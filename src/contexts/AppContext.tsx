import React, { createContext, useContext, useState } from 'react';
import { 
  Message, 
  Consultation, 
  ChatRoom, 
  EmergencyAlert, 
  Appointment, 
  MedicalRecord, 
  UserSettings,
  RTCRoom,
  ConsentTemplate,
  ConsentRecord,
  HandoffSession,
  TriageAssessment,
  AIResponse,
  WebRTCStats,
  AuditEvent
} from '../types';

interface AppContextType {
  // Navigation
  activeView: string;
  setActiveView: (view: string) => void;
  
  // Chat
  activeRoom: ChatRoom | null;
  setActiveRoom: (room: ChatRoom | null) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  
  // Consultations
  consultations: Consultation[];
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  
  // Medical Records
  medicalRecords: MedicalRecord[];
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  
  // Emergency Alerts
  emergencyAlerts: EmergencyAlert[];
  addEmergencyAlert: (alert: Omit<EmergencyAlert, 'id' | 'timestamp'>) => void;
  acknowledgeAlert: (id: string, responderId: string, response?: string) => void;
  
  // Video Call
  isVideoCallActive: boolean;
  setVideoCallActive: (active: boolean) => void;
  isScreenSharing: boolean;
  setScreenSharing: (sharing: boolean) => void;
  
  // Settings
  userSettings: UserSettings | null;
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // Enhanced RTC Features
  rtcRooms: RTCRoom[];
  createRTCRoom: (room: Omit<RTCRoom, 'id' | 'createdAt'>) => void;
  joinRTCRoom: (roomId: string, participantId: string) => void;
  
  // AI/RAG Features
  aiResponses: AIResponse[];
  sendAIQuery: (query: string) => Promise<AIResponse>;
  
  // Consent Management
  consentTemplates: ConsentTemplate[];
  consentRecords: ConsentRecord[];
  createConsentRecord: (templateId: string, subjectId: string) => void;
  
  // Handoff/Escalation
  handoffSessions: HandoffSession[];
  createHandoff: (reason: string, context: Record<string, any>) => void;
  
  // Observability
  webrtcStats: WebRTCStats[];
  auditEvents: AuditEvent[];
  recordWebRTCStats: (stats: Omit<WebRTCStats, 'timestamp'>) => void;
  recordAuditEvent: (event: Omit<AuditEvent, 'id' | 'occurredAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState('consultations');
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isVideoCallActive, setVideoCallActive] = useState(false);
  const [isScreenSharing, setScreenSharing] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  const addMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
    };
    setMessages(prev => [...prev, message]);
  };

  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const appointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAppointments(prev => [...prev, appointment]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, ...updates, updatedAt: new Date() } : apt
    ));
  };

  const addMedicalRecord = (recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const record: MedicalRecord = {
      ...recordData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setMedicalRecords(prev => [...prev, record]);
  };

  const addEmergencyAlert = (alertData: Omit<EmergencyAlert, 'id' | 'timestamp'>) => {
    const alert: EmergencyAlert = {
      ...alertData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setEmergencyAlerts(prev => [...prev, alert]);
  };

  const acknowledgeAlert = (id: string, responderId: string, response?: string) => {
    setEmergencyAlerts(prev => prev.map(alert =>
      alert.id === id 
        ? { ...alert, acknowledged: true, responderId, response, resolvedAt: new Date() }
        : alert
    ));
  };

  const updateSettings = (settings: Partial<UserSettings>) => {
    setUserSettings(prev => prev ? { ...prev, ...settings } : null);
  };

  // Mock data
  const consultations: Consultation[] = [
    {
      id: '1',
      patientId: '2',
      doctorId: '1',
      scheduledAt: new Date(Date.now() + 3600000),
      status: 'scheduled',
      type: 'video',
    },
  ];

  // Initialize with mock data
  React.useEffect(() => {
    // Mock appointments
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patientId: '2',
        doctorId: '1',
        title: 'Follow-up Consultation',
        description: 'Regular check-up for diabetes management',
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
        duration: 30,
        type: 'video',
        status: 'confirmed',
        reminderSent: false,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
      },
      {
        id: '2',
        patientId: '2',
        doctorId: '1',
        title: 'Lab Results Review',
        scheduledAt: new Date(Date.now() + 172800000), // 2 days from now
        duration: 15,
        type: 'chat',
        status: 'scheduled',
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock medical records
    const mockRecords: MedicalRecord[] = [
      {
        id: '1',
        patientId: '2',
        doctorId: '1',
        type: 'prescription',
        title: 'Metformin Prescription',
        content: 'Metformin 500mg twice daily with meals for diabetes management',
        tags: ['diabetes', 'medication'],
        createdAt: new Date(Date.now() - 604800000),
        updatedAt: new Date(Date.now() - 604800000),
        isConfidential: false,
      },
      {
        id: '2',
        patientId: '2',
        doctorId: '1',
        type: 'lab-result',
        title: 'Blood Glucose Test',
        content: 'Fasting glucose: 126 mg/dL (elevated)\nHbA1c: 7.2% (target <7%)',
        tags: ['diabetes', 'lab-results'],
        createdAt: new Date(Date.now() - 1209600000),
        updatedAt: new Date(Date.now() - 1209600000),
        isConfidential: false,
      },
    ];

    setAppointments(mockAppointments);
    setMedicalRecords(mockRecords);
  }, []);

  return (
    <AppContext.Provider value={{
      activeView,
      setActiveView,
      activeRoom,
      setActiveRoom,
      messages,
      addMessage,
      consultations,
      appointments,
      addAppointment,
      updateAppointment,
      medicalRecords,
      addMedicalRecord,
      emergencyAlerts,
      addEmergencyAlert,
      acknowledgeAlert,
      isVideoCallActive,
      setVideoCallActive,
      isScreenSharing,
      setScreenSharing,
      userSettings,
      updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};