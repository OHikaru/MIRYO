import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Clock, ArrowRight, ArrowLeft, User, Calendar, MapPin, Thermometer, Activity } from 'lucide-react';
import { auditLogger } from '../services/auditLogger';

interface QuestionnaireResponse {
  questionId: string;
  question: string;
  answer: string | string[] | number | boolean;
  metadata?: {
    confidence?: number;
    timestamp?: Date;
    followUpRequired?: boolean;
  };
}

interface DiagnosticAssessment {
  id: string;
  patientId: string;
  questionnaireName: string;
  specialty: string;
  responses: QuestionnaireResponse[];
  aiAnalysis?: {
    suspectedConditions: Array<{
      condition: string;
      probability: number;
      icd10Code?: string;
      rationale: string;
    }>;
    recommendedTests: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    redFlags: string[];
    confidence: number;
  };
  completedAt?: Date;
  reviewedBy?: string;
  status: 'in_progress' | 'completed' | 'reviewed' | 'requires_follow_up';
}

interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'number' | 'scale' | 'yes_no' | 'conditional';
  category: string;
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  conditions?: {
    dependsOn: string;
    value: string | boolean;
  };
  validation?: {
    pattern?: string;
    message?: string;
  };
  followUpQuestions?: Question[];
}

const diagnosticQuestionnaireTemplates = {
  general: {
    name: '一般問診',
    specialty: '総合診療',
    questions: [
      {
        id: 'chief_complaint',
        type: 'text' as const,
        category: '主訴',
        question: '今回受診された主な理由や症状を教えてください',
        description: 'どのような症状で困っているか、具体的に記載してください',
        required: true
      },
      {
        id: 'symptom_duration',
        type: 'single_choice' as const,
        category: '症状の期間',
        question: 'その症状はいつ頃から始まりましたか？',
        required: true,
        options: ['今日始まった', '2-3日前', '1週間前', '2-3週間前', '1ヶ月以上前', '数ヶ月前から']
      },
      {
        id: 'pain_scale',
        type: 'scale' as const,
        category: '症状の程度',
        question: '現在の症状の程度を10段階で教えてください',
        description: '0 = 症状なし、10 = 耐えられないほど強い',
        min: 0,
        max: 10,
        required: true
      },
      {
        id: 'fever',
        type: 'yes_no' as const,
        category: '発熱',
        question: '発熱はありますか？',
        required: true
      },
      {
        id: 'fever_temp',
        type: 'number' as const,
        category: '体温',
        question: '最高体温は何度でしたか？',
        required: true,
        conditions: {
          dependsOn: 'fever',
          value: true
        },
        min: 35.0,
        max: 42.0
      }
    ]
  },
  respiratory: {
    name: '呼吸器系問診',
    specialty: '呼吸器内科',
    questions: [
      {
        id: 'cough',
        type: 'yes_no' as const,
        category: '咳',
        question: '咳は出ますか？',
        required: true
      },
      {
        id: 'cough_type',
        type: 'single_choice' as const,
        category: '咳の種類',
        question: 'どのような咳ですか？',
        required: true,
        conditions: {
          dependsOn: 'cough',
          value: true
        },
        options: ['乾いた咳', '痰の絡む咳', '血の混じる咳']
      },
      {
        id: 'shortness_of_breath',
        type: 'yes_no' as const,
        category: '呼吸困難',
        question: '息切れや呼吸困難はありますか？',
        required: true
      },
      {
        id: 'chest_pain',
        type: 'yes_no' as const,
        category: '胸痛',
        question: '胸の痛みはありますか？',
        required: true
      },
      {
        id: 'smoking_history',
        type: 'single_choice' as const,
        category: '喫煙歴',
        question: '喫煙歴について教えてください',
        required: true,
        options: ['吸わない', '過去に吸っていた', '現在吸っている']
      }
    ]
  },
  cardiovascular: {
    name: '循環器系問診',
    specialty: '循環器内科',
    questions: [
      {
        id: 'chest_pain_quality',
        type: 'single_choice' as const,
        category: '胸痛',
        question: '胸の痛みの性質を教えてください',
        required: true,
        options: ['圧迫感', '締め付けられる感じ', 'チクチクした痛み', '焼けるような痛み', '痛みはない']
      },
      {
        id: 'palpitations',
        type: 'yes_no' as const,
        category: '動悸',
        question: '動悸（心臓がドキドキする）はありますか？',
        required: true
      },
      {
        id: 'exercise_tolerance',
        type: 'scale' as const,
        category: '運動耐容能',
        question: '階段を上る時の息切れの程度を10段階で教えてください',
        description: '0 = 息切れしない、10 = 数段で息切れ',
        min: 0,
        max: 10,
        required: true
      },
      {
        id: 'leg_swelling',
        type: 'yes_no' as const,
        category: '浮腫',
        question: '足のむくみはありますか？',
        required: true
      }
    ]
  }
};

