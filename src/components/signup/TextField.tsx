'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { CheckCircleIcon } from './icons';
import { FieldError } from './FieldError';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'aria-invalid' | 'aria-describedby'
>;

interface TextFieldProps extends NativeInputProps {
  label: string;
  /** Visible error message; presence flips the field into the error state. */
  error?: string | undefined;
  /** Marks the field valid (shows the success check). */
  isValid?: boolean;
  /** Optional helper/hint rendered below the label. */
  hint?: string;
  /** Slot rendered inside the input on the right (e.g. password toggle). */
  trailing?: ReactNode;
}

/**
 * Accessible labelled text input with inline validation state.
 * - Associates label/hint/error via stable ids (useId).
 * - Exposes aria-invalid + aria-describedby for screen readers.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, isValid = false, hint, trailing, required, className, ...inputProps },
  ref,
) {
  const reactId = useId();
  const inputId = `${reactId}-input`;
  const errorId = `${reactId}-error`;
  const hintId = `${reactId}-hint`;

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  const showSuccess = isValid && !error;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-indigo-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p id={hintId} className="mb-1.5 text-xs text-slate-400">
          {hint}
        </p>
      ) : null}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={[
            'w-full rounded-xl border bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition',
            'placeholder:text-slate-400',
            'focus-visible:ring-2 focus-visible:ring-offset-0',
            trailing || showSuccess ? 'pr-12' : '',
            error
              ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200'
              : showSuccess
                ? 'border-emerald-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-200'
                : 'border-slate-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-200',
          ]
            .filter(Boolean)
            .join(' ')}
          {...inputProps}
        />

        {trailing ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>
        ) : showSuccess ? (
          <CheckCircleIcon
            className="pointer-events-none absolute inset-y-0 right-3 my-auto h-5 w-5 text-emerald-500"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
});
