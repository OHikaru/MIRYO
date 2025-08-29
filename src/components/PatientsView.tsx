import React, { useState } from 'react';
import { Search, Filter, Plus, Phone, Video, MessageSquare, Calendar, FileText, MoreVertical, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { User as UserType } from '../types';
import { formatDistanceToNow } from 'date-fns';

// Mock patients data
const mockPatients: UserType[] = [
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
  {
    id: '3',
    name: 'Emily Johnson',
    email: 'emily@email.com',
    role: 'patient',
    phone: '+1 (555) 123-7890',
    dateOfBirth: '1992-07-22',
    medicalHistory: ['Asthma', 'Allergies'],
    isOnline: false,
    lastSeen: new Date(Date.now() - 1800000),
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'michael@email.com',
    role: 'patient',
    phone: '+1 (555) 456-1234',
    dateOfBirth: '1978-11-08',
    medicalHistory: ['Hypertension', 'High Cholesterol'],
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
  {
    id: '5',
    name: 'Sarah Davis',
    email: 'sarah.davis@email.com',
    role: 'patient',
    phone: '+1 (555) 789-0123',
    dateOfBirth: '1995-05-14',
    medicalHistory: ['Migraine', 'Anxiety'],
    isOnline: true,
    lastSeen: new Date(),
  },
];

const PatientsView: React.FC = () => {
  const { user } = useAuth();
  const { appointments, medicalRecords, setActiveRoom } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');

  if (user?.role !== 'doctor') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Access Restricted</h3>
          <p className="text-gray-400">This section is only available to healthcare providers</p>
        </div>
      </div>
    );
  }

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'online' && patient.isOnline) ||
                         (filterStatus === 'offline' && !patient.isOnline);
    return matchesSearch && matchesFilter;
  });

  const getPatientAppointments = (patientId: string) => {
    return appointments.filter(apt => apt.patientId === patientId);
  };

  const getPatientRecords = (patientId: string) => {
    return medicalRecords.filter(record => record.patientId === patientId);
  };

  const startChat = (patient: UserType) => {
    const chatRoom = {
      id: `chat-${patient.id}`,
      name: patient.name,
      participants: [user, patient],
      isActive: true,
    };
    setActiveRoom(chatRoom);
  };

  return (
    <div className="flex-1 flex bg-gray-50">
      {/* Patients List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600 text-sm">Manage your patient roster</p>
            </div>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('online')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'online' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setFilterStatus('offline')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'offline' 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Offline
              </button>
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    patient.isOnline ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{patient.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{patient.email}</p>
                  <p className="text-xs text-gray-500">
                    {patient.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(patient.lastSeen, { addSuffix: true })}`}
                  </p>
                  
                  {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {patient.medicalHistory.slice(0, 2).map(condition => (
                        <span key={condition} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {condition}
                        </span>
                      ))}
                      {patient.medicalHistory.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{patient.medicalHistory.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No patients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Details */}
      <div className="flex-1 flex flex-col">
        {selectedPatient ? (
          <>
            {/* Patient Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      selectedPatient.isOnline ? 'bg-green-400' : 'bg-gray-300'
                    }`}></div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                    <p className="text-gray-600">{selectedPatient.email}</p>
                    <p className="text-sm text-gray-500">
                      {selectedPatient.phone} • Born {selectedPatient.dateOfBirth}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedPatient.isOnline ? 'Online now' : `Last seen ${formatDistanceToNow(selectedPatient.lastSeen, { addSuffix: true })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startChat(selectedPatient)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare size={16} />
                    Chat
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Patient Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Medical History */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                  {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatient.medicalHistory.map(condition => (
                        <div key={condition} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="text-gray-700">{condition}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No medical history recorded</p>
                  )}
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View All
                    </button>
                  </div>
                  
                  {getPatientAppointments(selectedPatient.id).slice(0, 3).map(appointment => (
                    <div key={appointment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                      <Calendar size={16} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{appointment.title}</p>
                        <p className="text-sm text-gray-600">
                          {appointment.scheduledAt.toLocaleDateString()} at {appointment.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}

                  {getPatientAppointments(selectedPatient.id).length === 0 && (
                    <p className="text-gray-500">No appointments scheduled</p>
                  )}
                </div>

                {/* Medical Records */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Medical Records</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Add Record
                    </button>
                  </div>

                  {getPatientRecords(selectedPatient.id).map(record => (
                    <div key={record.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg mb-3">
                      <FileText size={20} className="text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{record.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === 'prescription' ? 'bg-blue-100 text-blue-800' :
                            record.type === 'lab-result' ? 'bg-green-100 text-green-800' :
                            record.type === 'diagnosis' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.type.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{record.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{record.createdAt.toLocaleDateString()}</span>
                          {record.tags.length > 0 && (
                            <div className="flex gap-1">
                              {record.tags.map(tag => (
                                <span key={tag} className="px-1 py-0.5 bg-gray-100 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {getPatientRecords(selectedPatient.id).length === 0 && (
                    <p className="text-gray-500">No medical records available</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Select a Patient</h3>
              <p className="text-gray-400">Choose a patient from the list to view their details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsView;