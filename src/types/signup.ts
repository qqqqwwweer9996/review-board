/**
 * Domain types for the signup form.
 * Centralizing these keeps field names, values, and errors in sync
 * across the hook, validators, and UI components.
 */

/** Text input fields that carry a string value. */
export type TextFieldName = 'email' | 'password' | 'nickname';

/** Checkbox fields for the terms-of-service agreements. */
export type TermsFieldName = 'agreeService' | 'agreePrivacy' | 'agreeMarketing';

/** Every field that participates in form state. */
export type FieldName = TextFieldName | TermsFieldName;

/** Terms the user must accept before submitting. */
export type RequiredTermsField = 'agreeService' | 'agreePrivacy';

/** Fields that can receive focus when the user submits an invalid form. */
export type FocusableField = TextFieldName | RequiredTermsField;

/** The full set of values the form tracks. */
export interface SignupValues {
  email: string;
  password: string;
  nickname: string;
  /** Required: 서비스 이용약관 동의 */
  agreeService: boolean;
  /** Required: 개인정보 수집·이용 동의 */
  agreePrivacy: boolean;
  /** Optional: 마케팅 정보 수신 동의 */
  agreeMarketing: boolean;
}

/** Per-field error message (undefined = valid). Only text fields surface messages. */
export type SignupErrors = Partial<Record<TextFieldName, string>>;

/** Tracks which fields the user has interacted with, to defer errors until relevant. */
export type TouchedState = Partial<Record<FieldName, boolean>>;

/** Discrete password-strength buckets used by the strength meter. */
export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrength;
  /** 0–4 score driving the meter bars. */
  score: number;
  label: string;
}

/** Result of a single validator run. */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}
