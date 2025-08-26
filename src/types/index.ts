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