import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  User,
  Camera,
  FileText,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  LogOut,
  RefreshCw,
  UploadCloud,
  Lock,
  Upload,
  Trash2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  updateUserProfile,
  submitVerificationRequest
} from '../../services/firestoreService';
import { maskIdNumber } from '../../utils/masking';
import { compressImageFile } from '../../utils/imageUtils';
import { Language, VerificationStatus } from '../../types';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const CITIZEN_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const { user, profile, updateProfile, logout } = useAuth();

  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(profile?.photoURL || CITIZEN_AVATARS[0]);
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Resubmission form state
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [idType, setIdType] = useState<'Aadhaar' | 'Voter ID' | 'Passport' | 'Driving License'>('Aadhaar');
  const [idNumberInput, setIdNumberInput] = useState('');
  const [idDocPhoto, setIdDocPhoto] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [previewDocModal, setPreviewDocModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  const status: VerificationStatus = profile?.verificationStatus || 'not_submitted';

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDoc(true);
      const dataUrl = await compressImageFile(file);
      setIdDocPhoto(dataUrl);
    } catch (err) {
      console.warn("Failed to compress document image:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSavePhoto = async (newUrl: string) => {
    setSelectedPhoto(newUrl);
    setIsEditingPhoto(false);
    if (user?.uid) {
      await updateUserProfile(user.uid, { photoURL: newUrl });
      updateProfile({ photoURL: newUrl });
      setToastMessage(t('Profile picture updated!', 'प्रोफ़ाइल फ़ोटो अपडेट हो गई!'));
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumberInput.trim() || !user) return;

    setLoading(true);
    try {
      const masked = maskIdNumber(idType, idNumberInput);
      const chosenDocPhoto = idDocPhoto || profile?.idDocumentUrl || undefined;

      await submitVerificationRequest({
        uid: user.uid,
        role: 'client',
        name: profile?.name || 'Citizen Client',
        email: user.email || '',
        phone: profile?.phone || '',
        documentType: idType,
        documentUrl: chosenDocPhoto,
        maskedIdNumber: masked,
        govIdType: idType,
      });

      updateProfile({
        verificationStatus: 'pending',
        idDocumentType: idType,
        idDocumentNumberMasked: masked,
        idDocumentUrl: chosenDocPhoto,
        rejectionReason: '',
      });

      setIsResubmitting(false);
      setIdNumberInput('');
      setIdDocPhoto('');
      setToastMessage(t('Verification request submitted for approval!', 'सत्यापन अनुरोध व्यवस्थापक को भेजा गया!'));
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.warn("Resubmission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 bg-[#111216] border border-white/[0.1] max-h-[92vh] overflow-y-auto">
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
                src={profile?.photoURL || selectedPhoto}
                alt={profile?.name || 'Citizen'}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
              />
              <button
                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center border border-black shadow ios-press"
                title="Change Photo"
              >
                <Camera size={11} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {profile?.name || t('Citizen Account', 'नागरिक खाता')}
                </h3>
                {status === 'verified' && <ShieldCheck size={15} className="text-emerald-400" />}
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                {profile?.phone || profile?.email || 'NYAAYNEETI Citizen'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white ios-press"
          >
            <X size={15} />
          </button>
        </div>

        {/* Photo Selection Drawer */}
        {isEditingPhoto && (
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 space-y-2 animate-in fade-in">
            <p className="text-xs font-semibold text-white">{t('Choose Profile Photo', 'प्रोफ़ाइल फ़ोटो चुनें')}</p>
            <div className="flex items-center gap-2">
              {CITIZEN_AVATARS.map((url, i) => (
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
                placeholder="Or paste image URL"
                className="flex-1 bg-neutral-900 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-neutral-500 outline-none border border-white/10"
              />
              <button
                onClick={() => customPhotoInput.trim() && handleSavePhoto(customPhotoInput.trim())}
                disabled={!customPhotoInput.trim()}
                className="px-2.5 py-1.5 bg-white text-black text-xs font-bold rounded-lg disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Verification Status Card */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {t('Identity Verification', 'पहचान सत्यापन स्थिति')}
            </span>

            {/* Status Badges */}
            {status === 'verified' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck size={11} />
                <span>Verified Citizen</span>
              </span>
            )}

            {status === 'pending' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Clock size={11} />
                <span>Verification Pending</span>
              </span>
            )}

            {status === 'resubmission_required' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-bold bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                <AlertTriangle size={11} />
                <span>Resubmission Required</span>
              </span>
            )}

            {status === 'rejected' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                <XCircle size={11} />
                <span>Rejected</span>
              </span>
            )}

            {status === 'not_submitted' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-bold bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
                <span>Not Submitted</span>
              </span>
            )}
          </div>

          {/* Status Explanation */}
          <p className="text-xs text-neutral-300 leading-relaxed">
            {status === 'verified' && t(
              'Your government identity has been verified and authenticated. Your profile proudly carries the verified trust badge.',
              'आपकी पहचान सत्यापित और प्रमाणित है।'
            )}
            {status === 'pending' && t(
              'Your identity verification request is currently under review. You can continue using all services seamlessly.',
              'आपका पहचान सत्यापन अनुरोध समीक्षाधीन है। आप सभी सेवाओं का निर्बाध उपयोग जारी रख सकते हैं।'
            )}
            {status === 'resubmission_required' && t(
              `Administrator requested resubmission: ${profile?.rejectionReason || 'Please provide a clear copy of your government ID.'}`,
              `व्यवस्थापक ने पुनः जमा करने का अनुरोध किया है: ${profile?.rejectionReason || 'कृपया स्पष्ट दस्तावेज़ प्रदान करें।'}`
            )}
            {status === 'rejected' && t(
              `Verification request rejected: ${profile?.rejectionReason || 'Document could not be authenticated.'}`,
              `सत्यापन अनुरोध अस्वीकार किया गया।`
            )}
            {status === 'not_submitted' && t(
              'Submit any valid government ID to receive the verified citizen seal.',
              'सत्यापित सील प्राप्त करने के लिए पहचान दस्तावेज़ जमा करें।'
            )}
          </p>

          {/* Masked ID Record & Document Photo Preview */}
          {profile?.idDocumentNumberMasked && (
            <div className="flex items-center justify-between text-xs bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-neutral-400">{profile.idDocumentType || 'Govt ID'}:</span>
              <span className="text-white font-mono font-bold flex items-center gap-1">
                <Lock size={11} className="text-emerald-400" />
                {profile.idDocumentNumberMasked}
              </span>
            </div>
          )}

          {/* Uploaded ID Photo Preview if available */}
          {profile?.idDocumentUrl && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <img
                  src={profile.idDocumentUrl}
                  alt="Govt ID Document"
                  className="w-12 h-9 rounded-lg object-cover border border-white/15"
                />
                <div>
                  <p className="text-[11px] font-medium text-white">ID Document Photo</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Attached to profile</p>
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

          {/* Resubmit / Upload Action */}
          {status !== 'verified' && (
            <button
              onClick={() => setIsResubmitting(!isResubmitting)}
              className="w-full mt-1 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition ios-press"
            >
              <UploadCloud size={14} />
              <span>{isResubmitting ? t('Cancel Resubmission', 'रद्द करें') : t('Submit / Resubmit ID Document', 'दस्तावेज़ पुनः जमा करें')}</span>
            </button>
          )}
        </div>

        {/* Resubmission Form */}
        {isResubmitting && (
          <form onSubmit={handleResubmit} className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-400" />
              <span>{t('Resubmit Verification Document', 'दस्तावेज़ पुनः जमा करें')}</span>
            </h4>

            {/* Document Type */}
            <div className="grid grid-cols-2 gap-1.5">
              {(['Aadhaar', 'Voter ID', 'Passport', 'Driving License'] as const).map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setIdType(dt)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition border ${
                    idType === dt
                      ? 'bg-white text-black border-white'
                      : 'bg-white/[0.04] text-neutral-300 border-white/[0.08]'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>

            {/* Masked ID Number */}
            <div>
              <label className="text-white/60 text-[11px] block mb-1">
                {idType} Number
              </label>
              <input
                type="text"
                value={idNumberInput}
                onChange={e => setIdNumberInput(e.target.value)}
                placeholder={idType === 'Aadhaar' ? '12-digit Aadhaar' : 'Document ID Number'}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                required
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                🔒 Privacy Protected: Number is stored masked (e.g. XXXX-XXXX-1234) per DPDP Act.
              </p>
            </div>

            {/* Document Photo Upload Field */}
            <div className="space-y-1.5">
              <label className="text-white/60 text-[11px] block">
                {t(`Upload Photo of ${idType} (Optional)`, `${idType} की फ़ोटो अपलोड करें`)}
              </label>
              {idDocPhoto ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <img src={idDocPhoto} alt="Uploaded Doc" className="w-10 h-8 rounded object-cover" />
                    <span className="text-[11px] text-emerald-400 font-medium">{t('Photo selected', 'फ़ोटो चुनी गई')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIdDocPhoto('')}
                    className="p-1 rounded-lg text-neutral-400 hover:text-rose-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-white/15 hover:border-emerald-400/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocFileChange}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                  <Upload size={15} className={`text-emerald-400 ${uploadingDoc ? 'animate-bounce' : ''}`} />
                  <span className="text-[11px] text-neutral-300">
                    {uploadingDoc ? 'Processing...' : 'Upload Document Photo'}
                  </span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !idNumberInput.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 ios-press disabled:opacity-40"
            >
              {loading ? t('Submitting...', 'जमा कर रहे हैं...') : t('Submit for Admin Approval', 'व्यवस्थापक अनुमोदन के लिए भेजें')}
            </button>
          </form>
        )}

        {/* DPDP Compliance Notice */}
        <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06] text-[10px] text-neutral-500 leading-relaxed italic">
          🛡️ Digital Personal Data Protection (DPDP) Act 2023 compliant. Government ID numbers are never displayed in full on public records.
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
            {t('Close', 'बंद करें')}
          </button>
        </div>

        {/* Document Photo Full Preview Modal */}
        {previewDocModal && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-md w-full bg-neutral-900 border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Government ID Document Preview</span>
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
                Stored securely & encrypted. Used only for administrative identity verification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
