import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, User, Heart, Thermometer, Activity, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { auditLogger } from '../services/auditLogger';

interface EmergencyIncident {
  id: string;
  patientId: string;
  patientName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'cardiac' | 'respiratory' | 'neurological' | 'trauma' | 'psychiatric' | 'other';
  symptoms: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  location: {
    address: string;
    coordinates?: { lat: number; lon: number };
    landmark?: string;
  };
  contactInfo: {
    patientPhone: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  reportedAt: Date;
  status: 'reported' | 'escalated' | 'dispatched' | 'resolved';
  escalationPath: EscalationStep[];
  assignedResponders: Responder[];
}

interface EscalationStep {
  id: string;
  type: 'ai_triage' | 'doctor_review' | 'emergency_services' | 'specialist_consultation';
  triggeredAt: Date;
  completedAt?: Date;
  result: 'pending' | 'escalate' | 'resolved' | 'no_action';
  notes?: string;
  responderId?: string;
}

interface Responder {
  id: string;
  name: string;
  role: 'emergency_doctor' | 'paramedic' | 'specialist' | 'emergency_dispatcher';
  phone: string;
  location?: string;
  status: 'available' | 'responding' | 'busy';
  estimatedArrival?: Date;
}

interface EmergencyEscalationProps {
  patientId: string;
  patientName: string;
  onIncidentCreated?: (incident: EmergencyIncident) => void;
  initialSymptoms?: string[];
}

const EmergencyEscalation: React.FC<EmergencyEscalationProps> = ({
  patientId,
  patientName,
  onIncidentCreated,
  initialSymptoms = []
}) => {
  const [incident, setIncident] = useState<Partial<EmergencyIncident>>({
    patientId,
    patientName,
    symptoms: initialSymptoms,
    status: 'reported',
    escalationPath: [],
    assignedResponders: []
  });
  
  const [currentStep, setCurrentStep] = useState<'assessment' | 'location' | 'escalation' | 'monitoring'>('assessment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);

  const emergencyCategories = [
    {
      category: 'cardiac' as const,
      name: '心臓関連',
      symptoms: ['胸痛', '息切れ', '動悸', '失神', '冷や汗'],
      severity: 'critical',
      icon: Heart,
      color: 'red'
    },
    {
      category: 'respiratory' as const,
      name: '呼吸器系',
      symptoms: ['呼吸困難', '窒息', '激しい咳', '血痰'],
      severity: 'critical',
      icon: Activity,
      color: 'orange'
    },
    {
      category: 'neurological' as const,
      name: '神経系',
      symptoms: ['意識障害', '激しい頭痛', 'けいれん', '手足の麻痺', '言語障害'],
      severity: 'critical',
      icon: AlertTriangle,
      color: 'purple'
    },
    {
      category: 'trauma' as const,
      name: '外傷',
      symptoms: ['大量出血', '骨折', '頭部外傷', '火傷'],
      severity: 'high',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      category: 'psychiatric' as const,
      name: '精神科的',
      symptoms: ['自殺念慮', 'パニック発作', '異常行動', '幻覚'],
      severity: 'high',
      icon: User,
      color: 'blue'
    }
  ];

  const performAITriage = async (symptoms: string[], vitalSigns?: any): Promise<any> => {
    // AI トリアージシステム（実際はMLモデルを使用）
    await new Promise(resolve => setTimeout(resolve, 2000));

    const criticalKeywords = ['胸痛', '意識障害', '呼吸困難', '大量出血'];
    const hasCriticalSymptoms = symptoms.some(symptom => 
      criticalKeywords.some(keyword => symptom.includes(keyword))
    );

    if (hasCriticalSymptoms) {
      return {
        severity: 'critical',
        recommendation: '直ちに救急車を呼んでください',
        confidence: 0.95,
        escalationRequired: true,
        estimatedWaitTime: 0
      };
    }

    return {
      severity: 'medium',
      recommendation: '医師による診察が必要です',
      confidence: 0.78,
      escalationRequired: false,
      estimatedWaitTime: 15
    };
  };

  const handleEmergencyReport = async () => {
    if (!incident.symptoms || incident.symptoms.length === 0) {
      alert('症状を選択してください');
      return;
    }

    setIsProcessing(true);

    try {
      // AI トリアージ実行
      const triage = await performAITriage(incident.symptoms, incident.vitalSigns);
      setTriageResult(triage);

      // 緊急度に応じた自動エスカレーション
      const escalationStep: EscalationStep = {
        id: `step_${Date.now()}`,
        type: 'ai_triage',
        triggeredAt: new Date(),
        completedAt: new Date(),
        result: triage.escalationRequired ? 'escalate' : 'resolved',
        notes: `AI トリアージ結果: ${triage.recommendation}`
      };

      const updatedIncident: EmergencyIncident = {
        ...incident,
        id: `incident_${Date.now()}`,
        severity: triage.severity,
        category: determineCategory(incident.symptoms),
        reportedAt: new Date(),
        escalationPath: [escalationStep],
        assignedResponders: []
      } as EmergencyIncident;

      if (triage.severity === 'critical') {
        // 救急サービスに自動通報
        await escalateToEmergencyServices(updatedIncident);
      } else if (triage.severity === 'high') {
        // 緊急医師に通知
        await escalateToEmergencyDoctor(updatedIncident);
      }

      setIncident(updatedIncident);
      setCurrentStep(triage.escalationRequired ? 'escalation' : 'monitoring');

      // 監査ログ記録
      await auditLogger.logSecurityEvent('emergency_incident', patientId, {
        severity: triage.severity,
        symptoms: incident.symptoms,
        auto_escalation: triage.escalationRequired
      });

      onIncidentCreated?.(updatedIncident);

    } catch (error) {
      console.error('Emergency escalation failed:', error);
      alert('緊急対応システムエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const determineCategory = (symptoms: string[]): EmergencyIncident['category'] => {
    for (const category of emergencyCategories) {
      if (symptoms.some(symptom => 
        category.symptoms.some(catSymptom => 
          symptom.includes(catSymptom) || catSymptom.includes(symptom)
        )
      )) {
        return category.category;
      }
    }
    return 'other';
  };

  const escalateToEmergencyServices = async (incident: EmergencyIncident) => {
    // 実際の実装では119番通報システムAPIを使用
    console.log('Escalating to emergency services:', incident);
    
    const emergencyStep: EscalationStep = {
      id: `emergency_${Date.now()}`,
      type: 'emergency_services',
      triggeredAt: new Date(),
      result: 'escalate',
      notes: '救急車要請'
    };

    incident.escalationPath.push(emergencyStep);
    incident.status = 'escalated';
  };

  const escalateToEmergencyDoctor = async (incident: EmergencyIncident) => {
    // 待機中の緊急医師に通知
    const availableDoctors: Responder[] = [
      {
        id: 'emergency_doc_001',
        name: '田中先生（救急科）',
        role: 'emergency_doctor',
        phone: '090-1234-5678',
        status: 'available',
        estimatedArrival: new Date(Date.now() + 10 * 60 * 1000)
      }
    ];

    const doctorStep: EscalationStep = {
      id: `doctor_${Date.now()}`,
      type: 'doctor_review',
      triggeredAt: new Date(),
      result: 'escalate',
      responderId: availableDoctors[0].id,
      notes: '緊急医師による診察開始'
    };

    incident.escalationPath.push(doctorStep);
    incident.assignedResponders = availableDoctors;
    incident.status = 'escalated';
  };

  if (currentStep === 'monitoring') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
            triageResult?.severity === 'critical' ? 'bg-red-100' : 
            triageResult?.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
          }`}>
            <AlertTriangle className={`h-8 w-8 ${
              triageResult?.severity === 'critical' ? 'text-red-600' : 
              triageResult?.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
            }`} />
          </div>
          <h3 className="text-xl font-semibold">緊急対応を開始しました</h3>
          <p className="text-gray-600 mt-2">{triageResult?.recommendation}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-4">対応状況</h4>
          <div className="space-y-4">
            {incident.escalationPath?.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  step.completedAt ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {step.completedAt ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">
                    {step.type === 'ai_triage' ? 'AI トリアージ' :
                     step.type === 'doctor_review' ? '医師による診察' :
                     step.type === 'emergency_services' ? '救急車要請' : step.type}
                  </p>
                  <p className="text-sm text-gray-500">{step.notes}</p>
                  <p className="text-xs text-gray-400">
                    {step.triggeredAt.toLocaleTimeString()}
                    {step.completedAt && ` - ${step.completedAt.toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {incident.assignedResponders && incident.assignedResponders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">対応者</h4>
            {incident.assignedResponders.map(responder => (
              <div key={responder.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">{responder.name}</p>
                  <p className="text-sm text-blue-700">{responder.phone}</p>
                </div>
                {responder.estimatedArrival && (
                  <div className="text-right">
                    <p className="text-sm text-blue-700">到着予定</p>
                    <p className="font-medium text-blue-900">
                      {responder.estimatedArrival.toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <Phone className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <p className="font-medium text-red-800">緊急連絡先</p>
              <p className="text-red-700 text-sm">
                状況が悪化した場合は、直ちに119番に電話してください
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'location') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold">現在地情報</h3>
          <p className="text-gray-600 mt-2">救急対応のため、正確な位置をお知らせください</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">住所 *</label>
            <input
              type="text"
              value={incident.location?.address || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                location: { ...prev.location, address: e.target.value }
              }))}
              placeholder="東京都渋谷区..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目印・建物名</label>
            <input
              type="text"
              value={incident.location?.landmark || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                location: { ...prev.location, landmark: e.target.value }
              }))}
              placeholder="○○ビル3階、○○駅前など"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <button
            onClick={() => {
              // 位置情報取得
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setIncident(prev => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        coordinates: {
                          lat: position.coords.latitude,
                          lon: position.coords.longitude
                        }
                      }
                    }));
                  },
                  (error) => console.error('Location error:', error)
                );
              }
            }}
            className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
          >
            現在地を取得
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">緊急連絡先</label>
            <input
              type="tel"
              value={incident.contactInfo?.patientPhone || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                contactInfo: { ...prev.contactInfo, patientPhone: e.target.value }
              }))}
              placeholder="090-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('assessment')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            onClick={handleEmergencyReport}
            disabled={!incident.location?.address || isProcessing}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '緊急対応を開始'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">緊急事態の報告</h2>
        <p className="text-gray-600 mt-2">
          緊急性の高い症状について、適切な対応を行います
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
          <div>
            <p className="font-medium text-red-800">生命に関わる緊急事態の場合</p>
            <p className="text-red-700 text-sm">
              直ちに119番に電話してください。このシステムは補助的な役割です。
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">現在の症状を選択してください</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyCategories.map((category) => (
            <div
              key={category.category}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                incident.category === category.category
                  ? `border-${category.color}-500 bg-${category.color}-50`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setIncident(prev => ({ 
                ...prev, 
                category: category.category,
                severity: category.severity as any
              }))}
            >
              <div className="flex items-start">
                <category.icon className={`h-6 w-6 text-${category.color}-600 mr-3 mt-1`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                  <div className="space-y-1">
                    {category.symptoms.map((symptom, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={incident.symptoms?.includes(symptom) || false}
                          onChange={(e) => {
                            const symptoms = incident.symptoms || [];
                            if (e.target.checked) {
                              setIncident(prev => ({
                                ...prev,
                                symptoms: [...symptoms, symptom]
                              }));
                            } else {
                              setIncident(prev => ({
                                ...prev,
                                symptoms: symptoms.filter(s => s !== symptom)
                              }));
                            }
                          }}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{symptom}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">バイタルサイン（分かる範囲で）</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">血圧</label>
            <input
              type="text"
              placeholder="120/80"
              value={incident.vitalSigns?.bloodPressure || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, bloodPressure: e.target.value }
              }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">脈拍</label>
            <input
              type="number"
              placeholder="72"
              value={incident.vitalSigns?.heartRate || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, heartRate: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">体温 (°C)</label>
            <input
              type="number"
              step="0.1"
              placeholder="36.5"
              value={incident.vitalSigns?.temperature || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, temperature: parseFloat(e.target.value) }
              }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SpO2 (%)</label>
            <input
              type="number"
              placeholder="98"
              value={incident.vitalSigns?.oxygenSaturation || ''}
              onChange={(e) => setIncident(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, oxygenSaturation: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep('location')}
          disabled={!incident.symptoms || incident.symptoms.length === 0}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          次へ進む
          <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default EmergencyEscalation;