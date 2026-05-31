'use client';

import { useId, useState } from 'react';
import { Checkbox } from './Checkbox';
import { FieldError } from './FieldError';
import type {
  RequiredTermsField,
  SignupValues,
  TermsFieldName,
} from '@/types/signup';

interface TermsAgreementProps {
  values: Pick<SignupValues, 'agreeService' | 'agreePrivacy' | 'agreeMarketing'>;
  /** Show the "필수 약관에 동의해 주세요" message. */
  showRequiredError: boolean;
  onChange: (name: TermsFieldName, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  /** Lets the parent focus a required checkbox on failed submit. */
  registerRequiredRef?: (name: RequiredTermsField, el: HTMLInputElement | null) => void;
}

interface TermItem {
  name: TermsFieldName;
  label: string;
  required: boolean;
  body: string;
}

const TERMS: readonly TermItem[] = [
  {
    name: 'agreeService',
    label: '서비스 이용약관 동의',
    required: true,
    body: '본 서비스의 이용약관입니다. 회원은 관계 법령 및 본 약관에 따라 서비스를 이용하며, 계정 정보를 정확하게 관리할 책임이 있습니다. (데모용 예시 약관)',
  },
  {
    name: 'agreePrivacy',
    label: '개인정보 수집·이용 동의',
    required: true,
    body: '수집 항목: 이메일, 비밀번호, 닉네임. 수집 목적: 회원 식별 및 서비스 제공. 보유 기간: 회원 탈퇴 시까지. (데모용 예시 약관)',
  },
  {
    name: 'agreeMarketing',
    label: '마케팅 정보 수신 동의',
    required: false,
    body: '이벤트·혜택 등 마케팅 정보를 이메일로 받아보실 수 있습니다. 동의하지 않아도 서비스 이용에는 제한이 없습니다. (데모용 예시 약관)',
  },
];

/**
 * Terms-of-service section: a master "전체 동의" toggle plus separated
 * required and optional agreements. Each item has an accessible expandable
 * detail panel (aria-expanded / aria-controls) instead of a dead link.
 */
export function TermsAgreement({
  values,
  showRequiredError,
  onChange,
  onToggleAll,
  registerRequiredRef,
}: TermsAgreementProps) {
  const baseId = useId();
  const [openTerm, setOpenTerm] = useState<TermsFieldName | null>(null);

  const allChecked =
    values.agreeService && values.agreePrivacy && values.agreeMarketing;

  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">약관 동의</legend>

      <Checkbox checked={allChecked} onChange={onToggleAll} emphasized>
        약관 전체 동의 (선택 항목 포함)
      </Checkbox>

      <hr className="my-2 border-slate-100" />

      <div className="space-y-0.5">
        {TERMS.map((term) => {
          const panelId = `${baseId}-${term.name}`;
          const isOpen = openTerm === term.name;
          return (
            <div key={term.name}>
              <Checkbox
                checked={values[term.name]}
                onChange={(checked) => onChange(term.name, checked)}
                badge={{
                  text: term.required ? '필수' : '선택',
                  tone: term.required ? 'required' : 'optional',
                }}
                inputRef={(el) => {
                  if (term.required) {
                    registerRequiredRef?.(term.name as RequiredTermsField, el);
                  }
                }}
                trailing={
                  <button
                    type="button"
                    onClick={() => setOpenTerm(isOpen ? null : term.name)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="rounded px-1.5 py-0.5 text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    {isOpen ? '접기' : '보기'}
                  </button>
                }
              >
                {term.label}
              </Checkbox>

              {isOpen ? (
                <p
                  id={panelId}
                  className="mx-1 mb-2 animate-fade-in rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500"
                >
                  {term.body}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <FieldError
        id="terms-error"
        message={showRequiredError ? '필수 약관에 모두 동의해 주세요.' : undefined}
      />
    </fieldset>
  );
}
