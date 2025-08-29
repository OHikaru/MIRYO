import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, ExternalLink, Loader, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { AIResponse } from '../types';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string; confidence?: number; citations?: string[]; action?: AIResponse['action'] };

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { aiChat, recordAuditEvent } = useApp();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: 'あなたは医療向けのAIアシスタントです。根拠URIを付与し、安全第一で回答してください。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submit = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res: AIResponse = await aiChat([...messages, userMsg].map(m => ({ role: m.role, content: m.content })));
      const assistant: Msg = {
        role: 'assistant',
        content: res.answer_markdown,
        confidence: res.confidence,
        citations: res.citations,
        action: res.action,
      };
      setMessages(prev => [...prev, assistant]);
      recordAuditEvent('ai_reply', user?.id || 'anon', 'ai', { action: res.action, confidence: res.confidence });
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `エラー: ${e.message || e}` }]);
    } finally {
      setLoading(false);
    }
  };

  const badge = (c?: number) => {
    if (c === undefined) return null;
    const color = c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-yellow-600' : 'text-red-600';
    const Icon = c >= 0.8 ? CheckCircle : c >= 0.5 ? AlertTriangle : XCircle;
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon size={14} />
        <span className="text-xs">信頼度 {Math.round((c || 0) * 100)}%</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b flex items-center gap-2 bg-white">
        <Bot /> <div className="font-semibold">AI アシスタント</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} className={`max-w-3xl ${m.role === 'user' ? 'ml-auto' : ''}`}>
            <div className={`p-3 rounded-lg border ${m.role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">{m.role === 'user' ? 'あなた' : 'AI'}</div>
                {m.role === 'assistant' && badge(m.confidence)}
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {/* Render markdown-ish line breaks simply */}
                {m.content}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.citations.map((u, idx) => (
                    <a key={idx} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 underline">
                      <ExternalLink size={12} /> 出典{idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500 flex items-center gap-2"><Loader className="animate-spin" size={16} /> 回答生成中…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="例：オンライン診療の接続要件は？"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' ? submit() : null)}
          />
          <button onClick={submit} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
            <Send size={16} /> 送信
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500">※ デモ環境ではモック応答が返る場合があります。</div>
      </div>
    </div>
  );
};

export default AIAssistant;

