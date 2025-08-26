// REVISED: 新しいビュー（Prescriptions/Referrals）を追加。患者/医療者で見える画面を切替。
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AppointmentsView from './components/AppointmentsView';
import PatientsView from './components/PatientsView';
import MedicalRecordsView from './components/MedicalRecordsView';
import EmergencyAlertsView from './components/EmergencyAlertsView';
import SettingsView from './components/SettingsView';
import AIAssistant from './components/AIAssistant';
import ConsentManagement from './components/ConsentManagement';
import PrescriptionComposer from './components/PrescriptionComposer';
import ReferralLetterComposer from './components/ReferralLetterComposer';

const AppContent: React.FC = () => {
  const { activeView, currentRole } = useApp();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-4 py-2 border-b bg-white flex items-center justify-between">
          <div className="font-semibold">
            {currentRole === 'doctor' ? 'Clinician Console' : 'Patient Portal'}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeView === 'consultations' && <ChatInterface />}
          {activeView === 'appointments' && <AppointmentsView />}
          {activeView === 'patients' && currentRole === 'doctor' && <PatientsView />}
          {activeView === 'medical-records' && currentRole === 'doctor' && <MedicalRecordsView />}
          {activeView === 'emergency-alerts' && currentRole === 'doctor' && <EmergencyAlertsView />}
          {activeView === 'consent' && currentRole === 'patient' && <ConsentManagement />}
          {activeView === 'prescriptions' && currentRole === 'doctor' && <PrescriptionComposer />}
          {activeView === 'referrals' && currentRole === 'doctor' && <ReferralLetterComposer />}
          {activeView === 'ai' && <AIAssistant />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;