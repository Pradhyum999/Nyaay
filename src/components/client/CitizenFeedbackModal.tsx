import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Mic, MicOff, CheckCircle2, X, Send } from 'lucide-react';
import { Language } from '../../types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CitizenFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  language: Language;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  language,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

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
    try {
      await addDoc(collection(db, 'citizen_feedback'), {
        userId,
        userName: userName || 'Citizen User',
        userRole: 'client',
        rating,
        feedbackText: feedbackText.trim(),
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFeedbackText('');
        onClose();
      }, 2000);
    } catch (err) {
      console.warn('Error saving feedback:', err);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-[#0E0F14] border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t('Citizen Feedback', 'नागरिक प्रतिपुष्टि', 'नागरिक अभिप्राय')}
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {t('Help us improve the justice desk', 'विधिक सहायता को बेहतर बनाएं', 'सेवा सुधारण्यासाठी मदत करा')}
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
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">
                {t('Thank You for Your Feedback!', 'आपकी प्रतिपुष्टि हेतु धन्यवाद!', 'आपल्या अभिप्रायाबद्दल धन्यवाद!')}
              </h4>
              <p className="text-xs text-neutral-400">
                {t('Your voice helps make NYAAYNEETI better.', 'आपकी राय से न्यायनीति और बेहतर बनेगी।', 'आपल्या अभिप्रायाने न्यायनीती अधिक सक्षम होईल.')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-1.5 py-1">
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
                        size={22}
                        className={
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-600'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Textarea + Voice Dictation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-neutral-400 block">
                    {t('Your Feedback & Suggestions *', 'आपकी राय व सुझाव *', 'आपले मत व सूचना *')}
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
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t(
                    'Type your feedback manually or tap Voice Input to speak...',
                    'अपनी प्रतिक्रिया यहाँ लिखें या बोलकर रिकॉर्ड करें...',
                    'आपला अभिप्राय येथे लिहा किंवा बोलून रेकॉर्ड करा...'
                  )}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400/50 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !feedbackText.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition ios-press shadow-lg shadow-emerald-500/20 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <span>{t('Submitting...', 'जमा हो रहा है...', 'सबमिट करत आहे...')}</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{t('Send Feedback', 'प्रतिक्रिया भेजें', 'अभिप्राय पाठवा')}</span>
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
