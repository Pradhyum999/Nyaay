import React from 'react';

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
  return (
    <div className={`flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto no-scrollbar gap-1 ${className}`}>
      {items.map(item => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap select-none ios-press ${
              active
                ? 'bg-amber-400 text-black font-bold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
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
