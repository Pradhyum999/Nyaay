import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-amber-300 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
