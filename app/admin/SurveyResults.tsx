import { SURVEYS } from "@/content/surveys";
import a from "./admin.module.css";
import s from "./pilot.module.css";

export type SurveyResponse = {
  survey: "d7" | "d15" | "d30";
  who: string;
  email: string;
  answers: Record<string, string>;
  testimonialOk: boolean;
  interviewOk: boolean;
};

const mailto = (emails: string[], subject: string) =>
  `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(subject)}`;

/** Resultados de las encuestas: números arriba y respuestas escritas debajo, con quién las escribió. */
export function SurveyResults({ responses }: { responses: SurveyResponse[] }) {
  const waitlist = responses.filter((r) => r.survey === "d30" && r.answers.wants_more === "yes");
  const interviews = responses.filter((r) => r.survey === "d15" && r.interviewOk);

  return (
    <div className={s.surveys}>
      {waitlist.length || interviews.length ? (
        <div className={s.callouts}>
          {waitlist.length ? (
            <div className={s.callout}>
              <p className={s.calloutTitle}>Lista de espera del plan de 90 días: {waitlist.length}</p>
              <p className={a.sub}>{waitlist.map((r) => r.who).join(", ")}</p>
              <a className={s.calloutLink} href={mailto(waitlist.map((r) => r.email), "ELEVATE 90")}>
                Escribirles (en copia oculta)
              </a>
            </div>
          ) : null}
          {interviews.length ? (
            <div className={s.callout}>
              <p className={s.calloutTitle}>Se ofrecen para una entrevista: {interviews.length}</p>
              <p className={a.sub}>{interviews.map((r) => r.who).join(", ")}</p>
              <a className={s.calloutLink} href={mailto(interviews.map((r) => r.email), "Entrevista ELEVATE 30 (20 minutos)")}>
                Escribirles (en copia oculta)
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {SURVEYS.map((survey) => {
        const rows = responses.filter((r) => r.survey === survey.id);
        return (
          <details key={survey.id} className={s.survey}>
            <summary className={s.surveySummary}>
              <span>
                Día {survey.day}: {survey.title}
              </span>
              <span className={s.surveyCount}>
                {rows.length} {rows.length === 1 ? "respuesta" : "respuestas"}
              </span>
            </summary>
            {rows.length ? (
              <div className={s.surveyBody}>
                {survey.questions.map((q) => {
                  const answered = rows.filter((r) => r.answers[q.id]);
                  if (q.kind === "text") {
                    return (
                      <section key={q.id} className={s.question}>
                        <h4 className={s.questionTitle}>{q.label}</h4>
                        {answered.length ? (
                          <ul className={s.quotes}>
                            {answered.map((r) => (
                              <li key={r.email}>
                                <p>{r.answers[q.id]}</p>
                                <span className={a.sub}>
                                  {r.who}
                                  {q.id === "frase" ? (r.testimonialOk ? " · se puede usar como testimonio" : " · sin permiso para publicarla") : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={a.sub}>Sin respuestas.</p>
                        )}
                      </section>
                    );
                  }
                  const options =
                    q.kind === "scale"
                      ? Array.from({ length: q.max - q.min + 1 }, (_, i) => ({ value: String(q.min + i), label: String(q.min + i) }))
                      : q.options;
                  const avg =
                    q.kind === "scale" && answered.length
                      ? (answered.reduce((t, r) => t + Number(r.answers[q.id]), 0) / answered.length).toFixed(1).replace(".", ",")
                      : null;
                  return (
                    <section key={q.id} className={s.question}>
                      <h4 className={s.questionTitle}>
                        {q.label}
                        {avg ? <span className={s.avg}> Media: {avg}</span> : null}
                      </h4>
                      <ul className={s.dist}>
                        {options.map((o) => {
                          const n = answered.filter((r) => r.answers[q.id] === o.value).length;
                          const w = answered.length ? Math.round((n / answered.length) * 100) : 0;
                          return (
                            <li key={o.value} data-scale={q.kind === "scale" || undefined}>
                              <span className={s.distLabel}>{o.label}</span>
                              <span className={s.distBar} aria-hidden="true">
                                <span style={{ width: `${w}%` }} />
                              </span>
                              <span className={s.distNum}>{n}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            ) : (
              <p className={s.empty}>Nadie la ha respondido todavía.</p>
            )}
          </details>
        );
      })}
    </div>
  );
}
