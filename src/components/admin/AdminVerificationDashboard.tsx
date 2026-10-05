import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  User,
  Scale,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  History,
  FileText,
  Lock,
  ExternalLink,
  Maximize2,
  Eye,
  Trash2,
  Star,
  MessageSquare,
  Bug,
  Search,
  Download,
  Check,
} from 'lucide-react';
import {
  getAllVerificationRequests,
  processVerificationRequest,
  purgeAllCitizenData,
  subscribeToCitizenFeedback,
  updateCitizenFeedbackStatus,
} from '../../services/firestoreService';
import { generateAdminEmailContent } from '../../utils/masking';
import { VerificationRequest, VerificationStatus, Language, CitizenFeedback } from '../../types';
import { auth } from '../../lib/firebase';

interface AdminVerificationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AdminVerificationDashboard: React.FC<AdminVerificationDashboardProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [feedbackList, setFeedbackList] = useState<CitizenFeedback[]>([]);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<'all' | 'bug_report' | 'feedback' | 'has_image' | 'new'>('all');
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [selectedFeedbackImageModal, setSelectedFeedbackImageModal] = useState<{ url: string; title: string; submitter: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'lawyer' | 'client' | 'history' | 'feedback'>('pending');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDocPhotoForModal, setSelectedDocPhotoForModal] = useState<{ url: string; title: string } | null>(null);

  // Reason modal for rejection or resubmission
  const [activeReasonModal, setActiveReasonModal] = useState<{
    request: VerificationRequest;
    action: 'reject' | 'resubmit';
  } | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [isPurgingCitizens, setIsPurgingCitizens] = useState(false);

  const handlePurgeCitizens = async () => {
    const confirm = window.confirm("⚠️ ARE YOU SURE? This will permanently delete ALL citizen (client) accounts and their verification requests from Firebase Firestore.\n\nAdvocate accounts will remain safe. Proceed?");
    if (!confirm) return;

    setIsPurgingCitizens(true);
    try {
      const res = await purgeAllCitizenData();
      setToastMessage(`✅ Successfully purged ${res.deletedCount} citizen profile(s) from Firebase.`);
      loadRequests();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert("Error purging citizen data: " + (err.message || err));
    } finally {
      setIsPurgingCitizens(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const live = await getAllVerificationRequests();
      setRequests(live);
    } catch (err) {
      console.warn("Failed to load admin verification requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
      const unsub = subscribeToCitizenFeedback((list) => {
        setFeedbackList(list);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (req: VerificationRequest) => {
    try {
      await processVerificationRequest(req.id, req.uid, 'verified', 'Identity and credentials verified by admin', auth.currentUser?.email || 'admin@nyaayneeti.in');
      setToastMessage(`Approved ${req.name} (${req.role})! Profile verified.`);
      loadRequests();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.warn("Approval error:", err);
    }
  };

  const handleConfirmReasonAction = async () => {
    if (!activeReasonModal) return;
    const { request, action } = activeReasonModal;
    const status: VerificationStatus = action === 'resubmit' ? 'resubmission_required' : 'rejected';
    const reason = reasonInput.trim() || (action === 'resubmit' ? 'Please provide a clearer copy of your document.' : 'Identity credentials could not be verified.');

    try {
      await processVerificationRequest(request.id, request.uid, status, reason, auth.currentUser?.email || 'admin@nyaayneeti.in');
      setActiveReasonModal(null);
      setReasonInput('');
      setToastMessage(`Marked ${request.name} as ${status}!`);
      loadRequests();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.warn("Reason action error:", err);
    }
  };

  const handleOpenEmailClient = (req: VerificationRequest) => {
    const { subject, body } = generateAdminEmailContent({
      applicantName: req.name,
      role: req.role,
      documentType: req.documentType,
      maskedIdNumber: req.maskedIdNumber,
      barCouncilId: req.barCouncilId,
      requestId: req.id,
    });
    window.open(`mailto:admin@nyaayneeti.in?subject=${subject}&body=${body}`, '_blank');
  };

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'investigating' | 'resolved') => {
    try {
      await updateCitizenFeedbackStatus(id, newStatus);
      setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      setToastMessage(`Feedback status updated to: ${newStatus.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      console.warn("Failed to update feedback status:", err);
      setToastMessage("Failed to update status");
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filterTab === 'pending') return r.status === 'pending';
    if (filterTab === 'lawyer') return r.role === 'lawyer';
    if (filterTab === 'client') return r.role === 'client';
    if (filterTab === 'history') return r.status === 'verified' || r.status === 'rejected' || r.status === 'resubmission_required';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 bg-[#111216] border border-white/[0.12] max-h-[92vh] overflow-y-auto">
        {/* Toast */}
        {toastMessage && (
          <div className="sticky top-0 z-40 bg-neutral-900/95 text-white border border-emerald-500/40 px-3.5 py-2 rounded-xl shadow-xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Admin Verification Console</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                  Administrator
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manual approval queue for Citizen IDs and Advocate Bar Council accreditations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePurgeCitizens}
              disabled={isPurgingCitizens}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center gap-1.5 text-xs font-semibold transition ios-press"
              title="Permanently delete all citizen accounts and reset citizen data"
            >
              <Trash2 size={13} className={isPurgingCitizens ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isPurgingCitizens ? "Purging..." : "Purge Citizens"}</span>
            </button>
            <button
              onClick={loadRequests}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
              title="Refresh Queue"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-white/[0.1] hover:border-red-500/30 flex items-center gap-1.5 text-xs font-bold transition ios-press"
              title="Exit Admin Console and return to Home Screen"
            >
              <X size={15} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/50 border border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
            { id: 'lawyer', label: 'Advocates', count: requests.filter(r => r.role === 'lawyer').length },
            { id: 'client', label: 'Citizens', count: requests.filter(r => r.role === 'client').length },
            { id: 'feedback', label: 'Feedback & Bugs', count: feedbackList.length },
            { id: 'history', label: 'Audit History', count: requests.filter(r => r.status !== 'pending').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition ios-press flex items-center justify-center gap-1.5 whitespace-nowrap ${
                filterTab === tab.id
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Feedback & Bug Reports Tab */}
        {filterTab === 'feedback' ? (
          <div className="space-y-3.5">
            {/* Sub-Filters and Search Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                {[
                  { id: 'all', label: 'All', count: feedbackList.length },
                  { id: 'bug_report', label: '🐞 Bug Reports', count: feedbackList.filter(f => f.type === 'bug_report').length },
                  { id: 'feedback', label: '⭐ Feedback', count: feedbackList.filter(f => f.type !== 'bug_report').length },
                  { id: 'has_image', label: '📎 With Screenshot', count: feedbackList.filter(f => Boolean(f.imageUrl)).length },
                  { id: 'new', label: '⚠️ Action Required', count: feedbackList.filter(f => !f.status || f.status === 'new').length },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setFeedbackCategoryFilter(sub.id as any)}
                    className={`px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${
                      feedbackCategoryFilter === sub.id
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-sm'
                        : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className="ml-1 opacity-70">({sub.count})</span>
                  </button>
                ))}
              </div>

              {/* Real-time Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={feedbackSearchQuery}
                  onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                  placeholder="Search submissions by user, email, subject, or message..."
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            {/* Submissions List */}
            {(() => {
              const filtered = feedbackList.filter((fb) => {
                if (feedbackCategoryFilter === 'bug_report' && fb.type !== 'bug_report') return false;
                if (feedbackCategoryFilter === 'feedback' && fb.type === 'bug_report') return false;
                if (feedbackCategoryFilter === 'has_image' && !fb.imageUrl) return false;
                if (feedbackCategoryFilter === 'new' && fb.status && fb.status !== 'new') return false;

                if (feedbackSearchQuery.trim()) {
                  const q = feedbackSearchQuery.toLowerCase();
                  const matchUser = (fb.userName || '').toLowerCase().includes(q);
                  const matchEmail = (fb.userEmail || '').toLowerCase().includes(q);
                  const matchTitle = (fb.title || '').toLowerCase().includes(q);
                  const matchText = (fb.feedbackText || '').toLowerCase().includes(q);
                  if (!matchUser && !matchEmail && !matchTitle && !matchText) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center space-y-2 bg-black/30 rounded-2xl border border-white/[0.06]">
                    <MessageSquare size={24} className="text-neutral-500 mx-auto" />
                    <p className="text-xs font-semibold text-white">No submissions matching criteria</p>
                    <p className="text-[11px] text-neutral-500">Submissions from citizens & advocates arrive here in real time.</p>
                  </div>
                );
              }

              return filtered.map((fb) => {
                const isBug = fb.type === 'bug_report';
                const formattedTime = fb.submittedAtIST || (fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Recent');
                const status = fb.status || 'new';

                return (
                  <div
                    key={fb.id}
                    className={`p-4 rounded-2xl bg-black/50 border transition space-y-3 text-left ${
                      isBug ? 'border-rose-500/25 hover:border-rose-500/40' : 'border-amber-500/25 hover:border-amber-500/40'
                    }`}
                  >
                    {/* Top Status & Date Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {isBug ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Bug size={11} />
                            <span>BUG REPORT • {(fb.severity || 'moderate').toUpperCase()}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Star size={11} className="fill-amber-400" />
                            <span>APP FEEDBACK • {fb.rating || 5}/5 STARS</span>
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : status === 'investigating'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                        <Clock size={11} />
                        <span>{formattedTime}</span>
                      </div>
                    </div>

                    {/* Title if present */}
                    {fb.title && (
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        {fb.title}
                      </h4>
                    )}

                    {/* What Was Received (Body Text) */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      "{fb.feedbackText}"
                    </div>

                    {/* Attached Screenshot / Image Preview (if present) */}
                    {fb.imageUrl && (
                      <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                        <div
                          onClick={() => setSelectedFeedbackImageModal({
                            url: fb.imageUrl!,
                            title: fb.title || (isBug ? 'Bug Screenshot' : 'Feedback Attachment'),
                            submitter: fb.userName || 'Citizen',
                            date: formattedTime,
                          })}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition group"
                        >
                          <img
                            src={fb.imageUrl}
                            alt="Screenshot"
                            className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition flex items-center gap-1">
                              <span>📎 Attached Screenshot</span>
                              <Maximize2 size={12} className="text-neutral-400" />
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-mono">
                              {fb.imageName || 'screenshot.jpg'} • Tap to enlarge
                            </span>
                          </div>
                        </div>

                        <a
                          href={fb.imageUrl}
                          download={fb.imageName || 'nyaay-screenshot.jpg'}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition"
                          title="Download screenshot"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )}

                    {/* By Whom & Notification Destination */}
                    <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-[11px] border-t border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-neutral-300 font-bold text-[10px]">
                          <User size={12} />
                        </div>
                        <div>
                          <span className="font-semibold text-white mr-1.5">{fb.userName}</span>
                          <span className="text-[10px] text-neutral-400 capitalize font-mono">({fb.userRole || 'citizen'})</span>
                          {fb.userEmail && fb.userEmail !== 'Not provided' && (
                            <a
                              href={`mailto:${fb.userEmail}?subject=Re: [NYAAY ${isBug ? 'Bug Report' : 'Feedback'}] ${encodeURIComponent(fb.title || 'Inquiry')}`}
                              className="ml-2 inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 underline font-mono"
                            >
                              <Mail size={10} />
                              <span>{fb.userEmail}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                        <span>✉️ Target:</span>
                        <span className="font-bold">{fb.targetEmail || 'Pradhumb1998@gmail.com'}</span>
                      </div>
                    </div>

                    {/* Admin Action Controls */}
                    <div className="flex items-center justify-between pt-1 gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Status:</span>
                        {status !== 'investigating' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(fb.id, 'investigating')}
                            className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-semibold transition"
                          >
                            Mark Investigating
                          </button>
                        )}
                        {status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(fb.id, 'resolved')}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {status === 'resolved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(fb.id, 'new')}
                            className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-300 text-[10px] font-semibold transition"
                          >
                            Re-open as New
                          </button>
                        )}
                      </div>

                      {fb.userEmail && fb.userEmail !== 'Not provided' && (
                        <a
                          href={`mailto:${fb.userEmail}?subject=Re: [NYAAY ${isBug ? 'Bug Report' : 'Feedback'}] ${encodeURIComponent(fb.title || 'Inquiry')}`}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <Mail size={12} />
                          <span>Reply to User</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          /* Requests List */
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-7 h-7 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-neutral-500 font-mono">Loading verification requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-black/30 rounded-2xl border border-white/[0.06]">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">No requests in this category</p>
                <p className="text-[11px] text-neutral-500">All submissions are reviewed and up to date.</p>
              </div>
            ) : (
              filteredRequests.map(req => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-black/50 border border-white/[0.08] hover:border-white/20 transition space-y-3 text-left"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-amber-300 flex-shrink-0">
                      {req.role === 'lawyer' ? <Scale size={16} /> : <User size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{req.name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                          req.role === 'lawyer' ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                        }`}>
                          {req.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div>
                    {req.status === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 size={10} />
                        <span>Verified</span>
                      </span>
                    )}
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Clock size={10} />
                        <span>Pending Review</span>
                      </span>
                    )}
                    {req.status === 'resubmission_required' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-bold bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                        <AlertTriangle size={10} />
                        <span>Resubmit Req.</span>
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                        <XCircle size={10} />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata & Masked ID */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase font-semibold">Document</span>
                    <span className="text-white font-medium">{req.documentType}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase font-semibold">ID No. (Masked)</span>
                    <span className="text-emerald-300 font-mono font-bold flex items-center gap-1">
                      <Lock size={10} />
                      {req.maskedIdNumber || 'XXXX-XXXX-XXXX'}
                    </span>
                  </div>
                  {req.barCouncilId && (
                    <div className="col-span-2 pt-1 border-t border-white/[0.04]">
                      <span className="text-neutral-500 block text-[9px] uppercase font-semibold">Bar Council Accreditation</span>
                      <span className="text-amber-300 font-mono font-bold">{req.barCouncilId}</span>
                    </div>
                  )}
                </div>

                {/* Uploaded Document Photo Thumbnail & Inspector */}
                {req.documentUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.documentUrl}
                        alt="Applicant ID Document"
                        className="w-12 h-9 rounded-lg object-cover border border-white/20 shadow"
                      />
                      <div>
                        <p className="text-[11px] font-semibold text-white">ID Document Photo</p>
                        <p className="text-[9px] text-emerald-400 font-mono">Click Inspect to view details</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDocPhotoForModal({
                        url: req.documentUrl!,
                        title: `${req.name} (${req.role}) — ${req.documentType}`
                      })}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold ios-press flex items-center gap-1.5 transition"
                    >
                      <Eye size={12} />
                      <span>Inspect Photo</span>
                    </button>
                  </div>
                )}

                {/* Rejection / Resubmission reason note */}
                {req.rejectionReason && (
                  <p className="text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    Reason: {req.rejectionReason}
                  </p>
                )}

                {/* Audit trail summary */}
                {req.auditTrail && req.auditTrail.length > 0 && (
                  <div className="text-[10px] text-neutral-400 space-y-0.5 border-t border-white/[0.04] pt-1.5">
                    <span className="text-neutral-500 uppercase font-semibold text-[9px]">Decision Audit Trail:</span>
                    {req.auditTrail.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between text-neutral-400 font-mono">
                        <span>{entry.decision} by {entry.adminEmail}</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(req)}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl ios-press flex items-center justify-center gap-1 transition"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => setActiveReasonModal({ request: req, action: 'resubmit' })}
                        className="py-2 px-3 bg-white/[0.08] hover:bg-white/[0.14] text-orange-300 text-xs font-semibold rounded-xl ios-press flex items-center justify-center gap-1 transition"
                      >
                        <AlertTriangle size={13} />
                        <span>Resubmit</span>
                      </button>

                      <button
                        onClick={() => setActiveReasonModal({ request: req, action: 'reject' })}
                        className="py-2 px-3 bg-white/[0.08] hover:bg-white/[0.14] text-rose-300 text-xs font-semibold rounded-xl ios-press flex items-center justify-center gap-1 transition"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleApprove(req)}
                      className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold rounded-xl ios-press"
                    >
                      Re-evaluate
                    </button>
                  )}

                  {/* Dispatch Email Notification */}
                  <button
                    onClick={() => handleOpenEmailClient(req)}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 ios-press"
                    title="Send Email Alert to Administrator"
                  >
                    <Mail size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

        {/* Reason Modal */}
        {activeReasonModal && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-neutral-950 border border-white/[0.12] rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                {activeReasonModal.action === 'resubmit' ? (
                  <AlertTriangle size={15} className="text-orange-400" />
                ) : (
                  <XCircle size={15} className="text-rose-400" />
                )}
                <span>
                  {activeReasonModal.action === 'resubmit'
                    ? 'Request Document Resubmission'
                    : 'Reject Verification Application'}
                </span>
              </h4>

              <p className="text-xs text-neutral-400">
                Provide feedback to {activeReasonModal.request.name}. This will be delivered to their notification feed and profile.
              </p>

              <textarea
                value={reasonInput}
                onChange={e => setReasonInput(e.target.value)}
                placeholder="e.g. Identity document photo is blurry; please re-upload clear image."
                rows={3}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-none resize-none"
              />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActiveReasonModal(null)}
                  className="flex-1 py-2 rounded-xl bg-white/[0.08] text-xs font-semibold text-neutral-300 ios-press"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReasonAction}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-black ios-press ${
                    activeReasonModal.action === 'resubmit' ? 'bg-orange-400 hover:bg-orange-300' : 'bg-rose-500 hover:bg-rose-400'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Photo Full Inspector Modal */}
        {selectedDocPhotoForModal && (
          <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-neutral-950 border border-white/20 rounded-3xl p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-amber-400" />
                  <span className="text-xs font-bold text-white tracking-tight">
                    {selectedDocPhotoForModal.title}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDocPhotoForModal(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-hidden rounded-2xl border border-white/10 flex items-center justify-center bg-black p-2">
                <img
                  src={selectedDocPhotoForModal.url}
                  alt="Document Inspection"
                  className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <span>Verified administrator view</span>
                <button
                  onClick={() => setSelectedDocPhotoForModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs ios-press"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Screenshot Full Lightbox Modal */}
        {selectedFeedbackImageModal && (
          <div className="fixed inset-0 z-70 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-2xl w-full bg-neutral-950 border border-white/20 rounded-3xl p-5 space-y-3 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <Bug size={16} className="text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white tracking-tight truncate">
                      {selectedFeedbackImageModal.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                    Submitted by: <strong className="text-neutral-200">{selectedFeedbackImageModal.submitter}</strong> • {selectedFeedbackImageModal.date}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={selectedFeedbackImageModal.url}
                    download="feedback-screenshot.jpg"
                    className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/20 text-neutral-300 hover:text-white transition"
                    title="Download original screenshot"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    onClick={() => setSelectedFeedbackImageModal(null)}
                    className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-2xl border border-white/10 flex items-center justify-center bg-black/60 p-2 min-h-0">
                <img
                  src={selectedFeedbackImageModal.url}
                  alt="Feedback Screenshot"
                  className="max-w-full max-h-[62vh] object-contain rounded-xl shadow-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <span className="font-mono text-[10px]">Evidence / Bug visual inspection</span>
                <button
                  onClick={() => setSelectedFeedbackImageModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs ios-press hover:bg-neutral-200 transition"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
