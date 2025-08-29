// REVISED: 新しいビュー（Prescriptions/Referrals）を追加。患者/医療者で見える画面を切替。
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import LoginPage from './components/LoginPage';
import DashboardView from './components/DashboardView';
import PaymentView from './components/PaymentView';
import TestResultsView from './components/TestResultsView';
import VitalSignsView from './components/VitalSignsView';
import QuestionnaireView from './components/QuestionnaireView';
import PharmacyView from './components/PharmacyView';
import FileUploadView from './components/FileUploadView';
import NotificationCenter from './components/NotificationCenter';

const AppContent: React.FC = () => {
  const { activeView, currentRole } = useApp();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-4 py-2 border-b bg-white flex items-center justify-between">
          <div className="font-semibold">
            {currentRole === 'doctor' ? '医師用コンソール' : '患者ポータル'}
          </div>
          <NotificationCenter />
        </header>

        <main className="flex-1 overflow-hidden">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'consultations' && <ChatInterface />}
          {activeView === 'appointments' && <AppointmentsView />}
          {activeView === 'patients' && currentRole === 'doctor' && <PatientsView />}
          {activeView === 'medical-records' && currentRole === 'doctor' && <MedicalRecordsView />}
          {activeView === 'emergency-alerts' && currentRole === 'doctor' && <EmergencyAlertsView />}
          {activeView === 'consent' && currentRole === 'patient' && <ConsentManagement />}
          {activeView === 'prescriptions' && currentRole === 'doctor' && <PrescriptionComposer />}
          {activeView === 'referrals' && currentRole === 'doctor' && <ReferralLetterComposer />}
          {activeView === 'payment' && <PaymentView />}
          {activeView === 'test-results' && <TestResultsView />}
          {activeView === 'vital-signs' && <VitalSignsView />}
          {activeView === 'questionnaire' && <QuestionnaireView />}
          {activeView === 'pharmacy' && <PharmacyView />}
          {activeView === 'files' && <FileUploadView />}
          {activeView === 'ai' && <AIAssistant />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

const AppWithLogin: React.FC = () => {
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  React.useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppWithLogin />
    </AuthProvider>
  );
}

export default App;