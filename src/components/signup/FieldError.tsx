import { AlertCircleIcon } from './icons';

interface FieldErrorProps {
  id: string;
  message: string | undefined;
}

/**
 * Live-region error text wired to an input via aria-describedby.
 * Renders nothing (but keeps the element for the live region) when valid.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="mt-1.5 flex min-h-[1.25rem] items-center gap-1 text-sm text-red-600"
    >
      {message ? (
        <span className="flex animate-fade-in items-center gap-1">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {message}
        </span>
      ) : null}
    </p>
  );
}
