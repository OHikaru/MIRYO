import React from 'react';
import { MessageSquare, Calendar, Users, Settings, AlertTriangle, Phone, Video, FileText, Shield, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import UserProfile from './UserProfile';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { activeView, setActiveView } = useApp();

  const menuItems = [
    { icon: MessageSquare, label: 'Consultations', key: 'consultations' },
    { icon: Calendar, label: 'Appointments', key: 'appointments' },
    { icon: Users, label: 'Patients', key: 'patients', doctorOnly: true },
    { icon: FileText, label: 'Medical Records', key: 'medical-records' },
    { icon: AlertTriangle, label: 'Emergency Alerts', key: 'emergency-alerts' },
    { icon: Shield, label: 'Consent Management', key: 'consent' },
    { icon: Settings, label: 'Settings', key: 'settings' },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.doctorOnly || user?.role === 'doctor'
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Bot className="text-white" size={16} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">MIRYO</h2>
        </div>
        <p className="text-sm text-gray-500">AI-Enhanced Telemedicine Platform</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => (
            <li key={item.label}>
              <button 
                onClick={() => setActiveView(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === item.key
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {user?.role === 'patient' && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-600" size={20} />
              <span className="font-semibold text-red-700">Emergency</span>
            </div>
            <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
              Call Emergency Services
            </button>
          </div>
        )}

        {/* AI Features Panel */}
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="text-blue-600" size={20} />
            <span className="font-semibold text-blue-700">AI Features</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>RAG-based Q&A</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Smart Triage</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Auto Escalation</span>
            </div>
          </div>
        </div>
      </nav>

      <UserProfile />
    </div>
  );
};

export default Sidebar;