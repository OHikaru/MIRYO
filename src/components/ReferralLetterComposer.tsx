// REVISED (NEW): 紹介状（診療情報提供書）作成UI。FHIR Composition（JP eReferral IG）を生成。
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ReferralLetter } from '../types';
import { Save, FileJson } from 'lucide-react';

const ReferralLetterComposer: React.FC = () => {
  const { user } = useAuth();
  const { createReferral } = useApp();

  const [patientId, setPatientId] = useState('patient-123');
  const [toOrg, setToOrg] = useState('〇〇病院 内科');
  const [reason, setReason] = useState('精査目的（高血圧のコントロール不良）');
  const [summary, setSummary] = useState('既往歴：高血圧、脂質異常症…／現病歴：…／所見：…／投薬：…');

  const [created, setCreated] = useState<ReferralLetter | null>(null);

  const onSave = () => {
    if (!user) return;
    const ref = createReferral({
      patientId,
      practitionerId: user.id,
      toOrganization: toOrg,
      reason,
      summary,
      createdAt: new Date()
    });
    setCreated(ref);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">紹介状（診療情報提供書）作成</h2>
      <div className="p-4 bg-white border rounded-lg space-y-3">
        <div className="flex gap-2 items-center">
          <label className="w-28 text-sm text-gray-600">患者ID</label>
          <input value={patientId} onChange={e => setPatientId(e.target.value)} className="border rounded px-2 py-1 flex-1" />
        </div>
        <div className="flex gap-2 items-center">
          <label className="w-28 text-sm text-gray-600">宛先</label>
          <input value={toOrg} onChange={e => setToOrg(e.target.value)} className="border rounded px-2 py-1 flex-1" />
        </div>
        <div>
          <label className="text-sm text-gray-600">紹介理由</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} className="border rounded w-full px-2 py-1" rows={2}/>
        </div>
        <div>
          <label className="text-sm text-gray-600">要約</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} className="border rounded w-full px-2 py-1" rows={6}/>
        </div>

        <div className="flex gap-2">
          <button onClick={onSave} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
            <Save size={16}/> 保存
          </button>
          {created && (
            <a
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(created.fhirComposition, null, 2))}`}
              download={`Referral_${created.id}.json`}
              className="px-3 py-2 bg-gray-100 border rounded inline-flex items-center gap-2"
            >
              <FileJson size={16}/> FHIR JSON ダウンロード
            </a>
          )}
        </div>
      </div>

      {created && (
        <pre className="p-3 bg-gray-50 border rounded text-xs overflow-auto">
{JSON.stringify(created.fhirComposition, null, 2)}
        </pre>
      )}

      <p className="text-xs text-gray-500">
        ※ 「診療情報提供書 FHIR 記述仕様（最新 v1.11）」のComposition文書に準拠する最小例です。
        実運用ではセクション構成（診療経過、検査所見、投薬歴 等）・コード体系・meta.profileなどを
        実装ガイドに合わせて拡張してください。
      </p>
    </div>
  );
};

export default ReferralLetterComposer;