"use client";

import { useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import { swapHabit } from "@/lib/data/habits";

export function SwapHabitButton({ slot, habitName }: { slot: "body" | "mind"; habitName: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <PillButton
        type="button"
        variant="ghost"
        size="sm"
        block
        loading={pending}
        aria-label={`Cambiar hábito: ${habitName}`}
        onClick={() =>
          start(async () => {
            const res = await swapHabit(slot);
            setError(res.ok ? null : res.error);
          })
        }
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 6h9l-2.5-2.5M13.5 10h-9l2.5 2.5" />
        </svg>
        Cambiar hábito
      </PillButton>
      {error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14, marginTop: 8 }}>
          {error}
        </p>
      ) : null}
    </>
  );
}
