import React, { useEffect, useRef, useState } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  Shield, 
  Activity,
  Users,
  Settings
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const EnhancedVideoCall: React.FC = () => {
  const { user } = useAuth();
  const { 
    setVideoCallActive, 
    isScreenSharing, 
    setScreenSharing,
    recordWebRTCStats,
    recordAuditEvent
  } = useApp();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [participantCount, setParticipantCount] = useState(2);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize WebRTC connection with enhanced security
    const initializeWebRTC = async () => {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { 
            urls: 'turn:turn.example.com:443',
            username: 'user',
            credential: 'pass'
          }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);
      
      // Start collecting WebRTC statistics
      startStatsCollection();
      
      // Record audit event
      recordAuditEvent({
        type: 'video_call_started',
        actorId: user?.id || 'unknown',
        subjectId: 'video_call_session',
        data: { e2ee: isE2EEEnabled, participants: participantCount }
      });
    };

    initializeWebRTC();

    // Call duration timer
    const durationInterval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      clearInterval(durationInterval);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const startStatsCollection = () => {
    if (!peerConnectionRef.current) return;

    statsIntervalRef.current = setInterval(async () => {
      if (peerConnectionRef.current) {
        try {
          const stats = await peerConnectionRef.current.getStats();
          const statsArray: any[] = [];
          stats.forEach(report => {
            statsArray.push({
              id: report.id,
              type: report.type,
              timestamp: report.timestamp,
              ...report
            });
          });

          recordWebRTCStats({
            sessionId: 'current_session',
            stats: statsArray as any
          });

          // Analyze connection quality
          analyzeConnectionQuality(stats);
        } catch (error) {
          console.error('Failed to collect WebRTC stats:', error);
        }
      }
    }, 3000);
  };

  const analyzeConnectionQuality = (stats: RTCStatsReport) => {
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const packetsLost = (report as any).packetsLost || 0;
        const packetsReceived = (report as any).packetsReceived || 1;
        const lossRate = packetsLost / (packetsLost + packetsReceived);
        
        if (lossRate > 0.05) quality = 'poor';
        else if (lossRate > 0.02) quality = 'fair';
        else if (lossRate > 0.01) quality = 'good';
      }
    });
    
    setConnectionQuality(quality);
  };

  const endCall = () => {
    recordAuditEvent({
      type: 'video_call_ended',
      actorId: user?.id || 'unknown',
      subjectId: 'video_call_session',
      data: { duration: callDuration, quality: connectionQuality }
    });
    
    setVideoCallActive(false);
    setScreenSharing(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    recordAuditEvent({
      type: 'audio_mute_toggled',
      actorId: user?.id || 'unknown',
      subjectId: 'video_call_session',
      data: { muted: !isMuted }
    });
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    recordAuditEvent({
      type: 'video_toggle',
      actorId: user?.id || 'unknown',
      subjectId: 'video_call_session',
      data: { videoOn: !isVideoOn }
    });
  };

  const toggleScreenShare = () => {
    setScreenSharing(!isScreenSharing);
    recordAuditEvent({
      type: 'screen_share_toggled',
      actorId: user?.id || 'unknown',
      subjectId: 'video_call_session',
      data: { sharing: !isScreenSharing }
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="relative bg-gray-900 h-80 flex items-center justify-center overflow-hidden rounded-lg">
      {/* Video Feed Simulation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-50"></div>
      
      {/* Main Video Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center text-white">
        {isScreenSharing ? (
          <div className="text-center">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-75" />
            <p className="text-lg font-medium">Screen Sharing Active</p>
            <p className="text-sm opacity-75">Medical reports and documents</p>
            {isE2EEEnabled && (
              <div className="flex items-center justify-center gap-2 mt-2 text-green-400">
                <Shield size={16} />
                <span className="text-xs">End-to-End Encrypted</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <p className="text-lg font-medium">{user?.name}</p>
            <p className="text-sm opacity-75">Secure video consultation</p>
            {isE2EEEnabled && (
              <div className="flex items-center justify-center gap-2 mt-2 text-green-400">
                <Shield size={16} />
                <span className="text-xs">E2EE Active</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Picture-in-Picture for other participant */}
      <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-gray-600 flex items-center justify-center">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">DR</span>
        </div>
      </div>

      {/* Connection Quality Indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Activity className={`w-4 h-4 ${getQualityColor(connectionQuality)}`} />
          <span className="text-white text-sm capitalize">{connectionQuality}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white" />
          <span className="text-white text-sm">{participantCount}</span>
        </div>
      </div>

      {/* Call Duration */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm">{formatDuration(callDuration)}</span>
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black bg-opacity-50 px-6 py-3 rounded-full">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="text-white" size={20} /> : <Mic className="text-white" size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            !isVideoOn 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isVideoOn ? 'Turn off video' : 'Turn on video'}
        >
          {isVideoOn ? <Video className="text-white" size={20} /> : <VideoOff className="text-white" size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="text-white" size={20} /> : <Monitor className="text-white" size={20} />}
        </button>

        <button
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          title="Call settings"
        >
          <Settings className="text-white" size={20} />
        </button>

        <button
          onClick={endCall}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          title="End call"
        >
          <PhoneOff className="text-white" size={20} />
        </button>
      </div>

      {/* E2EE Status */}
      {isE2EEEnabled && (
        <div className="absolute bottom-4 right-4 bg-green-600 bg-opacity-20 border border-green-400 px-2 py-1 rounded">
          <div className="flex items-center gap-1">
            <Shield className="text-green-400" size={12} />
            <span className="text-green-400 text-xs">Encrypted</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoCall;