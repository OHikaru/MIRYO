// src/services/aiClient.ts
// 改訂点:
// - /api 呼び出し失敗（TypeError: Failed to fetch 等）時に、UIへ「原因となる例外メッセージ」を返す
// - Gatewayが落ちていても、ブラウザにAPIキーがあれば直叩きフォールバック
// - fetchAvailableModels でも詳細メッセージを投げる
import { AIResponse, AIModelConfig, RetrievalConfig, KnowledgeDoc } from '../types';

export type Provider = 'openai' | 'anthropic' | 'gemini';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  inputModalities?: string[];
  outputModalities?: string[];
  contextWindow?: number;
}

function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const m of list) if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
  return out;
}

export async function fetchAvailableModels(
  provider: Provider,
  apiKey?: string,
  endpointBase?: string,
  useBrowserKey: boolean = false
): Promise<ModelInfo[]> {
  const sanitizedApiKey = apiKey?.trim().replace(/[^\x20-\x7E]/g, '');

  // Gateway経由（本番推奨）
  if (!useBrowserKey) {
    try {
      const r = await fetch(`/api/ai/models?provider=${encodeURIComponent(provider)}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error(`Gateway responded ${r.status}`);
      const j = await r.json();
      if (provider === 'openai') {
        const data: any[] = j?.data ?? [];
        const chatLike = /^(gpt|o\d|o[34]|omni|gpt-4|gpt-4o|gpt-4\.1|gpt-4o-mini)/i;
        const mapped: ModelInfo[] = data
          .filter((m: any) => typeof m?.id === 'string')
          .map((m: any) => ({ id: m.id, name: m.id, description: m.root ? `root:${m.root}` : undefined }))
          .filter((m: any) => chatLike.test(m.id));
        const order = ['o4', 'o3', 'omni', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'gpt-4'];
        mapped.sort((a,b) => {
          const ia = order.findIndex(k => a.id.startsWith(k));
          const ib = order.findIndex(k => b.id.startsWith(k));
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.id.localeCompare(b.id);
        });
        return dedupeById(mapped);
      }
      if (provider === 'anthropic') {
        const data: any[] = j?.data ?? [];
        return dedupeById(data.map((m: any) => ({
          id: m?.id, name: m?.display_name || m?.id, description: m?.description,
          inputModalities: m?.input_modalities || [], outputModalities: m?.output_modalities || [],
          contextWindow: typeof m?.context_window === 'number' ? m.context_window : undefined
        })).filter((m: any) => !!m.id));
      }
      if (provider === 'gemini') {
        const models: any[] = j?.models ?? [];
        return dedupeById(models.map((m: any) => ({
          id: m?.name, name: m?.displayName || m?.name, description: m?.description,
          inputModalities: m?.inputModalities || m?.supportedGenerationMethods, outputModalities: m?.outputModalities,
          contextWindow: m?.inputTokenLimit
        })).filter((m: any) => !!m.id));
      }
      return [];
    } catch (e) {
      // ここで "TypeError: Failed to fetch" 等をUIへ伝える
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`AI Gateway に接続できません: ${msg}（サーバ起動/ポート/プロキシを確認）`);
    }
  }

  // 直叩き（開発用）
  if (!sanitizedApiKey && provider !== 'gemini') return [];
  switch (provider) {
    case 'openai': {
      const base = endpointBase || 'https://api.openai.com';
      const r = await fetch(`${base}/v1/models`, { headers: { 'Authorization': `Bearer ${sanitizedApiKey}` } });
      if (!r.ok) throw new Error(`OpenAI models error ${r.status}`);
      const j = await r.json();
      const data: any[] = j?.data ?? [];
      const chatLike = /^(gpt|o\d|o[34]|omni|gpt-4|gpt-4o|gpt-4\.1|gpt-4o-mini)/i;
      const mapped = data.filter(m => typeof m?.id === 'string').map((m: any) => ({ id: m.id, name: m.id }));
      return dedupeById(mapped.filter((m: any) => chatLike.test(m.id)));
    }
    case 'anthropic': {
      const base = endpointBase || 'https://api.anthropic.com';
      const r = await fetch(`${base}/v1/models`, { headers: { 'x-api-key': sanitizedApiKey!, 'anthropic-version': '2023-06-01' } });
      if (!r.ok) throw new Error(`Anthropic models error ${r.status}`);
      const j = await r.json();
      const data: any[] = j?.data ?? [];
      return dedupeById(data.map((m: any) => ({ id: m?.id, name: m?.display_name || m?.id })).filter((m: any) => !!m.id));
    }
    case 'gemini': {
      if (!sanitizedApiKey) return [];
      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
      url.searchParams.set('key', sanitizedApiKey);
      const r = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error(`Gemini models error ${r.status}`);
      const j = await r.json();
      const models: any[] = j?.models ?? [];
      return dedupeById(models.map((m: any) => ({ id: m?.name, name: m?.displayName || m?.name })).filter((m: any) => !!m.id));
    }
    default:
      return [];
  }
}

export async function aiChatUnified(params: {
  config: AIModelConfig;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  retrieval: RetrievalConfig;
  knowledgeDocs: KnowledgeDoc[];
}): Promise<AIResponse> {
  const { config, messages } = params;
  const hasBrowserKey = !!config.apiKey;

  if (!config.devKeyInBrowser) {
    // 本番: Gateway優先
    try {
      const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(`Gateway ${r.status} ${j?.error ? `- ${j.error}` : ''}`);
      }
      return await r.json();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (hasBrowserKey) {
        console.warn('AI Gateway unreachable; falling back to direct provider call.', msg);
      } else {
        return {
          answer_markdown: `AI Gateway に接続できませんでした（${msg}）。\n- サーバを起動: \`npm run server\`\n- または設定で「開発モード（ブラウザにAPIキー）」を ON にしてください。`,
          citations: [],
          confidence: 0.4,
          action: 'continue_ai',
          reasons: ['gateway_unreachable']
        };
      }
    }
  }

  switch (config.provider) {
    case 'openai':  return callOpenAI(config, messages);
    case 'anthropic': return callAnthropic(config, messages);
    case 'gemini':  return callGemini(config, messages);
    default: throw new Error('Unknown provider');
  }
}

