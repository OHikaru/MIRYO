// REVISED: 「AI & 知識ベース」タブに"モデル一覧の動的取得"を追加し、選択式に変更。
// 変更点:
//  - モデル一覧の取得ボタン（RefreshCw）と自動取得（APIキー/プロバイダ変更時）
//  - availableModels ステートでプロバイダ別のリストを保持
//  - モデルが取得済みの場合は <select> で選択、未取得時は手入力欄をフォールバック
import React, { useEffect, useMemo, useState } from 'react';
import { Settings, User, Shield, Cpu, Database, Save, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { AIProvider, AISettings, UserSettings } from '../types';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import { fetchAvailableModels, ModelInfo, Provider } from '../services/aiClient';

const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { userSettings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'ai'>('ai');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 追加: モデル一覧
  const [availableModels, setAvailableModels] = useState<Record<Provider, ModelInfo[]>>({
    openai: [], anthropic: [], gemini: []
  });
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string>('');
  const currentProvider: Provider = (settings?.ai?.model.provider || 'openai') as Provider;
  const currentApiKey = settings?.ai?.model.apiKey || '';
  const devKeyInBrowser = !!settings?.ai?.model.devKeyInBrowser;
  const endpointBase = settings?.ai?.model.endpointBase || undefined;

  useEffect(() => {
    // 初期設定が無い場合のデフォルトを投入
    if (!userSettings && user) {
      updateSettings({
        locale: 'ja-JP',
        theme: 'light',
        notifications: true,
        privacyLevel: 'standard',
        ai: {
          model: { provider: 'openai', model: 'gpt-4o-mini', endpointBase: 'https://api.openai.com', devKeyInBrowser: false },
          retrieval: { topK: 5, threshold: 0.45, scopes: ['clinic_docs', 'faq', 'policies'] }
        }
      });
    }
    setSettings(userSettings || null);
  }, [userSettings, user, updateSettings]);

  const setAI = (patch: Partial<AISettings>) => {
    if (!settings) return;
    const next: UserSettings = { ...settings, ai: { ...(settings.ai || {} as any), ...patch } as AISettings };
    setSettings(next);
    setHasChanges(true);
  };
  const setModel = (patch: Partial<AISettings['model']>) => {
    if (!settings?.ai) return;
    setAI({ model: { ...settings.ai.model, ...patch } });
  };
  const setRetrieval = (patch: Partial<AISettings['retrieval']>) => {
    if (!settings?.ai) return;
    setAI({ retrieval: { ...settings.ai.retrieval, ...patch } });
  };

  // モデル一覧取得
  const refreshModels = async () => {
    if (!settings?.ai?.model.provider) return;
    setLoadingModels(true);
    setModelError('');
    try {
      const provider = settings.ai.model.provider as Provider;
      const models = await fetchAvailableModels(provider, currentApiKey, endpointBase, devKeyInBrowser);
      setAvailableModels(prev => ({ ...prev, [provider]: models }));

      // 既定モデルが空の場合は先頭を採用
      if (!settings.ai.model.model && models[0]?.id) {
        setModel({ model: models[0].id });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('Failed to fetch models:', errorMessage);
      setModelError(errorMessage);
      setModelError(errorMessage);
      setAvailableModels(prev => ({ ...prev, [currentProvider]: [] }));
    } finally {
      setLoadingModels(false);
    }
  };

  // APIキーまたはプロバイダ変更時に自動リフレッシュ（開発モードまたはサーバプロキシがある前提）
  useEffect(() => {
    if (settings?.ai?.model.provider) {
      refreshModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.ai?.model.provider, settings?.ai?.model.apiKey, settings?.ai?.model.devKeyInBrowser, settings?.ai?.model.endpointBase]);

  const onSave = () => {
    if (!settings) return;
    updateSettings(settings);
    setHasChanges(false);
  };

  const modelOptions = useMemo(() => availableModels[currentProvider] || [], [availableModels, currentProvider]);

  return (
    <div className="flex h-full">
      {/* Left tabs */}
      <aside className="w-64 border-r bg-white">
        <div className="p-4 font-semibold flex items-center gap-2">
          <Settings /> 設定
        </div>
        <nav className="px-2">
          <button className={`w-full flex items-center gap-2 px-3 py-2 rounded ${activeTab==='profile'?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}
            onClick={() => setActiveTab('profile')}>
            <User size={18}/> プロファイル
          </button>
          <button className={`w-full flex items-center gap-2 px-3 py-2 rounded ${activeTab==='privacy'?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}
            onClick={() => setActiveTab('privacy')}>
            <Shield size={18}/> プライバシー
          </button>
          <button className={`w-full flex items-center gap-2 px-3 py-2 rounded ${activeTab==='ai'?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}
            onClick={() => setActiveTab('ai')}>
            <Cpu size={18}/> AI & 知識ベース
          </button>
        </nav>
      </aside>

      {/* Content */}
      <section className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b bg-white flex justify-end gap-2">
          <button
            onClick={refreshModels}
            disabled={loadingModels}
            className={`px-3 py-1.5 rounded inline-flex items-center gap-2 ${loadingModels? 'bg-gray-100 text-gray-500 cursor-wait':'bg-gray-100 hover:bg-gray-200'}`}>
            <RefreshCw size={16} className={loadingModels ? 'animate-spin':''}/> モデル一覧を取得
          </button>
          <button
            disabled={!hasChanges}
            onClick={onSave}
            className={`px-3 py-1.5 rounded inline-flex items-center gap-2 ${hasChanges? 'bg-blue-600 text-white':'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            <Save size={16}/> 保存
          </button>
        </div>

        <div className="p-4 overflow-auto">
          {activeTab === 'profile' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">ユーザ情報は別画面で編集します。</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">言語</label>
                  <select
                    value={settings?.locale || 'ja-JP'}
                    onChange={e => setSettings(s => s ? { ...s, locale: e.target.value as any } : s)}
                    className="border rounded w-full px-2 py-1"
                  >
                    <option value="ja-JP">日本語</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">テーマ</label>
                  <select
                    value={settings?.theme || 'light'}
                    onChange={e => setSettings(s => s ? { ...s, theme: e.target.value as any } : s)}
                    className="border rounded w-full px-2 py-1"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">通知</label>
                  <select
                    value={settings?.notifications ? 'on' : 'off'}
                    onChange={e => setSettings(s => s ? { ...s, notifications: e.target.value === 'on' } : s)}
                    className="border rounded w-full px-2 py-1"
                  >
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">プライバシーレベル</label>
                  <select
                    value={settings?.privacyLevel || 'standard'}
                    onChange={e => setSettings(s => s ? { ...s, privacyLevel: e.target.value as any } : s)}
                    className="border rounded w-full px-2 py-1"
                  >
                    <option value="standard">標準</option>
                    <option value="strict">厳格</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="p-4 border rounded bg-white space-y-3">
                <div className="font-semibold flex items-center gap-2"><Cpu/> AIモデル設定</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">プロバイダ</label>
                    <select
                      value={settings?.ai?.model.provider || 'openai'}
                      onChange={e => setModel({ provider: e.target.value as AIProvider })}
                      className="border rounded w-full px-2 py-1"
                    >
                      <option value="openai">OpenAI (Responses)</option>
                      <option value="anthropic">Anthropic (Claude Messages)</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">モデル</label>
                    {modelOptions.length > 0 ? (
                      <select
                        value={settings?.ai?.model.model || modelOptions[0]?.id || ''}
                        onChange={e => setModel({ model: e.target.value })}
                        className="border rounded w-full px-2 py-1"
                      >
                        {modelOptions.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={settings?.ai?.model.model || ''}
                        onChange={e => setModel({ model: e.target.value })}
                        className="border rounded w-full px-2 py-1"
                        placeholder="例: gpt-4o-mini / claude-3-5-sonnet-latest / models/gemini-2.0-flash"
                      />
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      ※ モデル一覧取得はベンダのAPIに依存します（OpenAI/Anthropic/Gemini）。取得できない場合は直接IDを入力してください。
                    </div>
                    {modelError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <strong>エラー:</strong> {modelError}
                        {currentProvider === 'openai' && modelError.includes('401') && (
                          <div className="mt-1">
                            <strong>解決方法:</strong> OpenAI Platform で有効なAPIキーを取得し、上記の「開発用APIキー」欄に入力してください。
                          </div>
                        )}
                        {currentProvider === 'gemini' && modelError.includes('403') && (
                          <div className="mt-1">
                            <strong>解決方法:</strong> Google AI Studio で有効なAPIキーを取得し、上記の「開発用APIキー」欄に入力してください。
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-2"><KeyRound size={14}/> 開発用APIキー（本番禁止）</label>
                    <input
                      value={settings?.ai?.model.apiKey || ''}
                      onChange={e => setModel({ apiKey: e.target.value })}
                      className="border rounded w-full px-2 py-1"
                      type="password"
                      placeholder="開発中のみブラウザに保持"
                    />
                    <div className="mt-1 text-xs text-red-600">※ 本番ではAI Gatewayでキー管理（フロント保持禁止）</div>
                    {!currentApiKey && devKeyInBrowser && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        <strong>APIキーが未設定です。</strong> モデル一覧を取得するには、{currentProvider === 'openai' ? 'OpenAI Platform' : currentProvider === 'gemini' ? 'Google AI Studio' : 'Anthropic Console'}で有効なAPIキーが必要です。
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">エンドポイント（任意）</label>
                    <input
                      value={settings?.ai?.model.endpointBase || ''}
                      onChange={e => setModel({ endpointBase: e.target.value })}
                      className="border rounded w-full px-2 py-1"
                      placeholder="未指定で各社の既定URL"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">開発モード（キーをブラウザ保持）</label>
                    <select
                      value={settings?.ai?.model.devKeyInBrowser ? 'true':'false'}
                      onChange={e => setModel({ devKeyInBrowser: e.target.value === 'true' })}
                      className="border rounded w-full px-2 py-1"
                    >
                      <option value="false">false（推奨）</option>
                      <option value="true">true（デモ用）</option>
                    </select>
                    <div className="mt-1 text-xs text-gray-500">
                      {settings?.ai?.model.devKeyInBrowser 
                        ? '⚠️ 開発モード: APIキーがブラウザに保存されます' 
                        : '✅ 本番モード: サーバ側AI Gatewayを使用します'
                      }
                    </div>
                  </div>
                </div>
                
                {!settings?.ai?.model.apiKey && settings?.ai?.model.devKeyInBrowser && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>APIキーが未設定です</strong><br/>
                      開発モードを使用する場合は、上記でAPIキーを設定してください。<br/>
                      本番環境では AI Gateway を使用することを強く推奨します。
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded bg-white space-y-3">
                <div className="font-semibold flex items-center gap-2"><Database/> RAG（検索設定）</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">topK</label>
                    <input
                      type="number"
                      value={settings?.ai?.retrieval.topK || 5}
                      onChange={e => setRetrieval({ topK: Number(e.target.value) })}
                      className="border rounded w-full px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">閾値</label>
                    <input
                      type="number" step="0.01" min="0" max="1"
                      value={settings?.ai?.retrieval.threshold || 0.45}
                      onChange={e => setRetrieval({ threshold: Number(e.target.value) })}
                      className="border rounded w-full px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">スコープ</label>
                    <input
                      value={(settings?.ai?.retrieval.scopes || []).join(',')}
                      onChange={e => setRetrieval({ scopes: e.target.value.split(',').map(s => s.trim()) as any })}
                      className="border rounded w-full px-2 py-1"
                      placeholder="clinic_docs,faq,policies"
                    />
                  </div>
                </div>
              </div>

              <KnowledgeBaseManager />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsView;