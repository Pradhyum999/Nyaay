import React from 'react';

export interface SectionHeaderProps {
  title: string;
  count?: number;
  countLabel?: string;
  badge?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  countLabel,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-wider font-mono truncate">
          {title}
        </h2>
        {typeof count === 'number' && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 border border-white/[0.1]">
            {count} {countLabel || ''}
          </span>
        )}
        {badge}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition shrink-0 ios-press"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