async function callOpenAI(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  try {
    const r = await fetch(`${config.endpointBase || 'https://api.openai.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: config.model || 'gpt-4o-mini', 
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 1000
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`OpenAI ${r.status} - ${j?.error?.message || 'unknown error'}`);
    const text = j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
    return { answer_markdown: text, citations: [], confidence: 0.75, action: 'continue_ai', reasons: [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { answer_markdown: `OpenAI呼び出しに失敗: ${msg}`, citations: [], confidence: 0.3, action: 'continue_ai', reasons: ['provider_call_failed'] };
  }
}

async function callAnthropic(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  const userContent = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
  const systemMsg = messages.find(m => m.role === 'system')?.content;
  try {
    const r = await fetch(`${config.endpointBase || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': `${config.apiKey}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.model || 'claude-3-5-sonnet-latest', system: systemMsg, messages: userContent, max_tokens: 1024 })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`Anthropic ${r.status} - ${j?.error?.message || 'unknown error'}`);
    const text = j?.content?.[0]?.text ?? JSON.stringify(j);
    return { answer_markdown: text, citations: [], confidence: 0.75, action: 'continue_ai', reasons: [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { answer_markdown: `Anthropic呼び出しに失敗: ${msg}`, citations: [], confidence: 0.3, action: 'continue_ai', reasons: ['provider_call_failed'] };
  }
}

async function callGemini(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  const input = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
  const model = config.model || 'models/gemini-2.0-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': `${config.apiKey}` },
      body: JSON.stringify({ contents: input })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`Gemini ${r.status} - ${j?.error?.message || 'unknown error'}`);
    const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? JSON.stringify(j);
    return { answer_markdown: text, citations: [], confidence: 0.75, action: 'continue_ai', reasons: [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { answer_markdown: `Gemini呼び出しに失敗: ${msg}`, citations: [], confidence: 0.3, action: 'continue_ai', reasons: ['provider_call_failed'] };
  }
}