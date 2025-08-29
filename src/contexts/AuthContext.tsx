import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah@clinic.com',
    role: 'doctor',
    specialization: 'Internal Medicine',
    licenseNumber: 'MD12345',
    phone: '+1 (555) 123-4567',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john@email.com',
    role: 'patient',
    phone: '+1 (555) 987-6543',
    dateOfBirth: '1985-03-15',
    medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    isOnline: true,
    lastSeen: new Date(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Auto-login for demo
    setUser(mockUsers[0]);
  }, []);

  const login = async (email: string, password: string) => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = () => {
    if (user) {
      const newUser = user.role === 'doctor' ? mockUsers[1] : mockUsers[0];
      setUser(newUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};