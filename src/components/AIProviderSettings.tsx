import React, { useState, useEffect } from 'react';
import { Bot, Key, Settings, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Provider, fetchAvailableModels, ModelInfo } from '../services/aiClient';
import { 
  getAPIKey, 
  saveAPIKey, 
  saveAIProvider, 
  getProviderDisplayName,
  getCurrentAIConfig 
} from '../services/aiConfig';
import { useApp } from '../contexts/AppContext';

const AIProviderSettings: React.FC = () => {
  const { updateSettings } = useApp();
  const [currentConfig, setCurrentConfig] = useState(getCurrentAIConfig());
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    openai: getAPIKey('openai'),
    anthropic: getAPIKey('anthropic'),
    gemini: getAPIKey('gemini')
  });
  const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false
  });
  const [availableModels, setAvailableModels] = useState<Record<Provider, ModelInfo[]>>({
    openai: [],
    anthropic: [],
    gemini: []
  });
  const [loading, setLoading] = useState<Record<Provider, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false
  });
  const [testResults, setTestResults] = useState<Record<Provider, 'success' | 'error' | null>>({
    openai: null,
    anthropic: null,
    gemini: null
  });

  const providers: Provider[] = ['openai', 'anthropic', 'gemini'];

  useEffect(() => {
    // Load models for all providers on component mount
    providers.forEach(loadModels);
  }, []);

  const loadModels = async (provider: Provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      const models = await fetchAvailableModels(provider, apiKeys[provider], undefined, true);
      setAvailableModels(prev => ({ ...prev, [provider]: models }));
    } catch (error) {
      console.error(`Failed to load models for ${provider}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleAPIKeyChange = (provider: Provider, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newKeys);
    saveAPIKey(provider, key);
    
    // Reload models when API key changes
    if (key.trim()) {
      loadModels(provider);
    }
  };

  const toggleKeyVisibility = (provider: Provider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const testAPIKey = async (provider: Provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      const models = await fetchAvailableModels(provider, apiKeys[provider], undefined, true);
      if (models.length > 0) {
        setTestResults(prev => ({ ...prev, [provider]: 'success' }));
        setAvailableModels(prev => ({ ...prev, [provider]: models }));
      } else {
        setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const selectProvider = (provider: Provider, model?: string) => {
    saveAIProvider(provider, model);
    const newConfig = getCurrentAIConfig();
    setCurrentConfig(newConfig);
    
    // Update app context
    updateSettings({
      ai: {
        model: newConfig,
        retrieval: { topK: 5, threshold: 0.45, scopes: ['clinic_docs', 'faq', 'policies'] }
      }
    });
  };

  const getKeyStatus = (provider: Provider) => {
    const key = apiKeys[provider];
    const hasEnvKey = !!getAPIKey(provider);
    if (hasEnvKey && !key) return 'env';
    if (key) return 'set';
    return 'missing';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-semibold">AI プロバイダー設定</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">現在の選択</p>
            <p className="text-sm text-blue-700">
              {getProviderDisplayName(currentConfig.provider)} - {currentConfig.model}
            </p>
          </div>
        </div>
      </div>

      {providers.map((provider) => {
        const keyStatus = getKeyStatus(provider);
        const models = availableModels[provider] || [];
        const isSelected = currentConfig.provider === provider;

        return (
          <div key={provider} className={`border rounded-lg p-6 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium">{getProviderDisplayName(provider)}</h4>
                  <p className="text-sm text-gray-500">
                    {provider === 'openai' && 'ChatGPT, GPT-4 series'}
                    {provider === 'anthropic' && 'Claude 3.5 Sonnet, Haiku'}
                    {provider === 'gemini' && 'Gemini Pro, Flash'}
                  </p>
                </div>
              </div>
              
              {isSelected && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">選択中</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="inline h-4 w-4 mr-1" />
                  API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[provider] ? 'text' : 'password'}
                      value={apiKeys[provider]}
                      onChange={(e) => handleAPIKeyChange(provider, e.target.value)}
                      placeholder={keyStatus === 'env' ? '環境変数から取得済み' : `${getProviderDisplayName(provider)} API キーを入力`}
                      disabled={keyStatus === 'env'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility(provider)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                    >
                      {showKeys[provider] ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => testAPIKey(provider)}
                    disabled={loading[provider] || !apiKeys[provider]}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading[provider] ? '確認中...' : 'テスト'}
                  </button>
                </div>
                
                {keyStatus === 'env' && (
                  <p className="text-sm text-green-600 mt-1">✓ 環境変数から取得</p>
                )}
                
                {testResults[provider] === 'success' && (
                  <p className="text-sm text-green-600 mt-1">✓ API キーは有効です</p>
                )}
                
                {testResults[provider] === 'error' && (
                  <p className="text-sm text-red-600 mt-1">✗ API キーが無効です</p>
                )}
              </div>

              {models.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    利用可能なモデル
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {models.slice(0, 6).map((model) => (
                      <button
                        key={model.id}
                        onClick={() => selectProvider(provider, model.id)}
                        className={`p-3 text-left border rounded-md hover:bg-gray-50 transition-colors ${
                          currentConfig.provider === provider && currentConfig.model === model.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="font-medium text-sm">{model.name}</div>
                        {model.description && (
                          <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {!isSelected && models.length > 0 && (
                    <button
                      onClick={() => selectProvider(provider)}
                      className="mt-2 w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                    >
                      {getProviderDisplayName(provider)} を選択
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">設定方法</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p>1. <code>.env</code> ファイルに API キーを設定（推奨）</p>
          <p>2. または上記のフォームから直接入力</p>
          <p>3. テストボタンでAPI接続を確認</p>
          <p>4. 使用したいモデルを選択</p>
        </div>
      </div>
    </div>
  );
};

export default AIProviderSettings;