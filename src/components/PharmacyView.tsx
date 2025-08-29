import React, { useState } from 'react';
import { 
  MapPin, Clock, Phone, Send, CheckCircle, AlertCircle, 
  Package, Truck, Home, Store, Search, Filter, Star,
  ChevronRight, Navigation, Pill
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  rating: number;
  openHours: string;
  hasStock: boolean;
  deliveryAvailable: boolean;
  isPartner: boolean;
  waitTime: number;
}

interface PrescriptionTransmission {
  id: string;
  prescriptionId: string;
  pharmacyId: string;
  pharmacyName: string;
  patientId: string;
  patientName: string;
  sentAt: Date;
  status: 'sent' | 'received' | 'preparing' | 'ready' | 'completed';
  estimatedTime?: Date;
  deliveryMethod: 'pickup' | 'delivery';
  medications: {
    name: string;
    dosage: string;
    quantity: string;
    instructions: string;
  }[];
  notes?: string;
}

const PharmacyView: React.FC = () => {
  const { user } = useAuth();
  const { prescriptions } = useApp();
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);

  // デモ用の薬局データ
  const pharmacies: Pharmacy[] = [
    {
      id: 'ph-001',
      name: 'さくら薬局 渋谷店',
      address: '東京都渋谷区渋谷1-2-3',
      phone: '03-1234-5678',
      distance: 0.5,
      rating: 4.8,
      openHours: '9:00-20:00',
      hasStock: true,
      deliveryAvailable: true,
      isPartner: true,
      waitTime: 15
    },
    {
      id: 'ph-002',
      name: 'グリーン薬局',
      address: '東京都渋谷区恵比寿2-3-4',
      phone: '03-2345-6789',
      distance: 1.2,
      rating: 4.5,
      openHours: '9:00-19:00',
      hasStock: true,
      deliveryAvailable: false,
      isPartner: true,
      waitTime: 20
    },
    {
      id: 'ph-003',
      name: 'みらい薬局 表参道店',
      address: '東京都渋谷区神宮前3-4-5',
      phone: '03-3456-7890',
      distance: 1.8,
      rating: 4.7,
      openHours: '8:30-21:00',
      hasStock: false,
      deliveryAvailable: true,
      isPartner: false,
      waitTime: 30
    }
  ];

  // デモ用の送信履歴
  const [transmissions, setTransmissions] = useState<PrescriptionTransmission[]>([
    {
      id: 'trans-001',
      prescriptionId: 'rx_001',
      pharmacyId: 'ph-001',
      pharmacyName: 'さくら薬局 渋谷店',
      patientId: '2',
      patientName: 'John Smith',
      sentAt: new Date('2024-01-25T10:00'),
      status: 'preparing',
      estimatedTime: new Date('2024-01-25T10:30'),
      deliveryMethod: 'pickup',
      medications: [
        { name: 'アムロジピン錠5mg', dosage: '1日1回', quantity: '30錠', instructions: '朝食後' },
        { name: 'メトホルミン錠500mg', dosage: '1日2回', quantity: '60錠', instructions: '朝夕食後' }
      ]
    }
  ]);

  const handleSendPrescription = () => {
    if (!selectedPharmacy || !selectedPrescription) return;

    const newTransmission: PrescriptionTransmission = {
      id: `trans-${Date.now()}`,
      prescriptionId: selectedPrescription.id,
      pharmacyId: selectedPharmacy.id,
      pharmacyName: selectedPharmacy.name,
      patientId: user?.id || '2',
      patientName: user?.name || 'Unknown',
      sentAt: new Date(),
      status: 'sent',
      estimatedTime: new Date(Date.now() + selectedPharmacy.waitTime * 60000),
      deliveryMethod,
      medications: selectedPrescription.items?.map((item: any) => ({
        name: item.display || '処方薬',
        dosage: item.dosageText || '',
        quantity: `${item.quantity?.value || ''} ${item.quantity?.unit || ''}`,
        instructions: item.timingCode || ''
      })) || []
    };

    setTransmissions([newTransmission, ...transmissions]);
    setShowTransmissionModal(false);
    setSelectedPharmacy(null);
    setSelectedPrescription(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return { color: 'bg-blue-100 text-blue-800', text: '送信済み' };
      case 'received':
        return { color: 'bg-yellow-100 text-yellow-800', text: '受信確認' };
      case 'preparing':
        return { color: 'bg-orange-100 text-orange-800', text: '調剤中' };
      case 'ready':
        return { color: 'bg-green-100 text-green-800', text: '準備完了' };
      case 'completed':
        return { color: 'bg-gray-100 text-gray-800', text: '受取済み' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role === 'doctor') {
    // 医師用: 処方箋送信管理
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">薬局連携管理</h1>

          {/* 統計 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Package className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">152</p>
              <p className="text-sm text-gray-600">今月の処方箋</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Send className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">98%</p>
              <p className="text-sm text-gray-600">電子送信率</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Store className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">12</p>
              <p className="text-sm text-gray-600">提携薬局</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Clock className="w-8 h-8 text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">18分</p>
              <p className="text-sm text-gray-600">平均調剤時間</p>
            </div>
          </div>

          {/* 送信履歴 */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">処方箋送信履歴</h2>
            </div>
            <div className="divide-y">
              {transmissions.map((trans) => (
                <div key={trans.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-800">{trans.patientName}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(trans.status).color}`}>
                          {getStatusBadge(trans.status).text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        送信先: {trans.pharmacyName} • {format(trans.sentAt, 'HH:mm', { locale: ja })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        薬剤: {trans.medications.map(m => m.name).join(', ')}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      詳細
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 患者用: 薬局選択と処方箋送信
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">処方箋・薬局連携</h1>

        {/* アクティブな処方箋 */}
        {prescriptions.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">未送信の処方箋があります</p>
                <p className="text-sm text-blue-700 mt-1">
                  発行日: {format(prescriptions[0].issuedAt, 'yyyy年MM月dd日', { locale: ja })}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPrescription(prescriptions[0]);
                  setShowTransmissionModal(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                薬局に送信
              </button>
            </div>
          </div>
        )}

        {/* 送信状況 */}
        {transmissions.filter(t => t.status !== 'completed').length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">調剤状況</h2>
            <div className="space-y-4">
              {transmissions.filter(t => t.status !== 'completed').map((trans) => (
                <div key={trans.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-800">{trans.pharmacyName}</p>
                      <p className="text-sm text-gray-600">
                        {trans.deliveryMethod === 'pickup' ? '店舗受取' : '配送'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(trans.status).color}`}>
                      {getStatusBadge(trans.status).text}
                    </span>
                  </div>
                  
                  {/* プログレスバー */}
                  <div className="relative mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-gray-600">送信</span>
                      <span className="text-xs text-gray-600">受信</span>
                      <span className="text-xs text-gray-600">調剤中</span>
                      <span className="text-xs text-gray-600">完了</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: trans.status === 'sent' ? '25%' :
                                 trans.status === 'received' ? '50%' :
                                 trans.status === 'preparing' ? '75%' : '100%'
                        }}
                      />
                    </div>
                  </div>

                  {trans.estimatedTime && (
                    <p className="text-sm text-gray-600">
                      予定時刻: {format(trans.estimatedTime, 'HH:mm', { locale: ja })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 薬局検索 */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">近くの薬局</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="薬局名または住所で検索..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="divide-y">
            {filteredPharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-gray-800">{pharmacy.name}</p>
                      {pharmacy.isPartner && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          提携
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{pharmacy.rating}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {pharmacy.address} ({pharmacy.distance}km)
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        営業時間: {pharmacy.openHours} • 待ち時間: 約{pharmacy.waitTime}分
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {pharmacy.phone}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                      {pharmacy.hasStock && (
                        <span className="text-xs text-green-600">✓ 在庫あり</span>
                      )}
                      {pharmacy.deliveryAvailable && (
                        <span className="text-xs text-blue-600">✓ 配送可能</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedPharmacy(pharmacy)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      選択
                    </button>
                    <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      地図
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 処方箋送信モーダル */}
      {showTransmissionModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">処方箋を薬局に送信</h2>
            </div>
            <div className="p-6">
              {/* 薬局選択 */}
              {!selectedPharmacy ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">送信先の薬局を選択してください</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {pharmacies.map((pharmacy) => (
                      <button
                        key={pharmacy.id}
                        onClick={() => setSelectedPharmacy(pharmacy)}
                        className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{pharmacy.name}</p>
                            <p className="text-sm text-gray-600">{pharmacy.address}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-medium text-gray-800">{selectedPharmacy.name}</p>
                    <p className="text-sm text-gray-600">{selectedPharmacy.address}</p>
                    <button
                      onClick={() => setSelectedPharmacy(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      変更
                    </button>
                  </div>

                  {/* 受取方法 */}
                  <p className="text-sm font-medium text-gray-700 mb-3">受取方法</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-4 border rounded-lg ${
                        deliveryMethod === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <Store className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">店舗で受取</p>
                      <p className="text-xs text-gray-600 mt-1">約{selectedPharmacy.waitTime}分</p>
                    </button>
                    <button
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-4 border rounded-lg ${
                        deliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      } ${!selectedPharmacy.deliveryAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!selectedPharmacy.deliveryAvailable}
                    >
                      <Truck className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">配送</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedPharmacy.deliveryAvailable ? '2-3時間' : '利用不可'}
                      </p>
                    </button>
                  </div>

                  {/* 処方内容確認 */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">送信前の確認</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          処方箋の内容を薬局に送信します。薬局での本人確認が必要です。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowTransmissionModal(false);
                  setSelectedPharmacy(null);
                  setSelectedPrescription(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              {selectedPharmacy && (
                <button
                  onClick={handleSendPrescription}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  送信する
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyView;
