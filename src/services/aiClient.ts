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

// --- helpers ---------------------------------------------------------
const sanitize = (s?: string) => s?.trim().replace(/[^\x20-\x7E]/g, '') || '';
const dedupeById = (list: ModelInfo[]) => {
  const seen = new Set<string>();
  const out: ModelInfo[] = [];
  for (const m of list) {
    if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
  }
  return out;
};

function demoModels(provider: Provider): ModelInfo[] {
  if (provider === 'openai') return [
    { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
    { id: 'gpt-4o', name: 'gpt-4o' },
  ];
  if (provider === 'anthropic') return [
    { id: 'claude-3-5-sonnet-latest', name: 'claude-3-5-sonnet-latest' },
  ];
  return [
    { id: 'models/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  ];
}

// --- models listing --------------------------------------------------
export async function fetchAvailableModels(
  provider: Provider,
  apiKey?: string,
  endpointBase?: string,
  useBrowserKey = false
): Promise<ModelInfo[]> {
  const key = sanitize(apiKey);

  // Prefer server proxy in non-browser-key mode
  if (!useBrowserKey) {
    try {
      const r = await fetch(`/api/ai/models?provider=${encodeURIComponent(provider)}`, {
        method: 'GET', headers: { Accept: 'application/json' }
      });
      if (r.ok) {
        const j = await r.json();
        if (provider === 'openai') {
          const data: any[] = j?.data ?? [];
          const chatLike = /^(gpt|o\d|o[34]|omni|gpt-4|gpt-4o|gpt-4\.1|gpt-4o-mini)/i;
          const mapped: ModelInfo[] = data
            .filter((m: any) => typeof m?.id === 'string')
            .map((m: any) => ({ id: m.id, name: m.id, description: m.root ? `root:${m.root}` : undefined }))
            .filter((m: any) => chatLike.test(m.id));
          return dedupeById(mapped);
        }
        if (provider === 'anthropic') {
          const data: any[] = j?.data ?? [];
          const mapped: ModelInfo[] = data.map((m: any) => ({
            id: m?.id,
            name: m?.display_name || m?.id,
            description: m?.description,
            inputModalities: m?.input_modalities || [],
            outputModalities: m?.output_modalities || [],
            contextWindow: typeof m?.context_window === 'number' ? m.context_window : undefined
          })).filter(m => !!m.id);
          return dedupeById(mapped);
        }
        if (provider === 'gemini') {
          const models: any[] = j?.models ?? [];
          const mapped: ModelInfo[] = models.map((m: any) => ({
            id: m?.name,
            name: m?.displayName || m?.name,
            description: m?.description,
            inputModalities: m?.inputModalities || m?.supportedGenerationMethods,
            outputModalities: m?.outputModalities,
            contextWindow: m?.inputTokenLimit
          })).filter(m => !!m.id);
          return dedupeById(mapped);
        }
      }
    } catch {
      console.warn('AI models proxy unavailable, falling back to direct API (dev only).');
    }
  }

  if (!key) {
    // Provide demo models when no key is set
    return demoModels(provider);
  }

  if (provider === 'openai') {
    const base = endpointBase || 'https://api.openai.com';
    const r = await fetch(`${base}/v1/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) return demoModels(provider);
    const j = await r.json();
    const data: any[] = j?.data ?? [];
    const chatLike = /^(gpt|o\d|o[34]|omni|gpt-4|gpt-4o|gpt-4\.1|gpt-4o-mini)/i;
    return dedupeById(
      data.filter((m: any) => typeof m?.id === 'string')
          .map((m: any) => ({ id: m.id, name: m.id }))
          .filter((m: any) => chatLike.test(m.id))
    );
  }

  if (provider === 'anthropic') {
    const base = endpointBase || 'https://api.anthropic.com';
    const r = await fetch(`${base}/v1/models`, { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
    if (!r.ok) return demoModels(provider);
    const j = await r.json();
    const data: any[] = j?.data ?? [];
    return dedupeById(
      data.map((m: any) => ({ id: m?.id, name: m?.display_name || m?.id })).filter((m: any) => !!m.id)
    );
  }

  // gemini
  {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (!r.ok) return demoModels(provider);
    const j = await r.json();
    const models: any[] = j?.models ?? [];
    return dedupeById(
      models.map((m: any) => ({ id: m?.name, name: m?.displayName || m?.name })).filter((m: any) => !!m.id)
    );
  }
}

// --- chat unified ----------------------------------------------------
export async function aiChatUnified(params: {
  config: AIModelConfig;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  retrieval: RetrievalConfig;
  knowledgeDocs: KnowledgeDoc[];
}): Promise<AIResponse> {
  const { config, messages } = params;
  const hasBrowserKey = !!config.apiKey;

  if (config.devKeyInBrowser && hasBrowserKey) {
    return callProviderDirectly(config, messages);
  }

  try {
    const r = await fetch('/api/ai/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    if (!r.ok) throw new Error(`AI Gateway error: ${r.status}`);
    return await r.json();
  } catch {
    if (hasBrowserKey) {
      console.warn('AI Gateway unavailable; falling back to direct provider call using browser-held API key (dev fallback).');
      return callProviderDirectly(config, messages);
    }
    // Demo fallback when no Gateway nor API key
    return mockAIResponse(messages);
  }
}

function mockAIResponse(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): AIResponse {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const prompt = (lastUser?.content || '').trim();
  const summary = prompt
    ? `要約: ${prompt.slice(0, 160)}${prompt.length > 160 ? '…' : ''}`
    : 'ご質問を入力してください。医療一般のガイダンスを簡潔に返答します。';
  const tips = '- これはデモ応答です (モック)\n- 設定 > AI で API キーを登録すると実応答になります\n- もしくは /api/ai/chat (AI Gateway) を有効化してください';
  return {
    answer_markdown: `${summary}\n\n${tips}`,
    citations: ['README.md#Demo-Features'],
    confidence: 0.4,
    action: 'continue_ai',
    reasons: ['demo_fallback']
  };
}

// --- provider direct calls -----------------------------------------
async function callProviderDirectly(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
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
  const r = await fetch(`${config.endpointBase || 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model || 'gpt-4o-mini', messages: messages.map(m => ({ role: m.role, content: m.content })), max_tokens: 1000 })
  });
  if (!r.ok) throw new Error(`OpenAI API error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text = j?.choices?.[0]?.message?.content ?? 'No response from OpenAI';
  return { answer_markdown: text, citations: [], confidence: 0.75, action: 'continue_ai', reasons: [] };
}

async function callAnthropic(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  const userContent = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
  const systemMsg = messages.find(m => m.role === 'system')?.content;
  const r = await fetch(`${config.endpointBase || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': `${config.apiKey}`, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model || 'claude-3-5-sonnet-latest', system: systemMsg, messages: userContent, max_tokens: 1024 })
  });
  if (!r.ok) throw new Error(`Anthropic API error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text = j?.content?.[0]?.text ?? 'No response from Anthropic';
  return { answer_markdown: text, citations: [], confidence: 0.75, action: 'continue_ai', reasons: [] };
}

async function callGemini(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  const input = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
  const model = config.model || 'models/gemini-2.0-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': `${config.apiKey}` }, body: JSON.stringify({ contents: input })
  });
  if (!r.ok) throw new Error(`Gemini API error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? 'No response from Gemini';
  return { answer_markdown: text, citations: [], confidence: 0.75, action: 'continue_ai', reasons: [] };
}

