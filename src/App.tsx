import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatInterface from './components/ChatInterface';
import AppointmentsView from './components/AppointmentsView';
import PatientsView from './components/PatientsView';
import MedicalRecordsView from './components/MedicalRecordsView';
import EmergencyAlertsView from './components/EmergencyAlertsView';
import SettingsView from './components/SettingsView';
import AIAssistant from './components/AIAssistant';
import ConsentManagement from './components/ConsentManagement';

const AppContent: React.FC = () => {
  const { activeView } = useApp();

  const renderMainContent = () => {
    switch (activeView) {
      case 'consultations':
        return (
          <div className="flex-1 flex">
            <ChatList />
            <ChatInterface />
            <div className="w-96 border-l border-gray-200">
              <AIAssistant />
            </div>
          </div>
        );
      case 'appointments':
        return <AppointmentsView />;
      case 'patients':
        return <PatientsView />;
      case 'medical-records':
        return <MedicalRecordsView />;
      case 'emergency-alerts':
        return <EmergencyAlertsView />;
      case 'consent':
        return <ConsentManagement />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex-1 flex">
            <ChatList />
            <ChatInterface />
            <div className="w-96 border-l border-gray-200">
              <AIAssistant />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      {renderMainContent()}
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