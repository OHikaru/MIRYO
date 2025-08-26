import React, { useState } from 'react';
import { 
  FileText, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  Signature,
  Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ConsentTemplate, ConsentRecord } from '../types';

const ConsentManagement: React.FC = () => {
  const { user } = useAuth();
  const { recordAuditEvent } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);

  // Mock consent templates
  const consentTemplates: ConsentTemplate[] = [
    {
      id: 'informed-consent-001',
      title: 'オンライン診療 同意書',
      version: 'v1.2.3',
      locale: 'ja-JP',
      contentMd: `# オンライン診療に関する同意書

## 1. オンライン診療について
オンライン診療は、情報通信機器を用いて医師と患者が離れた場所で診療を行う医療行為です。

## 2. 同意事項
以下の事項について同意いたします：

### 2.1 技術的制約
- インターネット接続の品質により、音声や映像の品質が影響を受ける可能性
- 技術的問題により診療が中断される可能性

### 2.2 プライバシーと機密性
- 通信内容は暗号化され、適切なセキュリティ対策が講じられています
- 診療記録は医療法に基づき適切に管理されます

### 2.3 緊急時の対応
- 緊急時は直ちに最寄りの医療機関を受診してください
- 本システムは緊急医療には適していません

## 3. 患者の責任
- 正確な情報の提供
- 適切な環境での受診
- 処方薬の適切な管理

## 4. 同意の撤回
この同意はいつでも撤回することができます。

---
*この同意書は電子署名法に基づく電子署名により法的効力を有します。*`,
      signatureType: 'aes'
    },
    {
      id: 'privacy-policy-001',
      title: 'プライバシーポリシー同意',
      version: 'v2.1.0',
      locale: 'ja-JP',
      contentMd: `# プライバシーポリシー

## 個人情報の取り扱いについて

当クリニックは、患者様の個人情報を以下の通り取り扱います。

### 収集する情報
- 氏名、生年月日、連絡先
- 医療情報、診療記録
- 通信ログ、アクセス記録

### 利用目的
- 診療、治療、健康管理
- 予約管理、連絡業務
- 医療の質向上、研究（匿名化後）

### 第三者提供
法令に基づく場合を除き、同意なく第三者に提供しません。

### データの保管
- 暗号化による安全な保管
- アクセス制御による不正利用防止
- 定期的なセキュリティ監査

---
*GDPR、個人情報保護法に準拠*`,
      signatureType: 'aes'
    }
  ];

  // Mock consent records
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([
    {
      id: 'record-001',
      templateId: 'informed-consent-001',
      subjectId: user?.id || 'patient-123',
      status: 'signed',
      signedAt: new Date(Date.now() - 86400000), // 1 day ago
      evidence: {
        signaturePdfUri: 'https://example.com/signatures/record-001.pdf',
        auditLogUri: 'https://example.com/audit/record-001.log'
      }
    }
  ]);

  const getStatusIcon = (status: ConsentRecord['status']) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      case 'revoked':
        return <AlertTriangle className="text-red-600" size={20} />;
      default:
        return <FileText className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: ConsentRecord['status']) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'revoked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSignConsent = async (templateId: string) => {
    setIsSigningInProgress(true);
    
    // Record audit event
    recordAuditEvent({
      type: 'consent_signing_started',
      actorId: user?.id || 'unknown',
      subjectId: templateId,
      data: { templateId, signatureType: 'aes' }
    });

    // Simulate signing process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newRecord: ConsentRecord = {
      id: `record-${Date.now()}`,
      templateId,
      subjectId: user?.id || 'patient-123',
      status: 'signed',
      signedAt: new Date(),
      evidence: {
        signaturePdfUri: `https://example.com/signatures/record-${Date.now()}.pdf`,
        auditLogUri: `https://example.com/audit/record-${Date.now()}.log`
      }
    };

    setConsentRecords(prev => [...prev, newRecord]);
    setIsSigningInProgress(false);
    setShowSigningModal(false);

    // Record completion audit event
    recordAuditEvent({
      type: 'consent_signed',
      actorId: user?.id || 'unknown',
      subjectId: templateId,
      data: { 
        recordId: newRecord.id,
        signedAt: newRecord.signedAt,
        signatureType: 'aes'
      }
    });
  };

  const getSignatureTypeLabel = (type: ConsentTemplate['signatureType']) => {
    switch (type) {
      case 'qes':
        return '適格電子署名';
      case 'aes':
        return '高度電子署名';
      case 'ses':
        return '電子署名';
      default:
        return '電子署名';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">電子同意管理</h1>
            <p className="text-gray-600">デジタル同意書の管理と電子署名</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="text-green-600" size={16} />
            <span>eIDAS/電子署名法準拠</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Templates */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">利用可能な同意書</h3>
              <p className="text-gray-600 text-sm">署名が必要な同意書テンプレート</p>
            </div>

            <div className="p-6 space-y-4">
              {consentTemplates.map(template => {
                const existingRecord = consentRecords.find(r => r.templateId === template.id);
                const isAlreadySigned = existingRecord?.status === 'signed';

                return (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{template.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>バージョン: {template.version}</span>
                          <span>{getSignatureTypeLabel(template.signatureType)}</span>
                        </div>
                      </div>
                      {isAlreadySigned && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">署名済み</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye size={16} />
                        <span className="text-sm">内容確認</span>
                      </button>

                      {!isAlreadySigned && (
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowSigningModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Signature size={16} />
                          <span className="text-sm">署名する</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signed Records */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">署名済み同意書</h3>
              <p className="text-gray-600 text-sm">電子署名された同意記録</p>
            </div>

            <div className="p-6 space-y-4">
              {consentRecords.map(record => {
                const template = consentTemplates.find(t => t.id === record.templateId);
                
                return (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{template?.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(record.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                            {record.status === 'signed' ? '署名済み' : 
                             record.status === 'pending' ? '署名待ち' : '取り消し済み'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {record.signedAt && (
                          <p>署名日時: {record.signedAt.toLocaleDateString('ja-JP')}</p>
                        )}
                      </div>
                    </div>

                    {record.evidence && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => window.open(record.evidence!.signaturePdfUri, '_blank')}
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm transition-colors"
                        >
                          <Download size={14} />
                          <span>署名PDF</span>
                        </button>
                        <button
                          onClick={() => window.open(record.evidence!.auditLogUri, '_blank')}
                          className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded text-sm transition-colors"
                        >
                          <FileText size={14} />
                          <span>監査ログ</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {consentRecords.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">署名済みの同意書はありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && !showSigningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedTemplate.title}</h3>
                  <p className="text-gray-600">バージョン: {selectedTemplate.version}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="prose max-w-none">
                {selectedTemplate.contentMd.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                  } else if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-semibold mt-4 mb-3">{line.substring(3)}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-medium mt-3 mb-2">{line.substring(4)}</h3>;
                  } else if (line.startsWith('- ')) {
                    return <li key={index} className="ml-4">{line.substring(2)}</li>;
                  } else if (line.trim() === '') {
                    return <br key={index} />;
                  } else {
                    return <p key={index} className="mb-2">{line}</p>;
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signing Modal */}
      {showSigningModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Signature className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">電子署名</h3>
                  <p className="text-gray-600">{selectedTemplate.title}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="text-green-600" size={16} />
                  <span className="font-medium text-green-600">セキュア署名プロセス</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {getSignatureTypeLabel(selectedTemplate.signatureType)}を使用</li>
                  <li>• タイムスタンプ付与</li>
                  <li>• 改ざん検知機能</li>
                  <li>• 監査ログ記録</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSigningModal(false);
                    setSelectedTemplate(null);
                  }}
                  disabled={isSigningInProgress}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleSignConsent(selectedTemplate.id)}
                  disabled={isSigningInProgress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSigningInProgress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>署名中...</span>
                    </>
                  ) : (
                    <>
                      <Signature size={16} />
                      <span>署名する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentManagement;