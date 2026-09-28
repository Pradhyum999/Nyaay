import React, { useState } from 'react';
import { UploadCloud, AlertCircle, CheckCircle2, FileCheck, Eye, X } from 'lucide-react';
import { DocumentItem, Language } from '../types';
import { translations } from '../i18n/translations';

interface DocumentManagerProps {
  documents: DocumentItem[];
  language: Language;
  onUploadDocument: (docId: string) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, language, onUploadDocument }) => {
  const t = translations[language];
  const [docList, setDocList] = useState<DocumentItem[]>(documents);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  React.useEffect(() => {
    setDocList(documents);
  }, [documents]);

  const verifiedCount = docList.filter(d => d.status === 'Verified').length;
  const progressPercent = docList.length > 0 ? Math.round((verifiedCount / docList.length) * 100) : 0;

  const handleSimulateUpload = (id: string) => {
    setUploadingId(id);
    setTimeout(() => {
      setDocList(prev => prev.map(d => {
        if (d.id === id) {
          return {
            ...d,
            status: 'Verified',
            uploadedAt: 'Just now',
            fileSize: '2.4 MB PDF',
            validationNoteEn: undefined,
            validationNoteHi: undefined
          };
        }
        return d;
      }));
      setUploadingId(null);
      onUploadDocument(id);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Document Repository
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {t.docChecklistHeader}
        </h1>
      </div>

      {/* Minimalist Progress Pill Card */}
      <div className="glass-card rounded-3xl p-5 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-neutral-300 font-medium">CC/4128/2026 Checklist</span>
          <span className="text-white font-mono font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Document Items List */}
      <div className="space-y-3">
        {docList.map(doc => (
          <div
            key={doc.id}
            className={`rounded-3xl p-4 border flex flex-col gap-3 transition ${
              doc.status === 'Format_Issue'
                ? 'bg-rose-950/10 border-rose-500/30'
                : 'glass-card border-white/[0.08]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {doc.caseNumber}
                </span>
                <h4 className="text-sm font-semibold text-white tracking-tight mt-0.5">
                  {language === 'en' ? doc.titleEn : doc.titleHi}
                </h4>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Required: <strong className="text-neutral-200">{doc.requiredFormat}</strong>
                </span>
              </div>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                doc.status === 'Verified'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : doc.status === 'Format_Issue'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
              }`}>
                {doc.status === 'Format_Issue' ? 'Format Flag' : doc.status}
              </span>
            </div>

            {/* Validation Note Warning */}
            {doc.status === 'Format_Issue' && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex items-start gap-2 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <p>{language === 'en' ? doc.validationNoteEn : doc.validationNoteHi}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-1">
              {doc.status === 'Verified' ? (
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="w-full py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition ios-press"
                >
                  <Eye size={13} />
                  <span>Preview File</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSimulateUpload(doc.id)}
                  disabled={uploadingId === doc.id}
                  className="w-full py-2.5 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ios-press hover:bg-neutral-200"
                >
                  <UploadCloud size={14} />
                  <span>{uploadingId === doc.id ? 'Validating Format...' : t.uploadDoc}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl flex flex-col gap-3 bg-[#111215] border border-white/[0.1]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold text-white tracking-tight">
                {language === 'en' ? previewDoc.titleEn : previewDoc.titleHi}
              </span>
              <button onClick={() => setPreviewDoc(null)} className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="w-full h-64 bg-black/60 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between text-neutral-400 text-xs font-mono leading-relaxed select-none">
              <div>
                <p className="text-center font-bold text-white uppercase tracking-widest text-[10px]">
                  IN THE HIGH COURT OF DELHI AT NEW DELHI
                </p>
                <div className="w-full border-b border-white/[0.08] my-2"></div>
                <p className="font-semibold text-white">{previewDoc.caseNumber}</p>
                <p className="mt-1 text-neutral-400 text-[10px]">
                  Official certified electronic record uploaded to NYAAY Secure Vault.
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-300 text-[10px]">
                ✓ Validated: Certified True Copy with Court Seal
              </div>
            </div>

            <button
              onClick={() => setPreviewDoc(null)}
              className="w-full py-2.5 rounded-2xl bg-white text-black text-xs font-semibold mt-2 hover:bg-neutral-200 ios-press"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
