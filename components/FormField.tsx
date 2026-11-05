import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from "react";
import { AlertIcon } from "./icons";

const controlBase =
  "block w-full rounded-lg border bg-surface px-3.5 text-base text-primary placeholder:text-secondary/70 " +
  "transition-[border-color,box-shadow] duration-150 outline-none " +
  "disabled:bg-subtle disabled:text-secondary disabled:cursor-not-allowed";

function controlClass(hasError: boolean, extra: string) {
  const state = hasError
    ? "border-2 border-error shadow-[0_0_0_3px_#EF444418]"
    : "border-border hover:border-primary focus:border-2 focus:border-primary focus:shadow-[0_0_0_3px_#0F172A18]";
  return `${controlBase} ${state} ${extra}`;
}

interface ShellProps {
  id: string;
  label: string;
  error?: string;
  helper?: ReactNode;
  /** Contenuto a destra sotto il campo (es. contatore caratteri). */
  aside?: ReactNode;
}

function a11yProps({ id, error, helper }: ShellProps) {
  const describedBy = [error && `${id}-error`, helper && `${id}-helper`]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}

function FieldShell({ id, label, error, helper, aside, children }: ShellProps & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-primary">
        {label}
      </label>
      {children}
      {(error || helper || aside) && (
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {error && (
              <p id={`${id}-error`} className="flex items-start gap-1 text-xs text-error-text">
                <AlertIcon width={14} height={14} className="mt-px shrink-0" />
                <span>{error}</span>
              </p>
            )}
            {helper && (
              <p id={`${id}-helper`} className="text-xs text-muted">
                {helper}
              </p>
            )}
          </div>
          {aside}
        </div>
      )}
    </div>
  );
}

type TextFieldProps = ShellProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { ref?: Ref<HTMLInputElement> };

export function TextField({ id, label, error, helper, aside, className = "", ...rest }: TextFieldProps) {
  const shell = { id, label, error, helper, aside };
  return (
    <FieldShell {...shell}>
      <input {...rest} {...a11yProps(shell)} className={controlClass(!!error, `h-12 ${className}`)} />
    </FieldShell>
  );
}

type TextAreaFieldProps = ShellProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & { ref?: Ref<HTMLTextAreaElement> };

export function TextAreaField({ id, label, error, helper, aside, className = "", ...rest }: TextAreaFieldProps) {
  const shell = { id, label, error, helper, aside };
  return (
    <FieldShell {...shell}>
      <textarea
        {...rest}
        {...a11yProps(shell)}
        className={controlClass(!!error, `min-h-44 resize-y py-3 leading-relaxed ${className}`)}
      />
    </FieldShell>
  );
}
