'use client';

import { forwardRef, useState } from 'react';
import { TextField } from './TextField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { EyeIcon, EyeOffIcon } from './icons';

interface PasswordFieldProps {
  value: string;
  error?: string | undefined;
  isValid?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Password input with a show/hide visibility toggle and a live strength meter.
 * The toggle is a real <button> with aria-pressed + dynamic label for a11y.
 * Forwards a ref to the underlying input so the form can focus it on submit.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ value, error, isValid = false, onChange, onBlur }, ref) {
    const [visible, setVisible] = useState(false);

    const toggle = (
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        title={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    );

    return (
      <div>
        <TextField
          ref={ref}
          label="비밀번호"
          type={visible ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          placeholder="8자 이상 입력해 주세요"
          hint="최소 8자 이상, 영문·숫자·특수문자 조합을 권장합니다."
          required
          value={value}
          error={error}
          isValid={isValid}
          trailing={toggle}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <PasswordStrengthMeter password={value} />
      </div>
    );
  },
);
