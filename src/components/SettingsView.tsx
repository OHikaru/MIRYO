// REVISED: 「AI & 知識ベース」タブを追加し、プロバイダ選択・APIキー・モデル・RAG設定・ソース登録を提供
import React, { useEffect, useState } from 'react';
import { Settings, User, Bell, Shield, Globe, Cpu, Database, Save, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { AIProvider, AISettings, UserSettings } from '../types';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import { fetchAvailableModels } from '../services/aiClient';


const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { userSettings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'ai'>('ai');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ [key: string]: { id: string; name: string; description?: string }[] }>({});
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
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

  const onSave = () => {
    if (!settings) return;
    updateSettings(settings);
    setHasChanges(false);
  };

  const refreshModels = async () => {
    if (!settings?.ai?.model.apiKey || !settings?.ai?.model.provider) return;
    
    setLoadingModels(true);
    try {
      const models = await fetchAvailableModels(settings.ai.model.provider, settings.ai.model.apiKey);
      setAvailableModels(prev => ({
        ...prev,
        [settings.ai.model.provider]: models
      }));
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // APIキーが変更されたら自動でモデル一覧を取得
  useEffect(() => {
    if (settings?.ai?.model.apiKey && settings?.ai?.model.provider) {
      refreshModels();
    }
  }, [settings?.ai?.model.apiKey, settings?.ai?.model.provider]);

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
        <div className="px-4 py-2 border-b bg-white flex justify-end">
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
                    <div className="flex gap-2">
                      <select
                        value={settings?.ai?.model.model || ''}
                        onChange={e => setModel({ model: e.target.value })}
                        className="border rounded flex-1 px-2 py-1"
                        disabled={loadingModels}
                      >
                        <option value="">モデルを選択してください</option>
                        {availableModels[settings?.ai?.model.provider || 'openai']?.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={refreshModels}
                        disabled={loadingModels || !settings?.ai?.model.apiKey}
                        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                        title="モデル一覧を更新"
                      >
                        <RefreshCw size={16} className={loadingModels ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    {settings?.ai?.model.model && availableModels[settings?.ai?.model.provider || 'openai'] && (
                      <div className="mt-1 text-xs text-gray-500">
                        {availableModels[settings.ai.model.provider].find(m => m.id === settings.ai.model.model)?.description}
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