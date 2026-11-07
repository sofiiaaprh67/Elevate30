import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import s from "./ui.module.css";

type Props = ComponentProps<"input"> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
};

export function Field({ label, hint, error, hideLabel, id, className, ...rest }: Props) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={s.field}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : s.label}>
        {label}
      </label>
      <input
        id={inputId}
        className={[s.input, className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className={s.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  children,
  className,
  ...rest
}: ComponentProps<"input"> & { children: ReactNode }) {
  return (
    <label className={[s.check, className].filter(Boolean).join(" ")}>
      <input type="checkbox" {...rest} />
      <span className={s.box} aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </span>
      <span className={s.checkText}>{children}</span>
    </label>
  );
}
