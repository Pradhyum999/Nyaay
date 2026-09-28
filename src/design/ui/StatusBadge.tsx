import React from 'react';
import { AlertCircle, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

export type BadgeStatus = 'overdue' | 'pending' | 'paid' | 'urgent' | 'verified' | 'active' | 'closed';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const norm = status.toLowerCase();

  if (norm === 'urgent' || norm === 'overdue' || norm === 'critical') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 ${className}`}>
        <AlertTriangle size={13} className="shrink-0" />
        <span>{label || (norm === 'urgent' ? 'Urgent' : 'Overdue')}</span>
      </span>
    );
  }

  if (norm === 'paid' || norm === 'verified' || norm === 'disposed') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 ${className}`}>
        <CheckCircle2 size={13} className="shrink-0" />
        <span>{label || (norm === 'paid' ? 'Paid' : 'Verified')}</span>
      </span>
    );
  }

  if (norm === 'pending' || norm === 'in_progress' || norm === 'active') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/15 border border-amber-400/30 text-amber-300 ${className}`}>
        <Clock size={13} className="shrink-0" />
        <span>{label || (norm === 'active' ? 'Active' : 'Pending')}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.08] border border-white/[0.12] text-neutral-300 ${className}`}>
      <AlertCircle size={13} className="shrink-0" />
      <span>{label || status}</span>
    </span>
  );
};
