import type { ComponentProps, ReactNode } from "react";
import s from "./ui.module.css";

export function Card({
  tone = "graphite",
  className,
  ...rest
}: ComponentProps<"section"> & { tone?: "graphite" | "carbon" }) {
  return (
    <section
      className={[s.card, tone === "carbon" && s.cardCarbon, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

export function Notice({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div className={[s.notice, tone === "error" && s.noticeError].filter(Boolean).join(" ")} role={tone === "error" ? "alert" : "status"}>
      {title ? <p className={s.noticeTitle}>{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
