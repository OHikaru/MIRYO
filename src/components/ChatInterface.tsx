import React, { useState } from 'react';
import { Send, Paperclip, Phone, Video, Monitor, MoreVertical, AlertTriangle, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import EnhancedVideoCall from './EnhancedVideoCall';
import { formatDistanceToNow } from 'date-fns';

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { activeRoom, messages, addMessage, isVideoCallActive, setVideoCallActive, isScreenSharing, setScreenSharing } = useApp();
  const [inputMessage, setInputMessage] = useState('');

  if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No conversation selected</h3>
          <p className="text-gray-400">Choose a consultation to start communicating</p>
        </div>
      </div>
    );
  }

  const otherUser = activeRoom.participants.find(p => p.id !== user?.id);
  const roomMessages = messages.filter(m => 
    (m.senderId === user?.id && m.receiverId === otherUser?.id) ||
    (m.senderId === otherUser?.id && m.receiverId === user?.id)
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user || !otherUser) return;

    addMessage({
      senderId: user.id,
      receiverId: otherUser.id,
      content: inputMessage,
      type: 'text',
      isRead: false,
    });

    setInputMessage('');
  };

  const startVideoCall = () => {
    setVideoCallActive(true);
  };

  const sendEmergencyAlert = () => {
    if (!user || !otherUser) return;

    addMessage({
      senderId: user.id,
      receiverId: otherUser.id,
      content: 'EMERGENCY: Patient requires immediate attention!',
      type: 'emergency',
      isRead: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {otherUser?.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                otherUser?.isOnline ? 'bg-green-400' : 'bg-gray-300'
              }`}></div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">{otherUser?.name}</h3>
              <p className="text-sm text-gray-500">
                {otherUser?.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(otherUser?.lastSeen || new Date(), { addSuffix: true })}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'patient' && (
              <button
                onClick={sendEmergencyAlert}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <AlertTriangle size={16} />
                Emergency
              </button>
            )}
            
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone size={20} />
            </button>
            
            <button
              onClick={startVideoCall}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Video size={20} />
            </button>
            
            <button
              onClick={() => setScreenSharing(!isScreenSharing)}
              className={`p-2 rounded-lg transition-colors ${
                isScreenSharing 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Monitor size={20} />
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Video Call Interface */}
      {isVideoCallActive && <EnhancedVideoCall />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {roomMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Start your consultation by sending a message</p>
          </div>
        ) : (
          roomMessages.map((message) => {
            const isFromUser = message.senderId === user?.id;
            const isEmergency = message.type === 'emergency';

            return (
              <div
                key={message.id}
                className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isEmergency 
                    ? 'bg-red-600 text-white' 
                    : isFromUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  {isEmergency && (
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={16} />
                      <span className="font-semibold text-sm">EMERGENCY ALERT</span>
                    </div>
                  )}
                  <p className={isEmergency ? 'font-medium' : ''}>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isEmergency || isFromUser ? 'text-white opacity-75' : 'text-gray-500'
                  }`}>
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;