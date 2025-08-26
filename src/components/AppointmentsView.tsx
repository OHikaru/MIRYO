import React, { useState } from 'react';
import { Calendar, Clock, Video, Phone, MessageSquare, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Appointment } from '../types';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isBefore } from 'date-fns';

const AppointmentsView: React.FC = () => {
  const { user } = useAuth();
  const { appointments, addAppointment, updateAppointment } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-blue-600" />;
      case 'audio': return <Phone size={16} className="text-green-600" />;
      case 'chat': return <MessageSquare size={16} className="text-purple-600" />;
      default: return <Calendar size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = user?.role === 'doctor' ? apt.doctorId === user.id : apt.patientId === user.id;
    return matchesSearch && matchesUser;
  });

  const todayAppointments = filteredAppointments.filter(apt => 
    isSameDay(apt.scheduledAt, selectedDate)
  ).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const upcomingAppointments = filteredAppointments.filter(apt => 
    apt.scheduledAt > new Date() && apt.status !== 'cancelled'
  ).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600">Manage your scheduled consultations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              New Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Calendar Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {format(selectedDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="p-2 text-gray-500 font-medium">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const date = addDays(startOfWeek(selectedDate), i - 7);
                const hasAppointments = filteredAppointments.some(apt => isSameDay(apt.scheduledAt, date));
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 rounded hover:bg-blue-50 transition-colors ${
                      isSameDay(date, selectedDate) 
                        ? 'bg-blue-600 text-white' 
                        : isToday(date)
                          ? 'bg-blue-100 text-blue-600 font-semibold'
                          : 'text-gray-700'
                    } ${hasAppointments ? 'font-semibold' : ''}`}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Upcoming</h4>
            <div className="space-y-2">
              {upcomingAppointments.map(apt => (
                <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {getAppointmentIcon(apt.type)}
                    <span className="font-medium text-sm">{apt.title}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {format(apt.scheduledAt, 'MMM d, h:mm a')}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
              {upcomingAppointments.length === 0 && (
                <p className="text-gray-500 text-sm">No upcoming appointments</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-gray-600">{todayAppointments.length} appointments scheduled</p>
            </div>

            <div className="p-6">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-500 mb-2">No appointments today</h4>
                  <p className="text-gray-400">Schedule a new appointment to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map(apt => (
                    <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getAppointmentIcon(apt.type)}
                            <h4 className="font-semibold text-gray-900">{apt.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{format(apt.scheduledAt, 'h:mm a')} ({apt.duration} min)</span>
                            </div>
                          </div>

                          {apt.description && (
                            <p className="text-gray-600 text-sm mb-3">{apt.description}</p>
                          )}

                          {apt.notes && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                              <strong>Notes:</strong> {apt.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {apt.status === 'confirmed' && !isBefore(apt.scheduledAt, new Date()) && (
                            <button
                              onClick={() => updateAppointment(apt.id, { status: 'in-progress' })}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => updateAppointment(apt.id, { status: 'cancelled' })}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Schedule New Appointment</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const scheduledAt = new Date(formData.get('date') + 'T' + formData.get('time'));
              
              addAppointment({
                patientId: user?.role === 'patient' ? user.id : '2',
                doctorId: user?.role === 'doctor' ? user.id : '1',
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                scheduledAt,
                duration: parseInt(formData.get('duration') as string),
                type: formData.get('type') as 'video' | 'audio' | 'chat',
                status: 'scheduled',
                reminderSent: false,
              });
              
              setShowNewAppointment(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Consultation title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      name="time"
                      type="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <select
                      name="duration"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="video">Video Call</option>
                      <option value="audio">Audio Call</option>
                      <option value="chat">Chat Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;