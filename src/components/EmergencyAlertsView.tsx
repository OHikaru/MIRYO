import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Phone, MessageSquare, User, Filter, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { EmergencyAlert } from '../types';
import { formatDistanceToNow, format } from 'date-fns';

const EmergencyAlertsView: React.FC = () => {
  const { user } = useAuth();
  const { emergencyAlerts, addEmergencyAlert, acknowledgeAlert } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const severityLevels = [
    { value: 'all', label: 'All Severities', color: 'gray' },
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    const iconClass = severity === 'critical' ? 'animate-pulse' : '';
    return <AlertTriangle className={`${iconClass}`} size={20} />;
  };

  const filteredAlerts = emergencyAlerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'acknowledged' && alert.acknowledged) ||
                         (filterStatus === 'pending' && !alert.acknowledged);
    return matchesSearch && matchesSeverity && matchesStatus;
  }).sort((a, b) => {
    // Sort by severity (critical first) then by timestamp (newest first)
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const handleAcknowledge = (alertId: string) => {
    if (user) {
      acknowledgeAlert(alertId, user.id, 'Alert acknowledged and being handled');
    }
  };

  const createTestAlert = (severity: EmergencyAlert['severity']) => {
    const messages = {
      low: 'Patient reports mild discomfort and requests consultation',
      medium: 'Patient experiencing moderate symptoms, needs attention',
      high: 'Patient reports severe symptoms, urgent consultation required',
      critical: 'EMERGENCY: Patient in critical condition, immediate response needed'
    };

    addEmergencyAlert({
      patientId: '2',
      message: messages[severity],
      severity,
      acknowledged: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emergency Alerts</h1>
            <p className="text-gray-600">Monitor and respond to patient emergencies</p>
          </div>
          
          {/* Test Alert Buttons (for demo) */}
          {user?.role === 'doctor' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-2">Test Alerts:</span>
              <button
                onClick={() => createTestAlert('low')}
                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
              >
                Low
              </button>
              <button
                onClick={() => createTestAlert('medium')}
                className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
              >
                Medium
              </button>
              <button
                onClick={() => createTestAlert('high')}
                className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors"
              >
                High
              </button>
              <button
                onClick={() => createTestAlert('critical')}
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
              >
                Critical
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {severityLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No Emergency Alerts</h3>
              <p className="text-gray-400">
                {emergencyAlerts.length === 0 
                  ? 'All clear - no emergency alerts at this time'
                  : 'No alerts match your current filters'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg border-2 p-6 transition-all hover:shadow-md ${
                  alert.acknowledged 
                    ? 'border-gray-200 opacity-75' 
                    : alert.severity === 'critical' 
                      ? 'border-red-300 shadow-lg' 
                      : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100' :
                      alert.severity === 'high' ? 'bg-orange-100' :
                      alert.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}>
                      {getSeverityIcon(alert.severity)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        
                        {alert.acknowledged ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Acknowledged</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock size={16} />
                            <span className="text-sm font-medium">Pending Response</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-900 font-medium mb-2">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>Patient ID: {alert.patientId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                        </div>
                        <span>{format(alert.timestamp, 'MMM d, yyyy h:mm a')}</span>
                      </div>

                      {alert.acknowledged && alert.response && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Response:</strong> {alert.response}
                          </p>
                          {alert.resolvedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Resolved {formatDistanceToNow(alert.resolvedAt, { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!alert.acknowledged && user?.role === 'doctor' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone size={20} />
                    </button>
                    
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MessageSquare size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Action Panel for Patients */}
      {user?.role === 'patient' && (
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => createTestAlert('low')}
                className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="text-green-600" size={16} />
                </div>
                <p className="font-medium text-green-700">Request Consultation</p>
                <p className="text-xs text-green-600">Non-urgent medical question</p>
              </button>

              <button
                onClick={() => createTestAlert('medium')}
                className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="text-yellow-600" size={16} />
                </div>
                <p className="font-medium text-yellow-700">Medical Concern</p>
                <p className="text-xs text-yellow-600">Moderate symptoms</p>
              </button>

              <button
                onClick={() => createTestAlert('high')}
                className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="text-orange-600" size={16} />
                </div>
                <p className="font-medium text-orange-700">Urgent Care</p>
                <p className="text-xs text-orange-600">Severe symptoms</p>
              </button>

              <button
                onClick={() => createTestAlert('critical')}
                className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-center"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="text-red-600 animate-pulse" size={16} />
                </div>
                <p className="font-medium text-red-700">Emergency</p>
                <p className="text-xs text-red-600">Life-threatening situation</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertsView;