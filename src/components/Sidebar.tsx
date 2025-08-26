import React from 'react';
import { MessageSquare, Calendar, Users, Settings, AlertTriangle, Phone, Video, FileText } from 'lucide-react';
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
    { icon: Settings, label: 'Settings', key: 'settings' },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.doctorOnly || user?.role === 'doctor'
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">TeleMed Pro</h2>
        <p className="text-sm text-gray-500">Professional Healthcare Platform</p>
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
      </nav>

      <UserProfile />
    </div>
  );
};

export default Sidebar;