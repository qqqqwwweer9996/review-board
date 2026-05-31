import { useCallback, useMemo, useState, type FormEvent } from 'react';
import type {
  FocusableField,
  SignupErrors,
  SignupValues,
  TermsFieldName,
  TextFieldName,
  TouchedState,
} from '@/types/signup';
import { getFirstInvalidField, validateField } from '@/utils/validation';

const INITIAL_VALUES: SignupValues = {
  email: '',
  password: '',
  nickname: '',
  agreeService: false,
  agreePrivacy: false,
  agreeMarketing: false,
};

const TEXT_FIELDS: readonly TextFieldName[] = ['email', 'password', 'nickname'];

const GENERIC_SUBMIT_ERROR =
  '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

export interface UseSignupFormOptions {
  /** Called with valid values on submit. May throw/reject to surface an error. */
  onValidSubmit?: (values: SignupValues) => void | Promise<void>;
  /** Called with the first blocking field when the user submits an invalid form. */
  onInvalidSubmit?: (firstInvalidField: FocusableField) => void;
}

export interface UseSignupFormReturn {
  values: SignupValues;
  /** Errors the UI should display now (respects touched / submit state). */
  errors: SignupErrors;
  touched: TouchedState;
  isSubmittable: boolean;
  isSubmitting: boolean;
  submitSucceeded: boolean;
  /** Top-level error message from a failed submit (e.g. network/server error). */
  submitError: string | null;
  handleTextChange: (name: TextFieldName, value: string) => void;
  handleTextBlur: (name: TextFieldName) => void;
  handleTermsChange: (name: TermsFieldName, checked: boolean) => void;
  toggleAllTerms: (checked: boolean) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  reset: () => void;
}

/**
 * Owns all signup form state and the real-time validation lifecycle.
 *
 * Validation runs on every keystroke, but a field's message is only *shown*
 * once the user has blurred it (or attempted submit). This gives instant
 * feedback while typing in a known-bad field without nagging on first focus.
 */
export function useSignupForm(options: UseSignupFormOptions = {}): UseSignupFormReturn {
  const { onValidSubmit, onInvalidSubmit } = options;

  const [values, setValues] = useState<SignupValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live validation results for every text field, recomputed on value change.
  const liveErrors = useMemo<SignupErrors>(() => {
    const next: SignupErrors = {};
    for (const field of TEXT_FIELDS) {
      const result = validateField(field, values[field]);
      if (!result.isValid && result.message) {
        next[field] = result.message;
      }
    }
    return next;
  }, [values]);

  // Only surface an error once the field is relevant to the user.
  const errors = useMemo<SignupErrors>(() => {
    const visible: SignupErrors = {};
    for (const field of TEXT_FIELDS) {
      const message = liveErrors[field];
      if (message && (touched[field] || submitAttempted)) {
        visible[field] = message;
      }
    }
    return visible;
  }, [liveErrors, touched, submitAttempted]);

  const isSubmittable = useMemo(() => getFirstInvalidField(values) === null, [values]);

  const handleTextChange = useCallback((name: TextFieldName, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setSubmitSucceeded(false);
    setSubmitError(null);
  }, []);

  const handleTextBlur = useCallback((name: TextFieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleTermsChange = useCallback((name: TermsFieldName, checked: boolean) => {
    setValues((prev) => ({ ...prev, [name]: checked }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setSubmitSucceeded(false);
    setSubmitError(null);
  }, []);

  const toggleAllTerms = useCallback((checked: boolean) => {
    setValues((prev) => ({
      ...prev,
      agreeService: checked,
      agreePrivacy: checked,
      agreeMarketing: checked,
    }));
    setTouched((prev) => ({
      ...prev,
      agreeService: true,
      agreePrivacy: true,
      agreeMarketing: true,
    }));
    setSubmitSucceeded(false);
    setSubmitError(null);
  }, []);

  const reset = useCallback(() => {
    setValues(INITIAL_VALUES);
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
    setSubmitSucceeded(false);
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitAttempted(true);
      setSubmitError(null);

      const firstInvalid = getFirstInvalidField(values);
      if (firstInvalid) {
        // Reveal every outstanding error and hand focus to the first blocker.
        setTouched({
          email: true,
          password: true,
          nickname: true,
          agreeService: true,
          agreePrivacy: true,
        });
        onInvalidSubmit?.(firstInvalid);
        return;
      }

      setIsSubmitting(true);
      try {
        await onValidSubmit?.(values);
        setSubmitSucceeded(true);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : GENERIC_SUBMIT_ERROR);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onValidSubmit, onInvalidSubmit],
  );

  return {
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
    reset,
  };
}
