'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSignupForm } from '@/hooks/useSignupForm';
import { validateEmail, validateNickname, validatePassword } from '@/utils/validation';
import type { FocusableField } from '@/types/signup';
import { TextField } from './TextField';
import { PasswordField } from './PasswordField';
import { TermsAgreement } from './TermsAgreement';
import { AlertCircleIcon, CheckCircleIcon } from './icons';

/** Supabase 오류 메시지를 사용자 친화적인 한국어로 변환한다. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered')) {
    return '이미 가입된 이메일입니다. 로그인해 주세요.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (m.includes('password')) {
    return '비밀번호가 보안 요건을 충족하지 않습니다.';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return '유효하지 않은 이메일 주소입니다.';
  }
  return message || '회원가입 처리 중 오류가 발생했습니다.';
}

export function SignupForm() {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  // 이메일 확인(Confirm email)이 켜져 있어 세션 없이 가입된 경우 true
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  // Refs for every focusable field, so a failed submit can move focus to the
  // first blocking field (a11y: keeps keyboard users oriented).
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({});
  const focusField = (name: FocusableField) => {
    fieldRefs.current[name]?.focus();
  };

  const form = useSignupForm({
    onValidSubmit: async (values) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { nickname: values.nickname } },
      });
      if (error) {
        throw new Error(friendlyAuthError(error.message));
      }
      setSubmittedEmail(values.email);
      // 세션이 없으면 이메일 확인이 필요한 상태다.
      setConfirmationRequired(!data.session);
    },
    onInvalidSubmit: focusField,
  });

  const {
    values,
    errors,
    touched,
    isSubmittable,
    isSubmitting,
    submitSucceeded,
    submitError,
    handleTextChange,
    handleTextBlur,
    handleTermsChange,
    toggleAllTerms,
    handleSubmit,
  } = form;

  // Field-level "valid" flags drive the success check icon.
  const emailValid = validateEmail(values.email).isValid;
  const passwordValid = validatePassword(values.password).isValid;
  const nicknameValid = validateNickname(values.nickname).isValid;

  const requiredTermsMissing = Boolean(
    (touched.agreeService || touched.agreePrivacy) &&
      !(values.agreeService && values.agreePrivacy),
  );

  if (submitSucceeded && submittedEmail) {
    return (
      <div
        className="animate-scale-in rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-100 sm:p-10"
        role="status"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">회원가입 완료</h2>

        {confirmationRequired ? (
          <>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{submittedEmail}</span> 으로
              <br />
              확인 메일을 보냈습니다. 메일 인증 후 로그인해 주세요.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              로그인하러 가기
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{submittedEmail}</span> 으로
              <br />
              가입이 완료되어 자동으로 로그인되었습니다.
            </p>
            <button
              type="button"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              시작하기
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="animate-scale-in rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">회원가입</h1>
        <p className="mt-1 text-sm text-slate-500">
          몇 가지 정보만 입력하면 바로 후기를 남길 수 있어요.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          ref={(el) => {
            fieldRefs.current.email = el;
          }}
          label="이메일"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          value={values.email}
          error={errors.email}
          isValid={emailValid}
          onChange={(e) => handleTextChange('email', e.target.value)}
          onBlur={() => handleTextBlur('email')}
        />

        <PasswordField
          ref={(el) => {
            fieldRefs.current.password = el;
          }}
          value={values.password}
          error={errors.password}
          isValid={passwordValid}
          onChange={(v) => handleTextChange('password', v)}
          onBlur={() => handleTextBlur('password')}
        />

        <TextField
          ref={(el) => {
            fieldRefs.current.nickname = el;
          }}
          label="닉네임"
          type="text"
          name="nickname"
          autoComplete="nickname"
          placeholder="2~20자, 한글/영문/숫자"
          maxLength={20}
          required
          value={values.nickname}
          error={errors.nickname}
          isValid={nicknameValid}
          onChange={(e) => handleTextChange('nickname', e.target.value)}
          onBlur={() => handleTextBlur('nickname')}
        />

        <TermsAgreement
          values={values}
          showRequiredError={requiredTermsMissing}
          onChange={handleTermsChange}
          onToggleAll={toggleAllTerms}
          registerRequiredRef={(name, el) => {
            fieldRefs.current[name] = el;
          }}
        />

        {submitError ? (
          <div
            role="alert"
            className="flex animate-fade-in items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <span>{submitError}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={!isSubmittable || isSubmitting}
          className={[
            'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            isSubmittable && !isSubmitting
              ? 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-400'
              : 'cursor-not-allowed bg-slate-300 focus-visible:ring-slate-300',
          ].join(' ')}
        >
          {isSubmitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              처리 중...
            </>
          ) : (
            '가입하기'
          )}
        </button>

        <p className="text-center text-sm text-slate-400">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
