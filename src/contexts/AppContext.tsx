import React, { createContext, useContext, useState } from 'react';
import {
  AppContextType, ChatRoom, Message, Appointment, MedicalRecord,
  UserSettings, KnowledgeDoc, AIResponse, WebRTCStats,
  Prescription, ReferralLetter, EmergencyAlert,
} from '../types';
import { useAuth } from './AuthContext';
import { aiChatUnified } from '../services/aiClient';
import { getCurrentAIConfig } from '../services/aiConfig';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Basic UI state
  const [activeView, setActiveView] = useState<string>('dashboard');
  const currentRole = user?.role ?? 'patient';

  // Chat
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Video state
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isScreenSharing, setScreenSharing] = useState(false);
  // Back-compat alias for components expecting setVideoCallActive
  const setVideoCallActive = setIsVideoCallActive;

  // Data
  const [appointments] = useState<Appointment[]>([]);
  const [medicalRecords] = useState<MedicalRecord[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  // eConsent placeholders
  const [consentTemplates] = useState([] as any[]);
  const [consentRecords] = useState([] as any[]);

  // AI settings & knowledge base
  const [userSettings, setUserSettings] = useState<UserSettings | null>({
    locale: 'ja-JP',
    theme: 'light',
    notifications: true,
    privacyLevel: 'standard',
    ai: {
      model: getCurrentAIConfig(),
      retrieval: { topK: 5, threshold: 0.45, scopes: ['clinic_docs', 'faq', 'policies'] },
    },
  });

  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);

  const updateSettings = (s: Partial<UserSettings>) => {
    setUserSettings(prev => (prev ? { ...prev, ...s } : prev));
  };

  const uploadKnowledgeDoc = async (file: File, tags?: string[]): Promise<KnowledgeDoc> => {
    const doc: KnowledgeDoc = {
      id: `doc_${Date.now()}`,
      name: file.name,
      bytes: file.size,
      mime: file.type || 'application/octet-stream',
      uploadedAt: new Date(),
      tags,
    };
    setKnowledgeDocs(prev => [doc, ...prev]);
    return doc;
  };

  const aiChat: AppContextType['aiChat'] = async (msgs) => {
    if (!userSettings?.ai) {
      return {
        answer_markdown: 'AI設定が未構成です。設定 > AI でプロバイダとモデルを選択してください。',
        citations: [],
        confidence: 0,
        action: 'handoff_human',
        reasons: ['no_ai_settings'],
      } as AIResponse;
    }
    return aiChatUnified({
      config: userSettings.ai.model,
      messages: msgs,
      retrieval: userSettings.ai.retrieval,
      knowledgeDocs,
    });
  };

  // Prescriptions (simplified)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const createPrescription: AppContextType['createPrescription'] = (p) => {
    const id = `rx_${Date.now()}`;
    const fhir: Record<string, any> = {
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      subject: { reference: `Patient/${p.patientId}` },
      requester: { reference: `Practitioner/${p.practitionerId}` },
      authoredOn: new Date().toISOString(),
    };
    const created: Prescription = { ...p, id, fhirMedicationRequest: fhir };
    setPrescriptions(prev => [created, ...prev]);
    return created;
  };

  // Referrals (simplified)
  const [referrals, setReferrals] = useState<ReferralLetter[]>([]);
  const createReferral: AppContextType['createReferral'] = (r) => {
    const id = `ref_${Date.now()}`;
    const comp: Record<string, any> = {
      resourceType: 'Composition',
      status: 'final',
      title: '診療情報提供書（紹介状）',
      date: new Date().toISOString(),
    };
    const created: ReferralLetter = { ...r, id, fhirComposition: comp };
    setReferrals(prev => [created, ...prev]);
    return created;
  };

  // Observability (no-op demo)
  const recordWebRTCStats = (s: WebRTCStats) => console.debug('webrtc_stats', s.sessionId, s.stats.length);
  const recordAuditEvent = (type: string, actorId: string, subjectId: string, data?: Record<string, any>) =>
    console.debug('audit', { type, actorId, subjectId, data, at: new Date().toISOString() });

  const addEmergencyAlert = (alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'acknowledged'>) => {
    const newAlert: EmergencyAlert = { ...alert, id: `alert_${Date.now()}`, createdAt: new Date(), acknowledged: false };
    setEmergencyAlerts(prev => [newAlert, ...prev]);
    return newAlert;
  };
  const acknowledgeAlert = (alertId: string, responderId: string, response?: string) => {
    setEmergencyAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true, responderId, response, resolvedAt: new Date() } : a));
  };
  const addMessage = (m: Message) => setMessages(prev => [...prev, m]);

  return (
    <AppContext.Provider value={{
      activeView, setActiveView,
      currentRole,
      activeRoom, setActiveRoom, messages, addMessage,
      isVideoCallActive, setIsVideoCallActive, isScreenSharing, setScreenSharing,
      // @ts-ignore - for compatibility with ChatInterface
      setVideoCallActive,
      appointments, medicalRecords, emergencyAlerts, addEmergencyAlert, acknowledgeAlert,
      consentTemplates, consentRecords,
      userSettings, updateSettings,
      knowledgeDocs, uploadKnowledgeDoc,
      aiChat,
      prescriptions, createPrescription,
      referrals, createReferral,
      recordWebRTCStats, recordAuditEvent,
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

