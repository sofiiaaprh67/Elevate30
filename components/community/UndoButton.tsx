"use client";

import { useTransition } from "react";
import type { setBlocked, setMuted } from "@/lib/data/community-actions";
import s from "./community.module.css";

/** Deshacer un silencio o un bloqueo desde Perfil. */
export function UndoButton({
  otherId,
  action,
  label,
}: {
  otherId: string;
  action: typeof setMuted | typeof setBlocked;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={s.textButton}
      disabled={pending}
      onClick={() => start(async () => void (await action(otherId, false)))}
    >
      {label}
    </button>
  );
}
