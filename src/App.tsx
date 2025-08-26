import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="h-screen flex bg-gray-100">
          <Sidebar />
          <ChatList />
          <ChatInterface />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;