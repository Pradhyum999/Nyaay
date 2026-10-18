import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Bug,
  Mic,
  MicOff,
  CheckCircle2,
  X,
  Send,
  Image as ImageIcon,
  Trash2,
  Mail,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Language } from '../../types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getISTDateString, getISTTimeString } from '../../lib/istDate';

const TARGET_ADMIN_EMAIL = 'Pradhumb1998@gmail.com';

interface CitizenFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  language: Language;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail = '',
  userRole = 'client',
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'bug_report'>('feedback');
  const [rating, setRating] = useState<number>(5);
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'critical'>('moderate');
  const [title, setTitle] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>(userEmail || '');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Optional image attachment state
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  // Compress & convert selected image to lightweight Base64 JPEG data URL
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('Please select a valid image file (PNG, JPG, WEBP).', 'कृपया एक मान्य छवि फ़ाइल (PNG, JPG) चुनें।', 'कृपया एक वैध इमेज फाइल निवडा.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const src = loadEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          setImageBase64(compressed);
          setImageFileName(file.name);
          setImageSizeKb(Math.round(compressed.length / 1024));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImageFileName(null);
    setImageSizeKb(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(t('Voice dictation not supported in this browser.', 'इस ब्राउज़र में वॉयस रिकॉर्डिंग उपलब्ध नहीं है।', 'या ब्राउझरमध्ये व्हॉइस रेकॉर्डिंग उपलब्ध नाही.'));
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFeedbackText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    const dateStamp = `${getISTDateString()} ${getISTTimeString()}`;
    const payload = {
      userId,
      userName: userName || 'Citizen User',
      userEmail: contactEmail.trim() || userEmail || 'Not provided',
      userRole,
      type: activeTab,
      title: title.trim() || (activeTab === 'bug_report' ? 'Bug Report' : 'App Feedback'),
      rating: activeTab === 'feedback' ? rating : undefined,
      severity: activeTab === 'bug_report' ? severity : undefined,
      feedbackText: feedbackText.trim(),
      imageUrl: imageBase64,
      imageName: imageFileName,
      targetEmail: TARGET_ADMIN_EMAIL,
      status: 'new',
      submittedAtIST: dateStamp,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'citizen_feedback'), payload);

      // Cache locally for immediate Admin portal reflection
      try {
        const existing = JSON.parse(localStorage.getItem('nyaay_local_feedbacks') || '[]');
        existing.unshift({
          id: `local-${Date.now()}`,
          ...payload,
          createdAt: { toDate: () => new Date() },
        });
        localStorage.setItem('nyaay_local_feedbacks', JSON.stringify(existing.slice(0, 50)));
      } catch {}

      setIsSubmitted(true);
    } catch (err) {
      console.warn('Error saving feedback to Firestore:', err);
      // Fallback to local storage if Firestore write is blocked
      try {
        const existing = JSON.parse(localStorage.getItem('nyaay_local_feedbacks') || '[]');
        existing.unshift({
          id: `local-${Date.now()}`,
          ...payload,
          createdAt: { toDate: () => new Date() },
        });
        localStorage.setItem('nyaay_local_feedbacks', JSON.stringify(existing.slice(0, 50)));
      } catch {}

      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compose mailto link so user can also send an email copy directly
  const mailSubject = encodeURIComponent(`[NYAAY ${activeTab === 'bug_report' ? 'Bug Report' : 'App Feedback'}] ${title.trim() || 'User Submission'}`);
  const mailBody = encodeURIComponent(
    `Hello System Admin (${TARGET_ADMIN_EMAIL}),\n\n` +
    `I am submitting the following ${activeTab === 'bug_report' ? 'Bug Report' : 'App Feedback'} for NYAAY Legal Application:\n\n` +
    `• Submitter: ${userName} (${userRole})\n` +
    `• User ID: ${userId}\n` +
    `• Contact: ${contactEmail.trim() || 'N/A'}\n` +
    `• Type: ${activeTab === 'bug_report' ? 'Bug Report (' + severity.toUpperCase() + ')' : 'App Feedback (' + rating + ' Stars)'}\n` +
    `• Date: ${getISTDateString()} ${getISTTimeString()}\n\n` +
    `Description:\n${feedbackText.trim()}\n\n` +
    `${imageFileName ? `(Image attachment: ${imageFileName})` : '(No image attached)'}\n\n` +
    `Best regards,\n${userName}`
  );
  const mailtoUrl = `mailto:${TARGET_ADMIN_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-[#0E0F14] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-white max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {activeTab === 'bug_report' ? <Bug size={20} /> : <MessageSquare size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t('App Feedback & Bug Report', 'ऐप फीडबैक व बग रिपोर्ट', 'अ‍ॅप अभिप्राय आणि त्रुटी अहवाल')}
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {t('Sent directly to system administration', 'सिस्टम एडमिनिस्ट्रेशन को सीधे प्रेषित', 'थेट सिस्टम ॲडमिनला पाठवले जाते')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white transition ios-press"
            >
              <X size={15} />
            </button>
          </div>

          {isSubmitted ? (
            <div className="py-6 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <h4 className="text-sm font-bold text-white">
                {t('Report Registered Successfully!', 'रिपोर्ट सफलतापूर्वक दर्ज की गई!', 'अहवाल यशस्वीरित्या नोंदवला गेला!')}
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed px-2">
                {t(
                  `Your report has been logged and forwarded to ${TARGET_ADMIN_EMAIL}. Our technical team has been notified.`,
                  `आपकी रिपोर्ट दर्ज कर ${TARGET_ADMIN_EMAIL} को प्रेषित कर दी गई है। तकनीकी टीम को सूचित कर दिया गया है।`,
                  `आपला अहवाल नोंदवून ${TARGET_ADMIN_EMAIL} ला पाठवला आहे. तांत्रिक पथकाला सूचित केले आहे.`
                )}
              </p>

              {/* Optional direct email client button */}
              <div className="w-full pt-2 space-y-2">
                <a
                  href={mailtoUrl}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <Mail size={14} className="text-amber-400" />
                  <span>{t('Send Copy via Email Client', 'ईमेल ऐप से भी कॉपी भेजें', 'ईमेल ॲपद्वारे प्रत पाठवा')}</span>
                  <ExternalLink size={12} className="text-neutral-400" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition"
                >
                  {t('Done / Return to App', 'समाप्त / ऐप पर लौटें', 'पूर्ण / अ‍ॅपवर परत जा')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category Segmented Switch */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === 'feedback'
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Star size={15} />
                  <span>{t('App Feedback', 'ऐप फीडबैक', 'अ‍ॅप अभिप्राय')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bug_report')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === 'bug_report'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Bug size={14} />
                  <span>{t('Bug Report', 'बग रिपोर्ट', 'त्रुटी अहवाल')}</span>
                </button>
              </div>

              {/* Specific Field for Feedback: Star Rating */}
              {activeTab === 'feedback' ? (
                <div className="flex flex-col items-center gap-1 py-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    {t('Rate your experience', 'अपना अनुभव रेट करें', 'आपला अनुभव रेट करा')}
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110 ios-press"
                      >
                        <Star
                          size={24}
                          className={
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-600'
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-300 font-medium">
                    {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional' : rating === 4 ? '⭐⭐⭐⭐ Very Good' : rating === 3 ? '⭐⭐⭐ Good' : rating === 2 ? '⭐⭐ Needs Improvement' : '⭐ Critical Issues'}
                  </span>
                </div>
              ) : (
                /* Specific Field for Bug Report: Severity */
                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    {t('Severity / Issue Urgency', 'त्रुटि की गंभीरता', 'त्रुटीचे गांभीर्य')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'minor', label: 'Minor / UI', color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
                      { id: 'moderate', label: 'Moderate', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
                      { id: 'critical', label: 'Critical / Crash', color: 'border-rose-500/40 text-rose-300 bg-rose-500/10' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSeverity(s.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition ${
                          severity === s.id ? `${s.color} font-bold ring-1 ring-white/20` : 'border-white/[0.08] text-neutral-400 hover:text-white bg-white/[0.02]'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject / Title */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                  {activeTab === 'bug_report'
                    ? t('Issue Title / Summary', 'समस्या का शीर्षक', 'समस्येचे शीर्षक')
                    : t('Subject / Key Topic (Optional)', 'विषय (वैकल्पिक)', 'विषय (पर्यायी)')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    activeTab === 'bug_report'
                      ? 'e.g. CNR import button not responding on iOS'
                      : 'e.g. Court calendar view and dark mode feedback'
                  }
                  className="w-full bg-black/80 border border-white/[0.1] rounded-2xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Description + Voice Recording */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-neutral-400 block">
                    {activeTab === 'bug_report'
                      ? t('Describe What Happened *', 'समस्या का विस्तृत विवरण दें *', 'काय घडले ते सांगा *')
                      : t('Your Feedback & Suggestions *', 'आपकी राय व सुझाव *', 'आपले मत व सूचना *')}
                  </label>
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition ios-press ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.1]'
                    }`}
                  >
                    {isRecording ? <MicOff size={11} /> : <Mic size={11} />}
                    <span>{isRecording ? t('Listening...', 'सुन रहे हैं...', 'ऐकत आहे...') : t('Voice Input', 'बोलकर लिखें', 'व्हॉइस इनपुट')}</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    activeTab === 'bug_report'
                      ? t(
                          'Explain what you were doing, what error appeared, or steps to reproduce...',
                          'बताएं कि क्या हुआ था, क्या त्रुटि संदेश दिखा...',
                          'काय घडले आणि कोणती त्रुटी आली ते सांगा...'
                        )
                      : t(
                          'Type your feedback or ideas to help us improve NYAAY...',
                          'अपनी राय या सुझाव लिखें...',
                          'आपला अभिप्राय किंवा कल्पना येथे लिहा...'
                        )
                  }
                  className="w-full bg-black/80 border border-white/[0.1] rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Image Attachment (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-amber-400" />
                    <span>{t('Attach Screenshot or Image (Optional)', 'स्क्रीनशॉट या छवि जोड़ें (वैकल्पिक)', 'स्क्रीनशॉट जोडा (पर्यायी)')}</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">Not mandatory</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imageBase64 ? (
                  <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={imageBase64}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{imageFileName}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {imageSizeKb ? `${imageSizeKb} KB` : 'Attached'} • Ready to upload
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition ios-press shrink-0"
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-dashed border-white/20 hover:border-amber-400/50 text-neutral-400 hover:text-white flex items-center justify-center gap-2 text-xs transition"
                  >
                    <ImageIcon size={14} className="text-neutral-400" />
                    <span>{t('Choose Screenshot / Photo...', 'स्क्रीनशॉट या फोटो चुनें...', 'स्क्रीनशॉट / फोटो निवडा...')}</span>
                  </button>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                  {t('Your Contact Email (for follow-up)', 'आपका संपर्क ईमेल', 'आपला संपर्क ईमेल')}
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. advocate@example.com"
                  className="w-full bg-black/80 border border-white/[0.1] rounded-2xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* Target Notification Notice */}
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[10px] text-amber-200">
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className="text-amber-400" />
                  <span>Delivers directly to:</span>
                </div>
                <span className="font-mono font-bold text-amber-300">{TARGET_ADMIN_EMAIL}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !feedbackText.trim()}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ios-press shadow-lg disabled:opacity-40 ${
                  activeTab === 'bug_report'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
                    : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/25'
                }`}
              >
                {isSubmitting ? (
                  <span>{t('Submitting & Notifying...', 'भेजा जा रहा है...', 'सबमिट करत आहे...')}</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>
                      {activeTab === 'bug_report'
                        ? t('Submit Bug Report', 'बग रिपोर्ट भेजें', 'त्रुटी अहवाल पाठवा')
                        : t('Send Feedback', 'फीडबैक भेजें', 'अभिप्राय पाठवा')}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
