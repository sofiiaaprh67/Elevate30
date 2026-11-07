import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import s from "./ui.module.css";

type Variant = "blue" | "ghost";
type Size = "md" | "sm";

type Common = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  arrow?: boolean;
  children: ReactNode;
};

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [s.pill, s[variant], size === "sm" && s.sm, block && s.block, extra]
    .filter(Boolean)
    .join(" ");
}

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function PillButton({
  variant = "blue",
  size = "md",
  block,
  arrow,
  loading,
  className,
  children,
  disabled,
  ...rest
}: Common & ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button
      className={classes(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
      {loading ? <span className={s.spinner} aria-hidden="true" /> : arrow ? <Arrow /> : null}
    </button>
  );
}

export function PillLink({
  variant = "blue",
  size = "md",
  block,
  arrow,
  className,
  children,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={classes(variant, size, block, className)} {...rest}>
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}
