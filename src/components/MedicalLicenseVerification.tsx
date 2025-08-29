import React, { useState } from 'react';
import { Award, FileText, Shield, Check, AlertTriangle, ExternalLink, Upload } from 'lucide-react';

interface MedicalCredential {
  type: 'medical_license' | 'specialist_cert' | 'hospital_affiliation';
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  verified: boolean;
  verificationDate?: Date;
  documentImage?: File;
  specialty?: string;
  hospitalName?: string;
}

interface MedicalLicenseVerificationProps {
  onVerificationComplete: (credentials: MedicalCredential[]) => void;
  existingCredentials?: MedicalCredential[];
}

const MedicalLicenseVerification: React.FC<MedicalLicenseVerificationProps> = ({
  onVerificationComplete,
  existingCredentials = []
}) => {
  const [credentials, setCredentials] = useState<MedicalCredential[]>(existingCredentials);
  const [currentStep, setCurrentStep] = useState<'overview' | 'add_license' | 'add_specialist' | 'add_affiliation' | 'complete'>('overview');
  const [isVerifying, setIsVerifying] = useState(false);
  const [newCredential, setNewCredential] = useState<Partial<MedicalCredential>>({});

  const credentialTypes = [
    {
      type: 'medical_license' as const,
      name: '医師免許',
      description: '厚生労働省発行の医師免許証',
      icon: Award,
      required: true,
      color: 'blue'
    },
    {
      type: 'specialist_cert' as const,
      name: '専門医認定証',
      description: '学会認定の専門医資格',
      icon: FileText,
      required: false,
      color: 'green'
    },
    {
      type: 'hospital_affiliation' as const,
      name: '所属医療機関',
      description: '勤務先医療機関の証明',
      icon: Shield,
      required: true,
      color: 'purple'
    }
  ];

  const specialties = [
    '内科', '外科', '小児科', '産婦人科', '整形外科', '皮膚科', '眼科', '耳鼻咽喉科', 
    '泌尿器科', '精神科', '心療内科', '放射線科', '麻酔科', '病理診断科', '臨床検査医学', 
    '救急科', '総合診療科', 'リハビリテーション科', '形成外科', '脳神経外科'
  ];

  const simulateVerification = async (credential: MedicalCredential): Promise<boolean> => {
    // シミュレーション：実際は厚労省DB/学会DB照合
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // 医師免許は95%、その他は85%の成功率でシミュレート
    const successRate = credential.type === 'medical_license' ? 0.95 : 0.85;
    return Math.random() < successRate;
  };

  const verifyCredential = async (credential: MedicalCredential) => {
    setIsVerifying(true);
    
    try {
      const verificationResult = await simulateVerification(credential);
      
      setCredentials(prev =>
        prev.map(cred =>
          cred === credential
            ? {
                ...cred,
                verified: verificationResult,
                verificationDate: new Date()
              }
            : cred
        )
      );

      // すべての必須資格が確認できたかチェック
      const requiredTypes = credentialTypes.filter(ct => ct.required).map(ct => ct.type);
      const verifiedTypes = credentials.filter(c => c.verified).map(c => c.type);
      const hasAllRequired = requiredTypes.every(type => verifiedTypes.includes(type));

      if (verificationResult && hasAllRequired) {
        setCurrentStep('complete');
        onVerificationComplete(credentials);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const addCredential = (credentialData: Partial<MedicalCredential>) => {
    if (!credentialData.type || !credentialData.licenseNumber) return;
    
    const newCred: MedicalCredential = {
      type: credentialData.type,
      licenseNumber: credentialData.licenseNumber,
      issuingAuthority: credentialData.issuingAuthority || '',
      issueDate: credentialData.issueDate || new Date(),
      expiryDate: credentialData.expiryDate,
      verified: false,
      documentImage: credentialData.documentImage,
      specialty: credentialData.specialty,
      hospitalName: credentialData.hospitalName
    };

    setCredentials(prev => [...prev, newCred]);
    setNewCredential({});
    setCurrentStep('overview');
  };

  const CredentialForm: React.FC<{ type: MedicalCredential['type'] }> = ({ type }) => {
    const credType = credentialTypes.find(ct => ct.type === type)!;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 bg-${credType.color}-100 rounded-full flex items-center justify-center mb-4`}>
            <credType.icon className={`h-6 w-6 text-${credType.color}-600`} />
          </div>
          <h3 className="text-lg font-medium">{credType.name}の登録</h3>
          <p className="text-gray-500 mt-1">{credType.description}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {type === 'medical_license' ? '医師免許番号' : 
               type === 'specialist_cert' ? '認定番号' : '所属コード'}
            </label>
            <input
              type="text"
              value={newCredential.licenseNumber || ''}
              onChange={(e) => setNewCredential(prev => ({ ...prev, licenseNumber: e.target.value }))}
              placeholder={type === 'medical_license' ? '第123456号' : 
                          type === 'specialist_cert' ? 'JSIM12345' : 'H001234'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">発行機関</label>
            <input
              type="text"
              value={newCredential.issuingAuthority || ''}
              onChange={(e) => setNewCredential(prev => ({ ...prev, issuingAuthority: e.target.value }))}
              placeholder={type === 'medical_license' ? '厚生労働省' : 
                          type === 'specialist_cert' ? '日本内科学会' : '○○総合病院'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {type === 'specialist_cert' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">専門分野</label>
              <select
                value={newCredential.specialty || ''}
                onChange={(e) => setNewCredential(prev => ({ ...prev, specialty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'hospital_affiliation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">医療機関名</label>
              <input
                type="text"
                value={newCredential.hospitalName || ''}
                onChange={(e) => setNewCredential(prev => ({ ...prev, hospitalName: e.target.value }))}
                placeholder="○○総合病院"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">発行日</label>
            <input
              type="date"
              value={newCredential.issueDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setNewCredential(prev => ({ ...prev, issueDate: new Date(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {type !== 'medical_license' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">有効期限（任意）</label>
              <input
                type="date"
                value={newCredential.expiryDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setNewCredential(prev => ({ 
                  ...prev, 
                  expiryDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">証明書画像</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">証明書の写真をアップロード</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewCredential(prev => ({ ...prev, documentImage: file }));
                  }}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  ファイル選択
                </label>
                {newCredential.documentImage && (
                  <p className="text-green-600 text-xs mt-2">✓ {newCredential.documentImage.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('overview')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              setNewCredential(prev => ({ ...prev, type }));
              addCredential({ ...newCredential, type });
            }}
            disabled={!newCredential.licenseNumber || !newCredential.issuingAuthority}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            登録する
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
          <h3 className="text-xl font-semibold text-green-800">医師資格の確認が完了しました</h3>
          <p className="text-gray-600 mt-2">遠隔診療サービスを提供いただけます</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">確認済み資格</h4>
          {credentials.filter(cred => cred.verified).map((cred, index) => (
            <div key={index} className="flex items-center justify-between py-1">
              <span>{credentialTypes.find(ct => ct.type === cred.type)?.name}</span>
              <span className="text-green-600 text-sm">✓ 確認済み</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep !== 'overview') {
    const formType = currentStep.replace('add_', '') as MedicalCredential['type'];
    return <CredentialForm type={formType} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">医師資格確認</h2>
        <p className="text-gray-600 mt-2">
          遠隔診療を提供するために必要な医師資格の確認を行います
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h4 className="font-medium text-blue-800">確認プロセス</h4>
            <p className="text-blue-700 text-sm mt-1">
              入力された情報は厚生労働省および各学会のデータベースと照合され、自動的に確認されます。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {credentialTypes.map((credType) => {
          const existingCred = credentials.find(cred => cred.type === credType.type);
          const isVerified = existingCred?.verified;

          return (
            <div
              key={credType.type}
              className={`border rounded-lg p-4 ${
                isVerified
                  ? 'border-green-500 bg-green-50'
                  : credType.required
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <credType.icon className={`h-6 w-6 text-${credType.color}-600 mr-3`} />
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center">
                      {credType.name}
                      {credType.required && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">必須</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{credType.description}</p>
                    {existingCred && (
                      <p className="text-xs text-gray-500 mt-1">
                        登録番号: {existingCred.licenseNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isVerified && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  {existingCred && !isVerified && (
                    <button
                      onClick={() => verifyCredential(existingCred)}
                      disabled={isVerifying}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isVerifying ? '確認中...' : '確認'}
                    </button>
                  )}
                  {!existingCred && (
                    <button
                      onClick={() => setCurrentStep(`add_${credType.type}` as any)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      登録
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {credentials.some(cred => cred.verified) && (
        <div className="flex justify-center">
          <button
            onClick={() => onVerificationComplete(credentials)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            確認完了
          </button>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">参考リンク</h4>
        <div className="space-y-2 text-sm">
          <a href="#" className="flex items-center text-blue-600 hover:text-blue-800">
            <ExternalLink className="h-4 w-4 mr-2" />
            厚生労働省 医師等資格確認検索システム
          </a>
          <a href="#" className="flex items-center text-blue-600 hover:text-blue-800">
            <ExternalLink className="h-4 w-4 mr-2" />
            専門医機構 専門医検索
          </a>
        </div>
      </div>
    </div>
  );
};

export default MedicalLicenseVerification;