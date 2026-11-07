import { AddEmailsForm, RemoveEmailButton, StartDateForm, VideoReview } from "@/app/admin/AdminForms";
import { AdminView } from "@/app/admin/AdminView";
import { summarizeParticipant } from "@/lib/domain/admin";
import { DEFAULT_START_DATE, dateForDay, programState } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import { devAddEmails, devRemoveEmail, devReviewVideo, devUpdateStartDate } from "../actions-admin";

const START = DEFAULT_START_DATE;
const TODAY = dateForDay(START, 9);

function checkinsUntil(lastDay: number): Checkin[] {
  return Array.from({ length: lastDay }, (_, i) => ({ date: dateForDay(START, i + 1), slot: "body" as const, level: "full" as const }));
}

const people = [
  { id: "1", email: "lucia@ejemplo.com", name: "Lucía", checkins: checkinsUntil(9), videos: [{ status: "approved" as const }] },
  { id: "2", email: "marcos@ejemplo.com", name: "Marcos", checkins: checkinsUntil(5), videos: [] },
  { id: "3", email: "irene@ejemplo.com", name: "Irene", checkins: checkinsUntil(8), videos: [{ status: "pending" as const }] },
  { id: "4", email: "dani@ejemplo.com", name: null, checkins: [], videos: [] },
];

export default function DevAdmin() {
  const rows = people.map((p) => summarizeParticipant({ ...p, planReady: Boolean(p.name) }, START, TODAY, true));
  return (
    <AdminView
      state={programState(START, TODAY)}
      start={START}
      rows={rows}
      allowed={[
        { email: "admin@ejemplo.com", role: "admin", note: "Administración", registered: true },
        ...people.map((p) => ({ email: p.email, role: "participant", note: p.id === "2" ? "Pagado por Bizum" : null, registered: true })),
        { email: "pendiente@ejemplo.com", role: "participant", note: null, registered: false },
      ]}
      videos={[{ id: 1, week: 2, url: "https://www.instagram.com/reel/ejemplo", who: "Irene", submittedAt: TODAY }]}
      forms={{
        addEmails: <AddEmailsForm action={devAddEmails} />,
        startDate: <StartDateForm value={START} action={devUpdateStartDate} />,
        remove: (email) => <RemoveEmailButton email={email} action={devRemoveEmail} />,
        review: (id) => <VideoReview id={id} action={devReviewVideo} />,
      }}
    />
  );
}
