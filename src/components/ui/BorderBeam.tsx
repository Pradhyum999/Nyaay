import React from 'react';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 200,
  duration = 8,
  delay = 0,
  colorFrom = '#FFFFFF',
  colorTo = 'rgba(255, 255, 255, 0.1)',
  className = '',
}) => {
  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--delay': `-${delay}s`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
        } as React.CSSProperties
      }
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square animate-border-beam [background:radial-gradient(ellipse_at_center,var(--color-from)_0%,var(--color-to)_60%,transparent_100%)]"
        style={{
          width: 'var(--size)',
          offsetPath: 'rect(0 auto auto 0 round inherit)',
        }}
      />
    </div>
  );
};
