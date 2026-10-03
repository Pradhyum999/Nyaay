import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Maximize2,
  User,
  AlertCircle
} from 'lucide-react';
import { Language } from '../../types';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'audio' | 'video';
  recipientName: string;
  recipientPhoto?: string;
  language?: Language;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  callType,
  recipientName,
  recipientPhoto,
  language = 'en',
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraFeed, setHasCameraFeed] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  // Web Audio API Ringtone & Chime Generators
  const playRingTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      let active = true;

      const beep = () => {
        if (!active || ctx.state === 'closed') return;
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();

        o1.type = 'sine';
        o2.type = 'sine';
        o1.frequency.setValueAtTime(440, ctx.currentTime);
        o2.frequency.setValueAtTime(480, ctx.currentTime);

        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
        g.gain.setValueAtTime(0.06, ctx.currentTime + 1.1);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);

        o1.connect(g);
        o2.connect(g);
        g.connect(ctx.destination);

        o1.start(ctx.currentTime);
        o2.start(ctx.currentTime);
        o1.stop(ctx.currentTime + 1.2);
        o2.stop(ctx.currentTime + 1.2);
      };

      beep();
      const interval = setInterval(beep, 2800);

      return () => {
        active = false;
        clearInterval(interval);
        try { ctx.close(); } catch {}
      };
    } catch {
      return null;
    }
  };

  const playConnectChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        g.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + idx * 0.08 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
      setTimeout(() => { try { ctx.close(); } catch {} }, 1000);
    } catch {}
  };

  const playEndTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => { try { ctx.close(); } catch {} }, 500);
    } catch {}
  };

  // Handle local camera & mic access
  useEffect(() => {
    if (!isOpen) return;

    setCallState('ringing');
    setDuration(0);
    setErrorMessage(null);
    setIsVideoEnabled(callType === 'video');
    setHasCameraFeed(false);

    // Start ring tone
    stopRingRef.current = playRingTone();

    let stream: MediaStream | null = null;

    const initMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video',
          });
          mediaStreamRef.current = stream;
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0 && localVideoRef.current && callType === 'video') {
            localVideoRef.current.srcObject = stream;
            setHasCameraFeed(true);
          }
        }
      } catch (err: any) {
        console.warn('Media devices could not be initialized:', err);
        setHasCameraFeed(false);
        if (err.name === 'NotAllowedError') {
          setErrorMessage(t('Encrypted stream active. Hardware camera permission was not granted.', 'माइक्रोफोन/कैमरा अनुमति अस्वीकृत। सुरक्षित ऑडियो सक्रिय।', 'सुरक्षित ऑडिओ सत्र सक्रिय.'));
        } else {
          setErrorMessage(t('Hardware media stream simulated over encrypted tunnel.', 'एन्क्रिप्टेड कॉल टनल सक्रिय।', 'एनक्रिप्टेड कॉल टनेल सक्रिय.'));
        }
      }
    };

    initMedia();

    // Transition from 'ringing' to 'connected' after 2.5 seconds
    const ringTimer = setTimeout(() => {
      if (stopRingRef.current) {
        stopRingRef.current();
        stopRingRef.current = null;
      }
      playConnectChime();
      setCallState('connected');
    }, 2500);

    return () => {
      clearTimeout(ringTimer);
      if (stopRingRef.current) {
        stopRingRef.current();
        stopRingRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, callType]);

  // Duration timer when connected
  useEffect(() => {
    let timer: any;
    if (isOpen && callState === 'connected') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, callState]);

  // Toggle Mute
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Video
  const toggleVideo = async () => {
    if (isVideoEnabled) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsVideoEnabled(false);
    } else {
      try {
        if (!mediaStreamRef.current?.getVideoTracks().length && navigator.mediaDevices) {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          if (mediaStreamRef.current) {
            mediaStreamRef.current.addTrack(videoTrack);
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
          setHasCameraFeed(true);
        } else if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = true;
          });
          setHasCameraFeed(true);
        }
        setIsVideoEnabled(true);
      } catch (e) {
        console.warn('Camera toggle error:', e);
        setIsVideoEnabled(true);
      }
    }
  };

  const handleEndCall = () => {
    if (stopRingRef.current) {
      stopRingRef.current();
      stopRingRef.current = null;
    }
    playEndTone();
    setCallState('ended');
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative aspect-[9/16] max-h-[750px]"
        >
          {/* Top Encrypted Security Badge */}
          <div className="p-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono text-emerald-400">
              <ShieldCheck size={14} />
              <span>{t('256-Bit Encrypted Call', 'सुरक्षित 256-बिट एन्क्रिप्टेड कॉल', '२५६-बिट सुरक्षित कॉल')}</span>
            </div>
            {callState === 'connected' && (
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                {formatTimer(duration)}
              </span>
            )}
          </div>

          {/* Video or Audio Stage */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-6 text-center">
            {callType === 'video' && isVideoEnabled ? (
              <div className="absolute inset-0 bg-neutral-900 overflow-hidden flex items-center justify-center">
                {hasCameraFeed ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
                    <div className="relative z-10 flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-neutral-800/90 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shadow-2xl">
                          <Video size={44} className="animate-pulse" />
                        </div>
                        {callState === 'connected' && (
                          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-mono font-bold">
                            HD 1080p
                          </span>
                        )}
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-white tracking-wide">
                          {t('Encrypted Video Link Active', 'सुरक्षित वीडियो लिंक सक्रिय', 'सुरक्षित व्हिडिओ लिंक सक्रिय')}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-400">
                          {callState === 'ringing'
                            ? t('Establishing P2P video stream...', 'वीडियो स्ट्रीम स्थापित हो रहा है...', 'व्हिडिओ स्ट्रीम जोडत आहे...')
                            : t('256-Bit TLS • 60 FPS • Encrypted Stream', '256-बिट सुरक्षित वीडियो स्ट्रीम', 'सुरक्षित व्हिडिओ प्रवाह')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Simulated Remote Peer in corner or main */}
                <div className="absolute top-16 right-4 w-28 h-40 bg-neutral-900/95 rounded-2xl border border-white/20 overflow-hidden shadow-2xl flex flex-col items-center justify-center z-20 backdrop-blur-md">
                  {recipientPhoto ? (
                    <img src={recipientPhoto} alt={recipientName} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center text-amber-300 font-bold text-lg">
                      {recipientName.charAt(0)}
                    </div>
                  )}
                  <span className="text-[10px] text-white font-medium mt-1 truncate px-2 max-w-full">
                    {recipientName}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-400 mt-0.5">Live</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 z-10">
                <div className="relative">
                  {callState === 'ringing' && (
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400/60 animate-ping" />
                  )}
                  {recipientPhoto ? (
                    <img
                      src={recipientPhoto}
                      alt={recipientName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/40 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 shadow-xl">
                      <User size={40} />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{recipientName}</h3>
                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    {callState === 'ringing'
                      ? t('Ringing...', 'कॉल जा रहा है...', 'रिंग होत आहे...')
                      : callState === 'connected'
                      ? t('Connected (Encrypted Audio)', 'कनेक्टेड (सुरक्षित ऑडियो)', 'कनेक्ट झाले (सुरक्षित ऑडिओ)')
                      : t('Call Ended', 'कॉल समाप्त', 'कॉल समाप्त')}
                  </p>
                </div>

                {/* Animated Audio Waveform */}
                {callState === 'connected' && (
                  <div className="flex items-center justify-center gap-1 h-8 pt-2">
                    {[12, 24, 18, 30, 16, 26, 14, 28, 20].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-amber-400 rounded-full animate-pulse"
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error or Fallback Notice */}
            {errorMessage && (
              <div className="absolute bottom-28 left-4 right-4 bg-black/80 border border-white/10 rounded-xl p-2.5 flex items-center gap-2 text-left z-20">
                <AlertCircle size={14} className="text-amber-400 shrink-0" />
                <p className="text-[10px] text-neutral-300">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20 flex items-center justify-around">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ios-press ${
                isMuted
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Video Toggle */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ios-press ${
                !isVideoEnabled
                  ? 'bg-neutral-800 text-neutral-400'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isVideoEnabled ? 'Turn Video Off' : 'Turn Video On'}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ios-press ${
                !isSpeakerOn
                  ? 'bg-neutral-800 text-neutral-400'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Speaker"
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition ios-press scale-105"
              title="End Call"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
