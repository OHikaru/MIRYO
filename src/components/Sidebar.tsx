// REVISED: 患者/医療者のメニューを完全分離。doctorOnlyフラグではなく2系統の配列を用意。
import React from 'react';
import { 
  MessageSquare, Calendar, Users, Settings, AlertTriangle, FileText, 
  Bot, Pill, Share2, Home, CreditCard, Activity, Heart, ClipboardList, MapPin, FolderOpen 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import UserProfile from './UserProfile';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { activeView, setActiveView, currentRole } = useApp();

  const patientMenu = [
    { icon: Home, label: 'ダッシュボード', key: 'dashboard' },
    { icon: MessageSquare, label: 'オンライン診療', key: 'consultations' },
    { icon: Calendar, label: '予約', key: 'appointments' },
    { icon: Activity, label: '検査結果', key: 'test-results' },
    { icon: Heart, label: 'バイタル', key: 'vital-signs' },
    { icon: ClipboardList, label: '問診票', key: 'questionnaire' },
    { icon: MapPin, label: '薬局連携', key: 'pharmacy' },
    { icon: FolderOpen, label: 'ファイル', key: 'files' },
    { icon: CreditCard, label: '支払い', key: 'payment' },
    { icon: FileText, label: '同意管理', key: 'consent' },
    { icon: Bot, label: 'AIアシスタント', key: 'ai' },
    { icon: Settings, label: '設定', key: 'settings' }
  ];

  const clinicianMenu = [
    { icon: Home, label: 'ダッシュボード', key: 'dashboard' },
    { icon: MessageSquare, label: '診療キュー', key: 'consultations' },
    { icon: Users, label: '患者管理', key: 'patients' },
    { icon: FileText, label: '診療記録', key: 'medical-records' },
    { icon: Activity, label: '検査結果', key: 'test-results' },
    { icon: Heart, label: 'バイタル', key: 'vital-signs' },
    { icon: ClipboardList, label: '問診票', key: 'questionnaire' },
    { icon: Pill, label: '処方箋', key: 'prescriptions' },
    { icon: Share2, label: '紹介状', key: 'referrals' },
    { icon: MapPin, label: '薬局連携', key: 'pharmacy' },
    { icon: FolderOpen, label: 'ファイル管理', key: 'files' },
    { icon: CreditCard, label: '収益管理', key: 'payment' },
    { icon: AlertTriangle, label: '緊急アラート', key: 'emergency-alerts' },
    { icon: Bot, label: 'AIアシスタント', key: 'ai' },
    { icon: Settings, label: '設定', key: 'settings' }
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