interface DiagnosticQuestionnaireProps {
  patientId: string;
  specialty?: keyof typeof diagnosticQuestionnaireTemplates;
  onComplete: (assessment: DiagnosticAssessment) => void;
  initialResponses?: QuestionnaireResponse[];
}

const DiagnosticQuestionnaire: React.FC<DiagnosticQuestionnaireProps> = ({
  patientId,
  specialty = 'general',
  onComplete,
  initialResponses = []
}) => {
  const template = diagnosticQuestionnaireTemplates[specialty];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>(initialResponses);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<Partial<DiagnosticAssessment>>({
    patientId,
    questionnaireName: template.name,
    specialty: template.specialty,
    responses: [],
    status: 'in_progress'
  });

  const getVisibleQuestions = (): Question[] => {
    return template.questions.filter(question => {
      if (!question.conditions) return true;
      
      const dependentResponse = responses.find(r => r.questionId === question.conditions!.dependsOn);
      return dependentResponse && dependentResponse.answer === question.conditions!.value;
    });
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const canProceed = currentQuestion && hasValidResponse(currentQuestion.id);

  function hasValidResponse(questionId: string): boolean {
    const response = responses.find(r => r.questionId === questionId);
    if (!response) return false;
    
    const question = template.questions.find(q => q.id === questionId);
    if (!question || !question.required) return true;
    
    return response.answer !== '' && response.answer !== undefined && response.answer !== null;
  }

  const updateResponse = (questionId: string, answer: any) => {
    setResponses(prev => {
      const existing = prev.find(r => r.questionId === questionId);
      const question = template.questions.find(q => q.id === questionId)!;
      
      const updatedResponse: QuestionnaireResponse = {
        questionId,
        question: question.question,
        answer,
        metadata: {
          timestamp: new Date(),
          confidence: 1.0
        }
      };

      if (existing) {
        return prev.map(r => r.questionId === questionId ? updatedResponse : r);
      } else {
        return [...prev, updatedResponse];
      }
    });
  };

  const performAIDiagnosticAnalysis = async (responses: QuestionnaireResponse[]) => {
    // AI診断支援システム（実際は医療AIモデルを使用）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 症状に基づく簡易的な条件分析
    const suspectedConditions = [];
    const recommendedTests = [];
    const redFlags = [];
    let urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'low';

    const feverResponse = responses.find(r => r.questionId === 'fever');
    const painResponse = responses.find(r => r.questionId === 'pain_scale');
    const chestPainResponse = responses.find(r => r.questionId === 'chest_pain');

    // 発熱の評価
    if (feverResponse?.answer === true) {
      const tempResponse = responses.find(r => r.questionId === 'fever_temp');
      const temp = tempResponse?.answer as number;
      
      if (temp && temp >= 38.5) {
        suspectedConditions.push({
          condition: '感染性疾患',
          probability: 0.75,
          icd10Code: 'R50.9',
          rationale: '高熱が認められるため'
        });
        recommendedTests.push('血液検査（WBC, CRP）');
        urgencyLevel = 'medium';
      }
    }

    // 胸痛の評価
    if (chestPainResponse?.answer === true) {
      suspectedConditions.push({
        condition: '心疾患の疑い',
        probability: 0.60,
        icd10Code: 'R06.02',
        rationale: '胸痛症状があるため'
      });
      recommendedTests.push('心電図検査');
      redFlags.push('急性冠症候群の可能性');
      urgencyLevel = 'high';
    }

    // 疼痛スケールの評価
    const painLevel = painResponse?.answer as number;
    if (painLevel && painLevel >= 8) {
      redFlags.push('重度疼痛による緊急対応必要');
      urgencyLevel = 'urgent';
    }

    return {
      suspectedConditions,
      recommendedTests: [...new Set(recommendedTests)],
      urgencyLevel,
      redFlags,
      confidence: 0.78
    };
  };

  const handleComplete = async () => {
    setIsAnalyzing(true);
    
    try {
      // AI診断支援分析実行
      const aiAnalysis = await performAIDiagnosticAnalysis(responses);
      
      const completedAssessment: DiagnosticAssessment = {
        id: `assessment_${Date.now()}`,
        patientId,
        questionnaireName: template.name,
        specialty: template.specialty,
        responses,
        aiAnalysis,
        completedAt: new Date(),
        status: aiAnalysis.urgencyLevel === 'urgent' ? 'requires_follow_up' : 'completed'
      };

      setAssessment(completedAssessment);

      // 監査ログ記録
      await auditLogger.logPHIAccess(
        patientId,
        'patient',
        patientId,
        'create',
        'diagnostic_questionnaire',
        {
          questionnaire_type: template.name,
          ai_analysis_performed: true,
          urgency_level: aiAnalysis.urgencyLevel
        }
      );

      onComplete(completedAssessment);
      
    } catch (error) {
      console.error('Diagnostic analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const currentResponse = responses.find(r => r.questionId === question.id);

    switch (question.type) {
      case 'text':
        return (
          <textarea
            value={(currentResponse?.answer as string) || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="詳しく記載してください"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentResponse?.answer === option}
                  onChange={(e) => updateResponse(question.id, e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(currentResponse?.answer as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const current = (currentResponse?.answer as string[]) || [];
                    if (e.target.checked) {
                      updateResponse(question.id, [...current, option]);
                    } else {
                      updateResponse(question.id, current.filter(item => item !== option));
                    }
                  }}
                  className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={currentResponse?.answer === true}
                onChange={() => updateResponse(question.id, true)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span>はい</span>
            </label>
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={currentResponse?.answer === false}
                onChange={() => updateResponse(question.id, false)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span>いいえ</span>
            </label>
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={question.min || 0}
              max={question.max || 10}
              value={(currentResponse?.answer as number) || question.min || 0}
              onChange={(e) => updateResponse(question.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{question.min || 0}</span>
              <span className="font-semibold text-lg text-blue-600">
                {(currentResponse?.answer as number) || question.min || 0}
              </span>
              <span>{question.max || 10}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            min={question.min}
            max={question.max}
            step={question.id === 'fever_temp' ? '0.1' : '1'}
            value={(currentResponse?.answer as number) || ''}
            onChange={(e) => updateResponse(question.id, parseFloat(e.target.value))}
            placeholder={question.id === 'fever_temp' ? '37.5' : '数値を入力'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        );

      default:
        return null;
    }
  };

  if (assessment.status === 'completed' || assessment.status === 'requires_follow_up') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
            assessment.aiAnalysis?.urgencyLevel === 'urgent' ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {assessment.aiAnalysis?.urgencyLevel === 'urgent' ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
          <h3 className="text-xl font-semibold">問診が完了しました</h3>
          <p className="text-gray-600 mt-2">AI による診断支援分析を実施しました</p>
        </div>

        {assessment.aiAnalysis && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-4 flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-2" />
                AI 診断支援結果
              </h4>
              
              <div className="space-y-4">
                {assessment.aiAnalysis.suspectedConditions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">可能性のある疾患</h5>
                    {assessment.aiAnalysis.suspectedConditions.map((condition, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-900">{condition.condition}</p>
                            <p className="text-sm text-blue-700">{condition.rationale}</p>
                            {condition.icd10Code && (
                              <p className="text-xs text-blue-600">ICD-10: {condition.icd10Code}</p>
                            )}
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {Math.round(condition.probability * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {assessment.aiAnalysis.recommendedTests.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">推奨検査</h5>
                    <div className="space-y-1">
                      {assessment.aiAnalysis.recommendedTests.map((test, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span>{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.aiAnalysis.redFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="font-medium text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      注意すべき所見
                    </h5>
                    {assessment.aiAnalysis.redFlags.map((flag, index) => (
                      <div key={index} className="text-red-700 text-sm">
                        • {flag}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">緊急度</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      assessment.aiAnalysis.urgencyLevel === 'urgent' ? 'bg-red-100 text-red-800' :
                      assessment.aiAnalysis.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                      assessment.aiAnalysis.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {assessment.aiAnalysis.urgencyLevel === 'urgent' ? '緊急' :
                       assessment.aiAnalysis.urgencyLevel === 'high' ? '高' :
                       assessment.aiAnalysis.urgencyLevel === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-700">AI信頼度</span>
                    <span className="font-medium">
                      {Math.round(assessment.aiAnalysis.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
            <div>
              <p className="font-medium text-blue-800">次のステップ</p>
              <p className="text-blue-700 text-sm mt-1">
                この問診結果は医師による診察時に参考として使用されます。
                AI診断は補助的なものであり、最終的な診断は医師が行います。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
        <p className="text-gray-600 mt-2">
          効率的な診察のため、事前に症状について教えてください
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-blue-800">進捗</span>
          <span className="text-blue-800 font-semibold">
            {currentQuestionIndex + 1} / {visibleQuestions.length}
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / visibleQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {currentQuestion && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {currentQuestion.category}
              </span>
              {currentQuestion.required && (
                <span className="ml-2 text-red-500 text-sm">必須</span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentQuestion.question}
            </h3>
            {currentQuestion.description && (
              <p className="text-gray-600 text-sm mb-4">{currentQuestion.description}</p>
            )}
          </div>

          {renderQuestion(currentQuestion)}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          前の質問
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleComplete}
            disabled={!canProceed || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isAnalyzing ? (
              <>
                <Clock className="animate-spin h-4 w-4 mr-2" />
                分析中...
              </>
            ) : (
              '問診を完了'
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={!canProceed}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            次の質問
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DiagnosticQuestionnaire;