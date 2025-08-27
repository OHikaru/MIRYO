// server.mjs — MIRYO Minimal AI Gateway (Fixed)
// 修正点:
// 1) pdf-parse の読み込みエラーを適切にハンドリング
// 2) parsePDF 関数を正しく定義
// 3) エラーハンドリングを改善

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

// Ensure fetch is available for older Node versions
const ensureFetch = async () => {
  if (typeof globalThis.fetch !== 'function') {
    try {
      const { default: fetch } = await import('node-fetch');
      globalThis.fetch = fetch;
    } catch (e) {
      console.warn('[Gateway] node-fetch could not be loaded');
    }
  }
};
await ensureFetch();

// Try to load pdf-parse
let pdfParse = null;
try {
  const mod = await import('pdf-parse');
  pdfParse = mod.default || mod;
  console.log('[Gateway] pdf-parse loaded successfully');
} catch (e) {
  console.warn('[Gateway] pdf-parse could not be loaded. PDF text extraction disabled.');
  pdfParse = null;
}

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '8mb' }));

// In-memory store (dev)
const DOCS = new Map(); // id -> { id, name, text, tags, bytes, mime, uploadedAt }

const pickKey = (provider, clientKey) => {
  if (clientKey) return clientKey; // dev用：クライアントキーを優先
  if (provider === 'openai') return process.env.OPENAI_API_KEY || '';
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY || '';
  if (provider === 'gemini') return process.env.GEMINI_API_KEY || '';
  return '';
};

// PDF parsing function
async function parsePDF(buffer) {
  if (!pdfParse) {
    throw new Error('pdf-parse is not available');
  }
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('[Gateway] PDF parsing error:', error);
    return `[PDF parsing failed: ${error.message}]`;
  }
}

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    version: '1.1.0',
    node: process.version,
    docsCount: DOCS.size,
    env: {
      openaiKey: !!process.env.OPENAI_API_KEY,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
      geminiKey: !!process.env.GEMINI_API_KEY
    }
  });
});

// --- Models proxy ---
app.get('/api/ai/models', async (req, res) => {
  try {
    const provider = String(req.query.provider || 'openai');
    const key = pickKey(provider, null);
    if (!key && provider !== 'gemini') {
      return res.status(400).json({ error: 'Server-side API key not configured for this provider.' });
    }
    if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const j = await r.json();
      return res.status(r.status).json(j);
    }
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
      });
      const j = await r.json();
      return res.status(r.status).json(j);
    }
    if (provider === 'gemini') {
      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
      if (process.env.GEMINI_API_KEY) url.searchParams.set('key', process.env.GEMINI_API_KEY);
      const r = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      const j = await r.json();
      return res.status(r.status).json(j);
    }
    return res.status(400).json({ error: 'Unknown provider' });
  } catch (e) {
    console.error('[Gateway] /models error:', e);
    res.status(500).json({ error: String(e) });
  }
});

// --- Docs upload (naive RAG) ---
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/ai/docs', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const tags = (() => { try { return JSON.parse(req.body.tags || '[]'); } catch { return []; } })();
    if (!file) return res.status(400).json({ error: 'file required' });

    let text = '';
    const isPdf = (file.mimetype?.includes('pdf') || file.originalname.toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      text = await parsePDF(file.buffer);
    } else {
      text = file.buffer.toString('utf-8');
    }

    const id = 'doc_' + Date.now();
    DOCS.set(id, {
      id, name: file.originalname, text, tags, bytes: file.size, mime: file.mimetype || 'application/octet-stream',
      uploadedAt: new Date().toISOString()
    });
    res.json({ id, name: file.originalname, bytes: file.size, mime: file.mimetype || 'application/octet-stream', uploadedAt: new Date(), tags });
  } catch (e) {
    console.error('[Gateway] /docs error:', e);
    res.status(500).json({ error: String(e) });
  }
});

function buildRagContext(topK = 3, maxCharsPerDoc = 2000) {
  const docs = Array.from(DOCS.values()).slice(0, topK);
  const ctx = docs.map(d => `【${d.name}】\n${(d.text || '').slice(0, maxCharsPerDoc)}`).join('\n\n---\n\n');
  const citations = docs.map(d => d.name);
  return { ctx, citations };
}

// --- Chat ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { config, messages, retrieval } = req.body || {};
    if (!config?.provider || !config?.model) {
      return res.status(400).json({ error: 'config.provider and config.model are required' });
    }
    const provider = config.provider;
    const key = pickKey(provider, config.apiKey); // dev: クライアントキー許可

    const { ctx, citations } = buildRagContext(retrieval?.topK ?? 3, 2000);

    const systemContent = `あなたは医療向けAIアシスタントです。以下のコンテキスト（PDF要約）を最優先で参照し、日本語で回答してください。
# コンテキスト
${ctx}
# 注意
- 医学的助言は一般情報として提示し、緊急時は受診を促す
- 参照した資料名は citations に含める`;

    const plainMsgs = Array.isArray(messages) ? messages : [];
    const userMsgs = plainMsgs.filter(m => m.role !== 'system');
    const fullMessages = [{ role: 'system', content: systemContent }, ...userMsgs];

    let answerText = '';
    if (provider === 'openai') {
      const r = await fetch(`${config.endpointBase || 'https://api.openai.com'}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: fullMessages.map(m => ({ role: m.role, content: m.content })),
          max_tokens: 1000
        })
      });
      const j = await r.json();
      if (!r.ok) {
        console.error('[Gateway] OpenAI error payload:', j);
        return res.status(r.status).json(j);
      }
      answerText = j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
    } else if (provider === 'anthropic') {
      const systemMsg = fullMessages.find(m => m.role === 'system')?.content;
      const userContent = fullMessages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
      const r = await fetch(`${config.endpointBase || 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, system: systemMsg, messages: userContent, max_tokens: 1024 })
      });
      const j = await r.json();
      if (!r.ok) {
        console.error('[Gateway] Anthropic error payload:', j);
        return res.status(r.status).json(j);
      }
      answerText = j?.content?.[0]?.text ?? JSON.stringify(j);
    } else if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(config.model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: fullMessages.map(m => ({ role: m.role, parts: [{ text: m.content }] })) })
      });
      const j = await r.json();
      if (!r.ok) {
        console.error('[Gateway] Gemini error payload:', j);
        return res.status(r.status).json(j);
      }
      answerText = (j?.candidates?.[0]?.content?.parts || []).map(p => p.text).join('') || JSON.stringify(j);
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    res.json({
      answer_markdown: answerText,
      citations,
      confidence: 0.75,
      action: 'continue_ai',
      reasons: []
    });
  } catch (e) {
    console.error('[Gateway] /chat error:', e);
    res.status(500).json({ error: String(e) });
  }
});

// Error handler (JSON)
app.use((err, req, res, next) => {
  console.error('[Gateway] Uncaught error:', err);
  res.status(500).json({ error: String(err) });
});

const port = Number(process.env.PORT || 8901);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`[AI Gateway] listening on http://${host}:${port}`);
});