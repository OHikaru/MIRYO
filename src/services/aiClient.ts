// REVISED: マルチAIプロバイダの「モデル一覧取得」と「チャット呼び出し」を統合。
// 変更点:
//  - fetchAvailableModels(provider, apiKey, endpointBase?) を追加（OpenAI/Anthropic/Gemini対応）
//  - devKeyInBrowser=false の場合は /api/ai/models にフォールバック（本番用プロキシ）
//  - OpenAI: GET https://api.openai.com/v1/models（Bearer）で一覧取得（公式ドキュメント）。 
//  - Anthropic: GET https://api.anthropic.com/v1/models（x-api-key + anthropic-version）で一覧取得（公式）。
//  - Gemini:   GET https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY で一覧取得（公式）。
//  - aiChatUnified は既存のまま（Responses / Messages / generateContent を利用）。
//
// 参照:
//  - OpenAI List models: https://platform.openai.com/docs/api-reference/models/list
//  - Anthropic List models: https://docs.anthropic.com/en/api/models-list
//  - Gemini Models endpoint: https://ai.google.dev/api/models
import { AIResponse, AIModelConfig, RetrievalConfig, KnowledgeDoc } from '../types';

export type Provider = 'openai' | 'anthropic' | 'gemini';

export interface ModelInfo {
  id: string;                 // APIで指定するモデルID（例: gpt-4o, claude-3-5-sonnet-latest, gemini-2.0-flash-exp）
  name: string;               // 表示名（displayName 等）
  description?: string;       // 説明
  inputModalities?: string[]; // テキスト/画像/音声など（得られる場合）
  outputModalities?: string[];// テキスト/画像/音声など（得られる場合）
  contextWindow?: number;     // 入力トークン上限（得られる場合）
}

