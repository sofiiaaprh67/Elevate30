import { writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import type { SystemPiece } from "@/lib/domain/system";

vi.mock("server-only", () => ({}));

const pieces: SystemPiece[] = [
  { id: "why", title: "Tu porqué", day: 1, status: "done", items: [{ label: "Por qué empiezas", text: "Quiero dejar de empezar de cero cada lunes → y demostrarme que puedo 💪. Lo que haría que mereciera la pena: llegar al día 30 con mi rutina de estudio en marcha." }] },
  { id: "bad_days", title: "Tu plan para los días malos", day: 8, status: "done", items: [
    { label: "Si…", text: "Si llego a casa tarde y sin energía" },
    { label: "Entonces…", text: "Hago solo el mínimo de mi ancla: abrir los apuntes y leer una página.\nY me voy a dormir sin culpa." },
  ] },
  { id: "hard_week", title: "Tu modo semana difícil", day: 16, status: "pending", items: [{ label: "Plan", text: "" }] },
  { id: "letter", title: "Tu carta al día 1", day: 29, status: "locked", items: [{ label: "Carta", text: "" }] },
];

describe("Tu sistema en PDF", () => {
  it("genera un PDF con portada y piezas, sin fallar con caracteres raros", async () => {
    const { renderSystemPdf } = await import("@/lib/pdf/system-pdf");
    const bytes = await renderSystemPdf({
      name: "Lucía Martínez",
      startLabel: "11 de enero de 2027",
      endLabel: "9 de febrero de 2027",
      generatedLabel: "8 de noviembre de 2026",
      daysCounted: 17,
      anchorName: "Bloque de estudio",
      pieces,
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
    expect(doc.getTitle()).toContain("Lucía");
    if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT, bytes);
  });
});
