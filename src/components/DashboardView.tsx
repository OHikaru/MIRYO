import React from 'react';
import { 
  Calendar, Users, Activity, DollarSign, TrendingUp, Clock, 
  AlertCircle, CheckCircle, FileText, Video, Heart, Pill
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { appointments, emergencyAlerts, medicalRecords, prescriptions } = useApp();

  // 統計データ（デモ用）
  const stats = {
    doctor: {
      todayAppointments: 8,
      totalPatients: 245,
      pendingPrescriptions: 3,
      monthlyRevenue: 1250000,
      emergencyAlerts: emergencyAlerts.filter(a => !a.acknowledged).length,
      completedConsultations: 152,
      averageRating: 4.8,
      responseTime: '5分',
    },
    patient: {
      upcomingAppointments: 2,
      lastVisit: '2024年1月10日',
      activePrescriptions: 3,
      nextAppointment: '2024年2月1日 14:00',
      healthScore: 85,
      completedConsultations: 12,
      savedAmount: 45000,
      medicationAdherence: 92,
    }
  };

  const recentActivities = [
    { id: 1, type: 'appointment', title: '診察完了', patient: '田中太郎', time: '10分前', status: 'completed' },
    { id: 2, type: 'prescription', title: '処方箋発行', patient: '佐藤花子', time: '30分前', status: 'completed' },
    { id: 3, type: 'message', title: '新着メッセージ', patient: '鈴木一郎', time: '1時間前', status: 'pending' },
    { id: 4, type: 'lab', title: '検査結果到着', patient: '高橋美咲', time: '2時間前', status: 'new' },
  ];

  const upcomingAppointments = [
    { id: 1, patient: '山田太郎', time: '14:00', type: 'follow-up', duration: '30分' },
    { id: 2, patient: '伊藤さくら', time: '14:30', type: 'consultation', duration: '20分' },
    { id: 3, patient: '渡辺健', time: '15:00', type: 'checkup', duration: '30分' },
  ];

  if (user?.role === 'doctor') {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">ダッシュボード</h1>
            <p className="text-gray-600 mt-2">
              {format(new Date(), 'yyyy年MM月dd日（E）', { locale: ja })} の診療状況
            </p>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">本日の予約</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.doctor.todayAppointments}
                  </p>
                  <p className="text-xs text-green-600 mt-2">+12% 前週比</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総患者数</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.doctor.totalPatients}
                  </p>
                  <p className="text-xs text-green-600 mt-2">+8 今月</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">月間収益</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    ¥{stats.doctor.monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-2">+15% 前月比</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">緊急アラート</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.doctor.emergencyAlerts}
                  </p>
                  <p className="text-xs text-red-600 mt-2">要対応</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 本日の予約 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">本日の予約</h2>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{apt.patient}</p>
                        <p className="text-sm text-gray-600">{apt.type} • {apt.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">{apt.time}</p>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        詳細を見る
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近のアクティビティ */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">最近のアクティビティ</h2>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'completed' ? 'bg-green-500' :
                      activity.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.patient} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 患者用ダッシュボード
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">マイヘルス ダッシュボード</h1>
          <p className="text-gray-600 mt-2">こんにちは、{user?.name}さん</p>
        </div>

        {/* 健康スコアカード */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">健康スコア</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{stats.patient.healthScore}</span>
                <span className="text-xl">/100</span>
              </div>
              <p className="mt-4 opacity-90">良好な健康状態を維持しています</p>
            </div>
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">次回の予約</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {stats.patient.nextAppointment}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">服薬中の薬</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.patient.activePrescriptions}
                </p>
              </div>
              <Pill className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">診察回数</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.patient.completedConsultations}
                </p>
              </div>
              <Video className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">節約金額</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  ¥{stats.patient.savedAmount.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 健康情報 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">最近の健康記録</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">血圧測定</p>
                    <p className="text-sm text-gray-600">120/80 mmHg</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">今日 09:00</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-800">心拍数</p>
                    <p className="text-sm text-gray-600">72 bpm</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">今日 09:00</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-800">体温</p>
                    <p className="text-sm text-gray-600">36.5°C</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">昨日 19:00</span>
              </div>
            </div>
          </div>

          {/* 服薬リマインダー */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">服薬リマインダー</h2>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">降圧薬</p>
                    <p className="text-sm text-gray-600">1日1回 朝食後</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">糖尿病薬</p>
                    <p className="text-sm text-gray-600">1日2回 朝夕食後</p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">ビタミン剤</p>
                    <p className="text-sm text-gray-600">1日1回 就寝前</p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
