import React, { useState } from 'react';
import { 
  Activity, TrendingUp, TrendingDown, FileText, Download, 
  AlertCircle, CheckCircle, Calendar, User, Filter, Search,
  ChevronRight, ArrowUp, ArrowDown, Minus, Eye, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface TestResult {
  id: string;
  patientId: string;
  patientName: string;
  type: 'blood' | 'urine' | 'xray' | 'ct' | 'mri' | 'ecg';
  category: string;
  date: Date;
  status: 'pending' | 'completed' | 'abnormal';
  doctor: string;
  items?: {
    name: string;
    value: number | string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'high' | 'low' | 'critical';
    previousValue?: number | string;
  }[];
  images?: {
    url: string;
    description: string;
  }[];
  summary?: string;
  recommendations?: string[];
}

const TestResultsView: React.FC = () => {
  const { user } = useAuth();
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // デモ用の検査結果データ
  const testResults: TestResult[] = [
    {
      id: 'TR-2024-001',
      patientId: '2',
      patientName: 'John Smith',
      type: 'blood',
      category: '血液検査',
      date: new Date('2024-01-25'),
      status: 'abnormal',
      doctor: 'Dr. Sarah Johnson',
      items: [
        { name: '白血球数', value: 8500, unit: '/μL', referenceRange: '3500-9100', status: 'normal', previousValue: 8200 },
        { name: 'ヘモグロビン', value: 18.5, unit: 'g/dL', referenceRange: '13.5-17.5', status: 'high', previousValue: 17.2 },
        { name: '血小板数', value: 250000, unit: '/μL', referenceRange: '150000-400000', status: 'normal', previousValue: 245000 },
        { name: 'HbA1c', value: 7.2, unit: '%', referenceRange: '4.6-6.2', status: 'high', previousValue: 6.8 },
        { name: 'LDLコレステロール', value: 165, unit: 'mg/dL', referenceRange: '70-139', status: 'high', previousValue: 152 },
        { name: 'HDLコレステロール', value: 42, unit: 'mg/dL', referenceRange: '40-80', status: 'normal', previousValue: 45 },
        { name: '中性脂肪', value: 180, unit: 'mg/dL', referenceRange: '50-149', status: 'high', previousValue: 165 },
        { name: 'AST(GOT)', value: 28, unit: 'U/L', referenceRange: '10-40', status: 'normal', previousValue: 26 },
        { name: 'ALT(GPT)', value: 35, unit: 'U/L', referenceRange: '5-45', status: 'normal', previousValue: 32 },
        { name: 'クレアチニン', value: 0.9, unit: 'mg/dL', referenceRange: '0.6-1.2', status: 'normal', previousValue: 0.9 },
      ],
      summary: '糖尿病と脂質異常症の管理が必要です。HbA1cとLDLコレステロールが基準値を超えています。',
      recommendations: [
        '食事療法の強化（糖質制限、脂質管理）',
        '運動療法の継続（有酸素運動を週3回以上）',
        '薬物療法の調整を検討',
        '3ヶ月後の再検査を推奨'
      ]
    },
    {
      id: 'TR-2024-002',
      patientId: '2',
      patientName: 'John Smith',
      type: 'xray',
      category: '胸部X線',
      date: new Date('2024-01-20'),
      status: 'completed',
      doctor: 'Dr. Michael Chen',
      images: [
        { url: '/api/images/xray-chest.jpg', description: '胸部正面像' }
      ],
      summary: '肺野に異常陰影なし。心拡大なし。胸水貯留なし。',
      recommendations: ['特に異常所見なし。年1回の定期検査を継続。']
    },
    {
      id: 'TR-2024-003',
      patientId: '2',
      patientName: 'John Smith',
      type: 'ecg',
      category: '心電図',
      date: new Date('2024-01-15'),
      status: 'completed',
      doctor: 'Dr. Sarah Johnson',
      summary: '洞調律、心拍数72/分、正常範囲内。ST-T変化なし。',
      recommendations: ['心電図所見は正常範囲内。']
    }
  ];

  const filteredResults = testResults.filter(result => {
    if (filterType !== 'all' && result.type !== filterType) return false;
    if (searchTerm && !result.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood': return '🩸';
      case 'urine': return '🧪';
      case 'xray': return '📋';
      case 'ct': return '🖥️';
      case 'mri': return '🧲';
      case 'ecg': return '❤️';
      default: return '📄';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <span className="text-green-600">正常</span>;
      case 'high': return <span className="text-red-600 flex items-center gap-1"><ArrowUp className="w-3 h-3" />高値</span>;
      case 'low': return <span className="text-blue-600 flex items-center gap-1"><ArrowDown className="w-3 h-3" />低値</span>;
      case 'critical': return <span className="text-red-700 font-bold">要注意</span>;
      default: return <span className="text-gray-600">-</span>;
    }
  };

  if (user?.role === 'doctor') {
    // 医師用: 複数患者の検査結果管理
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">検査結果管理</h1>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              結果をアップロード
            </button>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="患者名または検査項目で検索..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべての検査</option>
                <option value="blood">血液検査</option>
                <option value="urine">尿検査</option>
                <option value="xray">X線</option>
                <option value="ct">CT</option>
                <option value="mri">MRI</option>
                <option value="ecg">心電図</option>
              </select>
            </div>
          </div>

          {/* 検査結果一覧 */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">最近の検査結果</h2>
            </div>
            <div className="divide-y">
              {filteredResults.map((result) => (
                <div key={result.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{getTypeIcon(result.type)}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium text-gray-800">{result.category}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === 'completed' ? 'bg-green-100 text-green-800' :
                            result.status === 'abnormal' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status === 'completed' ? '完了' :
                             result.status === 'abnormal' ? '異常値あり' : '処理中'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          患者: {result.patientName} • {format(result.date, 'yyyy年MM月dd日', { locale: ja })}
                        </p>
                        {result.summary && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{result.summary}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                    >
                      詳細
                      <ChevronRight className="w-4 h-4" />
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

  // 患者用: 自分の検査結果閲覧
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">検査結果</h1>

        {/* 最新の検査結果サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500">最新</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">血液検査</p>
            <p className="text-sm text-gray-600">2024年1月25日</p>
            <p className="text-sm text-red-600 mt-2">要注意項目: 3</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-green-600" />
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800">胸部X線</p>
            <p className="text-sm text-gray-600">2024年1月20日</p>
            <p className="text-sm text-green-600 mt-2">異常なし</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-600" />
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800">心電図</p>
            <p className="text-sm text-gray-600">2024年1月15日</p>
            <p className="text-sm text-green-600 mt-2">正常範囲</p>
          </div>
        </div>

        {/* 検査結果一覧 */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">検査履歴</h2>
          </div>
          <div className="divide-y">
            {filteredResults.map((result) => (
              <div key={result.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getTypeIcon(result.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-800">{result.category}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.status === 'completed' ? 'bg-green-100 text-green-800' :
                          result.status === 'abnormal' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status === 'completed' ? '完了' :
                           result.status === 'abnormal' ? '異常値あり' : '処理中'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {format(result.date, 'yyyy年MM月dd日', { locale: ja })} • 担当医: {result.doctor}
                      </p>
                      {result.summary && (
                        <p className="text-sm text-gray-700">{result.summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      詳細を見る
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedResult.category}結果詳細</h2>
                <p className="text-sm text-gray-600 mt-1">
                  検査日: {format(selectedResult.date, 'yyyy年MM月dd日', { locale: ja })}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {selectedResult.items && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">検査項目</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium text-gray-700">項目</th>
                          <th className="pb-2 font-medium text-gray-700">結果</th>
                          <th className="pb-2 font-medium text-gray-700">基準値</th>
                          <th className="pb-2 font-medium text-gray-700">判定</th>
                          <th className="pb-2 font-medium text-gray-700">前回値</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 text-gray-800">{item.name}</td>
                            <td className="py-3 font-medium">
                              {item.value} {item.unit}
                            </td>
                            <td className="py-3 text-gray-600 text-sm">{item.referenceRange}</td>
                            <td className="py-3">{getStatusBadge(item.status)}</td>
                            <td className="py-3 text-gray-600">
                              {item.previousValue ? `${item.previousValue} ${item.unit}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedResult.images && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">画像</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedResult.images.map((image, index) => (
                      <div key={index} className="border rounded-lg p-2">
                        <div className="bg-gray-100 h-48 rounded flex items-center justify-center mb-2">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600">{image.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedResult.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">所見</h3>
                  <p className="text-gray-700">{selectedResult.summary}</p>
                </div>
              )}

              {selectedResult.recommendations && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">推奨事項</h3>
                  <ul className="space-y-2">
                    {selectedResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <span className="text-blue-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-between">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <Download className="w-4 h-4" />
                PDFでダウンロード
              </button>
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultsView;
