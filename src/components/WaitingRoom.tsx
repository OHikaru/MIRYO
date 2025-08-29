import React from 'react';
import { Clock, Calendar, User, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const WaitingRoom: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-white" size={24} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Waiting Room</h2>
        <p className="text-gray-600 mb-6">
          Your healthcare provider will join you shortly. Please remain patient while we connect you.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Your Appointment Details</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>Dr. Sarah Johnson - Internal Medicine</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Today, 2:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <Video size={16} />
              <span>Video Consultation</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Waiting for doctor to join...</span>
        </div>

        <div className="text-xs text-gray-500">
          Average wait time: 2-5 minutes
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;