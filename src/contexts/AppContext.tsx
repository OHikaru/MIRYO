import React, { createContext, useContext, useState } from 'react';
import { Message, Consultation, ChatRoom, EmergencyAlert } from '../types';

interface AppContextType {
  activeRoom: ChatRoom | null;
  setActiveRoom: (room: ChatRoom | null) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  consultations: Consultation[];
  emergencyAlerts: EmergencyAlert[];
  isVideoCallActive: boolean;
  setVideoCallActive: (active: boolean) => void;
  isScreenSharing: boolean;
  setScreenSharing: (sharing: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVideoCallActive, setVideoCallActive] = useState(false);
  const [isScreenSharing, setScreenSharing] = useState(false);

  const addMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
    };
    setMessages(prev => [...prev, message]);
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

  const emergencyAlerts: EmergencyAlert[] = [];

  return (
    <AppContext.Provider value={{
      activeRoom,
      setActiveRoom,
      messages,
      addMessage,
      consultations,
      emergencyAlerts,
      isVideoCallActive,
      setVideoCallActive,
      isScreenSharing,
      setScreenSharing,
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