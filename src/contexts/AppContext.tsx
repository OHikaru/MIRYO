// REVISED: 役割別UI、AI設定/知識ベース、マルチAI呼出、処方箋/紹介状、監査の状態管理を追加
import React, { createContext, useContext, useState } from 'react';
import {
  AppContextType, ChatRoom, Message, Appointment, MedicalRecord,
  UserSettings, KnowledgeDoc, AIResponse, WebRTCStats,
  Prescription, ReferralLetter, EmergencyAlert
} from '../types';
import { useAuth } from './AuthContext';
import { aiChatUnified } from '../services/aiClient';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // --- 基本状態 ---
  const [activeView, setActiveView] = useState<string>('consultations');
  const currentRole = user?.role ?? 'patient';

  // Chat
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Video
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isScreenSharing, setScreenSharing] = useState(false);

  // Data
  const [appointments] = useState<Appointment[]>([]);
  const [medicalRecords] = useState<MedicalRecord[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  // eConsent（テンプレ/記録はダミー）
  const [consentTemplates] = useState([]);
  const [consentRecords] = useState([]);

  // --- AI設定/知識ベース ---
  const [userSettings, setUserSettings] = useState<UserSettings | null>({
    locale: 'ja-JP',
    theme: 'light',
    notifications: true,
    privacyLevel: 'standard',
    ai: {
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        endpointBase: 'https://api.openai.com',
        devKeyInBrowser: true
      },
      retrieval: { topK: 5, threshold: 0.45, scopes: ['clinic_docs', 'faq', 'policies'] }
    }
  });

  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);

  const updateSettings = (s: Partial<UserSettings>) => {
    setUserSettings(prev => prev ? { ...prev, ...s } : prev);
  };

  const uploadKnowledgeDoc = async (file: File, tags?: string[]): Promise<KnowledgeDoc> => {
    // 本番: /api/ai/docs (multipart) へPOSTし、オブジェクトストレージへ保存＋ベクタ化
    const doc: KnowledgeDoc = {
      id: `doc_${Date.now()}`,
      name: file.name,
      bytes: file.size,
      mime: file.type || 'application/octet-stream',
      uploadedAt: new Date(),
      tags
    };
    setKnowledgeDocs(prev => [doc, ...prev]);
    return doc;
  };

  // --- AIチャット（Gatewayを推奨。開発時はdevKeyInBrowser=trueで直叩き可能） ---
  const aiChat: AppContextType['aiChat'] = async (msgs) => {
    if (!userSettings?.ai) {
      return {
        answer_markdown: 'AI設定が未構成です。',
        citations: [],
        confidence: 0,
        action: 'handoff_human',
        reasons: ['AI設定なし']
      };
    }
    const res = await aiChatUnified({
      config: userSettings.ai.model,
      messages: msgs,
      retrieval: userSettings.ai.retrieval,
      knowledgeDocs
    });
    return res;
  };

  // --- 処方箋（FHIR MedicationRequest最小生成） ---
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const createPrescription: AppContextType['createPrescription'] = (p) => {
    const id = `rx_${Date.now()}`;
    const fhir: Record<string, any> = {
      resourceType: 'MedicationRequest',
      meta: { profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_MedicationRequest'] },
      status: 'active',
      intent: 'order',
      subject: { reference: `Patient/${p.patientId}` },
      requester: { reference: `Practitioner/${p.practitionerId}` },
      authoredOn: new Date().toISOString(),
      // items -> dosageInstruction/dispenseRequest（簡略化）
      dosageInstruction: (p.items || []).map(it => ({
        text: it.dosageText,
        timing: it.timingCode ? {
          code: { coding: [{ system: 'urn:oid:1.2.392.200250.2.2.20', code: it.timingCode }] }
        } : undefined,
        route: it.route ? { text: it.route } : undefined
      })),
      dispenseRequest: {
        numberOfRepeatsAllowed: p.items?.[0]?.repeats ?? 0,
      }
    };
    const created: Prescription = { ...p, id, fhirMedicationRequest: fhir };
    setPrescriptions(prev => [created, ...prev]);
    return created;
  };

  // --- 紹介状（FHIR Composition: 診療情報提供書） ---
  const [referrals, setReferrals] = useState<ReferralLetter[]>([]);
  const createReferral: AppContextType['createReferral'] = (r) => {
    const id = `ref_${Date.now()}`;
    const comp: Record<string, any> = {
      resourceType: 'Composition',
      meta: {
        // 診療情報提供書 IG（最新版 v1.11 のcanonical例。運用先に合わせ調整）
        profile: ['http://std.jpfhir.jp/fhir/eReferral/StructureDefinition/JP_ReferralDocument']
      },
      status: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '57133-1', display: 'Consult note' }]
      },
      subject: { reference: `Patient/${r.patientId}` },
      author: [{ reference: `Practitioner/${r.practitionerId}` }],
      title: '診療情報提供書（紹介状）',
      date: new Date().toISOString(),
      section: [
        { title: '紹介理由', text: { status: 'generated', div: `<div>${r.reason}</div>` } },
        { title: '要約', text: { status: 'generated', div: `<div>${r.summary}</div>` } }
      ]
    };
    const created: ReferralLetter = { ...r, id, fhirComposition: comp };
    setReferrals(prev => [created, ...prev]);
    return created;
  };

  // 監査/QoE
  const recordWebRTCStats = (s: WebRTCStats) => {
    // 本番は /observability/webrtc_stats にPOST
    console.debug('webrtc_stats', s.sessionId, s.stats.length);
  };
  const recordAuditEvent = (type: string, actorId: string, subjectId: string, data?: Record<string, any>) => {
    // 本番は /audit/events にPOST
    console.debug('audit', { type, actorId, subjectId, data, at: new Date().toISOString() });
  };

  // Emergency alerts management
  const addEmergencyAlert = (alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'acknowledged'>) => {
    const newAlert: EmergencyAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      createdAt: new Date(),
      acknowledged: false
    };
    setEmergencyAlerts(prev => [newAlert, ...prev]);
    return newAlert;
  };

  const acknowledgeAlert = (alertId: string, responderId: string, response?: string) => {
    setEmergencyAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, responderId, response, resolvedAt: new Date() }
        : alert
    ));
  };
  // チャットユーティリティ
  const addMessage = (m: Message) => setMessages(prev => [...prev, m]);

  return (
    <AppContext.Provider value={{
      activeView, setActiveView,
      currentRole,
      activeRoom, setActiveRoom, messages, addMessage,
      isVideoCallActive, setIsVideoCallActive, isScreenSharing, setScreenSharing,
      appointments, medicalRecords, emergencyAlerts, addEmergencyAlert, acknowledgeAlert,
      consentTemplates, consentRecords,
      userSettings, updateSettings,
      knowledgeDocs, uploadKnowledgeDoc,
      aiChat,
      prescriptions, createPrescription,
      referrals, createReferral,
      recordWebRTCStats, recordAuditEvent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp must be used within an AppProvider');
  return c;
};