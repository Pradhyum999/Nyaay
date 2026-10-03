import React, { useRef, useEffect } from 'react';

export interface SegmentedItem<T extends string = string> {
  id: T;
  label: string;
  badge?: number | string;
}

export interface SegmentedProps<T extends string = string> {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
}: SegmentedProps<T>) {
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [value]);

  return (
    <div className={`flex items-center p-1.5 rounded-2xl bg-neutral-900/60 border border-white/[0.08] overflow-x-auto no-scrollbar gap-1.5 w-full scroll-smooth ${className}`}>
      {items.map(item => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={active ? activeBtnRef : undefined}
            type="button"
            onClick={() => onChange(item.id)}
            className={`shrink-0 sm:shrink sm:flex-1 min-w-max px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap select-none ios-press ${
              active
                ? 'bg-amber-400 text-black font-bold shadow-md ring-1 ring-amber-400/50'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                  active ? 'bg-black/20 text-black' : 'bg-white/[0.1] text-neutral-300'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
