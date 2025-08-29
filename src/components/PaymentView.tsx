import React, { useState } from 'react';
import { 
  CreditCard, Calendar, DollarSign, FileText, Download, 
  Check, AlertCircle, Clock, Shield, ChevronRight, Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  doctorName: string;
  items: {
    name: string;
    amount: number;
    covered: number;
    selfPay: number;
  }[];
}

const PaymentView: React.FC = () => {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);

  // デモ用の請求データ
  const invoices: Invoice[] = [
    {
      id: 'INV-2024-001',
      date: new Date('2024-01-25'),
      amount: 5500,
      status: 'pending',
      description: 'オンライン診療 - 内科初診',
      doctorName: 'Dr. Sarah Johnson',
      items: [
        { name: '初診料', amount: 8500, covered: 5950, selfPay: 2550 },
        { name: 'オンライン診療料', amount: 3000, covered: 2100, selfPay: 900 },
        { name: '処方箋料', amount: 2000, covered: 1400, selfPay: 600 },
        { name: '診断書作成料', amount: 3000, covered: 1500, selfPay: 1500 },
      ]
    },
    {
      id: 'INV-2024-002',
      date: new Date('2024-01-10'),
      amount: 3200,
      status: 'paid',
      description: 'オンライン診療 - 再診',
      doctorName: 'Dr. Sarah Johnson',
      items: [
        { name: '再診料', amount: 5000, covered: 3500, selfPay: 1500 },
        { name: 'オンライン診療料', amount: 3000, covered: 2100, selfPay: 900 },
        { name: '処方箋料', amount: 2000, covered: 1200, selfPay: 800 },
      ]
    },
    {
      id: 'INV-2023-015',
      date: new Date('2023-12-20'),
      amount: 4800,
      status: 'paid',
      description: 'オンライン診療 - 定期検診',
      doctorName: 'Dr. Michael Chen',
      items: [
        { name: '再診料', amount: 5000, covered: 3500, selfPay: 1500 },
        { name: '検査オーダー', amount: 8000, covered: 5600, selfPay: 2400 },
        { name: '健康相談料', amount: 3000, covered: 2100, selfPay: 900 },
      ]
    }
  ];

  const totalPending = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handlePayment = async () => {
    setProcessing(true);
    // 決済処理のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (selectedInvoice) {
      selectedInvoice.status = 'paid';
      setSelectedInvoice(null);
      setShowPaymentModal(false);
    }
    setProcessing(false);
  };

  const paymentMethods = [
    { id: 'card', name: 'クレジットカード', icon: CreditCard, description: 'Visa, Mastercard, JCB' },
    { id: 'bank', name: '銀行振込', icon: DollarSign, description: '即時振込対応' },
    { id: 'wallet', name: 'デジタルウォレット', icon: Wallet, description: 'PayPay, LINE Pay対応' }
  ];

  if (user?.role === 'doctor') {
    // 医師用の収益管理画面
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">収益管理</h1>

          {/* 収益サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">今月</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">¥850,000</p>
              <p className="text-sm text-green-600 mt-2">+12% 前月比</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">請求件数</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">152</p>
              <p className="text-sm text-gray-600 mt-2">今月の診療</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">平均単価</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">¥5,592</p>
              <p className="text-sm text-gray-600 mt-2">診療あたり</p>
            </div>
          </div>

          {/* 収益グラフ（プレースホルダー） */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">月別収益推移</h2>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">収益グラフ</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 患者用の支払い画面
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">診療費支払い</h1>

        {/* 支払いサマリー */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">未払い金額合計</p>
              <p className="text-3xl font-bold mt-2">¥{totalPending.toLocaleString()}</p>
            </div>
            <Shield className="w-12 h-12 opacity-20" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">保険適用後の自己負担額</span>
          </div>
        </div>

        {/* 請求書一覧 */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">請求書一覧</h2>
          </div>
          <div className="divide-y">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">{invoice.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status === 'paid' ? '支払済' : 
                         invoice.status === 'pending' ? '未払い' : '期限超過'}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800">{invoice.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {invoice.doctorName} • {format(invoice.date, 'yyyy年MM月dd日', { locale: ja })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">¥{invoice.amount.toLocaleString()}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        詳細
                      </button>
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          支払う
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 支払い方法 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">登録済み支払い方法</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-600">Visa - 有効期限 12/25</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">デフォルト</span>
            </div>
            <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition">
              + 新しい支払い方法を追加
            </button>
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedInvoice && !showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">請求書詳細</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedInvoice.id}</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600">診療日</p>
                <p className="font-medium">{format(selectedInvoice.date, 'yyyy年MM月dd日', { locale: ja })}</p>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">診療内容</p>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">{item.name}</span>
                      <div className="text-right">
                        <p className="text-sm">¥{item.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">
                          保険: ¥{item.covered.toLocaleString()} / 自己負担: ¥{item.selfPay.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>自己負担額合計</span>
                  <span className="text-xl">¥{selectedInvoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-between">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <Download className="w-4 h-4" />
                PDFダウンロード
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  閉じる
                </button>
                {selectedInvoice.status === 'pending' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    支払いへ進む
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 支払いモーダル */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">支払い手続き</h2>
              <p className="text-sm text-gray-600 mt-1">
                請求額: ¥{selectedInvoice.amount.toLocaleString()}
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">支払い方法を選択</p>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`w-full p-4 border rounded-lg flex items-center gap-3 transition ${
                      paymentMethod === method.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <method.icon className="w-5 h-5 text-gray-600" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-xs text-gray-600">{method.description}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">使用するカード</p>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-xs text-gray-600">Visa</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">安全な支払い</p>
                    <p className="text-xs text-blue-700 mt-1">
                      すべての取引は暗号化され、PCI DSS準拠のセキュアな環境で処理されます
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={processing}
              >
                キャンセル
              </button>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    支払いを確定
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentView;
