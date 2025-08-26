import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  AlertTriangle, 
  ExternalLink, 
  Shield, 
  Brain,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ChatMessage, AIResponse } from '../types';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { recordAuditEvent } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: 'こんにちは！医療向けAIアシスタントです。症状や医療に関するご質問にお答えします。重要な医療判断が必要な場合は、医師への相談をお勧めします。',
      timestamp: new Date(),
      confidence: 1.0
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const simulateAIResponse = async (userMessage: string): Promise<AIResponse> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI response based on user input
    const isEmergency = userMessage.toLowerCase().includes('緊急') || 
                       userMessage.toLowerCase().includes('救急') ||
                       userMessage.toLowerCase().includes('痛い');
    
    const isUncertain = userMessage.toLowerCase().includes('診断') ||
                       userMessage.toLowerCase().includes('薬');

    if (isEmergency) {
      return {
        answer_markdown: `**緊急性の高い症状の可能性があります。**

以下の場合は直ちに医療機関を受診してください：
- 激しい痛み
- 呼吸困難
- 意識障害
- 大量出血

**推奨アクション**: 医師への即座の相談が必要です。`,
        citations: [
          'https://example.com/emergency-guidelines',
          'https://example.com/triage-protocols'
        ],
        confidence: 0.95,
        action: 'handoff_human',
        reasons: ['緊急性の高い症状', '医師の判断が必要']
      };
    }

    if (isUncertain) {
      return {
        answer_markdown: `ご質問いただいた内容は医師の専門的な判断が必要です。

一般的な情報として：
- 症状の詳細な評価が重要
- 個人の医療歴を考慮する必要
- 適切な検査や診察が必要な場合があります

**推奨**: 医師との直接相談をお勧めします。`,
        citations: [
          'https://example.com/medical-guidelines',
          'https://example.com/consultation-protocols'
        ],
        confidence: 0.7,
        action: 'handoff_human',
        reasons: ['医師の専門判断が必要', '個別評価が重要']
      };
    }

    return {
      answer_markdown: `ご質問にお答えします。

**一般的な情報として：**
- 症状の観察と記録が重要です
- 適切な休息と水分補給を心がけてください
- 症状が悪化する場合は医師にご相談ください

この情報は一般的なガイダンスであり、個別の医療アドバイスではありません。`,
      citations: [
        'https://example.com/health-guidelines',
        'https://example.com/symptom-management'
      ],
      confidence: 0.85,
      action: 'continue_ai',
      reasons: ['一般的な健康情報', '根拠に基づく回答']
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Record audit event
    recordAuditEvent({
      type: 'ai_query_submitted',
      actorId: user?.id || 'unknown',
      subjectId: 'ai_assistant',
      data: { query: inputMessage }
    });

    try {
      const aiResponse = await simulateAIResponse(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.answer_markdown,
        timestamp: new Date(),
        citations: aiResponse.citations.map(uri => ({ sourceId: uri, uri, span: '' })),
        confidence: aiResponse.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Record audit event for AI response
      recordAuditEvent({
        type: 'ai_response_generated',
        actorId: 'ai_assistant',
        subjectId: user?.id || 'unknown',
        data: { 
          confidence: aiResponse.confidence,
          action: aiResponse.action,
          escalated: aiResponse.action === 'handoff_human'
        }
      });

      // Handle escalation
      if (aiResponse.action === 'handoff_human') {
        setTimeout(() => {
          const escalationMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'system',
            content: '🔄 **医師への相談をお勧めします**\n\n医療スタッフが間もなく対応いたします。緊急の場合は直接お電話ください。',
            timestamp: new Date(),
            confidence: 1.0
          };
          setMessages(prev => [...prev, escalationMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: '申し訳ございません。一時的にサービスが利用できません。医師への直接相談をお勧めします。',
        timestamp: new Date(),
        confidence: 0.0
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return <XCircle size={14} />;
    if (confidence >= 0.8) return <CheckCircle size={14} />;
    if (confidence >= 0.6) return <AlertTriangle size={14} />;
    return <XCircle size={14} />;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center">
          <Bot className="text-white" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">医療AIアシスタント</h3>
          <p className="text-sm text-gray-600">根拠に基づく医療情報をサポート</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="text-green-600" size={16} />
          <span className="text-xs text-green-600 font-medium">HIPAA準拠</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.role === 'system'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-gray-100 text-gray-900'
            } rounded-lg px-4 py-2`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">AI回答</span>
                  {message.confidence && (
                    <div className={`flex items-center gap-1 ${getConfidenceColor(message.confidence)}`}>
                      {getConfidenceIcon(message.confidence)}
                      <span className="text-xs">
                        信頼度: {Math.round(message.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="prose prose-sm max-w-none">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className={`${
                    message.role === 'user' ? 'text-white' : ''
                  } ${index === 0 ? '' : 'mt-2'}`}>
                    {line}
                  </p>
                ))}
              </div>

              {message.citations && message.citations.length > 0 && showCitations && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">参考文献:</p>
                  <div className="space-y-1">
                    {message.citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={12} />
                        <span>出典 {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs mt-2 opacity-75">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader className="animate-spin text-blue-600" size={16} />
              <span className="text-gray-600">AI が回答を生成中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="症状や医療に関する質問を入力してください..."
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>

        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCitations}
              onChange={(e) => setShowCitations(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">参考文献を表示</span>
          </label>
          
          <p className="text-xs text-gray-500">
            ⚠️ 医療判断は医師にご相談ください
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;