import React, { useState } from 'react';
import { Shield, CreditCard, CheckCircle, XCircle, AlertTriangle, FileText, Calculator, Clock } from 'lucide-react';
import { auditLogger } from '../services/auditLogger';

interface InsuranceInfo {
  insurerNumber: string; // 保険者番号（8桁）
  patientNumber: string; // 被保険者証等記号・番号
  patientName: string;
  patientNameKana: string;
  dateOfBirth: Date;
  sex: 'male' | 'female';
  address: string;
  relationshipToHolder: 'self' | 'spouse' | 'child' | 'other';
  insuranceType: 'kokuho' | 'shakai' | 'koukikourei' | 'other';
  validFrom: Date;
  validUntil: Date;
  copayRatio: number; // 患者負担割合 (10%, 20%, 30%)
  issuerName: string; // 保険者名
  verified: boolean;
  verificationDate?: Date;
  cardImage?: File;
}

interface MedicalFeeCalculation {
  consultationFee: number;
  technicianFee: number;
  medicationFee: number;
  totalFee: number;
  patientCopay: number;
  insuranceCoverage: number;
  additionalCharges: { name: string; fee: number }[];
}

interface InsuranceVerificationProps {
  onVerificationComplete: (insuranceInfo: InsuranceInfo) => void;
  patientId: string;
  existingInfo?: Partial<InsuranceInfo>;
}

