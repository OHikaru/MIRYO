// REVISED (NEW): NotebookLM的なソース登録UI（PDF等のアップロード）
// 本番は /api/ai/docs にmultipartで送信し、サーバでベクタ化してください。
import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, Tag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { KnowledgeDoc } from '../types';

const KnowledgeBaseManager: React.FC = () => {
  const { knowledgeDocs, uploadKnowledgeDoc } = useApp();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tags, setTags] = useState<string>('');

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const doc = await uploadKnowledgeDoc(f, tags ? tags.split(',').map(t => t.trim()) : undefined);
    console.info('uploaded', doc.id);
    if (inputRef.current) inputRef.current.value = '';
    setTags('');
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-white">
        <div className="flex items-center gap-3">
          <Upload />
          <div className="font-semibold">知識ベース（PDF/Doc/URLメタ）を登録</div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input ref={inputRef} type="file" accept="application/pdf" onChange={onUpload} className="block" />
          <div className="flex items-center gap-2">
            <Tag size={16} />
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="カンマ区切りタグ（任意）"
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ※ 本番はサーバ側でテキスト抽出/埋め込み→ベクタDBへ格納し、出典URIを保持してください（NotebookLM類似）。 
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-white">
        <div className="font-semibold mb-2">登録済みソース</div>
        <ul className="divide-y">
          {knowledgeDocs.map((d: KnowledgeDoc) => (
            <li key={d.id} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText />
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500">
                    {(d.bytes / 1024).toFixed(1)} KB ・ {d.mime} ・ {d.uploadedAt.toLocaleString()}
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-red-600" title="（デモ）削除未実装">
                <Trash2 />
              </button>
            </li>
          ))}
          {knowledgeDocs.length === 0 && (
            <li className="text-sm text-gray-500">まだソースがありません。</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;