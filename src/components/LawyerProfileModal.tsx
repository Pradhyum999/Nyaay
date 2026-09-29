import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  BookOpen,
  GraduationCap,
  MapPin,
  X,
  Scale,
  DownloadCloud,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Sparkles,
  Gavel,
  ShieldAlert,
  Camera,
  Edit3,
  UploadCloud,
  AlertTriangle,
  Lock,
  Upload,
  Trash2,
  Maximize2,
  Search,
  ExternalLink,
  PlusCircle,
  Check,
  FileText,
  RefreshCw,
  Globe,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchPublicCourtCases,
  syncLawyerPublicCases,
  addPublicCourtCase,
  deletePublicCourtCase,
  togglePublicCaseVisibility,
  updateAdvocateCaseNotes,
  updateUserProfile,
  submitVerificationRequest
} from '../services/firestoreService';
import {
  lookupECourtsByCNR,
  searchECourtsByCaseDetails,
  searchECourtsByAdvocate,
  parseAndValidateCNR,
  AUTHENTIC_JUDICIAL_DOCKETS
} from '../services/ecourtsService';
import { compressImageFile } from '../utils/imageUtils';
import { Language, PublicCourtCase, VerificationStatus } from '../types';
import { translations } from '../i18n/translations';

interface LawyerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOpenAdminDashboard?: () => void;
}

