export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  avatar?: string;
  specialization?: string;
  licenseNumber?: string;
  phone?: string;
  dateOfBirth?: string;
  medicalHistory?: string[];
  isOnline: boolean;
  lastSeen: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'emergency';
  timestamp: Date;
  isRead: boolean;
  fileName?: string;
  fileUrl?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio' | 'chat';
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  duration?: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: User[];
  lastMessage?: Message;
  isActive: boolean;
  consultationId?: string;
}

export interface EmergencyAlert {
  id: string;
  patientId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  responderId?: string;
  response?: string;
  resolvedAt?: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  type: 'video' | 'audio' | 'chat';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  type: 'prescription' | 'lab-result' | 'diagnosis' | 'treatment-plan' | 'note' | 'document';
  title: string;
  content: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isConfidential: boolean;
}

export interface UserSettings {
  userId: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointments: boolean;
    messages: boolean;
    emergencies: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'doctors-only';
    shareDataForResearch: boolean;
    allowMarketing: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

// Enhanced types based on C4 architecture and OpenAPI 3.1 spec

export interface RTCRoom {
  id: string;
  title: string;
  participants: RTCParticipant[];
  createdAt: Date;
  region?: string;
  e2ee: boolean;
  recording: boolean;
  status: 'active' | 'ended';
}

export interface RTCParticipant {
  id: string;
  role: 'patient' | 'practitioner' | 'staff';
  joinedAt?: Date;
  isConnected: boolean;
}

export interface JoinToken {
  roomId: string;
  token: string;
  expiresAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  confidence?: number;
  escalated?: boolean;
}

export interface Citation {
  sourceId: string;
  uri: string;
  span: string;
}

export interface RAGQuery {
  query: string;
  topK: number;
  rerank: boolean;
  scope: ('clinic_docs' | 'consent_templates' | 'faq' | 'policies' | 'ehr_subset')[];
}

export interface RAGResult {
  docId: string;
  score: number;
  uri: string;
  snippet: string;
}

export interface TriageAssessment {
  severity: 'emergent' | 'urgent' | 'routine' | 'unknown';
  uncertainty: number;
  reasons: string[];
  action: 'continue_ai' | 'handoff_human' | 'call_emergency';
  citations: string[];
}

export interface HandoffSession {
  id: string;
  status: 'pending' | 'assigned' | 'active' | 'closed';
  assignedTo?: string;
  reason: string;
  context: Record<string, any>;
  createdAt: Date;
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
  signedAt?: Date;
  evidence?: {
    signaturePdfUri: string;
    auditLogUri: string;
  };
}

export interface VoiceCall {
  id: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
  to: string;
  from?: string;
  streamUrl?: string;
  ivrFlowId?: string;
}

export interface FHIRResource {
  resourceType: string;
  id?: string;
  [key: string]: any;
}

export interface PaymentIntent {
  id: string;
  status: 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  amount: number;
  currency: string;
  description?: string;
}

export interface WebRTCStats {
  sessionId: string;
  timestamp: Date;
  stats: RTCStatsReport[];
}

export interface AuditEvent {
  id: string;
  type: string;
  actorId: string;
  subjectId: string;
  occurredAt: Date;
  data: Record<string, any>;
}

export interface AIResponse {
  answer_markdown: string;
  citations: string[];
  confidence: number;
  action: 'continue_ai' | 'handoff_human' | 'call_emergency';
  reasons: string[];
}