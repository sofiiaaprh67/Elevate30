import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { formatLongDate } from "@/lib/domain/program";
import { signCommitment } from "./actions";
import { CommitView } from "./CommitView";
import s from "./compromiso.module.css";

export const metadata: Metadata = { title: "Tu compromiso" };

export default async function CompromisoPage() {
  const user = await requireUser();
  if (user.committedAt) redirect("/hoy");
  const [intake, plan] = await Promise.all([getIntake(user.id), getPlan(user.id)]);
  if (!user.programStart || !intake?.completed || !plan || !user.anchorSlot) redirect("/");

  const anchor = plan[user.anchorSlot];
  return (
    <main id="contenido" className={s.page}>
      <CommitView
        name={intake.draft.name ?? ""}
        startText={formatLongDate(user.programStart)}
        anchorName={anchor.name}
        anchorMin={anchor.levels.min}
        action={signCommitment}
      />
    </main>
  );
}
