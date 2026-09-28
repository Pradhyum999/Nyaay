import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'ghost',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center rounded-2xl transition duration-150 ios-press disabled:opacity-40 disabled:pointer-events-none";

  const sizeClasses = {
    sm: "w-9 h-9 min-w-9 min-h-9",
    md: "w-11 h-11 min-w-[44px] min-h-[44px]", // Minimum 44px for thumb touch target
    lg: "w-12 h-12 min-w-[48px] min-h-[48px]",
  };

  const variantClasses = {
    ghost: "bg-transparent hover:bg-white/[0.08] text-neutral-300 hover:text-white",
    secondary: "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-neutral-200 hover:text-white",
    primary: "bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-md shadow-amber-500/20",
    danger: "bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400",
  };

  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
