import React, { useState } from 'react';
import { UploadCloud, AlertCircle, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import { DocumentItem, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface ClientDocumentUploadProps {
  documents: DocumentItem[];
  language: Language;
  onUploadDocument: (docId: string) => void;
}

export const ClientDocumentUpload: React.FC<ClientDocumentUploadProps> = ({
  documents,
  language,
  onUploadDocument
}) => {
  const t = translations[language];
  const [docList, setDocList] = useState<DocumentItem[]>(documents);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setDocList(documents);
  }, [documents]);

  const handleUpload = (id: string) => {
    setUploadingId(id);
    setTimeout(() => {
      setDocList(prev => prev.map(d => {
        if (d.id === id) {
          return {
            ...d,
            status: 'Verified',
            uploadedAt: 'Just now',
            fileSize: '2.8 MB PDF',
            validationNoteEn: undefined,
            validationNoteHi: undefined
          };
        }
        return d;
      }));
      setUploadingId(null);
      onUploadDocument(id);
      setToastMessage(
        language === 'mr'
          ? 'कागदपत्र सत्यापित करून वकिलांकडे पाठवले गेले!'
          : language === 'hi'
          ? 'दस्तावेज़ सत्यापित कर अधिवक्ता को प्रेषित किया गया!'
          : 'Document verified & forwarded to advocate!'
      );
      setTimeout(() => setToastMessage(null), 3000);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="sticky top-2 z-30 bg-neutral-900/90 text-white border border-emerald-500/30 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Case Vault
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {t.requestedDocuments}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Court-admissible document repository encrypted with AES-256
        </p>
      </div>

      {/* Document Items */}
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
                  Requirement: <strong className="text-amber-300 font-medium">{doc.requiredFormat}</strong>
                </span>
              </div>

              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                doc.status === 'Verified'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : doc.status === 'Format_Issue'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {doc.status === 'Format_Issue' ? 'Format Flag' : doc.status}
              </span>
            </div>

            {/* Validation warning */}
            {doc.status === 'Format_Issue' && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <p>{language === 'en' ? doc.validationNoteEn : doc.validationNoteHi}</p>
              </div>
            )}

            {/* Upload Action */}
            <div className="pt-1">
              <button
                onClick={() => handleUpload(doc.id)}
                disabled={uploadingId === doc.id || doc.status === 'Verified'}
                className={`w-full py-2.5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ios-press ${
                  doc.status === 'Verified'
                    ? 'bg-white/[0.04] text-neutral-500 cursor-default'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                <UploadCloud size={14} />
                <span>
                  {uploadingId === doc.id
                    ? 'Scanning & Validating...'
                    : doc.status === 'Verified'
                    ? 'Verified & Approved'
                    : 'Upload Certified Document'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

