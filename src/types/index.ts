// REVISED: AIプロバイダ設定、知識ベース、処方箋/紹介状（FHIR準拠）型、役割別UIサポートを追加
export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;   // doctor only
  licenseNumber?: string;    // doctor only
  phone?: string;
  dateOfBirth?: string;
  medicalHistory?: string[];
  isOnline: boolean;
  lastSeen: Date;
}

export interface ChatRoom {
  id: string;
  title: string;
  participantIds: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  attachments?: { name: string; url: string; mime: string }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  practitionerId: string;
  start: Date;
  end: Date;
  status: 'booked' | 'arrived' | 'fulfilled' | 'cancelled';
  description?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  authorId: string;
  note: string;
  createdAt: Date;
}

export interface EmergencyAlert {
  id: string;
  patientId: string;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  responderId?: string;
  response?: string;
  resolvedAt?: Date;
}

export interface WebRTCStats {
  sessionId: string;
  stats: Record<string, any>[];
  collectedAt: Date;
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  // 開発用フロント保持は非推奨。本番ではAI Gateway側で管理
  apiKey?: string;
  endpointBase?: string; // 例: OpenAI https://api.openai.com
  devKeyInBrowser?: boolean;
}

export interface RetrievalConfig {
  topK: number;
  threshold: number; // 類似度スコアの閾値
  scopes: ('clinic_docs' | 'consent_templates' | 'faq' | 'policies' | 'ehr_subset')[];
}

export interface AISettings {
  model: AIModelConfig;
  retrieval: RetrievalConfig;
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  bytes: number;
  mime: string;
  uploadedAt: Date;
  url?: string; // サーバ保存先（将来のオブジェクトストレージ）
  tags?: string[];
}

export interface UserSettings {
  locale: 'ja-JP' | 'en-US';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  privacyLevel: 'standard' | 'strict';
  ai?: AISettings; // REVISED: 追加
}

export interface ConsentTemplate {
  id: string;
  title: string;
  version: string;
  locale: string;
  contentMd: string;
  signatureType: 'qes' | 'aes' | 'ses';
}

export interface ConsentRecord {
  id: string;
  templateId: string;
  subjectId: string;
  status: 'pending' | 'signed' | 'revoked';
  signedAt: Date | null;
  evidence?: { signaturePdfUri?: string; auditLogUri?: string };
}

export interface TriageAssessment {
  severity: 'emergent' | 'urgent' | 'routine' | 'unknown';
  uncertainty: number; // 0-1
  reasons: string[];
  action: 'continue_ai' | 'handoff_human' | 'call_emergency';
  citations?: string[];
}

export interface AIResponse {
  answer_markdown: string;
  citations: string[];
  confidence: number;
  action: 'continue_ai' | 'handoff_human' | 'call_emergency';
  reasons: string[];
}

// --- 処方箋（FHIR JP Core MedicationRequestに対応する最小セット） ---
export interface MedicationItem {
  codeSystem?: string; // e.g., "urn:oid:1.2.392.200119.4.403.1" (YJコード等)
  code?: string;
  display?: string;
  dosageText?: string;  // 例: 1日3回 毎食後 1錠
  quantity?: { value: number; unit: string }; // 例: {10, "錠"}
  repeats?: number; // リフィル回数
  route?: string; // 投与経路
  timingCode?: string; // 用法マスタコード等
}

export interface Prescription {
  id: string;
  patientId: string;
  practitionerId: string;
  issuedAt: Date;
  items: MedicationItem[];
  fhirMedicationRequest?: Record<string, any>;
}

// --- 紹介状（診療情報提供書 FHIR Composition） ---
export interface ReferralLetter {
  id: string;
  patientId: string;
  practitionerId: string;
  toOrganization: string;
  reason: string;
  summary: string;
  createdAt: Date;
  attachments?: { name: string; url: string; mime: string }[];
  fhirComposition?: Record<string, any>;
}

// --- アプリ状態/操作 ---
export interface AppContextType {
  activeView: string;
  setActiveView: (v: string) => void;

  // 役割
  currentRole: UserRole;

  // チャット
  activeRoom: ChatRoom | null;
  setActiveRoom: (r: ChatRoom | null) => void;
  messages: Message[];
  addMessage: (m: Message) => void;

  // ビデオ
  isVideoCallActive: boolean;
  setIsVideoCallActive: (b: boolean) => void;
  isScreenSharing: boolean;
  setScreenSharing: (b: boolean) => void;

  // 予約/患者/記録
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];

  // eConsent
  consentTemplates: ConsentTemplate[];
  consentRecords: ConsentRecord[];

  // AI設定/知識
  userSettings: UserSettings | null;
  updateSettings: (s: Partial<UserSettings>) => void;
  knowledgeDocs: KnowledgeDoc[];
  uploadKnowledgeDoc: (file: File, tags?: string[]) => Promise<KnowledgeDoc>;

  // AIチャット（RAG＋マルチプロバイダ）
  aiChat: (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) => Promise<AIResponse>;

  // 処方/紹介状
  prescriptions: Prescription[];
  createPrescription: (p: Omit<Prescription, 'id' | 'fhirMedicationRequest'>) => Prescription;
  referrals: ReferralLetter[];
  createReferral: (r: Omit<ReferralLetter, 'id' | 'fhirComposition'>) => ReferralLetter;

  // 監査/QoE
  recordWebRTCStats: (s: WebRTCStats) => void;
  recordAuditEvent: (type: string, actorId: string, subjectId: string, data?: Record<string, any>) => void;
}