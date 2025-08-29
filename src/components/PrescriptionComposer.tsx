// REVISED (NEW): 処方箋作成UI。JP Core MedicationRequestに対応する最小セットを生成。
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { MedicationItem, Prescription } from '../types';
import { Plus, Save, FileJson } from 'lucide-react';

const emptyItem: MedicationItem = {
  display: '',
  dosageText: '',
  quantity: { value: 10, unit: '錠' },
  repeats: 0
};

const PrescriptionComposer: React.FC = () => {
  const { user } = useAuth();
  const { createPrescription } = useApp();
  const [patientId, setPatientId] = useState('patient-123');
  const [items, setItems] = useState<MedicationItem[]>([{ ...emptyItem }]);
  const [created, setCreated] = useState<Prescription | null>(null);

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const updateItem = (idx: number, patch: Partial<MedicationItem>) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const onSave = () => {
    if (!user) return;
    const rx = createPrescription({
      patientId,
      practitionerId: user.id,
      issuedAt: new Date(),
      items
    });
    setCreated(rx);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">処方箋作成</h2>
      <div className="p-4 bg-white border rounded-lg space-y-3">
        <div className="flex gap-2 items-center">
          <label className="w-24 text-sm text-gray-600">患者ID</label>
          <input value={patientId} onChange={e => setPatientId(e.target.value)} className="border rounded px-2 py-1 flex-1" />
        </div>

        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="p-3 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">薬品名/表示</label>
                  <input value={it.display || ''} onChange={e => updateItem(idx, { display: e.target.value })}
                    className="border rounded w-full px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">用法（テキスト）</label>
                  <input value={it.dosageText || ''} onChange={e => updateItem(idx, { dosageText: e.target.value })}
                    className="border rounded w-full px-2 py-1" placeholder="1日3回 毎食後 1錠 など" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">数量</label>
                  <input type="number" value={it.quantity?.value || 0} onChange={e => updateItem(idx, { quantity: { ...(it.quantity||{unit:'錠'}), value: Number(e.target.value) } })}
                    className="border rounded w-full px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">単位</label>
                  <input value={it.quantity?.unit || ''} onChange={e => updateItem(idx, { quantity: { ...(it.quantity||{value: 0}), unit: e.target.value } })}
                    className="border rounded w-full px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">リフィル回数</label>
                  <input type="number" value={it.repeats || 0} onChange={e => updateItem(idx, { repeats: Number(e.target.value) })}
                    className="border rounded w-full px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">用法コード（任意）</label>
                  <input value={it.timingCode || ''} onChange={e => updateItem(idx, { timingCode: e.target.value })}
                    className="border rounded w-full px-2 py-1" placeholder="用法マスタコード等" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addItem} className="inline-flex items-center gap-2 text-blue-600">
            <Plus size={16}/> 薬剤を追加
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={onSave} className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
            <Save size={16}/> 保存
          </button>
          {created && (
            <a
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(created.fhirMedicationRequest, null, 2))}`}
              download={`MedicationRequest_${created.id}.json`}
              className="px-3 py-2 bg-gray-100 border rounded inline-flex items-center gap-2"
            >
              <FileJson size={16}/> FHIR JSON ダウンロード
            </a>
          )}
        </div>
      </div>

      {created && (
        <pre className="p-3 bg-gray-50 border rounded text-xs overflow-auto">
{JSON.stringify(created.fhirMedicationRequest, null, 2)}
        </pre>
      )}

      <p className="text-xs text-gray-500">
        ※ JP Core MedicationRequest/調剤指示・用法コード体系は実装ガイドに準拠（例：用法コード体系、拡張）。運用時は
        電子処方箋管理サービスの要件（調剤結果登録・重複投薬チェック等）も考慮してください。
      </p>
    </div>
  );
};

export default PrescriptionComposer;