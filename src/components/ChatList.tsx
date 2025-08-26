import React from 'react';
import { MessageSquare, Video, Phone, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ChatRoom, User } from '../types';
import { formatDistanceToNow } from 'date-fns';

// Mock chat rooms
const mockChatRooms: ChatRoom[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    participants: [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah@clinic.com',
        role: 'doctor',
        specialization: 'Internal Medicine',
        isOnline: true,
        lastSeen: new Date(),
      },
      {
        id: '2',
        name: 'John Smith',
        email: 'john@email.com',
        role: 'patient',
        isOnline: true,
        lastSeen: new Date(),
      },
    ],
    isActive: true,
    lastMessage: {
      id: '1',
      senderId: '1',
      receiverId: '2',
      content: 'How are you feeling today?',
      type: 'text',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
    },
  },
  {
    id: '2',
    name: 'John Smith',
    participants: [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah@clinic.com',
        role: 'doctor',
        specialization: 'Internal Medicine',
        isOnline: true,
        lastSeen: new Date(),
      },
      {
        id: '2',
        name: 'John Smith',
        email: 'john@email.com',
        role: 'patient',
        isOnline: false,
        lastSeen: new Date(Date.now() - 1800000),
      },
    ],
    isActive: false,
    lastMessage: {
      id: '2',
      senderId: '2',
      receiverId: '1',
      content: 'Thank you for the consultation yesterday.',
      type: 'text',
      timestamp: new Date(Date.now() - 86400000),
      isRead: true,
    },
  },
];

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { activeRoom, setActiveRoom } = useApp();

  const getOtherParticipant = (room: ChatRoom): User => {
    return room.participants.find(p => p.id !== user?.id) || room.participants[0];
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900">
          {user?.role === 'doctor' ? 'Patient Consultations' : 'My Consultations'}
        </h3>
        <p className="text-sm text-gray-500">Active and recent conversations</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockChatRooms.map((room) => {
          const otherUser = getOtherParticipant(room);
          const isActive = activeRoom?.id === room.id;

          return (
            <div
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                isActive ? 'bg-blue-50 border-blue-200' : 'hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {otherUser.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    otherUser.isOnline ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{otherUser.name}</h4>
                    {room.isActive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                    )}
                  </div>
                  
                  {otherUser.specialization && (
                    <p className="text-xs text-gray-500 mb-1">{otherUser.specialization}</p>
                  )}

                  {room.lastMessage && (
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {room.lastMessage.content}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {room.lastMessage && formatDistanceToNow(room.lastMessage.timestamp, { addSuffix: true })}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Phone size={14} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Video size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="p-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            + Schedule New Consultation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatList;