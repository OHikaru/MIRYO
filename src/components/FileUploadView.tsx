import React, { useState } from 'react';
import { 
  Upload, File, Image, FileText, Download, Trash2, 
  Eye, X, CheckCircle, AlertCircle, Calendar, User
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: 'medical-record' | 'test-result' | 'prescription' | 'insurance' | 'other';
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
  tags?: string[];
}

const FileUploadView: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: 'file-1',
      name: '血液検査結果_20240125.pdf',
      type: 'application/pdf',
      size: 245760,
      category: 'test-result',
      uploadedAt: new Date('2024-01-25'),
      uploadedBy: 'John Smith',
      description: '2024年1月の定期検査結果',
      tags: ['血液検査', '2024年1月']
    },
    {
      id: 'file-2',
      name: '胸部X線画像.jpg',
      type: 'image/jpeg',
      size: 1048576,
      category: 'test-result',
      uploadedAt: new Date('2024-01-20'),
      uploadedBy: 'Dr. Sarah Johnson',
      description: '胸部X線撮影',
      tags: ['X線', '画像診断']
    },
    {
      id: 'file-3',
      name: '保険証.pdf',
      type: 'application/pdf',
      size: 512000,
      category: 'insurance',
      uploadedAt: new Date('2024-01-15'),
      uploadedBy: 'John Smith',
      description: '健康保険証のコピー',
      tags: ['保険', '身分証明']
    }
  ]);

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    // アップロードシミュレーション
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          
          // ファイルを追加
          const newFiles: UploadedFile[] = Array.from(fileList).map((file, index) => ({
            id: `file-${Date.now()}-${index}`,
            name: file.name,
            type: file.type,
            size: file.size,
            category: 'other',
            uploadedAt: new Date(),
            uploadedBy: user?.name || 'Unknown',
            description: '',
            tags: []
          }));
          
          setFiles(prev => [...newFiles, ...prev]);
          setUploadProgress(null);
          return null;
        }
        return prev + 10;
      });
    }, 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-600" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'medical-record': { color: 'bg-blue-100 text-blue-800', label: '診療記録' },
      'test-result': { color: 'bg-green-100 text-green-800', label: '検査結果' },
      'prescription': { color: 'bg-purple-100 text-purple-800', label: '処方箋' },
      'insurance': { color: 'bg-yellow-100 text-yellow-800', label: '保険' },
      'other': { color: 'bg-gray-100 text-gray-800', label: 'その他' }
    };
    return badges[category] || badges.other;
  };

  const filteredFiles = files.filter(file => 
    filterCategory === 'all' || file.category === filterCategory
  );

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ファイル管理</h1>

        {/* アップロードエリア */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 mb-8 transition ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              ファイルをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-gray-500 mb-4">または</p>
            <span className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              ファイルを選択
            </span>
            <p className="text-xs text-gray-500 mt-4">
              対応形式: PDF, JPG, PNG, DICOM（最大10MB）
            </p>
          </label>

          {/* アップロード進捗 */}
          {uploadProgress !== null && (
            <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">アップロード中... {uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>

        {/* フィルター */}
        <div className="flex items-center gap-4 mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべてのファイル</option>
            <option value="medical-record">診療記録</option>
            <option value="test-result">検査結果</option>
            <option value="prescription">処方箋</option>
            <option value="insurance">保険</option>
            <option value="other">その他</option>
          </select>
          <p className="text-sm text-gray-600">
            {filteredFiles.length}個のファイル
          </p>
        </div>

        {/* ファイル一覧 */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">アップロード済みファイル</h2>
          </div>
          <div className="divide-y">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center">
                <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">ファイルがありません</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-800">{file.name}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryBadge(file.category).color}`}>
                            {getCategoryBadge(file.category).label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{format(file.uploadedAt, 'yyyy年MM月dd日', { locale: ja })}</span>
                          <span>•</span>
                          <span>{file.uploadedBy}</span>
                        </div>
                        {file.description && (
                          <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                        )}
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {file.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 使用容量 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ストレージ使用状況</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">使用中</span>
              <span className="font-medium">24.5 MB / 100 MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24.5%' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">診療記録</p>
              <p className="font-medium">8.2 MB</p>
            </div>
            <div>
              <p className="text-gray-600">検査結果</p>
              <p className="font-medium">12.3 MB</p>
            </div>
            <div>
              <p className="text-gray-600">処方箋</p>
              <p className="font-medium">2.5 MB</p>
            </div>
            <div>
              <p className="text-gray-600">その他</p>
              <p className="font-medium">1.5 MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* ファイルプレビューモーダル */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">{selectedFile.name}</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {selectedFile.type.startsWith('image/') ? (
                <div className="bg-gray-100 rounded-lg p-4">
                  <img 
                    src={`https://via.placeholder.com/600x400?text=${encodeURIComponent(selectedFile.name)}`}
                    alt={selectedFile.name}
                    className="w-full h-auto rounded"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  {getFileIcon(selectedFile.type)}
                  <p className="mt-4 text-gray-600">プレビューは利用できません</p>
                </div>
              )}
              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ファイルタイプ</p>
                  <p className="font-medium">{selectedFile.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ファイルサイズ</p>
                  <p className="font-medium">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">アップロード日時</p>
                  <p className="font-medium">
                    {format(selectedFile.uploadedAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">アップロード者</p>
                  <p className="font-medium">{selectedFile.uploadedBy}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2">
                <Download className="w-4 h-4" />
                ダウンロード
              </button>
              <button
                onClick={() => setSelectedFile(null)}
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

export default FileUploadView;
