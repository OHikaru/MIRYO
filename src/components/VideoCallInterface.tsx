import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const VideoCallInterface: React.FC = () => {
  const { user } = useAuth();
  const { setVideoCallActive, isScreenSharing, setScreenSharing } = useApp();
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOn, setIsVideoOn] = React.useState(true);

  const endCall = () => {
    setVideoCallActive(false);
    setScreenSharing(false);
  };

  return (
    <div className="relative bg-gray-900 h-64 flex items-center justify-center overflow-hidden">
      {/* Video Feed Simulation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-50"></div>
      
      {/* Main Video Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center text-white">
        {isScreenSharing ? (
          <div className="text-center">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-75" />
            <p className="text-lg font-medium">Screen Sharing Active</p>
            <p className="text-sm opacity-75">Medical reports and documents</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <p className="text-lg font-medium">{user?.name}</p>
            <p className="text-sm opacity-75">Video consultation in progress</p>
          </div>
        )}
      </div>

      {/* Picture-in-Picture for other participant */}
      <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-gray-600 flex items-center justify-center">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">DR</span>
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black bg-opacity-50 px-6 py-3 rounded-full">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-3 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <MicOff className="text-white" size={20} /> : <Mic className="text-white" size={20} />}
        </button>

        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`p-3 rounded-full transition-colors ${
            !isVideoOn 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVideoOn ? <Video className="text-white" size={20} /> : <VideoOff className="text-white" size={20} />}
        </button>

        <button
          onClick={() => setScreenSharing(!isScreenSharing)}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isScreenSharing ? <MonitorOff className="text-white" size={20} /> : <Monitor className="text-white" size={20} />}
        </button>

        <button
          onClick={endCall}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
        >
          <PhoneOff className="text-white" size={20} />
        </button>
      </div>

      {/* Call Status */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm">Connected - 02:34</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;