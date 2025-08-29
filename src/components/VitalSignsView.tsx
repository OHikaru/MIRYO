import React, { useState } from 'react';
import { 
  Activity, Heart, Thermometer, Droplets, Wind, Plus, 
  TrendingUp, TrendingDown, Calendar, Clock, Save, AlertCircle,
  ChevronLeft, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface VitalSign {
  id: string;
  patientId: string;
  patientName?: string;
  timestamp: Date;
  temperature?: number;
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  bloodGlucose?: number;
  notes?: string;
}

const VitalSignsView: React.FC = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart');
  const [editingVital, setEditingVital] = useState<VitalSign | null>(null);
  
  const [formData, setFormData] = useState({
    temperature: '',
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    bloodGlucose: '',
    notes: '',
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  // デモ用のバイタルデータ
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    {
      id: 'vs-001',
      patientId: '2',
      patientName: 'John Smith',
      timestamp: new Date('2024-01-25T09:00'),
      temperature: 36.5,
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 70,
      bloodGlucose: 95
    },
    {
      id: 'vs-002',
      patientId: '2',
      patientName: 'John Smith',
      timestamp: new Date('2024-01-24T09:00'),
      temperature: 36.8,
      systolicBP: 125,
      diastolicBP: 82,
      heartRate: 75,
      respiratoryRate: 18,
      oxygenSaturation: 97,
      weight: 70.2,
      bloodGlucose: 102
    },
    {
      id: 'vs-003',
      patientId: '2',
      patientName: 'John Smith',
      timestamp: new Date('2024-01-23T09:00'),
      temperature: 36.4,
      systolicBP: 118,
      diastolicBP: 78,
      heartRate: 70,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 69.8,
      bloodGlucose: 92
    },
  ]);

  const latestVital = vitalSigns[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newVital: VitalSign = {
      id: `vs-${Date.now()}`,
      patientId: user?.id || '2',
      patientName: user?.name,
      timestamp: new Date(formData.timestamp),
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      systolicBP: formData.systolicBP ? parseInt(formData.systolicBP) : undefined,
      diastolicBP: formData.diastolicBP ? parseInt(formData.diastolicBP) : undefined,
      heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
      respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
      oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bloodGlucose: formData.bloodGlucose ? parseInt(formData.bloodGlucose) : undefined,
      notes: formData.notes
    };

    if (editingVital) {
      setVitalSigns(prev => prev.map(v => v.id === editingVital.id ? { ...newVital, id: editingVital.id } : v));
      setEditingVital(null);
    } else {
      setVitalSigns(prev => [newVital, ...prev]);
    }

    setShowAddModal(false);
    setFormData({
      temperature: '',
      systolicBP: '',
      diastolicBP: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      bloodGlucose: '',
      notes: '',
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
  };

  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case 'bp':
        if (value >= 140) return 'text-red-600';
        if (value >= 130) return 'text-yellow-600';
        return 'text-green-600';
      case 'heartRate':
        if (value >= 100 || value <= 60) return 'text-yellow-600';
        return 'text-green-600';
      case 'oxygen':
        if (value < 95) return 'text-red-600';
        if (value < 97) return 'text-yellow-600';
        return 'text-green-600';
      case 'temperature':
        if (value >= 37.5 || value < 36) return 'text-yellow-600';
        if (value >= 38) return 'text-red-600';
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const VitalCard = ({ title, value, unit, icon: Icon, type, trend }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-6 h-6 text-gray-600" />
        {trend && (
          <span className={`text-sm ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${getStatusColor(value, type)}`}>
        {value} <span className="text-sm font-normal">{unit}</span>
      </p>
    </div>
  );

  if (user?.role === 'doctor') {
    // 医師用: 患者のバイタル管理
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">バイタルサイン管理</h1>
            <div className="flex gap-3">
              <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>すべての患者</option>
                <option>John Smith</option>
                <option>田中太郎</option>
                <option>佐藤花子</option>
              </select>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                エクスポート
              </button>
            </div>
          </div>

          {/* 患者リスト */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">患者別バイタル記録</h2>
            </div>
            <div className="divide-y">
              {vitalSigns.slice(0, 5).map((vital) => (
                <div key={vital.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{vital.patientName}</p>
                      <p className="text-sm text-gray-600">
                        {format(vital.timestamp, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">体温: </span>
                        <span className={`font-medium ${getStatusColor(vital.temperature || 0, 'temperature')}`}>
                          {vital.temperature}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">血圧: </span>
                        <span className={`font-medium ${getStatusColor(vital.systolicBP || 0, 'bp')}`}>
                          {vital.systolicBP}/{vital.diastolicBP}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">心拍: </span>
                        <span className={`font-medium ${getStatusColor(vital.heartRate || 0, 'heartRate')}`}>
                          {vital.heartRate} bpm
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">SpO2: </span>
                        <span className={`font-medium ${getStatusColor(vital.oxygenSaturation || 0, 'oxygen')}`}>
                          {vital.oxygenSaturation}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {vital.notes && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-700">メモ: {vital.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 患者用: 自分のバイタル記録
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">バイタルサイン</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            記録を追加
          </button>
        </div>

        {/* 最新のバイタル */}
        {latestVital && (
          <>
            <div className="mb-2 text-sm text-gray-600">
              最終更新: {format(latestVital.timestamp, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <VitalCard
                title="体温"
                value={latestVital.temperature}
                unit="°C"
                icon={Thermometer}
                type="temperature"
                trend={0}
              />
              <VitalCard
                title="血圧"
                value={`${latestVital.systolicBP}/${latestVital.diastolicBP}`}
                unit="mmHg"
                icon={Activity}
                type="bp"
                trend={1}
              />
              <VitalCard
                title="心拍数"
                value={latestVital.heartRate}
                unit="bpm"
                icon={Heart}
                type="heartRate"
                trend={0}
              />
              <VitalCard
                title="酸素飽和度"
                value={latestVital.oxygenSaturation}
                unit="%"
                icon={Wind}
                type="oxygen"
                trend={0}
              />
            </div>
          </>
        )}

        {/* ビュー切り替え */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                グラフ表示
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                リスト表示
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                {format(startOfWeek(selectedDate, { locale: ja }), 'MM月dd日', { locale: ja })} - 
                {format(endOfWeek(selectedDate, { locale: ja }), 'MM月dd日', { locale: ja })}
              </span>
              <button
                onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'chart' ? (
            <div className="p-6">
              {/* グラフ表示（プレースホルダー） */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">バイタルサイングラフ</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {vitalSigns.map((vital) => (
                <div key={vital.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {format(vital.timestamp, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {vital.temperature && (
                          <div className="text-sm">
                            <span className="text-gray-600">体温: </span>
                            <span className={`font-medium ${getStatusColor(vital.temperature, 'temperature')}`}>
                              {vital.temperature}°C
                            </span>
                          </div>
                        )}
                        {vital.systolicBP && (
                          <div className="text-sm">
                            <span className="text-gray-600">血圧: </span>
                            <span className={`font-medium ${getStatusColor(vital.systolicBP, 'bp')}`}>
                              {vital.systolicBP}/{vital.diastolicBP}
                            </span>
                          </div>
                        )}
                        {vital.heartRate && (
                          <div className="text-sm">
                            <span className="text-gray-600">心拍: </span>
                            <span className={`font-medium ${getStatusColor(vital.heartRate, 'heartRate')}`}>
                              {vital.heartRate} bpm
                            </span>
                          </div>
                        )}
                        {vital.oxygenSaturation && (
                          <div className="text-sm">
                            <span className="text-gray-600">SpO2: </span>
                            <span className={`font-medium ${getStatusColor(vital.oxygenSaturation, 'oxygen')}`}>
                              {vital.oxygenSaturation}%
                            </span>
                          </div>
                        )}
                      </div>
                      {vital.notes && (
                        <p className="text-sm text-gray-600 mt-2">メモ: {vital.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingVital(vital);
                          setFormData({
                            temperature: vital.temperature?.toString() || '',
                            systolicBP: vital.systolicBP?.toString() || '',
                            diastolicBP: vital.diastolicBP?.toString() || '',
                            heartRate: vital.heartRate?.toString() || '',
                            respiratoryRate: vital.respiratoryRate?.toString() || '',
                            oxygenSaturation: vital.oxygenSaturation?.toString() || '',
                            weight: vital.weight?.toString() || '',
                            bloodGlucose: vital.bloodGlucose?.toString() || '',
                            notes: vital.notes || '',
                            timestamp: format(vital.timestamp, "yyyy-MM-dd'T'HH:mm")
                          });
                          setShowAddModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setVitalSigns(prev => prev.filter(v => v.id !== vital.id));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 記録追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingVital ? 'バイタルサイン編集' : 'バイタルサイン記録'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  記録日時
                </label>
                <input
                  type="datetime-local"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体温 (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    血圧 (mmHg)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.systolicBP}
                      onChange={(e) => setFormData({ ...formData, systolicBP: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="120"
                    />
                    <span className="self-center">/</span>
                    <input
                      type="number"
                      value={formData.diastolicBP}
                      onChange={(e) => setFormData({ ...formData, diastolicBP: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="80"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    心拍数 (bpm)
                  </label>
                  <input
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    酸素飽和度 (%)
                  </label>
                  <input
                    type="number"
                    value={formData.oxygenSaturation}
                    onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="98"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="70.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    血糖値 (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={formData.bloodGlucose}
                    onChange={(e) => setFormData({ ...formData, bloodGlucose: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="特記事項があれば記入してください"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVital(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingVital ? '更新' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalSignsView;