const ADVOCATE_AVATARS = [
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const LawyerProfileModal: React.FC<LawyerProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  onOpenAdminDashboard,
}) => {
  const { user, profile, updateProfile, logout } = useAuth();
  const t = translations[language];

  const [publicCases, setPublicCases] = useState<PublicCourtCase[]>([]);
  const [fetchingOnline, setFetchingOnline] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Photo edit
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Editing case note modal
  const [editingCaseNote, setEditingCaseNote] = useState<{ id: string; note: string } | null>(null);

  // eCourts Docket Importer Modal State
  const [showECourtsModal, setShowECourtsModal] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState<'cnr' | 'case_details' | 'advocate' | 'manual'>('cnr');
  
  // Tab 1: CNR Search
  const [cnrInput, setCnrInput] = useState('');
  const [cnrSearchResult, setCnrSearchResult] = useState<PublicCourtCase | null>(null);
  const [cnrSearchError, setCnrSearchError] = useState<string | null>(null);
  const [isSearchingCNR, setIsSearchingCNR] = useState(false);

  // Tab 2: Case Details Search
  const [courtQuery, setCourtQuery] = useState('Delhi High Court');
  const [caseTypeQuery, setCaseTypeQuery] = useState('W.P.(C)');
  const [caseNumberQuery, setCaseNumberQuery] = useState('');
  const [yearQuery, setYearQuery] = useState(new Date().getFullYear().toString());
  const [caseDetailsResults, setCaseDetailsResults] = useState<PublicCourtCase[]>([]);
  const [caseDetailsSearched, setCaseDetailsSearched] = useState(false);

  // Tab 3: Advocate Search
  const [advocateSearchName, setAdvocateSearchName] = useState(profile?.name || '');
  const [advocateSearchBarId, setAdvocateSearchBarId] = useState(profile?.barCouncilId || '');
  const [advocateSearchResults, setAdvocateSearchResults] = useState<PublicCourtCase[]>([]);
  const [advocateSearchDone, setAdvocateSearchDone] = useState(false);

  // Tab 4: Manual Entry
  const [manualCnr, setManualCnr] = useState('');
  const [manualCourt, setManualCourt] = useState('Delhi High Court');
  const [manualCaseNo, setManualCaseNo] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualStage, setManualStage] = useState('Final Arguments');
  const [manualOutcome, setManualOutcome] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Resubmission form state
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitBarId, setResubmitBarId] = useState(profile?.barCouncilId || '');
  const [resubmitGovId, setResubmitGovId] = useState('');
  const [resubmitDocPhoto, setResubmitDocPhoto] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [previewDocModal, setPreviewDocModal] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.publicCases) {
      setPublicCases(profile.publicCases);
    }
    if (profile?.name) setAdvocateSearchName(profile.name);
    if (profile?.barCouncilId) setAdvocateSearchBarId(profile.barCouncilId);
  }, [profile]);

  if (!isOpen) return null;

  const status: VerificationStatus = profile?.verificationStatus || 'not_submitted';
  const isVerified = status === 'verified';
  const isAdmin = false;

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      const dataUrl = await compressImageFile(file);
      setResubmitDocPhoto(dataUrl);
    } catch (err) {
      console.warn("Failed to compress document image:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSavePhoto = async (newUrl: string) => {
    setIsEditingPhoto(false);
    if (user?.uid) {
      await updateUserProfile(user.uid, { photoURL: newUrl });
      updateProfile({ photoURL: newUrl });
      setToastMessage(language === 'hi' ? 'प्रोफ़ाइल फ़ोटो अपडेट किया गया!' : 'Profile picture updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // eCourts CNR Search Handler
  const handleSearchCNR = () => {
    setCnrSearchError(null);
    setCnrSearchResult(null);
    if (!cnrInput.trim()) {
      setCnrSearchError('Please enter a 16-character CNR number.');
      return;
    }
    setIsSearchingCNR(true);
    try {
      const res = lookupECourtsByCNR(cnrInput);
      if (res.success && res.data) {
        setCnrSearchResult(res.data);
      } else {
        setCnrSearchError(res.error || 'Could not validate or find docket for this CNR.');
      }
    } catch (err: any) {
      setCnrSearchError(err?.message || 'Error parsing CNR.');
    } finally {
      setIsSearchingCNR(false);
    }
  };

  // eCourts Case Details Search Handler
  const handleSearchCaseDetails = () => {
    setCaseDetailsSearched(true);
    const results = searchECourtsByCaseDetails({
      court: courtQuery,
      caseType: caseTypeQuery,
      caseNumber: caseNumberQuery,
      year: parseInt(yearQuery) || undefined,
    });
    setCaseDetailsResults(results);
  };

  // eCourts Advocate Search Handler
  const handleSearchAdvocate = () => {
    setAdvocateSearchDone(true);
    const results = searchECourtsByAdvocate(advocateSearchBarId, advocateSearchName);
    setAdvocateSearchResults(results);
  };

  // Import single case into user's profile
  const handleImportSingleCase = async (caseToImport: PublicCourtCase) => {
    if (!user?.uid) return;
    try {
      const updated = await addPublicCourtCase(user.uid, publicCases, caseToImport);
      setPublicCases(updated);
      updateProfile({ publicCases: updated });
      setToastMessage('Court docket imported into your profile successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.warn("Failed to import court case:", err);
    }
  };

  // Manual Docket Submission
  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCaseNo.trim() || !manualTitle.trim()) {
      setToastMessage('Please enter Case Number and Title.');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const cleanCnr = manualCnr.trim().toUpperCase();
    const cnrParsed = cleanCnr ? parseAndValidateCNR(cleanCnr) : null;
    const yearCurrent = new Date().getFullYear();

    const newCase: PublicCourtCase = {
      id: cleanCnr ? `ecourt-${cleanCnr}` : `custom-docket-${Date.now()}`,
      cnrNumber: cleanCnr || undefined,
      caseNumber: manualCaseNo.trim(),
      title: manualTitle.trim(),
      court: manualCourt,
      year: parseInt(yearQuery) || yearCurrent,
      stage: manualStage || 'Ongoing',
      judgmentOutcome: manualOutcome || undefined,
      showOnProfile: true,
      sourceType: cleanCnr ? 'ecourts_public' : 'self_reported',
      sourceCitation: cleanCnr
        ? `eCourts Services CIS - ${manualCourt}`
        : `Advocate Verified Case Record (${manualCourt})`,
      ecourtsUrl: cleanCnr
        ? (cnrParsed?.officialUrl || `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&cnr_no=${cleanCnr}`)
        : undefined,
      advocateNotes: manualNotes || undefined,
    };

    await handleImportSingleCase(newCase);
    setManualCnr('');
    setManualCaseNo('');
    setManualTitle('');
    setManualOutcome('');
    setManualNotes('');
    setShowECourtsModal(false);
  };

  // Delete case from profile
  const handleDeleteCase = async (caseId: string) => {
    if (!user?.uid) return;
    try {
      const updated = await deletePublicCourtCase(user.uid, publicCases, caseId);
      setPublicCases(updated);
      updateProfile({ publicCases: updated });
      setToastMessage('Case removed from your profile.');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.warn("Failed to delete case:", err);
    }
  };

  // Toggle case visibility on profile
  const handleToggleVisibility = async (caseId: string, currentShow: boolean) => {
    const updated = publicCases.map(c => c.id === caseId ? { ...c, showOnProfile: !currentShow } : c);
    setPublicCases(updated);

    if (user?.uid) {
      try {
        await syncLawyerPublicCases(user.uid, updated);
        updateProfile({ publicCases: updated });
      } catch (err) {
        console.warn("Failed to update case visibility:", err);
      }
    }
  };

  // Save customized advocate notes on imported case
  const handleSaveCaseNote = async () => {
    if (!editingCaseNote || !user?.uid) return;
    const updated = await updateAdvocateCaseNotes(user.uid, publicCases, editingCaseNote.id, editingCaseNote.note);
    setPublicCases(updated);
    updateProfile({ publicCases: updated });
    setEditingCaseNote(null);
    setToastMessage('Advocate case observation saved!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Resubmit advocate verification
  const handleResubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resubmitBarId.trim()) return;

    try {
      const chosenPhoto = resubmitDocPhoto || profile?.idDocumentUrl || undefined;
      await submitVerificationRequest({
        uid: user.uid,
        role: 'lawyer',
        name: profile?.name || 'Advocate',
        email: user.email || '',
        phone: profile?.phone || '',
        documentType: 'Bar Council ID Card & Govt ID',
        documentUrl: chosenPhoto,
        barCouncilId: resubmitBarId,
        maskedIdNumber: resubmitGovId ? `XXXX-XXXX-${resubmitGovId.slice(-4)}` : undefined,
      });

      updateProfile({
        verificationStatus: 'pending',
        barCouncilId: resubmitBarId,
        idDocumentUrl: chosenPhoto,
        rejectionReason: '',
      });

      setIsResubmitting(false);
      setResubmitDocPhoto('');
      setToastMessage('Advocate credentials resubmitted for admin review!');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.warn("Resubmission error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 bg-[#111216] border border-white/[0.1] max-h-[92vh] overflow-y-auto">
        {/* Toast */}
        {toastMessage && (
          <div className="sticky top-0 z-30 bg-neutral-900/95 text-white border border-emerald-500/40 px-3.5 py-2 rounded-xl shadow-xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={profile?.photoURL || ADVOCATE_AVATARS[0]}
                alt={profile?.name || 'Advocate'}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/40 shadow-lg"
              />
              <button
                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center border border-black shadow ios-press"
                title="Update Profile Photo"
              >
                <Camera size={11} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {profile?.name || t.advocateTitle}
                </h3>
                {isVerified ? (
                  <ShieldCheck size={16} className="text-emerald-400" />
                ) : (
                  <Clock size={15} className="text-amber-400" />
                )}
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                {profile?.barCouncilId ? `Bar Council ID: ${profile.barCouncilId}` : 'Bar Council Enrollment: Pending Submission'}
              </p>

              {/* Status Seal */}
              <div className="mt-1">
                {status === 'verified' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck size={10} />
                    <span>Verified Lawyer</span>
                  </span>
                )}
                {status === 'pending' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Clock size={10} />
                    <span>Verification Pending</span>
                  </span>
                )}
                {status === 'resubmission_required' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    <AlertTriangle size={10} />
                    <span>Resubmission Required</span>
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <XCircle size={10} />
                    <span>Application Rejected</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white ios-press"
          >
            <X size={15} />
          </button>
        </div>

        {/* Directory Visibility Notice for Unverified Advocates */}
        {!isVerified && (
          <div className="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Lock size={13} className="text-amber-400" />
              <span>Directory Visibility: Hidden</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Your profile is currently under credential review. You can manage your practice and cases freely, but your public profile will remain hidden in the directory until approved.
            </p>
          </div>
        )}

        {/* Uploaded Bar Council Card / Document Photo Preview if available */}
        {profile?.idDocumentUrl && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <img
                src={profile.idDocumentUrl}
                alt="Bar Council ID Document"
                className="w-12 h-9 rounded-lg object-cover border border-white/15"
              />
              <div>
                <p className="text-[11px] font-medium text-white">Bar Council ID Card Photo</p>
                <p className="text-[10px] text-amber-400 font-mono">Attached to credentials</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewDocModal(profile.idDocumentUrl || null)}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 text-[11px] flex items-center gap-1 ios-press"
            >
              <Maximize2 size={11} />
              <span>View</span>
            </button>
          </div>
        )}

        {/* Photo Selection Drawer */}
        {isEditingPhoto && (
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 space-y-2 animate-in fade-in">
            <p className="text-xs font-semibold text-white">Choose Professional Profile Photo</p>
            <div className="flex items-center gap-2">
              {ADVOCATE_AVATARS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleSavePhoto(url)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition ios-press ${
                    profile?.photoURL === url ? 'border-amber-400 scale-105' : 'border-white/20 opacity-70'
                  }`}
                >
                  <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customPhotoInput}
                onChange={e => setCustomPhotoInput(e.target.value)}
                placeholder="Or paste headshot image URL"
                className="flex-1 bg-neutral-900 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-neutral-500 outline-none border border-white/10"
              />
              <button
                onClick={() => customPhotoInput.trim() && handleSavePhoto(customPhotoInput.trim())}
                disabled={!customPhotoInput.trim()}
                className="px-2.5 py-1.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Resubmission Prompt if rejected or resubmit requested */}
        {(status === 'resubmission_required' || status === 'rejected') && (
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
            <div className="flex items-center gap-2 text-orange-300 text-xs font-bold">
              <AlertTriangle size={14} />
              <span>Action Required on Credentials</span>
            </div>
            <p className="text-xs text-neutral-300">
              {profile?.rejectionReason || 'Please resubmit verified Bar Council credentials.'}
            </p>
            <button
              onClick={() => setIsResubmitting(!isResubmitting)}
              className="px-3 py-1.5 rounded-xl bg-orange-400 text-black font-bold text-xs ios-press"
            >
              {isResubmitting ? 'Cancel' : 'Resubmit Bar Council & Govt ID'}
            </button>
          </div>
        )}

        {/* Resubmission Form */}
        {isResubmitting && (
          <form onSubmit={handleResubmitVerification} className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-white">Resubmit Advocate Credentials</h4>
            <div>
              <label className="text-white/60 text-[11px] block mb-1">Bar Council Enrollment Number</label>
              <input
                type="text"
                value={resubmitBarId}
                onChange={e => setResubmitBarId(e.target.value)}
                placeholder="e.g. DL/1482/2015"
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="text-white/60 text-[11px] block mb-1">Government ID Number (Aadhaar / Voter / DL)</label>
              <input
                type="text"
                value={resubmitGovId}
                onChange={e => setResubmitGovId(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* Bar Council Card Photo Upload */}
            <div className="space-y-1.5">
              <label className="text-white/60 text-[11px] block">
                Bar Council ID Card / Certificate Photo (Optional)
              </label>
              {resubmitDocPhoto ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <img src={resubmitDocPhoto} alt="Uploaded Doc" className="w-10 h-8 rounded object-cover" />
                    <span className="text-[11px] text-amber-400 font-medium">Card photo selected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResubmitDocPhoto('')}
                    className="p-1 rounded-lg text-neutral-400 hover:text-rose-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocFileChange}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                  <Upload size={15} className={`text-amber-400 ${uploadingDoc ? 'animate-bounce' : ''}`} />
                  <span className="text-[11px] text-neutral-300">
                    {uploadingDoc ? 'Processing...' : 'Upload Bar Council ID Photo'}
                  </span>
                </label>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-400 text-black text-xs font-bold rounded-xl ios-press"
            >
              Submit for Admin Review
            </button>
          </form>
        )}

        {/* Credential Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">{t.yearsOfExperience}</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {profile?.experience !== undefined ? `${profile.experience} Years` : 'Not specified'}
            </span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Location / Jurisdiction</span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block flex items-center gap-1">
              <MapPin size={12} />
              {profile?.city ? `${profile.city}, ${profile.state || ''}` : (profile?.state || 'Not specified')}
            </span>
          </div>
        </div>

        {/* Education Section */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-neutral-500" />
            <span>Education & Qualifications</span>
          </h4>
          <div className="space-y-1">
            {(profile?.education && profile.education.length > 0) ? (
              profile.education.map((edu, idx) => (
                <p key={idx} className="text-xs text-neutral-300 bg-black/40 p-2 rounded-xl border border-white/[0.04]">
                  🎓 {edu}
                </p>
              ))
            ) : (
              <p className="text-xs text-neutral-400 bg-black/40 p-2 rounded-xl border border-white/[0.04] italic">
                LL.B. (Credentials pending verification)
              </p>
            )}
          </div>
        </div>

        {/* Practice Courts */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building size={13} className="text-neutral-500" />
            <span>{t.practiceCourts}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.practiceCourts && profile.practiceCourts.length > 0) ? (
              profile.practiceCourts.map((c, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.03] text-neutral-300 border border-white/[0.06]">
                  {c}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-neutral-400 italic">Courts not specified</span>
            )}
          </div>
        </div>

        {/* Practice Areas */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen size={13} className="text-neutral-500" />
            <span>{t.practiceAreas}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.practiceAreas && profile.practiceAreas.length > 0) ? (
              profile.practiceAreas.map((s, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.03] text-neutral-300 border border-white/[0.06]">
                  {s}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-neutral-400 italic">General Practice</span>
            )}
          </div>
        </div>

        {/* ─── eCourts Public Case Dockets with Provenance & Notes ──────────────── */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gavel size={14} className="text-amber-300" />
                <span>Public Case Dockets (eCourts CIS)</span>
              </h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Authentic court records. Linked with 16-character CNR numbers and official eCourts portals.
              </p>
            </div>
            <button
              onClick={() => setShowECourtsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-[11px] font-bold hover:bg-amber-300 ios-press flex-shrink-0 shadow-md"
            >
              <PlusCircle size={13} />
              <span>Import eCourts Docket</span>
            </button>
          </div>

          {/* Cases List */}
          <div className="space-y-2 mt-2">
            {publicCases.length === 0 ? (
              <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-2.5">
                <p className="text-xs text-neutral-300 font-medium">No official court dockets linked yet.</p>
                <p className="text-[10px] text-neutral-500 max-w-sm mx-auto">
                  Import your actual cases using your 16-character CNR number, Case Details, or Bar Council ID. You have complete control over which cases appear on your public profile.
                </p>
                <button
                  onClick={() => setShowECourtsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/25 text-xs font-semibold ios-press"
                >
                  <Search size={12} />
                  <span>Import via eCourts CNR / Case No.</span>
                </button>
              </div>
            ) : (
              publicCases.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-2xl border transition-all text-left space-y-2 ${
                    c.showOnProfile
                      ? 'bg-neutral-900/60 border-white/[0.1]'
                      : 'bg-black/30 border-white/[0.04] opacity-55'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono text-amber-300 font-bold">{c.caseNumber}</span>
                        {/* Official CNR Badge & Link */}
                        {c.cnrNumber && (
                          <a
                            href={c.ecourtsUrl || `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&cnr_no=${c.cnrNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-mono hover:bg-blue-500/25 transition"
                            title="Verify on Official eCourts Services Portal"
                          >
                            <span>CNR: {c.cnrNumber}</span>
                            <ExternalLink size={9} />
                          </a>
                        )}
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 border border-white/10 font-mono">
                          {c.sourceType === 'ecourts_public' ? '🏛️ Official CIS Docket' : '📄 Verified Record'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-white">{c.title}</p>
                      
                      <p className="text-[10px] text-neutral-400">
                        {c.court} • {c.year} • {c.stage}
                        {c.benchJudge && <span className="text-neutral-500"> • Bench: {c.benchJudge}</span>}
                      </p>

                      {(c.petitioner || c.respondent) && (
                        <p className="text-[10px] text-neutral-400 bg-white/[0.02] px-2 py-1 rounded-lg border border-white/[0.04]">
                          <span className="text-neutral-300">{c.petitioner || 'Petitioner'}</span>
                          <span className="text-amber-400/80 mx-1.5 font-bold">vs</span>
                          <span className="text-neutral-300">{c.respondent || 'Respondent'}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingCaseNote({ id: c.id, note: c.advocateNotes || '' })}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-neutral-400 hover:text-white"
                        title="Add/Edit Advocate Observation"
                      >
                        <Edit3 size={12} />
                      </button>

                      <button
                        onClick={() => handleToggleVisibility(c.id, c.showOnProfile)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition ios-press ${
                          c.showOnProfile
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/[0.05] text-neutral-400 border border-white/10'
                        }`}
                        title={c.showOnProfile ? 'Visible on profile' : 'Hidden from profile'}
                      >
                        {c.showOnProfile ? <Eye size={11} /> : <EyeOff size={11} />}
                        <span>{c.showOnProfile ? 'Shown' : 'Hidden'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCase(c.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                        title="Delete from profile"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Outcome */}
                  {c.judgmentOutcome && (
                    <p className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      ⚖️ Order: {c.judgmentOutcome}
                    </p>
                  )}

                  {/* Custom Advocate Notes */}
                  {c.advocateNotes && (
                    <div className="text-[10px] text-neutral-300 bg-black/40 p-2 rounded-xl border border-white/[0.04]">
                      <span className="text-neutral-500 font-semibold uppercase text-[9px] block">Advocate Strategy & Observations:</span>
                      {c.advocateNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Case Note Modal */}
        {editingCaseNote && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-950 border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Edit3 size={14} className="text-amber-300" />
                <span>Advocate Case Observations</span>
              </h4>
              <p className="text-[11px] text-neutral-400">
                Add your legal commentary or strategy summary. This is labeled separately from the official docket record.
              </p>
              <textarea
                value={editingCaseNote.note}
                onChange={e => setEditingCaseNote(prev => prev ? { ...prev, note: e.target.value } : null)}
                rows={3}
                placeholder="e.g. Lead counsel; argued interpretation of Section 138 proviso."
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCaseNote(null)}
                  className="flex-1 py-2 rounded-xl bg-white/[0.08] text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCaseNote}
                  className="flex-1 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Admin Dashboard Shortcut */}
        {isAdmin && onOpenAdminDashboard && (
          <div className="pt-2 border-t border-amber-500/20">
            <button
              onClick={() => {
                onClose();
                onOpenAdminDashboard();
              }}
              className="w-full py-2.5 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 ios-press transition"
            >
              <ShieldAlert size={14} />
              <span>Open Admin Verification Console</span>
            </button>
          </div>
        )}

        {/* Regulatory disclaimer */}
        <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06] text-[10px] text-neutral-500 leading-relaxed italic">
          {t.bciComplianceNote}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 ios-press flex items-center gap-1.5"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 ios-press shadow-md"
          >
            {t.close}
          </button>
        </div>

        {/* eCourts Case Information System (CIS) Importer Modal */}
        {showECourtsModal && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
            <div className="max-w-2xl w-full bg-neutral-950 border border-white/20 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      <Gavel size={16} />
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      eCourts Case Information System (CIS)
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      National Judicial Data Grid
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Import authentic, verified court records directly into your advocate profile using your 16-character CNR number or case registry details.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowECourtsModal(false);
                    setCnrSearchResult(null);
                    setCnrSearchError(null);
                  }}
                  className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/[0.06] overflow-x-auto text-xs scrollbar-none">
                <button
                  onClick={() => setActiveSearchTab('cnr')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeSearchTab === 'cnr'
                      ? 'bg-amber-400 text-black font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Search size={12} />
                  <span>16-Digit CNR Search</span>
                </button>
                <button
                  onClick={() => setActiveSearchTab('case_details')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeSearchTab === 'case_details'
                      ? 'bg-amber-400 text-black font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Building size={12} />
                  <span>Case Type & No.</span>
                </button>
                <button
                  onClick={() => setActiveSearchTab('advocate')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeSearchTab === 'advocate'
                      ? 'bg-amber-400 text-black font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Scale size={12} />
                  <span>By Advocate / Bar ID</span>
                </button>
                <button
                  onClick={() => setActiveSearchTab('manual')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeSearchTab === 'manual'
                      ? 'bg-amber-400 text-black font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <PlusCircle size={12} />
                  <span>Custom Docket</span>
                </button>
              </div>

              {/* TAB 1: 16-Digit CNR Search */}
              {activeSearchTab === 'cnr' && (
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <label className="block text-xs font-semibold text-neutral-200">
                      Enter 16-Character CNR Number (Case Natural Record)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cnrInput}
                        onChange={(e) => setCnrInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        maxLength={16}
                        placeholder="e.g. DLHC010049202022"
                        className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono tracking-wider text-white placeholder-neutral-500 uppercase outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={handleSearchCNR}
                        disabled={isSearchingCNR}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl ios-press flex items-center gap-1.5 shadow"
                      >
                        <Search size={13} />
                        <span>{isSearchingCNR ? 'Verifying...' : 'Search CNR'}</span>
                      </button>
                    </div>

                    {/* CNR Format Guide */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-neutral-400 gap-1.5 pt-1">
                      <span>Format: [2-State][2-Dist][2-Court][6-CaseNo][4-Year]</span>
                      <a
                        href="https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        <span>Find your CNR on services.ecourts.gov.in</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  {/* CNR Error Message */}
                  {cnrSearchError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <span>{cnrSearchError}</span>
                    </div>
                  )}

                  {/* CNR Search Result Card */}
                  {cnrSearchResult && (
                    <div className="bg-neutral-900/80 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {cnrSearchResult.caseNumber}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              CNR: {cnrSearchResult.cnrNumber}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white">{cnrSearchResult.title}</h4>
                          <p className="text-[11px] text-neutral-400">
                            {cnrSearchResult.court} • Filing Year: {cnrSearchResult.year} • Stage: {cnrSearchResult.stage}
                          </p>
                          {cnrSearchResult.benchJudge && (
                            <p className="text-[10px] text-neutral-400">
                              Bench: <span className="text-neutral-200">{cnrSearchResult.benchJudge}</span>
                            </p>
                          )}
                          {(cnrSearchResult.petitioner || cnrSearchResult.respondent) && (
                            <p className="text-[10px] text-neutral-400 bg-black/40 p-2 rounded-xl border border-white/[0.04]">
                              <span className="text-neutral-200">{cnrSearchResult.petitioner}</span>
                              <span className="text-amber-400 mx-1.5 font-bold">vs</span>
                              <span className="text-neutral-200">{cnrSearchResult.respondent}</span>
                            </p>
                          )}
                          {cnrSearchResult.judgmentOutcome && (
                            <p className="text-[10px] text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                              ⚖️ Outcome: {cnrSearchResult.judgmentOutcome}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                        {cnrSearchResult.ecourtsUrl && (
                          <a
                            href={cnrSearchResult.ecourtsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
                          >
                            <span>Verify on Official Court Portal</span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            handleImportSingleCase(cnrSearchResult);
                            setShowECourtsModal(false);
                            setCnrSearchResult(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold ios-press flex items-center gap-1.5 shadow"
                        >
                          <Check size={13} />
                          <span>Import to My Profile</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sample CNR helper for quick testing */}
                  <div className="text-[11px] text-neutral-400 bg-black/30 p-3 rounded-2xl border border-white/[0.04] space-y-1.5">
                    <span className="font-semibold text-neutral-300 block">Try testing with authentic High Court CNR numbers:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['DLHC010049202022', 'DLHC010015322023', 'MHBJ010061202022', 'KAHC010078922023', 'SCIN010010922023'].map(sample => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setCnrInput(sample);
                            const res = lookupECourtsByCNR(sample);
                            if (res.success && res.data) setCnrSearchResult(res.data);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-amber-300 font-mono text-[10px] border border-white/10"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Case Details Search */}
              {activeSearchTab === 'case_details' && (
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                          Court Establishment
                        </label>
                        <select
                          value={courtQuery}
                          onChange={(e) => setCourtQuery(e.target.value)}
                          className="w-full bg-[#18181b] text-white border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400"
                        >
                          <option value="Delhi High Court">Delhi High Court</option>
                          <option value="Bombay High Court">Bombay High Court</option>
                          <option value="Karnataka High Court">Karnataka High Court</option>
                          <option value="Allahabad High Court">Allahabad High Court</option>
                          <option value="Supreme Court of India">Supreme Court of India</option>
                          <option value="Saket District Court">Saket District Court</option>
                          <option value="Patiala House District Court">Patiala House District Court</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                          Case Type
                        </label>
                        <select
                          value={caseTypeQuery}
                          onChange={(e) => setCaseTypeQuery(e.target.value)}
                          className="w-full bg-[#18181b] text-white border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400"
                        >
                          <option value="W.P.(C)">W.P.(C) - Writ Petition Civil</option>
                          <option value="CRL.M.C.">CRL.M.C. - Criminal Main Case</option>
                          <option value="CS(COMM)">CS(COMM) - Commercial Civil Suit</option>
                          <option value="ARB.P.">ARB.P. - Arbitration Petition</option>
                          <option value="W.P.">W.P. - Writ Petition</option>
                          <option value="COMSS">COMSS - Commercial Summary Suit</option>
                          <option value="CS SCJ">CS SCJ - Civil Suit Senior Judge</option>
                          <option value="CC NI Act">CC NI Act - Sec 138 Negotiable Instruments</option>
                          <option value="SLP(C)">SLP(C) - Special Leave Petition</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                          Case Number
                        </label>
                        <input
                          type="text"
                          value={caseNumberQuery}
                          onChange={(e) => setCaseNumberQuery(e.target.value)}
                          placeholder="e.g. 4920 or leave blank for all"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                          Filing Year
                        </label>
                        <input
                          type="number"
                          value={yearQuery}
                          onChange={(e) => setYearQuery(e.target.value)}
                          placeholder="e.g. 2022"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSearchCaseDetails}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl ios-press flex items-center justify-center gap-1.5 shadow"
                    >
                      <Search size={13} />
                      <span>Search Judicial Registry</span>
                    </button>
                  </div>

                  {/* Results List */}
                  {caseDetailsSearched && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                        <span>Found {caseDetailsResults.length} matching docket(s)</span>
                      </div>

                      {caseDetailsResults.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-1.5">
                          <p className="text-xs text-neutral-400">No matching indexed cases found for this specific query.</p>
                          <p className="text-[11px] text-neutral-500">
                            Try searching by 16-character CNR number or add your case under the Custom Docket tab.
                          </p>
                        </div>
                      ) : (
                        caseDetailsResults.map((c) => (
                          <div
                            key={c.id}
                            className="bg-neutral-900/60 border border-white/[0.08] rounded-2xl p-3.5 space-y-2 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-amber-300">{c.caseNumber}</span>
                                  {c.cnrNumber && (
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                      CNR: {c.cnrNumber}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-white">{c.title}</p>
                                <p className="text-[10px] text-neutral-400">{c.court} • {c.year} • {c.stage}</p>
                                {c.judgmentOutcome && (
                                  <p className="text-[10px] text-emerald-400">⚖️ {c.judgmentOutcome}</p>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  handleImportSingleCase(c);
                                  setShowECourtsModal(false);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold ios-press flex-shrink-0"
                              >
                                + Import
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Advocate Search */}
              {activeSearchTab === 'advocate' && (
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                          Advocate Full Name
                        </label>
                        <input
                          type="text"
                          value={advocateSearchName}
                          onChange={(e) => setAdvocateSearchName(e.target.value)}
                          placeholder="e.g. Adv. Pradeep Sharma"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                          Bar Council Enrollment ID
                        </label>
                        <input
                          type="text"
                          value={advocateSearchBarId}
                          onChange={(e) => setAdvocateSearchBarId(e.target.value)}
                          placeholder="e.g. DL/1482/2015"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSearchAdvocate}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl ios-press flex items-center justify-center gap-1.5 shadow"
                    >
                      <Search size={13} />
                      <span>Search Indexed Advocate Records</span>
                    </button>
                  </div>

                  {advocateSearchDone && (
                    <div className="space-y-2">
                      {advocateSearchResults.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-2">
                          <p className="text-xs text-neutral-300 font-medium">
                            No indexed court appearances found for "{advocateSearchName || advocateSearchBarId}".
                          </p>
                          <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                            Due to court captcha security on services.ecourts.gov.in, you can import your active dockets instantly by entering the 16-character CNR number on the first tab.
                          </p>
                          <button
                            onClick={() => setActiveSearchTab('cnr')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold"
                          >
                            Switch to 16-Digit CNR Search
                          </button>
                        </div>
                      ) : (
                        advocateSearchResults.map((c) => (
                          <div
                            key={c.id}
                            className="bg-neutral-900/60 border border-white/[0.08] rounded-2xl p-3.5 space-y-2 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-mono font-bold text-amber-300">{c.caseNumber}</span>
                                <p className="text-xs font-semibold text-white">{c.title}</p>
                                <p className="text-[10px] text-neutral-400">{c.court} • {c.stage}</p>
                              </div>
                              <button
                                onClick={() => {
                                  handleImportSingleCase(c);
                                  setShowECourtsModal(false);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
                              >
                                + Import
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Custom Docket Entry */}
              {activeSearchTab === 'manual' && (
                <form onSubmit={handleManualImport} className="space-y-3">
                  <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <p className="text-[11px] text-neutral-400">
                      For ongoing matters, appeals, or tribunals (e.g. NCLT, NCDRC, DRT) where central CIS auto-indexing is not yet available:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          16-Digit CNR Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={manualCnr}
                          onChange={(e) => setManualCnr(e.target.value.toUpperCase())}
                          placeholder="e.g. DLHC010049202022"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Court / Forum *
                        </label>
                        <input
                          type="text"
                          value={manualCourt}
                          onChange={(e) => setManualCourt(e.target.value)}
                          placeholder="e.g. Delhi High Court / NCLT New Delhi"
                          required
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Case Number *
                        </label>
                        <input
                          type="text"
                          value={manualCaseNo}
                          onChange={(e) => setManualCaseNo(e.target.value)}
                          placeholder="e.g. W.P.(C) 3214/2023"
                          required
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Case Title / Cause Title *
                        </label>
                        <input
                          type="text"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="e.g. XYZ Corp v. State of Delhi"
                          required
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Stage
                        </label>
                        <input
                          type="text"
                          value={manualStage}
                          onChange={(e) => setManualStage(e.target.value)}
                          placeholder="e.g. Final Arguments / Evidence"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                          Order / Outcome (Optional)
                        </label>
                        <input
                          type="text"
                          value={manualOutcome}
                          onChange={(e) => setManualOutcome(e.target.value)}
                          placeholder="e.g. Interim Injunction Granted"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                        Advocate Strategy & Observations (Optional)
                      </label>
                      <textarea
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        rows={2}
                        placeholder="Brief summary of your appearance, argument or relief secured."
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowECourtsModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-xs font-semibold text-neutral-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold ios-press shadow"
                    >
                      Save Docket to Profile
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Document Photo Full Preview Modal */}
        {previewDocModal && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-md w-full bg-neutral-900 border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Bar Council Document Preview</span>
                <button
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-hidden rounded-xl border border-white/10 flex items-center justify-center bg-black">
                <img src={previewDocModal} alt="Document" className="w-full h-auto object-contain max-h-[58vh]" />
              </div>
              <p className="text-[10px] text-neutral-400 text-center font-mono">
                Official Advocate Credential Document (Confidential Review)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
