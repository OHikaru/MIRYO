import React, { useState } from 'react';
import { Shield, Camera, CreditCard, FileText, Check, AlertTriangle, Upload, X } from 'lucide-react';

interface IdentityDocument {
  type: 'mynumber' | 'insurance' | 'drivers_license' | 'passport';
  frontImage?: File;
  backImage?: File;
  verified: boolean;
  verificationDate?: Date;
  documentNumber?: string;
}

interface IdentityVerificationProps {
  onVerificationComplete: (documents: IdentityDocument[]) => void;
  requiredDocuments?: string[];
  userRole: 'patient' | 'doctor';
}

const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  onVerificationComplete,
  requiredDocuments = ['insurance'],
  userRole
}) => {
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'capture' | 'verify' | 'complete'>('select');
  const [selectedDocType, setSelectedDocType] = useState<IdentityDocument['type'] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const documentTypes = [
    {
      type: 'mynumber' as const,
      name: 'マイナンバーカード',
      description: '最も確実な本人確認',
      icon: CreditCard,
      recommended: true,
      acceptedFor: ['patient', 'doctor']
    },
    {
      type: 'insurance' as const,
      name: '健康保険証',
      description: '保険適用に必要',
      icon: FileText,
      recommended: userRole === 'patient',
      acceptedFor: ['patient']
    },
    {
      type: 'drivers_license' as const,
      name: '運転免許証',
      description: '写真付き身分証明書',
      icon: CreditCard,
      recommended: false,
      acceptedFor: ['patient', 'doctor']
    },
    {
      type: 'passport' as const,
      name: 'パスポート',
      description: '国際的な身分証明書',
      icon: FileText,
      recommended: false,
      acceptedFor: ['patient', 'doctor']
    }
  ];

  const handleFileSelect = (file: File, side: 'front' | 'back') => {
    if (!selectedDocType) return;

    setDocuments(prev => {
      const existing = prev.find(doc => doc.type === selectedDocType);
      if (existing) {
        return prev.map(doc =>
          doc.type === selectedDocType
            ? { ...doc, [`${side}Image`]: file }
            : doc
        );
      } else {
        return [...prev, {
          type: selectedDocType,
          [`${side}Image`]: file,
          verified: false
        } as IdentityDocument];
      }
    });
  };

  const simulateVerification = async (document: IdentityDocument): Promise<boolean> => {
    // シミュレーション：実際はOCR + 公的DB照合
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 90%の確率で成功をシミュレート
    return Math.random() > 0.1;
  };

  const verifyDocument = async (docType: IdentityDocument['type']) => {
    setIsVerifying(true);
    const document = documents.find(doc => doc.type === docType);
    
    if (!document) {
      setIsVerifying(false);
      return;
    }

    try {
      const verificationResult = await simulateVerification(document);
      
      setDocuments(prev =>
        prev.map(doc =>
          doc.type === docType
            ? {
                ...doc,
                verified: verificationResult,
                verificationDate: new Date(),
                documentNumber: verificationResult ? generateDocumentNumber(docType) : undefined
              }
            : doc
        )
      );

      if (verificationResult) {
        // すべての必要書類が確認できたかチェック
        const verifiedDocs = documents.filter(doc => doc.verified);
        const hasRequiredDocs = requiredDocuments.every(required =>
          verifiedDocs.some(doc => doc.type === required)
        );

        if (hasRequiredDocs) {
          setCurrentStep('complete');
          onVerificationComplete(documents);
        }
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const generateDocumentNumber = (type: IdentityDocument['type']): string => {
    switch (type) {
      case 'mynumber':
        return '*'.repeat(8) + Math.random().toString().substr(2, 4);
      case 'insurance':
        return Math.random().toString().substr(2, 8);
      case 'drivers_license':
        return Math.random().toString().substr(2, 12);
      case 'passport':
        return 'JP' + Math.random().toString().substr(2, 7).toUpperCase();
      default:
        return 'VERIFIED';
    }
  };

  const DocumentCapture: React.FC<{ docType: IdentityDocument['type'] }> = ({ docType }) => {
    const docInfo = documentTypes.find(dt => dt.type === docType);
    const currentDoc = documents.find(doc => doc.type === docType);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {docInfo?.icon && <docInfo.icon className="h-6 w-6 text-blue-600" />}
          </div>
          <h3 className="text-lg font-medium">{docInfo?.name}を撮影してください</h3>
          <p className="text-gray-500 mt-1">明るい場所で、文字がはっきり見えるように撮影してください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium mb-2">表面</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'front');
                }}
                className="hidden"
                id="front-camera"
              />
              <label
                htmlFor="front-camera"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                撮影する
              </label>
              {currentDoc?.frontImage && (
                <p className="text-green-600 text-xs mt-2">✓ 撮影完了</p>
              )}
            </div>
          </div>

          {(docType === 'mynumber' || docType === 'insurance') && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium mb-2">裏面</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'back');
                  }}
                  className="hidden"
                  id="back-camera"
                />
                <label
                  htmlFor="back-camera"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  撮影する
                </label>
                {currentDoc?.backImage && (
                  <p className="text-green-600 text-xs mt-2">✓ 撮影完了</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => {
              setCurrentStep('select');
              setSelectedDocType(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            onClick={() => verifyDocument(docType)}
            disabled={!currentDoc?.frontImage || isVerifying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? '確認中...' : '本人確認を開始'}
          </button>
        </div>
      </div>
    );
  };

  if (currentStep === 'complete') {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-800">本人確認が完了しました</h3>
          <p className="text-gray-600 mt-2">セキュアな診療サービスをご利用いただけます</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">確認済み書類</h4>
          {documents.filter(doc => doc.verified).map(doc => (
            <div key={doc.type} className="flex items-center justify-between py-1">
              <span>{documentTypes.find(dt => dt.type === doc.type)?.name}</span>
              <span className="text-green-600 text-sm">✓ 確認済み</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep === 'capture' && selectedDocType) {
    return <DocumentCapture docType={selectedDocType} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">本人確認</h2>
        <p className="text-gray-600 mt-2">
          {userRole === 'patient' 
            ? '安全な診療のため、本人確認書類の提出をお願いいたします'
            : '医師資格の確認のため、身分証明書の提出をお願いいたします'
          }
        </p>
      </div>

      {requiredDocuments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">必要書類</h4>
              <ul className="text-yellow-700 text-sm mt-1">
                {requiredDocuments.map(docType => (
                  <li key={docType}>
                    • {documentTypes.find(dt => dt.type === docType)?.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes
          .filter(docType => docType.acceptedFor.includes(userRole))
          .map((docType) => {
            const isVerified = documents.find(doc => doc.type === docType.type)?.verified;
            const isRequired = requiredDocuments.includes(docType.type);
            
            return (
              <div
                key={docType.type}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isVerified
                    ? 'border-green-500 bg-green-50'
                    : docType.recommended || isRequired
                    ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (!isVerified) {
                    setSelectedDocType(docType.type);
                    setCurrentStep('capture');
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <docType.icon className="h-6 w-6 text-gray-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{docType.name}</h3>
                      <p className="text-sm text-gray-600">{docType.description}</p>
                    </div>
                  </div>
                  {isVerified && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  {(docType.recommended || isRequired) && !isVerified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {isRequired ? '必須' : '推奨'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {documents.some(doc => doc.verified) && (
        <div className="text-center">
          <button
            onClick={() => onVerificationComplete(documents)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            確認完了
          </button>
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;