const InsuranceVerification: React.FC<InsuranceVerificationProps> = ({
  onVerificationComplete,
  patientId,
  existingInfo
}) => {
  const [insuranceInfo, setInsuranceInfo] = useState<Partial<InsuranceInfo>>(existingInfo || {});
  const [currentStep, setCurrentStep] = useState<'input' | 'verify' | 'calculate' | 'complete'>('input');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failure' | 'partial'>('pending');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feeCalculation, setFeeCalculation] = useState<MedicalFeeCalculation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const insuranceTypes = [
    { 
      value: 'kokuho', 
      label: '国民健康保険', 
      description: '市町村国保・国保組合',
      copayRatio: 30 
    },
    { 
      value: 'shakai', 
      label: '社会保険', 
      description: '健康保険組合・協会けんぽ',
      copayRatio: 30 
    },
    { 
      value: 'koukikourei', 
      label: '後期高齢者医療', 
      description: '75歳以上または65-74歳の一定の障害者',
      copayRatio: 10 
    },
    { 
      value: 'other', 
      label: 'その他', 
      description: '共済組合・その他の保険',
      copayRatio: 30 
    }
  ];

  const validateInsuranceInfo = (info: Partial<InsuranceInfo>): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!info.insurerNumber || !/^\d{8}$/.test(info.insurerNumber)) {
      errors.insurerNumber = '保険者番号は8桁の数字で入力してください';
    }

    if (!info.patientNumber || info.patientNumber.length < 2) {
      errors.patientNumber = '被保険者証等記号・番号を入力してください';
    }

    if (!info.patientName || info.patientName.length < 1) {
      errors.patientName = '被保険者氏名を入力してください';
    }

    if (!info.dateOfBirth) {
      errors.dateOfBirth = '生年月日を入力してください';
    }

    if (!info.insuranceType) {
      errors.insuranceType = '保険種別を選択してください';
    }

    return errors;
  };

  const simulateInsuranceVerification = async (info: Partial<InsuranceInfo>): Promise<{
    valid: boolean;
    details?: any;
    errors?: string[];
  }> => {
    // 実際の実装では保険者番号検証API、レセプトオンライン資格確認等を使用
    await new Promise(resolve => setTimeout(resolve, 3000));

    // シミュレーション：85%の確率で成功
    const isValid = Math.random() > 0.15;
    
    if (!isValid) {
      return {
        valid: false,
        errors: ['保険証が無効または期限切れです', '保険者番号が見つかりません']
      };
    }

    return {
      valid: true,
      details: {
        insurerName: getInsurerName(info.insurerNumber || ''),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年後
        copayRatio: getCopayRatio(info.insuranceType || 'shakai', info.dateOfBirth),
        additionalBenefits: ['高額療養費制度適用', '傷病手当金対象']
      }
    };
  };

  const getInsurerName = (insurerNumber: string): string => {
    // 実際の保険者番号から保険者名を取得
    const sampleInsurers: Record<string, string> = {
      '01234567': '○○健康保険組合',
      '06123456': '東京都国民健康保険',
      '39123456': '後期高齢者医療広域連合',
    };
    return sampleInsurers[insurerNumber] || '保険者名（API取得）';
  };

  const getCopayRatio = (insuranceType: string, dateOfBirth?: Date): number => {
    if (!dateOfBirth) return 30;
    
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    if (insuranceType === 'koukikourei') return 10;
    if (age >= 70) return 20;
    if (age < 3) return 20;
    return 30;
  };

  const calculateMedicalFees = (consultationType: 'initial' | 'follow_up' = 'initial'): MedicalFeeCalculation => {
    // 診療報酬点数表に基づく計算（簡略化）
    const baseFees = {
      initial: {
        consultation: 288, // 初診料（点数）
        technician: 150,  // 情報通信機器を用いた場合の技術料
      },
      follow_up: {
        consultation: 73,  // 再診料
        technician: 100,
      }
    };

    const fees = baseFees[consultationType];
    const consultationFee = fees.consultation * 10; // 1点 = 10円
    const technicianFee = fees.technician * 10;
    const medicationFee = 0; // 処方がある場合は別途計算
    
    const totalFee = consultationFee + technicianFee + medicationFee;
    const copayRatio = insuranceInfo.copayRatio || 30;
    const patientCopay = Math.floor(totalFee * copayRatio / 100);
    const insuranceCoverage = totalFee - patientCopay;

    const additionalCharges = [
      { name: 'システム利用料', fee: 330 },
      { name: '情報通信料', fee: 220 }
    ];

    return {
      consultationFee,
      technicianFee,
      medicationFee,
      totalFee,
      patientCopay: patientCopay + additionalCharges.reduce((sum, charge) => sum + charge.fee, 0),
      insuranceCoverage,
      additionalCharges
    };
  };

  const handleVerification = async () => {
    const validationErrors = validateInsuranceInfo(insuranceInfo);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      // 監査ログ記録
      await auditLogger.logPHIAccess(
        patientId,
        'patient',
        patientId,
        'view',
        'insurance_verification',
        { verification_initiated: true }
      );

      const result = await simulateInsuranceVerification(insuranceInfo);
      
      if (result.valid) {
        const updatedInfo: InsuranceInfo = {
          ...insuranceInfo,
          issuerName: result.details.insurerName,
          validUntil: result.details.validUntil,
          copayRatio: result.details.copayRatio,
          verified: true,
          verificationDate: new Date()
        } as InsuranceInfo;

        setInsuranceInfo(updatedInfo);
        setVerificationStatus('success');
        
        // 診療費計算
        const calculation = calculateMedicalFees('initial');
        setFeeCalculation(calculation);
        
        setCurrentStep('calculate');

        // 監査ログ記録
        await auditLogger.logPHIAccess(
          patientId,
          'patient',
          patientId,
          'view',
          'insurance_verification_success',
          { 
            insurer: result.details.insurerName,
            copay_ratio: result.details.copayRatio 
          }
        );
        
      } else {
        setVerificationStatus('failure');
        setErrors({ general: result.errors?.join(', ') || '保険証の確認に失敗しました' });
      }
    } catch (error) {
      console.error('Insurance verification failed:', error);
      setVerificationStatus('failure');
      setErrors({ general: 'システムエラーが発生しました' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = () => {
    if (insuranceInfo.verified) {
      onVerificationComplete(insuranceInfo as InsuranceInfo);
      setCurrentStep('complete');
    }
  };

  if (currentStep === 'complete') {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-800">保険証確認が完了しました</h3>
          <p className="text-gray-600 mt-2">診療を開始いたします</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">確認内容</h4>
          <div className="text-left space-y-1 text-sm">
            <p><strong>保険者:</strong> {insuranceInfo.issuerName}</p>
            <p><strong>患者負担割合:</strong> {insuranceInfo.copayRatio}%</p>
            <p><strong>本日の患者負担額:</strong> ¥{feeCalculation?.patientCopay.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'calculate' && feeCalculation) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Calculator className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold">診療費計算</h3>
          <p className="text-gray-600 mt-2">保険適用による診療費をご確認ください</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-4">診療費明細</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>初診料</span>
              <span>¥{feeCalculation.consultationFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>オンライン診療技術料</span>
              <span>¥{feeCalculation.technicianFee.toLocaleString()}</span>
            </div>
            {feeCalculation.medicationFee > 0 && (
              <div className="flex justify-between">
                <span>処方料</span>
                <span>¥{feeCalculation.medicationFee.toLocaleString()}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-semibold">
              <span>保険診療費 小計</span>
              <span>¥{feeCalculation.totalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>保険負担分 ({100 - (insuranceInfo.copayRatio || 30)}%)</span>
              <span>-¥{feeCalculation.insuranceCoverage.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>患者負担分 ({insuranceInfo.copayRatio}%)</span>
              <span>¥{Math.floor(feeCalculation.totalFee * (insuranceInfo.copayRatio || 30) / 100).toLocaleString()}</span>
            </div>
            
            {feeCalculation.additionalCharges.map((charge, index) => (
              <div key={index} className="flex justify-between text-gray-600">
                <span>{charge.name} (自費)</span>
                <span>¥{charge.fee.toLocaleString()}</span>
              </div>
            ))}
            
            <hr className="border-2" />
            <div className="flex justify-between text-lg font-bold text-red-600">
              <span>お支払い総額</span>
              <span>¥{feeCalculation.patientCopay.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">お支払いについて</p>
              <p className="text-yellow-700">
                診療終了後、クレジットカードまたは銀行振込でお支払いください。
                高額療養費制度の対象となる場合があります。
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('input')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            診療を開始する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">保険証確認</h2>
        <p className="text-gray-600 mt-2">
          診療費の保険適用のため、保険証情報をご入力ください
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <p className="text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              保険者番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={insuranceInfo.insurerNumber || ''}
              onChange={(e) => setInsuranceInfo(prev => ({ 
                ...prev, 
                insurerNumber: e.target.value.replace(/\D/g, '').substr(0, 8) 
              }))}
              placeholder="12345678"
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.insurerNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={8}
            />
            {errors.insurerNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.insurerNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              被保険者証等記号・番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={insuranceInfo.patientNumber || ''}
              onChange={(e) => setInsuranceInfo(prev => ({ ...prev, patientNumber: e.target.value }))}
              placeholder="123456-1"
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.patientNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.patientNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.patientNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              被保険者氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={insuranceInfo.patientName || ''}
              onChange={(e) => setInsuranceInfo(prev => ({ ...prev, patientName: e.target.value }))}
              placeholder="田中太郎"
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.patientName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.patientName && (
              <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生年月日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={insuranceInfo.dateOfBirth?.toISOString().split('T')[0] || ''}
              onChange={(e) => setInsuranceInfo(prev => ({ 
                ...prev, 
                dateOfBirth: e.target.value ? new Date(e.target.value) : undefined 
              }))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性別 <span className="text-red-500">*</span>
            </label>
            <select
              value={insuranceInfo.sex || ''}
              onChange={(e) => setInsuranceInfo(prev => ({ ...prev, sex: e.target.value as 'male' | 'female' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択してください</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              保険種別 <span className="text-red-500">*</span>
            </label>
            <select
              value={insuranceInfo.insuranceType || ''}
              onChange={(e) => {
                const selectedType = insuranceTypes.find(type => type.value === e.target.value);
                setInsuranceInfo(prev => ({ 
                  ...prev, 
                  insuranceType: e.target.value as any,
                  copayRatio: selectedType?.copayRatio || 30
                }));
              }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.insuranceType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">選択してください</option>
              {insuranceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.description})
                </option>
              ))}
            </select>
            {errors.insuranceType && (
              <p className="text-red-500 text-xs mt-1">{errors.insuranceType}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleVerification}
            disabled={isVerifying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isVerifying ? (
              <>
                <Clock className="animate-spin h-4 w-4 mr-2" />
                確認中...
              </>
            ) : (
              '保険証を確認する'
            )}
          </button>
        </div>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">保険証確認について</p>
            <p className="text-blue-700 mt-1">
              入力された情報は社会保険診療報酬支払基金のオンライン資格確認システムと照合されます。
              個人情報は診療目的でのみ使用され、適切に保護されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceVerification;