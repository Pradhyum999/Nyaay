import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  primary?: {
    label: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondary?: {
    label: string;
    onClick?: () => void;
  };
  maxWidth?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  primary,
  secondary,
  maxWidth = 'max-w-lg',
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in transition-opacity" />
        <DialogPrimitive.Content
          className={`fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full ${maxWidth} rounded-t-[32px] sm:rounded-3xl bg-neutral-950 border border-white/[0.14] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] focus:outline-none animate-in slide-in-from-bottom sm:zoom-in-95`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.08]">
            <div>
              <DialogPrimitive.Title className="text-base sm:text-lg font-bold text-white tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs text-neutral-400 mt-0.5">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white transition shrink-0">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {children}
          </div>

          {/* Footer Actions */}
          {(primary || secondary) && (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08] mt-2">
              {secondary && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    if (secondary.onClick) secondary.onClick();
                    else onOpenChange(false);
                  }}
                >
                  {secondary.label}
                </Button>
              )}
              {primary && (
                <Button
                  variant="primary"
                  size="md"
                  loading={primary.loading}
                  disabled={primary.disabled}
                  onClick={primary.onClick}
                >
                  {primary.label}
                </Button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
