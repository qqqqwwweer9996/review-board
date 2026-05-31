'use client';

import { useMemo } from 'react';
import { getPasswordStrength } from '@/utils/validation';

interface PasswordStrengthMeterProps {
  password: string;
}

const SEGMENT_COLORS: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-lime-500',
  4: 'bg-emerald-500',
};

const LABEL_COLORS: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-amber-500',
  3: 'text-lime-600',
  4: 'text-emerald-600',
};

/** Four-segment strength meter. Hidden until the user types something. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label } = useMemo(() => getPasswordStrength(password), [password]);

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 animate-fade-in">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={[
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              segment <= score ? SEGMENT_COLORS[score] : 'bg-slate-200',
            ].join(' ')}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        비밀번호 강도:{' '}
        <span className={`font-semibold ${LABEL_COLORS[score] ?? 'text-slate-500'}`}>
          {label}
        </span>
      </p>
    </div>
  );
}
