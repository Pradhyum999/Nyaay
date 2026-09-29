import React, { useState, useEffect } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Button } from '../../design/ui/Button';
import { MapPin, Navigation, Landmark, CheckCircle2, AlertCircle } from 'lucide-react';
import { GeoPoint, Language } from '../../types';

interface LocationPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAddress?: string;
  currentGeo?: GeoPoint;
  language: Language;
  onSaveLocation: (geo: GeoPoint, formattedAddress: string) => Promise<void> | void;
}

export const LocationPickerSheet: React.FC<LocationPickerSheetProps> = ({
  open,
  onOpenChange,
  currentAddress = '',
  currentGeo,
  language,
  onSaveLocation,
}) => {
  const [address, setAddress] = useState(currentAddress);
  const [city, setCity] = useState(currentGeo?.city || '');
  const [state, setState] = useState(currentGeo?.state || '');
  const [lat, setLat] = useState<number>(currentGeo?.lat || 28.6139);
  const [lng, setLng] = useState<number>(currentGeo?.lng || 77.2090);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAddress(currentAddress || '');
      setCity(currentGeo?.city || '');
      setState(currentGeo?.state || '');
      setLat(currentGeo?.lat || 28.6139);
      setLng(currentGeo?.lng || 77.2090);
      setSavedSuccess(false);
      setError(null);
    }
  }, [open, currentAddress, currentGeo]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve location.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    if (!address.trim()) {
      setError('Please provide your chamber or office address.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Simple geohash generator
      const simpleGeohash = `${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
      const geo: GeoPoint = {
        lat,
        lng,
        city: city.trim() || 'New Delhi',
        state: state.trim() || 'Delhi',
        formattedAddress: address.trim(),
        geohash: simpleGeohash,
        updatedAt: new Date().toISOString(),
      };

      await onSaveLocation(geo, address.trim());
      setSavedSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Failed to save chamber location.');
    } finally {
      setIsSaving(false);
    }
  };

  const t = (en: string, hi: string, mr: string) =>
    language === 'mr' ? mr : language === 'hi' ? hi : en;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('Chambers & Office Location', 'चैम्बर एवं कार्यालय का स्थान', 'चेंबर्स व कार्यालय स्थान')}
      description={t(
        'Configure your physical chamber coordinates so nearby clients in court complexes can find your practice.',
        'अपने भौतिक चैम्बर का पता सेट करें ताकि कोर्ट परिसर में आस-पास के मुवक्किल आपको ढूंढ सकें।',
        'आपल्या प्रत्यक्ष चेंबरचा पत्ता सेट करा जेणेकरून कोर्ट परिसरातील पक्षकार आपल्याला शोधू शकतील.'
      )}
    >
      <div className="space-y-4 pb-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{t('Chamber location updated successfully!', 'चैम्बर स्थान सफलतापूर्वक सहेज लिया गया!', 'चेंबरचे स्थान यशस्वीरीत्या अद्यतनित केले!')}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-sub block mb-1">
            {t('Chambers Address / Room Number', 'चैम्बर का पूरा पता / कमरा संख्या', 'चेंबरचा पूर्ण पत्ता / खोली क्रमांक')}
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t(
              'e.g. Chambers 402, Block III, Delhi High Court, New Delhi 110003',
              'उदा. चैम्बर 402, ब्लॉक 3, दिल्ली उच्च न्यायालय, नई दिल्ली 110003',
              'उदा. चेंबर ४०२, ब्लॉक ३, दिल्ली उच्च न्यायालय, नवी दिल्ली ११०००३'
            )}
            className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-sub block mb-1">
              {t('City / District', 'शहर / ज़िला', 'शहर / जिल्हा')}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. New Delhi"
              className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-sub block mb-1">
              {t('State', 'राज्य', 'राज्य')}
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Delhi"
              className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Landmark size={14} className="text-amber-400" />
              {t('GPS Coordinates', 'जीपीएस निर्देशांक', 'जीपीएस निर्देशक')}
            </span>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1 hover:bg-amber-400/25 transition disabled:opacity-50"
            >
              <Navigation size={12} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? t('Detecting...', 'पता कर रहे हैं...', 'शोधत आहे...') : t('Use Current GPS', 'वर्तमान जीपीएस लें', 'सध्याचे जीपीएस वापरा')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 font-mono">
            <div className="bg-black/40 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-neutral-500 block">LAT</span>
              <span className="text-white font-bold">{lat.toFixed(5)}</span>
            </div>
            <div className="bg-black/40 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-neutral-500 block">LNG</span>
              <span className="text-white font-bold">{lng.toFixed(5)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('Cancel', 'रद्द करें', 'रद्द करा')}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            {t('Save Chamber Location', 'चैम्बर स्थान सहेजें', 'चेंबर स्थान जतन करा')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
