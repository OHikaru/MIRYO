// REVISED (NEW): マルチAIプロバイダ呼出の抽象化。開発時のみフロントから直叩き可。
// 本番は /api/ai/chat などのAI Gatewayを介し、キーはサーバで管理してください。
import { AIResponse, AIModelConfig, RetrievalConfig, KnowledgeDoc } from '../types';

// 役割: NotebookLM的に「与えたソースのみで回答」→ここではUI側のメタ情報を付与。
// 実際のRAGはサーバ側でベクタ検索/再ランクを実装してください。
export async function aiChatUnified(params: {
  config: AIModelConfig;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  retrieval: RetrievalConfig;
  knowledgeDocs: KnowledgeDoc[];
}): Promise<AIResponse> {
  const { config, messages } = params;
  if (!config.devKeyInBrowser) {
    // サーバ側AI Gateway想定
    const r = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!r.ok) throw new Error(`AI Gateway error: ${r.status}`);
    return await r.json();
  }

  // --- 以下、開発モードのみ: 直接各社API ---
  switch (config.provider) {
    case 'openai':
      return callOpenAI(config, messages);
    case 'anthropic':
      return callAnthropic(config, messages);
    case 'gemini':
      return callGemini(config, messages);
    default:
      throw new Error('Unknown provider');
  }
}

async function callOpenAI(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  // OpenAI Responses API（2025）に準拠
  // https://platform.openai.com/docs/api-reference/responses
  const input = messages.map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }] }));
  const r = await fetch(`${config.endpointBase || 'https://api.openai.com'}/v1/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4.1-mini',
      input
    })
  });
  const j = await r.json();
  const text = j.output_text ?? j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
  return {
    answer_markdown: text,
    citations: [],
    confidence: 0.75,
    action: 'continue_ai',
    reasons: []
  };
}

async function callAnthropic(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  // Anthropic Messages API
  // https://docs.anthropic.com/en/api/messages
  const userContent = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
  const systemMsg = messages.find(m => m.role === 'system')?.content;
  const r = await fetch(`${config.endpointBase || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': `${config.apiKey}`,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-latest',
      system: systemMsg,
      messages: userContent,
      max_tokens: 1024
    })
  });
  const j = await r.json();
  const text = j?.content?.[0]?.text ?? JSON.stringify(j);
  return {
    answer_markdown: text,
    citations: [],
    confidence: 0.75,
    action: 'continue_ai',
    reasons: []
  };
}

async function callGemini(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  // Gemini API generateContent
  // https://ai.google.dev/api/generate-content
  const input = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
  const model = config.model || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': `${config.apiKey}` },
    body: JSON.stringify({ contents: input })
  });
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? JSON.stringify(j);
  return {
    answer_markdown: text,
    citations: [],
    confidence: 0.75,
    action: 'continue_ai',
    reasons: []
  };
}