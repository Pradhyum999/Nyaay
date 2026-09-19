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
  Eye
} from 'lucide-react';
import {
  getAllVerificationRequests,
  processVerificationRequest
} from '../../services/firestoreService';
import { generateAdminEmailContent } from '../../utils/masking';
import { VerificationRequest, VerificationStatus, Language } from '../../types';

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
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'lawyer' | 'client' | 'history'>('pending');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDocPhotoForModal, setSelectedDocPhotoForModal] = useState<{ url: string; title: string } | null>(null);

  // Reason modal for rejection or resubmission
  const [activeReasonModal, setActiveReasonModal] = useState<{
    request: VerificationRequest;
    action: 'reject' | 'resubmit';
  } | null>(null);
  const [reasonInput, setReasonInput] = useState('');

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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (req: VerificationRequest) => {
    try {
      await processVerificationRequest(req.id, req.uid, 'verified', 'Identity and credentials verified by admin', 'pradhumb1998@gmail.com');
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
      await processVerificationRequest(request.id, request.uid, status, reason, 'pradhumb1998@gmail.com');
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
    window.open(`mailto:pradhumb1998@gmail.com?subject=${subject}&body=${body}`, '_blank');
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
                  pradhumb1998@gmail.com
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manual approval queue for Citizen IDs and Advocate Bar Council accreditations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadRequests}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
              title="Refresh Queue"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white ios-press"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/50 border border-white/[0.08] rounded-2xl">
          {[
            { id: 'pending', label: 'Pending Queue', count: requests.filter(r => r.status === 'pending').length },
            { id: 'lawyer', label: 'Advocates', count: requests.filter(r => r.role === 'lawyer').length },
            { id: 'client', label: 'Citizens', count: requests.filter(r => r.role === 'client').length },
            { id: 'history', label: 'Audit History', count: requests.filter(r => r.status !== 'pending').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition ios-press flex items-center justify-center gap-1.5 ${
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

        {/* Requests List */}
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
                    title="Send Email Alert to pradhumb1998@gmail.com"
                  >
                    <Mail size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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
                <span>Verified administrator view (pradhumb1998@gmail.com)</span>
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
      </div>
    </div>
  );
};
