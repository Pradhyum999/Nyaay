import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-semibold rounded-2xl transition duration-150 ios-press disabled:opacity-40 disabled:pointer-events-none select-none";
  
  const sizeClasses = {
    sm: "min-h-[36px] px-3.5 py-1.5 text-xs gap-1.5",
    md: "min-h-[44px] px-4 py-2.5 text-xs sm:text-sm gap-2",
    lg: "min-h-[50px] px-6 py-3 text-sm sm:text-base gap-2.5",
  };

  const variantClasses = {
    primary: "bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-lg shadow-amber-500/20 active:bg-amber-500",
    secondary: "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.12] active:bg-white/[0.05]",
    danger: "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 active:bg-red-500/10",
    ghost: "bg-transparent hover:bg-white/[0.06] text-neutral-300 hover:text-white active:bg-white/[0.04]",
  };

  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
