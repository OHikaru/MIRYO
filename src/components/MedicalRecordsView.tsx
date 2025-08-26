import React, { useState } from 'react';
import { FileText, Search, Filter, Plus, Download, Upload, Eye, Edit, Trash2, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { MedicalRecord } from '../types';
import { format } from 'date-fns';

const MedicalRecordsView: React.FC = () => {
  const { user } = useAuth();
  const { medicalRecords, addMedicalRecord } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showNewRecord, setShowNewRecord] = useState(false);

  const recordTypes = [
    { value: 'all', label: 'All Records', color: 'gray' },
    { value: 'prescription', label: 'Prescriptions', color: 'blue' },
    { value: 'lab-result', label: 'Lab Results', color: 'green' },
    { value: 'diagnosis', label: 'Diagnoses', color: 'red' },
    { value: 'treatment-plan', label: 'Treatment Plans', color: 'purple' },
    { value: 'note', label: 'Clinical Notes', color: 'yellow' },
    { value: 'document', label: 'Documents', color: 'indigo' },
  ];

  const getTypeColor = (type: string) => {
    const typeConfig = recordTypes.find(t => t.value === type);
    return typeConfig?.color || 'gray';
  };

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesUser = user?.role === 'doctor' ? record.doctorId === user.id : record.patientId === user.id;
    return matchesSearch && matchesType && matchesUser;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addMedicalRecord({
      patientId: user?.role === 'patient' ? user.id : '2',
      doctorId: user?.role === 'doctor' ? user.id : '1',
      type: formData.get('type') as MedicalRecord['type'],
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean),
      isConfidential: formData.get('confidential') === 'on',
    });
    
    setShowNewRecord(false);
  };

  return (
    <div className="flex-1 flex bg-gray-50">
      {/* Records List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medical Records</h1>
              <p className="text-gray-600 text-sm">Electronic health records</p>
            </div>
            <button
              onClick={() => setShowNewRecord(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {recordTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedRecord?.id === record.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{record.title}</h4>
                    {record.isConfidential && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" title="Confidential"></div>
                    )}
                  </div>
                  
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                    getTypeColor(record.type) === 'blue' ? 'bg-blue-100 text-blue-800' :
                    getTypeColor(record.type) === 'green' ? 'bg-green-100 text-green-800' :
                    getTypeColor(record.type) === 'red' ? 'bg-red-100 text-red-800' :
                    getTypeColor(record.type) === 'purple' ? 'bg-purple-100 text-purple-800' :
                    getTypeColor(record.type) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    getTypeColor(record.type) === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.type.replace('-', ' ')}
                  </span>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{record.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{format(record.createdAt, 'MMM d, yyyy')}</span>
                    {record.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag size={12} />
                        <span>{record.tags.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Details */}
      <div className="flex-1 flex flex-col">
        {selectedRecord ? (
          <>
            {/* Record Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRecord.title}</h2>
                    {selectedRecord.isConfidential && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Confidential
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getTypeColor(selectedRecord.type) === 'blue' ? 'bg-blue-100 text-blue-800' :
                      getTypeColor(selectedRecord.type) === 'green' ? 'bg-green-100 text-green-800' :
                      getTypeColor(selectedRecord.type) === 'red' ? 'bg-red-100 text-red-800' :
                      getTypeColor(selectedRecord.type) === 'purple' ? 'bg-purple-100 text-purple-800' :
                      getTypeColor(selectedRecord.type) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      getTypeColor(selectedRecord.type) === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRecord.type.replace('-', ' ')}
                    </span>
                    <span>Created: {format(selectedRecord.createdAt, 'MMM d, yyyy h:mm a')}</span>
                    {selectedRecord.updatedAt.getTime() !== selectedRecord.createdAt.getTime() && (
                      <span>Updated: {format(selectedRecord.updatedAt, 'MMM d, yyyy h:mm a')}</span>
                    )}
                  </div>

                  {selectedRecord.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit size={20} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Record Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.content}</p>
                </div>

                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedRecord.attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <FileText size={20} className="text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-sm text-gray-600">{attachment.type} • {(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Download size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Select a Record</h3>
              <p className="text-gray-400">Choose a medical record to view its details</p>
            </div>
          </div>
        )}
      </div>

      {/* New Record Modal */}
      {showNewRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Medical Record</h3>
            <form onSubmit={handleAddRecord}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {recordTypes.slice(1).map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      name="title"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Record title"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    name="content"
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter detailed information..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    name="tags"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas"
                  />
                  <p className="text-xs text-gray-500 mt-1">e.g., diabetes, medication, follow-up</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    name="confidential"
                    type="checkbox"
                    id="confidential"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="confidential" className="text-sm text-gray-700">
                    Mark as confidential
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRecord(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsView;