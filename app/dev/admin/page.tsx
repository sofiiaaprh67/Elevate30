import { AddEmailsForm, RefundToggle, RemoveEmailButton, StartDateForm, VideoReview } from "@/app/admin/AdminForms";
import { CohortTable, LessonBars, LevelBars, MetricsGrid } from "@/app/admin/Metrics";
import { SurveyResults } from "@/app/admin/SurveyResults";
import p from "@/app/admin/pilot.module.css";
import { cohorts, lessonStats, levelsByWeek, pilotMetrics, type Person } from "@/lib/domain/metrics";
import { devSetRefund } from "../actions-measure";
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

const levels = ["full", "half", "min", "skip"] as const;
const mixed = (days: number[], start = START): Checkin[] =>
  days.map((d, i) => ({ date: dateForDay(start, d), slot: "mind" as const, level: levels[i % 4] }));

export default function DevAdmin() {
  const rows = people.map((x) => summarizeParticipant({ ...x, planReady: Boolean(x.name) }, START, TODAY, true));
  const pilotPeople: Person[] = [
    { id: "1", start: START, committed: true, checkins: [...checkinsUntil(9), ...mixed([1, 2, 3, 8])] },
    { id: "2", start: START, committed: true, checkins: checkinsUntil(5) },
    { id: "3", start: "2027-01-01", committed: true, checkins: mixed([1, 2, 4, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16, 17, 18], "2027-01-01") },
    { id: "4", start: null, committed: false, checkins: [] },
  ];
  const pilot = (
    <div className={p.pilot}>
      <MetricsGrid
        metrics={pilotMetrics({
          today: TODAY,
          people: pilotPeople,
          seats: 18,
          surveys: [{ userId: "3", survey: "d15", nps: null, wantsMore: null }],
          communityActivity: [{ userId: "1", date: TODAY }],
          validReports: [],
          refunds: 1,
        })}
      />
      <h3 className={p.subTitle}>Por fecha de inicio</h3>
      <CohortTable rows={cohorts(pilotPeople, TODAY)} />
      <h3 className={p.subTitle}>Reparto de niveles</h3>
      <LevelBars weeks={levelsByWeek(pilotPeople)} />
      <h3 className={p.subTitle}>Lecciones leídas hasta el final y con la acción hecha</h3>
      <LessonBars lessons={lessonStats(pilotPeople, TODAY, [{ userId: "1", day: 1 }, { userId: "2", day: 1 }, { userId: "1", day: 2 }], [{ userId: "1", day: 1 }])} />
    </div>
  );
  return (
    <AdminView
      pilot={pilot}
      surveys={
        <SurveyResults
          responses={[
            { survey: "d7", who: "Lucía", email: "lucia@ejemplo.com", answers: { falta: "Un recordatorio a mediodía.", frenado: "El viernes salí y no hice nada." }, testimonialOk: false, interviewOk: false },
            { survey: "d7", who: "Marcos", email: "marcos@ejemplo.com", answers: { sobra: "Nada por ahora." }, testimonialOk: false, interviewOk: false },
            { survey: "d15", who: "Irene", email: "irene@ejemplo.com", answers: { ayuda: "4", mejor: "levels", minimo: "yes", frase: "Ya no empiezo de cero los lunes." }, testimonialOk: true, interviewOk: true },
          ]}
        />
      }
      extra={Object.fromEntries(
        people.map((x, i) => [
          x.id,
          {
            day: x.name ? "Día 9" : "Sin Día 0",
            lastOpen: i === 1 ? "14 ene" : x.name ? "hoy" : null,
            counted: x.checkins.length,
            refund: <RefundToggle userId={x.id} on={x.id === "2"} name={x.name ?? x.email} action={devSetRefund} />,
          },
        ]),
      )}
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
