import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  FolderPlus,
  Search,
  BookOpen,
  Loader2,
  Printer,
  Edit3,
  HelpCircle,
  Upload,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getAllTemplates, LegalTemplate } from '../../config/legalTemplates';
import { CaseFile, Language } from '../../types';
import { getISTDateString } from '../../lib/istDate';

interface LegalTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseFile[];
  activeCase?: CaseFile | null;
  initialTemplate?: LegalTemplate | null;
  language?: Language;
  onAttachDocumentToCase?: (caseNumber: string, doc: { title: string; content: string; category: string }) => void;
  lawyerName?: string;
  lawyerOffice?: string;
  onOpenUploadManager?: () => void;
}

export const LegalTemplatesModal: React.FC<LegalTemplatesModalProps> = ({
  isOpen,
  onClose,
  cases = [],
  activeCase,
  initialTemplate,
  language = 'en',
  onAttachDocumentToCase,
  lawyerName = 'Adv. Rajesh Sharma',
  lawyerOffice = 'Chambers at High Court / District Court, New Delhi',
  onOpenUploadManager,
}) => {
  const [allTemplatesList, setAllTemplatesList] = useState<LegalTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(initialTemplate || null);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>(
    activeCase?.caseNumber || (cases[0]?.caseNumber || '')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [isPreFilledWithClientData, setIsPreFilledWithClientData] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [aiRefinementNotes, setAiRefinementNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [attachedToast, setAttachedToast] = useState<string | null>(null);
  const [editableDraft, setEditableDraft] = useState<string>('');
  const [isEditingManually, setIsEditingManually] = useState(false);

  // Load templates (including any custom uploaded by lawyer)
  useEffect(() => {
    if (isOpen) {
      const templates = getAllTemplates();
      setAllTemplatesList(templates);
      if (initialTemplate) {
        setSelectedTemplate(initialTemplate);
      } else if (!selectedTemplate && templates.length > 0) {
        setSelectedTemplate(templates[0]);
      }
    }
  }, [isOpen, initialTemplate]);

  const currentCase = cases.find(c => c.caseNumber === selectedCaseNumber) || activeCase || cases[0];

  // Resolve template text dynamically with client details prefilled
  const generateFilledText = (template: LegalTemplate, forceClientPreFill = false): string => {
    let text = template.templateContent;
    const today = getISTDateString();
    const currentYear = new Date().getFullYear().toString();

    // Standard variable mappings from live Case + Counsel credentials
    const mappings: Record<string, string> = {
      TODAY_DATE: today,
      TODAY_YEAR: currentYear,
      COURT_LOCATION: currentCase?.courtLocation || 'New Delhi',
      COURT_NAME: currentCase?.courtLocation || currentCase?.court || 'High Court of Delhi / District Court',
      CASE_NUMBER: currentCase?.caseNumber || 'CC/2026/8941',
      CLIENT_NAME: (forceClientPreFill || isPreFilledWithClientData)
        ? (currentCase?.clientName || 'Shri Rajesh Gupta')
        : (currentCase?.clientName || '{{CLIENT_NAME}}'),
      CLIENT_PHONE: (forceClientPreFill || isPreFilledWithClientData)
        ? ((currentCase as any)?.clientPhone || '+91 98765 43210')
        : '{{CLIENT_PHONE}}',
      CLIENT_ADDRESS: (forceClientPreFill || isPreFilledWithClientData)
        ? `${currentCase?.courtLocation || 'New Delhi'}, India`
        : '{{CLIENT_ADDRESS}}',
      OPPOSITE_PARTY: currentCase?.opponentName || currentCase?.accused || currentCase?.respondent || 'State / Opposite Party',
      OPPOSITE_ADDRESS: 'Industrial Area, Phase II, New Delhi',
      LAWYER_NAME: lawyerName,
      LAWYER_OFFICE: lawyerOffice,
      BAR_ENROLLMENT: 'D/1482/2015',
      ...customValues,
    };

    // Apply variable mappings
    Object.entries(mappings).forEach(([key, val]) => {
      const reg = new RegExp(`{{${key}}}`, 'g');
      text = text.replace(reg, val || `[${key}]`);
    });

    if (aiRefinementNotes.trim()) {
      text += `\n\n/* ── AI Tailored Grounds & Submissions ── */\n${aiRefinementNotes.trim()}`;
    }

    return text;
  };

  // Sync draft when template or case changes
  useEffect(() => {
    if (selectedTemplate && !isEditingManually) {
      setEditableDraft(generateFilledText(selectedTemplate, isPreFilledWithClientData));
    }
  }, [selectedTemplate, selectedCaseNumber, customValues, isPreFilledWithClientData, aiRefinementNotes]);

  if (!isOpen) return null;

  // AI Client Pre-Fill Command
  const handlePreFillClientDetails = () => {
    setIsPreFilledWithClientData(true);
    setIsEditingManually(false);
    if (selectedTemplate) {
      const filled = generateFilledText(selectedTemplate, true);
      setEditableDraft(filled);
      setAttachedToast(`✨ Client details auto-filled from Case ${currentCase?.caseNumber || ''}!`);
      setTimeout(() => setAttachedToast(null), 3000);
    }
  };

  // AI Grounds Refinement
  const handleAiRefine = () => {
    setIsAiRefining(true);
    setTimeout(() => {
      const notes =
        `Grounds for Urgent Judicial Consideration:\n` +
        `1. That the opposing party has acted in willful violation of established judicial principles in Indian law.\n` +
        `2. Statutory limitation period is strictly complied with pursuant to the Limitation Act, 1963.\n` +
        `3. Relief sought is necessary to prevent severe injustice and irreparable loss to ${currentCase?.clientName || 'the client'}.`;
      setAiRefinementNotes(notes);
      setIsAiRefining(false);
      setAttachedToast('AI tailored clauses appended to draft!');
      setTimeout(() => setAttachedToast(null), 2500);
    }, 700);
  };

  // Direct Print Command
  const handleDirectPrint = () => {
    // Ensure the dedicated legal print mount is set up with clean text
    let printContainer = document.getElementById('nyaay-legal-print-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'nyaay-legal-print-container';
      document.body.appendChild(printContainer);
    }
    printContainer.innerText = editableDraft;
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([editableDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.id || 'draft'}_${(currentCase?.caseNumber || 'case').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachToCase = () => {
    if (!currentCase || !selectedTemplate) return;
    if (onAttachDocumentToCase) {
      onAttachDocumentToCase(currentCase.caseNumber, {
        title: `${selectedTemplate.title} (Draft).txt`,
        content: editableDraft,
        category: selectedTemplate.category,
      });
      setAttachedToast(`Successfully attached draft to Case ${currentCase.caseNumber}!`);
      setTimeout(() => setAttachedToast(null), 3500);
    }
  };

  // Categories
  const categories = ['All', 'Notice', 'Bail', 'Civil Application', 'Vakalatnama', 'Pleading', 'My Uploads'];

  const filteredTemplates = allTemplatesList.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.statutoryReference.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'My Uploads') return Boolean((t as any).isCustom);
    return t.category === selectedCategory;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          className="w-full max-w-5xl bg-white dark:bg-[#0B0F19] text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/[0.12] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4.5 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                    Legal Drafting Studio & Templates
                  </h3>
                  <span className="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hidden xs:inline-block">
                    BNSS / CPC 1908
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate">
                  Pre-fill client information, refine with AI, and print or export directly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenUploadManager && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUploadManager();
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition border border-neutral-300 dark:border-white/[0.1]"
                  title="Upload New Custom Template"
                >
                  <Upload size={13} />
                  <span className="hidden sm:inline">Upload Template</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {attachedToast && (
            <div className="mx-4 mt-2.5 p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
              <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{attachedToast}</span>
            </div>
          )}

          {/* Body Layout: Master-Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
            {/* Left Column: Template Catalog & Filter (4 cols) */}
            <div className="md:col-span-5 lg:col-span-4 border-r border-neutral-200 dark:border-white/[0.08] p-3 sm:p-4 flex flex-col gap-2.5 overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950/40">
              {/* Target Case Selector */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Active Case for Pre-fill
                </label>
                <select
                  value={selectedCaseNumber}
                  onChange={e => {
                    setSelectedCaseNumber(e.target.value);
                    setIsEditingManually(false);
                  }}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono shadow-sm"
                >
                  {cases.map(c => (
                    <option key={c.caseNumber} value={c.caseNumber}>
                      {c.caseNumber} • {c.clientName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search templates or acts..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400 shadow-sm"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[10.5px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-[#0F172A] text-white dark:bg-amber-400 dark:text-black font-bold shadow-sm'
                        : 'bg-neutral-200/70 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Templates List */}
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
                {filteredTemplates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No matching templates found.
                  </div>
                ) : (
                  filteredTemplates.map(tpl => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    const isCustom = Boolean((tpl as any).isCustom);

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setIsEditingManually(false);
                          setCustomValues({});
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-amber-50/80 dark:bg-neutral-800/90 border-amber-400/80 dark:border-amber-400/60 shadow-sm'
                            : 'bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800/80 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-white/[0.06]">
                              {tpl.category}
                            </span>
                            {isCustom && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/30">
                                My Upload
                              </span>
                            )}
                          </div>
                          <span className="text-[9.5px] text-neutral-500 truncate max-w-[110px]">{tpl.courtHierarchy}</span>
                        </div>
                        <h4 className="text-xs font-bold leading-snug line-clamp-2 text-neutral-900 dark:text-white">
                          {tpl.title}
                        </h4>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1 font-mono">
                          {tpl.statutoryReference}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Drafting Studio & Preview (7 or 8 cols) */}
            <div className="md:col-span-7 lg:col-span-8 p-3 sm:p-4.5 flex flex-col gap-3 overflow-y-auto bg-white dark:bg-[#0B0F19]">
              {selectedTemplate ? (
                <>
                  {/* Top Bar: Title & Action Commands */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-200 dark:border-white/[0.08]">
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 truncate">
                        <FileText size={15} className="text-amber-500 shrink-0" />
                        <span className="truncate">{selectedTemplate.title}</span>
                      </h4>
                      <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5 truncate">
                        {selectedTemplate.statutoryReference}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {/* One-Click AI Pre-Fill Client Details */}
                      <button
                        type="button"
                        onClick={handlePreFillClientDetails}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                        title="Auto-fill client name, phone, address, and case details"
                      >
                        <Sparkles size={13} className="text-black animate-pulse" />
                        <span>AI Fill Client Data</span>
                      </button>

                      {/* Direct Print Command */}
                      <button
                        type="button"
                        onClick={handleDirectPrint}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-neutral-800 dark:text-white font-semibold text-xs flex items-center gap-1.5 transition border border-neutral-300 dark:border-white/[0.12]"
                        title="Direct Judicial Print Command"
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>

                      {/* Copy */}
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-neutral-800 dark:text-white font-semibold text-xs flex items-center gap-1.5 transition border border-neutral-300 dark:border-white/[0.12]"
                        title="Copy to Clipboard"
                      >
                        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Export File */}
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-neutral-800 dark:text-white font-semibold text-xs flex items-center gap-1.5 transition border border-neutral-300 dark:border-white/[0.12]"
                        title="Download Plain Text Document"
                      >
                        <Download size={13} />
                        <span>Export</span>
                      </button>

                      {/* Attach to Case Docket */}
                      {onAttachDocumentToCase && (
                        <button
                          type="button"
                          onClick={handleAttachToCase}
                          className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold flex items-center gap-1.5 transition shadow"
                          title="Save directly into Case Documents Dossier"
                        >
                          <FolderPlus size={13} />
                          <span>Attach to Case</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pre-fill Status & AI Assist Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-neutral-700 dark:text-neutral-300 text-[11px]">
                        Target: <strong className="font-mono text-neutral-900 dark:text-white">{currentCase?.caseNumber}</strong> • {currentCase?.clientName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAiRefine}
                      disabled={isAiRefining}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                    >
                      {isAiRefining ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>Add AI Legal Grounds</span>
                    </button>
                  </div>

                  {/* Document Live Editor Area */}
                  <div className="flex-1 flex flex-col min-h-[320px] rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#FBFBFC] dark:bg-[#07090E] p-3 sm:p-4 overflow-hidden relative shadow-inner">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-200 dark:border-white/[0.06] text-[10.5px] text-neutral-500 font-mono">
                      <span>Draft Document Preview (Editable)</span>
                      <span>{editableDraft.length} chars</span>
                    </div>

                    <textarea
                      value={editableDraft}
                      onChange={e => {
                        setEditableDraft(e.target.value);
                        setIsEditingManually(true);
                      }}
                      className="w-full flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 font-mono leading-relaxed resize-none focus:outline-none overflow-y-auto select-text"
                      placeholder="Template draft content..."
                    />
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
                  <FileText size={32} className="mb-2 text-neutral-300 dark:text-neutral-600" />
                  <p className="font-semibold text-neutral-700 dark:text-neutral-300">Select a template from the left</p>
                  <p className="text-[11px] text-neutral-500 mt-1">Choose an Indian law template to review and auto-fill.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
