import React, { useEffect, useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { AIProvider, AISettings, UserSettings } from '../types';
import { fetchAvailableModels, Provider, ModelInfo } from '../services/aiClient';

const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { userSettings, updateSettings } = useApp();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');

  useEffect(() => {
    setSettings(userSettings || null);
  }, [userSettings]);

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

  const refreshModels = async () => {
    if (!settings?.ai?.model.provider) return;
    setLoadingModels(true);
    setModelError('');
    try {
      const provider = settings.ai.model.provider as Provider;
      const ms = await fetchAvailableModels(provider, settings.ai.model.apiKey, settings.ai.model.endpointBase, !!settings.ai.model.devKeyInBrowser);
      setModels(ms);
      if (!settings.ai.model.model && ms[0]?.id) setModel({ model: ms[0].id });
    } catch (e: any) {
      setModelError(e?.message || String(e));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const onSave = () => {
    if (!settings) return;
    updateSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="h-full flex">
      <aside className="w-64 border-r bg-white">
        <div className="p-4 font-semibold flex items-center gap-2"><Settings /> 設定</div>
      </aside>
      <section className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="p-4 border rounded bg-white space-y-3">
          <div className="font-semibold">AI 設定</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Provider</label>
              <select
                value={settings?.ai?.model.provider || 'openai'}
                onChange={e => setModel({ provider: e.target.value as AIProvider })}
                className="border rounded w-full px-2 py-1"
              >
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="gemini">gemini</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Model</label>
              {models.length > 0 ? (
                <select
                  value={settings?.ai?.model.model || ''}
                  onChange={e => setModel({ model: e.target.value })}
                  className="border rounded w-full px-2 py-1"
                >
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              ) : (
                <input
                  value={settings?.ai?.model.model || ''}
                  onChange={e => setModel({ model: e.target.value })}
                  className="border rounded w-full px-2 py-1"
                  placeholder="gpt-4o-mini など"
                />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">API Key（開発モードでのみ使用推奨）</label>
              <input
                type="password"
                value={settings?.ai?.model.apiKey || ''}
                onChange={e => setModel({ apiKey: e.target.value })}
                className="border rounded w-full px-2 py-1"
                placeholder="sk-... / claude-... / AIza..."
              />
              <div className="mt-2 text-xs text-gray-500">
                本番ではサーバ側の AI Gateway を使用してください（開発モードはデモ用途）。
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">開発モード（ブラウザにキー保持）</label>
              <select
                value={settings?.ai?.model.devKeyInBrowser ? 'true' : 'false'}
                onChange={e => setModel({ devKeyInBrowser: e.target.value === 'true' })}
                className="border rounded w-full px-2 py-1"
              >
                <option value="false">false（推奨）</option>
                <option value="true">true（デモ用）</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="button" onClick={refreshModels} className="px-3 py-2 border rounded inline-flex items-center gap-2">
                <RefreshCw size={16} /> Fetch Models
              </button>
              {loadingModels && <span className="text-xs text-gray-500">取得中…</span>}
              {modelError && <span className="text-xs text-red-600">{modelError}</span>}
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={onSave}
              disabled={!hasChanges}
              className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> 保存
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;

