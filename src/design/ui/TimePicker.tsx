import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

const COMMON_COURT_SLOTS = [
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
];

const HOURS = ['09', '10', '11', '12', '01', '02', '03', '04', '05', '06'];
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'] as const;

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select Time',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value or fallback to 10:30 AM
  const parseVal = (str: string) => {
    const m = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (m) {
      const h = m[1].padStart(2, '0');
      const min = m[2];
      const p = m[3].toUpperCase() as 'AM' | 'PM';
      return { hour: h, minute: min, period: p };
    }
    return { hour: '10', minute: '30', period: 'AM' as const };
  };

  const currentParsed = parseVal(value);
  const [selectedHour, setSelectedHour] = useState(currentParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(currentParsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(currentParsed.period);

  useEffect(() => {
    const p = parseVal(value);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleApply = (h: string, m: string, p: 'AM' | 'PM') => {
    const formatted = `${h}:${m} ${p}`;
    onChange(formatted);
  };

  const handleSelectSlot = (slot: string) => {
    onChange(slot);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between hover:border-amber-400/50 transition focus:outline-none focus:border-amber-400 font-mono"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-400 shrink-0" />
          <span className={value ? 'text-white font-medium' : 'text-neutral-500'}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      {/* Clock Selector Dropdown Panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 left-0 w-72 sm:w-80 bg-neutral-950 border border-white/[0.16] rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-amber-400" />
              <span className="text-xs font-bold text-white font-display">Time Picker</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              {value || `${selectedHour}:${selectedMinute} ${selectedPeriod}`}
            </span>
          </div>

          {/* Quick Court Hours Pills */}
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">
              Court Listing Slots
            </span>
            <div className="grid grid-cols-5 gap-1">
              {COMMON_COURT_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className={`px-1 py-1 rounded-lg text-[10px] font-mono font-medium transition ${
                    value === slot
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {slot.replace(' ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Dial / Direct Hour & Minute Selectors */}
          <div className="pt-1">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">
              Direct Hour & Minute Picker
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Hours */}
              <div>
                <label className="text-[9px] text-neutral-400 block mb-0.5">Hour</label>
                <select
                  value={selectedHour}
                  onChange={e => {
                    const h = e.target.value;
                    setSelectedHour(h);
                    handleApply(h, selectedMinute, selectedPeriod);
                  }}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minutes */}
              <div>
                <label className="text-[9px] text-neutral-400 block mb-0.5">Minute</label>
                <select
                  value={selectedMinute}
                  onChange={e => {
                    const min = e.target.value;
                    setSelectedMinute(min);
                    handleApply(selectedHour, min, selectedPeriod);
                  }}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  {MINUTES.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM */}
              <div>
                <label className="text-[9px] text-neutral-400 block mb-0.5">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={e => {
                    const p = e.target.value as 'AM' | 'PM';
                    setSelectedPeriod(p);
                    handleApply(selectedHour, selectedMinute, p);
                  }}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  {PERIODS.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => {
              handleApply(selectedHour, selectedMinute, selectedPeriod);
              setOpen(false);
            }}
            className="w-full py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition ios-press"
          >
            Confirm Time
          </button>
        </div>
      )}
    </div>
  );
};
