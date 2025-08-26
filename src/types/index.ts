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
}