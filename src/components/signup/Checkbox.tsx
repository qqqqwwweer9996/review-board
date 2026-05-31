'use client';

import { type ReactNode, type Ref } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  /** Renders the "필수"/"선택" badge next to the label. */
  badge?: { text: string; tone: 'required' | 'optional' };
  /** Slot on the far right (e.g. a "보기" toggle for terms detail). */
  trailing?: ReactNode;
  emphasized?: boolean;
  /** Exposes the underlying input so callers can focus it (e.g. on submit). */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Accessible checkbox row. Uses a native <input type="checkbox"> visually
 * replaced by a styled box via the peer pattern, so keyboard + screen-reader
 * behavior is fully preserved.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  badge,
  trailing,
  emphasized = false,
  inputRef,
}: CheckboxProps) {
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl px-1 py-2 transition',
        emphasized ? 'bg-slate-50 px-3' : '',
      ].join(' ')}
    >
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <span className="relative inline-flex shrink-0">
          <input
            ref={inputRef}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
          />
          <svg
            className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>

        <span
          className={[
            'flex items-center gap-2 text-sm',
            emphasized ? 'font-bold text-slate-800' : 'text-slate-600',
          ].join(' ')}
        >
          {badge ? (
            <span
              className={[
                'text-xs font-semibold',
                badge.tone === 'required' ? 'text-indigo-600' : 'text-slate-400',
              ].join(' ')}
            >
              ({badge.text})
            </span>
          ) : null}
          {children}
        </span>
      </label>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
