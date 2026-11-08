import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { getIntake, getPlan } from "@/lib/data/intake";
import { logEvent } from "@/lib/data/measure";
import { getAllEntries, getCheckins } from "@/lib/data/progress";
import { toIntake } from "@/lib/domain/intake";
import { currentProgramDay, dateForDay, PROGRAM_DAYS, todayInMadrid } from "@/lib/domain/program";
import { daysDone, groupByDate } from "@/lib/domain/stats";
import { buildSystem } from "@/lib/domain/system";
import { renderSystemPdf } from "@/lib/pdf/system-pdf";
import { getStartDate } from "@/lib/settings";

export const dynamic = "force-dynamic";

const longDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (d: string) => longDate.format(new Date(`${d}T00:00:00Z`));

/** Descarga "Tu sistema" en PDF, siempre con lo último que se ha escrito. */
export async function GET() {
  const user = await requireUser();
  const [intakeData, plan, entries, start, checkins] = await Promise.all([
    getIntake(user.id),
    getPlan(user.id),
    getAllEntries(user.id),
    getStartDate(user.id),
    getCheckins(user.id),
  ]);
  const intake = intakeData?.completed ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) return NextResponse.redirect(new URL("/cuestionario", env.siteUrl));

  const today = todayInMadrid();
  const day = currentProgramDay(start, today);
  const pieces = buildSystem({ entries, intake, plan, start, anchor: user.anchorSlot, currentDay: day });
  const end = dateForDay(start, PROGRAM_DAYS);

  const pdf = await renderSystemPdf({
    name: intake.name,
    startLabel: fmt(start),
    endLabel: fmt(end),
    generatedLabel: fmt(today),
    daysCounted: daysDone(groupByDate(checkins), start, today < end ? today : end),
    anchorName: user.anchorSlot ? plan[user.anchorSlot].name : null,
    pieces,
  });
  await logEvent("system_pdf", Math.min(day, 31));

  const slug = intake.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");
  const file = `ELEVATE30-Tu-sistema${slug ? `-${slug}` : ""}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
