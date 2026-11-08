import s from "./PdfLink.module.css";

/** Descarga de "Tu sistema" en PDF (se genera en el momento con lo último escrito). */
export function PdfLink({ href = "/sistema/pdf" }: { href?: string }) {
  return (
    <a href={href} className={s.link} download>
      <span className={s.icon} aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3v9.5M6 9l4 4 4-4M4 16.5h12" />
        </svg>
      </span>
      <span className={s.text}>
        <span className={s.title}>Descargar en PDF</span>
        <span className={s.sub}>Tu sistema es tuyo: guárdalo, imprímelo o compártelo.</span>
      </span>
    </a>
  );
}