// ------------------------------------------------------------
// モデル一覧の取得（開発時はフロント直叩き、本番はサーバのプロキシを推奨）
// ------------------------------------------------------------
export async function fetchAvailableModels(
  provider: Provider,
  apiKey?: string,
  endpointBase?: string,
  useBrowserKey: boolean = false
): Promise<ModelInfo[]> {
  // Sanitize API key to prevent HTTP header issues
  const sanitizedApiKey = apiKey?.trim().replace(/[^\x20-\x7E]/g, '');

  // 本番: ブラウザにキーを置かず、サーバのプロキシへ（開発モードでない場合）
  if (!useBrowserKey || !sanitizedApiKey) {
    try {
      const r = await fetch(`/api/ai/models?provider=${encodeURIComponent(provider)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (r.ok) {
        const data = await r.json();
        return (data?.models || []) as ModelInfo[];
      }
      // If proxy fails and we're not in dev mode, return empty array
      if (!useBrowserKey) {
        console.warn(`AI models proxy failed for ${provider}, and not in development mode`);
        return [];
      }
    } catch (error) {
      console.warn(`AI models proxy unavailable for ${provider}, falling back to direct API (dev only).`);
      // If proxy fails and we're not in dev mode, return empty array
      if (!useBrowserKey || !sanitizedApiKey) {
        return [];
      }
    }
  }

  // Development mode: require API key for direct calls
  if (!sanitizedApiKey) {
    console.warn(`No API key provided for ${provider} in development mode`);
    return [];
  }

  switch (provider) {
    case 'openai':
      return fetchOpenAIModels(sanitizedApiKey!, endpointBase);
    case 'anthropic':
      return fetchAnthropicModels(sanitizedApiKey!, endpointBase);
    case 'gemini':
      return fetchGeminiModels(sanitizedApiKey);
    default:
      return [];
  }
}

// --- OpenAI: GET /v1/models --------------------------------
async function fetchOpenAIModels(apiKey: string, endpointBase?: string): Promise<ModelInfo[]> {
  const base = endpointBase || 'https://api.openai.com';
  const res = await fetch(`${base}/v1/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(`OpenAI API key is invalid or missing (401). Please check your API key in the OpenAI Platform.`);
    }
    throw new Error(`OpenAI models error ${res.status}: ${res.statusText}`);
  }
  const j = await res.json();
  const data: any[] = j?.data ?? [];
  // OpenAIのListは埋め込み/音声等も含むため、チャット向け代表的名称で粗フィルタ
  const chatLike = /^(gpt|o\d|o[34]|omni|gpt-4|gpt-4o|gpt-4\.1|gpt-4o-mini)/i;
  const mapped: ModelInfo[] = data
    .filter(m => typeof m?.id === 'string')
    .map(m => ({ id: m.id, name: m.id, description: m.root ? `root:${m.root}` : undefined }))
    .filter(m => chatLike.test(m.id));
  // ある程度の安定順に並べ替え（新しそうな接頭辞を優先）
  const order = ['o4', 'o3', 'omni', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'gpt-4'];
  mapped.sort((a,b) => {
    const ia = order.findIndex(k => a.id.startsWith(k));
    const ib = order.findIndex(k => b.id.startsWith(k));
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.id.localeCompare(b.id);
  });
  return dedupeById(mapped);
}

// --- Anthropic: GET /v1/models ------------------------------
async function fetchAnthropicModels(apiKey: string, endpointBase?: string): Promise<ModelInfo[]> {
  const base = endpointBase || 'https://api.anthropic.com';
  const res = await fetch(`${base}/v1/models`, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  });
  if (!res.ok) {
    throw new Error(`Anthropic models error ${res.status}`);
  }
  const j = await res.json();
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

// --- Gemini: GET /v1beta/models -----------------------------
async function fetchGeminiModels(apiKey?: string): Promise<ModelInfo[]> {
  // APIキーはクエリかヘッダ（x-goog-api-key）どちらでも可。ここではクエリに付与。
  if (!apiKey) {
    console.warn('Gemini API key not provided, returning empty model list');
    return [];
  }

  const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Gemini API key is invalid or lacks permissions (403). Please check your API key in Google AI Studio.`);
    }
    if (res.status === 400) {
      throw new Error(`Gemini API request was malformed (400). Please check your API key and try again.`);
    }
    throw new Error(`Gemini models error ${res.status}: ${res.statusText}`);
  }
  const j = await res.json();
  const models: any[] = j?.models ?? [];
  const mapped: ModelInfo[] = models.map((m: any) => ({
    id: m?.name,                       // 例: models/gemini-2.0-flash-exp
    name: m?.displayName || m?.name,   // 例: Gemini 2.0 Flash Experimental
    description: m?.description,
    inputModalities: m?.inputModalities || m?.supportedGenerationMethods,
    outputModalities: m?.outputModalities,
    contextWindow: m?.inputTokenLimit
  })).filter(m => !!m.id);
  return dedupeById(mapped);
}

function dedupeById(list: ModelInfo[]): ModelInfo[] {
  const seen = new Set<string>();
  const out: ModelInfo[] = [];
  for (const m of list) {
    if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
  }
  return out;
}

// ------------------------------------------------------------
// チャット統合呼び出し（既存）
// ------------------------------------------------------------
export async function aiChatUnified(params: {
  config: AIModelConfig;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  retrieval: RetrievalConfig;
  knowledgeDocs: KnowledgeDoc[];
}): Promise<AIResponse> {
  const { config, messages } = params;
  
  // Sanitize API key
  const sanitizedApiKey = config.apiKey?.trim().replace(/[^\x20-\x7E]/g, '');
  
  if (!config.devKeyInBrowser || !sanitizedApiKey) {
    // 本番はGateway経由でRAGや監査・レート制御を一元化
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!r.ok) throw new Error(`AI Gateway error: ${r.status}`);
      return await r.json();
    } catch (error) {
      // AI Gatewayが利用できない場合で、開発モードかつAPIキーがある場合は直接呼び出し
      if (config.devKeyInBrowser && sanitizedApiKey) {
        console.warn('AI Gateway unavailable, falling back to direct API call');
        // 直接API呼び出しにフォールバック
      } else {
        // AI Gatewayが利用できない場合はデモ応答を返す
        return {
          answer_markdown: 'AI Gatewayに接続できません。開発モードでAPIキーを設定するか、サーバ側のAI Gatewayを起動してください。\n\n**デモ応答**: ご質問ありがとうございます。本番環境では適切なAI応答が提供されます。',
          citations: [],
          confidence: 0.5,
          action: 'continue_ai',
          reasons: ['AI Gateway接続エラー']
        };
      }
    }
  }

  // Use sanitized API key for direct calls
  const configWithSanitizedKey = { ...config, apiKey: sanitizedApiKey };
  
  switch (config.provider) {
    case 'openai':
      return callOpenAI(configWithSanitizedKey, messages);
    case 'anthropic':
      return callAnthropic(configWithSanitizedKey, messages);
    case 'gemini':
      return callGemini(configWithSanitizedKey, messages);
    default:
      throw new Error('Unknown provider');
  }
}

// --- OpenAI Responses API -----------------------------------
async function callOpenAI(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
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

// --- Anthropic Messages API ---------------------------------
async function callAnthropic(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
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

// --- Gemini generateContent ---------------------------------
async function callGemini(config: AIModelConfig, messages: { role: string; content: string }[]): Promise<AIResponse> {
  const input = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
  const model = config.model || 'models/gemini-2.0-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(model)}:generateContent`, {
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