import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Folder,
  Scale,
  FileCheck,
  Shield,
  Clock,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { CaseFile, Language } from '../../types';

interface EvidentiaryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseFile[];
  language?: Language;
  onUploadDocument: (caseNumber: string, file: File, docType: string, note?: string) => Promise<void> | void;
}

const DOCUMENT_CATEGORIES = [
  { id: 'vakalatnama', label: 'Vakalatnama (Counsel Authority)', icon: '⚖️', desc: 'Power of Attorney / Memo of Appearance' },
  { id: 'petition', label: 'Petition / Plaint / Bail Application', icon: '📄', desc: 'Main substantive legal pleading' },
  { id: 'chargesheet', label: 'FIR / Police Charge Sheet', icon: '🚨', desc: 'Investigative record / Final Report' },
  { id: 'evidence', label: 'Evidentiary Exhibit / Annexure', icon: '📎', desc: 'Affidavit, Bank Statement, Contract, Chat Log' },
  { id: 'order', label: 'Certified Court Order / Notice', icon: '🏛️', desc: 'Interim Injunction, Summons, or Judgment' },
  { id: 'written_statement', label: 'Written Statement / Reply', icon: '✍️', desc: 'Defense statement / Rejoinder' },
];

export const EvidentiaryUploadModal: React.FC<EvidentiaryUploadModalProps> = ({
  isOpen,
  onClose,
  cases = [],
  language = 'en',
  onUploadDocument,
}) => {
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>(cases[0]?.caseNumber || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(DOCUMENT_CATEGORIES[0].id);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentNote, setDocumentNote] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setDocumentTitle(cleanName);
      }
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!documentTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setDocumentTitle(cleanName);
      }
      setError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseNumber) {
      setError('Please select or specify a Case Dossier to attach this evidentiary file.');
      return;
    }
    if (!selectedFile) {
      setError('Please select a document or evidentiary file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const categoryObj = DOCUMENT_CATEGORIES.find(c => c.id === selectedCategory);
      const categoryLabel = categoryObj ? categoryObj.label : 'Evidence';
      const finalTitle = documentTitle.trim() || selectedFile.name;

      await onUploadDocument(
        selectedCaseNumber,
        selectedFile,
        categoryLabel,
        documentNote.trim() || undefined
      );

      setSuccessMessage(`File "${finalTitle}" successfully attached to Case ${selectedCaseNumber}!`);
      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedFile(null);
        setDocumentTitle('');
        setDocumentNote('');
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload evidentiary file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 bg-[#111216] border border-white/[0.12] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-lg">
              <Folder size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Upload Evidentiary Files</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                  DOSSIER VAULT
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Attach case pleadings, vakalatnama, evidence exhibits, or court orders to a case docket
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
          >
            <X size={15} />
          </button>
        </div>

        {/* Feedback / Alert Banners */}
        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {/* Step 1: Select Case Dossier */}
          <div>
            <label className="text-xs font-bold text-neutral-200 block mb-1.5 flex items-center justify-between">
              <span>1. Target Case Dossier *</span>
              <span className="text-[10px] text-neutral-500 font-mono font-normal">Vault Destination</span>
            </label>
            {cases.length > 0 ? (
              <select
                value={selectedCaseNumber}
                onChange={e => setSelectedCaseNumber(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.12] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium"
              >
                {cases.map(c => (
                  <option key={c.id || c.caseNumber} value={c.caseNumber}>
                    {c.caseNumber} — {c.clientName} vs {c.opponentName || 'State'} ({c.courtLocation})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                <p className="font-semibold text-xs">No case dossiers registered yet.</p>
                <p className="text-[11px] text-neutral-400">
                  Please create a Case Dossier first (or use "+ New Case Dossier") to store evidentiary files.
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Evidentiary Classification */}
          <div>
            <label className="text-xs font-bold text-neutral-200 block mb-1.5">
              2. Evidentiary Document Classification *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-start gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-white/[0.02] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className={`font-semibold text-[11px] truncate ${isSelected ? 'text-emerald-300' : 'text-neutral-300'}`}>
                        {cat.label}
                      </p>
                      <p className="text-[9px] text-neutral-500 truncate mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: File Dropzone */}
          <div>
            <label className="text-xs font-bold text-neutral-200 block mb-1.5 flex items-center justify-between">
              <span>3. Document File (PDF, DOCX, Images) *</span>
              <span className="text-[10px] text-neutral-500 font-mono font-normal">Max 25 MB</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.12] hover:border-emerald-400/40 bg-black/40 hover:bg-white/[0.02]'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3 text-left w-full justify-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-white truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] text-neutral-300 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Tap to upload or drag & drop</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Supports PDF, Court Orders, Scanned Documents, Photos</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Step 4: Title & Exhibit Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Document / Exhibit Title
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={e => setDocumentTitle(e.target.value)}
                placeholder="e.g. Vakalatnama Signed, Annexure P-1"
                className="w-full bg-black/60 border border-white/[0.12] rounded-2xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Notes / Markings (Optional)
              </label>
              <input
                type="text"
                value={documentNote}
                onChange={e => setDocumentNote(e.target.value)}
                placeholder="e.g. Certified copy received from registry"
                className="w-full bg-black/60 border border-white/[0.12] rounded-2xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !selectedCaseNumber}
              className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ios-press shadow-lg ${
                isUploading || !selectedFile || !selectedCaseNumber
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
              }`}
            >
              <FileText size={14} />
              <span>{isUploading ? 'Uploading to Vault...' : 'Save to Case Vault'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
