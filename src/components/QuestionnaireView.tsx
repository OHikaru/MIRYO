import React, { useState } from 'react';
import { 
  FileText, CheckCircle, AlertCircle, Clock, Send, Plus,
  Edit, Trash2, Eye, Download, Copy, Calendar, User
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'scale' | 'date';
  question: string;
  required: boolean;
  options?: string[];
  scale?: { min: number; max: number; labels?: string[] };
  category?: string;
}

interface QuestionnaireTemplate {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'internal' | 'surgery' | 'pediatrics' | 'mental' | 'custom';
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionnaireResponse {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  answers: Record<string, any>;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'reviewed';
  reviewedBy?: string;
  reviewNotes?: string;
}

const QuestionnaireView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'responses'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, any>>({});

  // デモ用のテンプレートデータ
  const templates: QuestionnaireTemplate[] = [
    {
      id: 'tmpl-001',
      name: '初診問診票',
      description: '初めて受診される方向けの基本的な問診票です',
      category: 'general',
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: '本日はどのような症状でお越しになりましたか？',
          required: true,
          category: '主訴'
        },
        {
          id: 'q2',
          type: 'radio',
          question: 'いつ頃から症状がありますか？',
          required: true,
          options: ['今日', '2-3日前', '1週間前', '1ヶ月前', 'それ以前'],
          category: '主訴'
        },
        {
          id: 'q3',
          type: 'scale',
          question: '現在の痛みの程度を10段階で評価してください',
          required: false,
          scale: { min: 0, max: 10, labels: ['痛みなし', '最大の痛み'] },
          category: '症状'
        },
        {
          id: 'q4',
          type: 'checkbox',
          question: '現在治療中の病気はありますか？（複数選択可）',
          required: false,
          options: ['高血圧', '糖尿病', '心臓病', '喘息', 'その他', 'なし'],
          category: '既往歴'
        },
        {
          id: 'q5',
          type: 'textarea',
          question: '現在服用中のお薬があれば教えてください',
          required: false,
          category: '服薬歴'
        },
        {
          id: 'q6',
          type: 'radio',
          question: 'アレルギーはありますか？',
          required: true,
          options: ['はい', 'いいえ'],
          category: 'アレルギー'
        }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'tmpl-002',
      name: '内科問診票',
      description: '内科受診用の詳細な問診票',
      category: 'internal',
      questions: [
        {
          id: 'q1',
          type: 'checkbox',
          question: '以下の症状はありますか？（複数選択可）',
          required: true,
          options: ['発熱', '咳', '痰', '息切れ', '胸痛', '動悸', '腹痛', '下痢', '便秘', '吐き気'],
          category: '症状'
        },
        {
          id: 'q2',
          type: 'text',
          question: '体温を測定していれば教えてください',
          required: false,
          category: 'バイタル'
        }
      ],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  // デモ用の回答データ
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([
    {
      id: 'resp-001',
      templateId: 'tmpl-001',
      templateName: '初診問診票',
      patientId: '2',
      patientName: 'John Smith',
      answers: {
        q1: '頭痛と発熱があります',
        q2: '2-3日前',
        q3: 6,
        q4: ['高血圧'],
        q5: '降圧薬を服用中',
        q6: 'いいえ'
      },
      submittedAt: new Date('2024-01-25T10:30'),
      status: 'submitted'
    }
  ]);

  const handleSubmitQuestionnaire = () => {
    if (!selectedTemplate) return;

    const newResponse: QuestionnaireResponse = {
      id: `resp-${Date.now()}`,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      patientId: user?.id || '2',
      patientName: user?.name || 'Unknown',
      answers: currentAnswers,
      submittedAt: new Date(),
      status: 'submitted'
    };

    setResponses([newResponse, ...responses]);
    setShowResponseModal(false);
    setCurrentAnswers({});
    setSelectedTemplate(null);
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentAnswers[question.id] || ''}
            onChange={(e) => setCurrentAnswers({ ...currentAnswers, [question.id]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required={question.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={currentAnswers[question.id] || ''}
            onChange={(e) => setCurrentAnswers({ ...currentAnswers, [question.id]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            required={question.required}
          />
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentAnswers[question.id] === option}
                  onChange={(e) => setCurrentAnswers({ ...currentAnswers, [question.id]: e.target.value })}
                  className="text-blue-500"
                  required={question.required}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(currentAnswers[question.id] || []).includes(option)}
                  onChange={(e) => {
                    const current = currentAnswers[question.id] || [];
                    if (e.target.checked) {
                      setCurrentAnswers({ ...currentAnswers, [question.id]: [...current, option] });
                    } else {
                      setCurrentAnswers({ ...currentAnswers, [question.id]: current.filter((v: string) => v !== option) });
                    }
                  }}
                  className="text-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'scale':
        const value = currentAnswers[question.id] || question.scale?.min || 0;
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{question.scale?.labels?.[0]}</span>
              <span className="text-lg font-medium text-blue-600">{value}</span>
              <span className="text-sm text-gray-600">{question.scale?.labels?.[1]}</span>
            </div>
            <input
              type="range"
              min={question.scale?.min || 0}
              max={question.scale?.max || 10}
              value={value}
              onChange={(e) => setCurrentAnswers({ ...currentAnswers, [question.id]: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={currentAnswers[question.id] || ''}
            onChange={(e) => setCurrentAnswers({ ...currentAnswers, [question.id]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required={question.required}
          />
        );
      
      default:
        return null;
    }
  };

  if (user?.role === 'doctor') {
    // 医師用: テンプレート管理と回答確認
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">問診票管理</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              テンプレート作成
            </button>
          </div>

          {/* タブ */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-2 px-1 ${activeTab === 'templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            >
              テンプレート
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`pb-2 px-1 ${activeTab === 'responses' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            >
              回答一覧
            </button>
          </div>

          {activeTab === 'templates' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.category === 'general' ? 'bg-gray-100 text-gray-800' :
                      template.category === 'internal' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {template.category === 'general' ? '一般' :
                       template.category === 'internal' ? '内科' : 'カスタム'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="text-xs text-gray-500 mb-4">
                    質問数: {template.questions.length} • 
                    更新: {format(template.updatedAt, 'MM月dd日', { locale: ja })}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                      編集
                    </button>
                    <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                      プレビュー
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">患者からの回答</h2>
              </div>
              <div className="divide-y">
                {responses.map((response) => (
                  <div key={response.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium text-gray-800">{response.patientName}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            response.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                            response.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {response.status === 'submitted' ? '未確認' :
                             response.status === 'reviewed' ? '確認済' : '下書き'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {response.templateName} • {format(response.submittedAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        </p>
                      </div>
                      <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        詳細
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 患者用: 問診票回答
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">問診票</h1>

        {/* 未回答の問診票 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">回答が必要な問診票</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <p className="text-xs text-gray-500 mb-4">
                  質問数: {template.questions.length} • 所要時間: 約5分
                </p>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowResponseModal(true);
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  回答する
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 回答済みの問診票 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">回答履歴</h2>
          <div className="bg-white rounded-xl shadow-lg">
            <div className="divide-y">
              {responses.map((response) => (
                <div key={response.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-800">{response.templateName}</p>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        回答日: {format(response.submittedAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        詳細
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 問診票回答モーダル */}
      {showResponseModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{selectedTemplate.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitQuestionnaire(); }} className="p-6">
              <div className="space-y-6">
                {selectedTemplate.questions.map((question, index) => (
                  <div key={question.id}>
                    <label className="block mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1}. {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </label>
                    {renderQuestionInput(question)}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedTemplate(null);
                    setCurrentAnswers({});
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  送信
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireView;
