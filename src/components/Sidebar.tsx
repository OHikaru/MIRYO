// REVISED: 患者/医療者のメニューを完全分離。doctorOnlyフラグではなく2系統の配列を用意。
import React from 'react';
import { MessageSquare, Calendar, Users, Settings, AlertTriangle, FileText, Bot, Pill, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import UserProfile from './UserProfile';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { activeView, setActiveView, currentRole } = useApp();

  const patientMenu = [
    { icon: MessageSquare, label: 'Consultations', key: 'consultations' },
    { icon: Calendar, label: 'Appointments', key: 'appointments' },
    { icon: FileText, label: 'Consent', key: 'consent' },
    { icon: Bot, label: 'AI Assistant', key: 'ai' },
    { icon: Settings, label: 'Settings', key: 'settings' }
  ];

  const clinicianMenu = [
    { icon: MessageSquare, label: 'Consult Queue', key: 'consultations' },
    { icon: Users, label: 'Patients', key: 'patients' },
    { icon: FileText, label: 'Medical Records', key: 'medical-records' },
    { icon: Pill, label: 'Prescriptions', key: 'prescriptions' },
    { icon: Share2, label: 'Referrals', key: 'referrals' },
    { icon: AlertTriangle, label: 'Emergency Alerts', key: 'emergency-alerts' },
    { icon: Bot, label: 'AI Assistant', key: 'ai' },
    { icon: Settings, label: 'Settings', key: 'settings' }
  ];

  const menu = currentRole === 'doctor' ? clinicianMenu : patientMenu;

  return (
    <div className="w-64 border-r bg-white flex flex-col">
      <div className="p-4">
        <div className="text-lg font-bold">MIRYO</div>
        <div className="text-xs text-gray-500">Telemedicine</div>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2">
          {menu.map(item => {
            const active = activeView === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => setActiveView(item.key)}
                  className={`w-full px-3 py-2 rounded flex items-center gap-2 ${active?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}
                >
                  <item.icon size={18}/>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <UserProfile />
    </div>
  );
};

export default Sidebar;