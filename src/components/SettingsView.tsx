import React, { useEffect, useState } from 'react';
import { Settings, Save, RefreshCw, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { AIProvider, AISettings, UserSettings } from '../types';
import { fetchAvailableModels, Provider, ModelInfo } from '../services/aiClient';
import AIProviderSettings from './AIProviderSettings';

const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'general' | 'privacy'>('ai');

  const tabs = [
    { id: 'ai' as const, label: 'AI設定', icon: Bot },
    { id: 'general' as const, label: '全般', icon: Settings },
  ];

  return (
    <div className="h-full flex">
      <aside className="w-64 border-r bg-white">
        <div className="p-4 font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          設定
        </div>
        <nav className="px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg mb-1 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      
      <section className="flex-1 p-6 overflow-auto bg-gray-50">
        {activeTab === 'ai' && <AIProviderSettings />}
        
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">全般設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  言語
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テーマ
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                  <option value="system">システム設定に従う</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SettingsView;

