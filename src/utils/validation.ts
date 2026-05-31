import type {
  FocusableField,
  PasswordStrengthResult,
  SignupValues,
  TextFieldName,
  ValidationResult,
} from '@/types/signup';

/**
 * RFC 5322 compliant email pattern (practical "official" subset).
 * Source: the widely-used HTML5 / RFC 5322 addr-spec regex. It validates the
 * local part (incl. dot-atom and common special chars) and the domain
 * (labels + dotted TLD), which covers the vast majority of real addresses
 * without the pathological full-grammar backtracking.
 */
const EMAIL_RFC5322 =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;
const EMAIL_MAX_LENGTH = 254; // RFC 5321 upper bound for the whole address.

/** 한글, 영문, 숫자, 밑줄(_)만 허용 — 공백/특수문자 차단. */
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

const valid: ValidationResult = { isValid: true };

export function validateEmail(rawValue: string): ValidationResult {
  const value = rawValue.trim();
  if (value.length === 0) {
    return { isValid: false, message: '이메일을 입력해 주세요.' };
  }
  if (value.length > EMAIL_MAX_LENGTH) {
    return { isValid: false, message: '이메일이 너무 깁니다.' };
  }
  if (!EMAIL_RFC5322.test(value)) {
    return { isValid: false, message: '올바른 이메일 형식이 아닙니다. (예: name@example.com)' };
  }
  return valid;
}

export function validatePassword(value: string): ValidationResult {
  if (value.length === 0) {
    return { isValid: false, message: '비밀번호를 입력해 주세요.' };
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    };
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return {
      isValid: false,
      message: `비밀번호는 최대 ${PASSWORD_MAX_LENGTH}자까지 가능합니다.`,
    };
  }
  return valid;
}

export function validateNickname(rawValue: string): ValidationResult {
  const value = rawValue.trim();
  if (value.length === 0) {
    return { isValid: false, message: '닉네임을 입력해 주세요.' };
  }
  if (value.length < NICKNAME_MIN_LENGTH || value.length > NICKNAME_MAX_LENGTH) {
    return {
      isValid: false,
      message: `닉네임은 ${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자여야 합니다.`,
    };
  }
  if (!NICKNAME_PATTERN.test(value)) {
    return {
      isValid: false,
      message: '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.',
    };
  }
  return valid;
}

/** Maps a text field name to its validator so the hook stays declarative. */
const TEXT_VALIDATORS: Record<TextFieldName, (value: string) => ValidationResult> = {
  email: validateEmail,
  password: validatePassword,
  nickname: validateNickname,
};

export function validateField(name: TextFieldName, value: string): ValidationResult {
  return TEXT_VALIDATORS[name](value);
}

/**
 * Heuristic password strength used purely for UX feedback (not gating submit).
 * Scores length and character-class variety into 4 buckets.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (password.length === 0) {
    return { level: 'empty', score: 0, label: '' };
  }

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;

  const variety =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^a-zA-Z0-9]/.test(password));
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;

  // Cap at 4 for the four meter segments.
  score = Math.min(score, 4);

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { level: 'weak', score: 1, label: '약함' };
  }

  const byScore: Record<number, PasswordStrengthResult> = {
    0: { level: 'weak', score: 1, label: '약함' },
    1: { level: 'weak', score: 1, label: '약함' },
    2: { level: 'fair', score: 2, label: '보통' },
    3: { level: 'good', score: 3, label: '안전' },
    4: { level: 'strong', score: 4, label: '매우 안전' },
  };
  return byScore[score] ?? byScore[1]!;
}

/** True only when all text fields are valid AND required terms are checked. */
export function isFormSubmittable(values: SignupValues): boolean {
  return getFirstInvalidField(values) === null;
}

/**
 * Returns the first field (in visual/tab order) that blocks submission, or
 * null when the form is fully valid. Drives focus management on failed submit.
 */
export function getFirstInvalidField(values: SignupValues): FocusableField | null {
  if (!validateEmail(values.email).isValid) return 'email';
  if (!validatePassword(values.password).isValid) return 'password';
  if (!validateNickname(values.nickname).isValid) return 'nickname';
  if (!values.agreeService) return 'agreeService';
  if (!values.agreePrivacy) return 'agreePrivacy';
  return null;
}
