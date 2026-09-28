import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`rounded-3xl bg-white/[0.035] border border-white/[0.08] backdrop-blur-md p-4 sm:p-5 transition ${
        interactive ? 'hover:bg-white/[0.06] hover:border-white/[0.16] cursor-pointer ios-press' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
