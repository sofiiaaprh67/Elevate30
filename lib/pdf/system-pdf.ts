import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { SystemPiece } from "@/lib/domain/system";
import { ISOTIPO_PNG, WORDMARK_PNG } from "./brand-images";

/**
 * "Tu sistema" en PDF (A4): portada oscura con la marca y, después,
 * las piezas escritas en páginas claras para leer o imprimir.
 * Usa Helvetica (incluida en todos los lectores de PDF).
 */
export type SystemPdfInput = {
  name: string;
  /** "11 de enero de 2027" */
  startLabel: string;
  endLabel: string;
  generatedLabel: string;
  daysCounted: number;
  anchorName: string | null;
  pieces: SystemPiece[];
};

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const C = {
  obsidian: hex("#03060c"),
  carbon: hex("#0b1320"),
  steel: hex("#1a2536"),
  ash: hex("#94a3b8"),
  porcelain: hex("#f8fafc"),
  blue: hex("#0066ff"),
  ink: hex("#0b1320"),
  body: hex("#1e293b"),
  muted: hex("#475569"),
  rule: hex("#e2e8f0"),
  tint: hex("#f1f5f9"),
};

const W = 595.28;
const H = 841.89;
const M = 56;

const REPLACE: Record<string, string> = { "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "−": "-", "✓": "", "\t": " " };

/** Deja solo los caracteres que Helvetica sabe dibujar (WinAnsi: tildes, ñ, ¿¡, «», comillas…). */
function sanitizer(font: PDFFont) {
  const ok = new Set(font.getCharacterSet());
  return (text: string) =>
    Array.from(text.replace(/\r/g, ""))
      .map((ch) => REPLACE[ch] ?? ch)
      .join("")
      .split("")
      .filter((ch) => ch === "\n" || ok.has(ch.codePointAt(0)!))
      .join("")
      // Lo que se quita (emojis…) puede dejar espacios sueltos
      .replace(/[  ]+([.,;:!?)»])/g, "$1")
      .replace(/ {2,}/g, " ");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      // Palabra más larga que la línea (por ejemplo, un enlace): se parte
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

/** Barra con el degradado de la marca (azul → cian), en tiras finas. */
function gradientBar(page: PDFPage, x: number, y: number, width: number, height: number) {
  const steps = 48;
  const w = width / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    page.drawRectangle({ x: x + i * w, y, width: w + 0.4, height, color: rgb(0, (102 + (217 - 102) * t) / 255, 1) });
  }
}

export async function renderSystemPdf(input: SystemPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Tu sistema · ${input.name} · ELEVATE 30`);
  doc.setAuthor("ELEVATE 30");
  doc.setSubject("Tu sistema de hábitos, escrito durante los 30 días");
  doc.setLanguage("es-ES");
  doc.setCreator("ELEVATE 30");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const clean = sanitizer(regular);
  const wordmark = await doc.embedPng(Buffer.from(WORDMARK_PNG, "base64"));
  const isotipo = await doc.embedPng(Buffer.from(ISOTIPO_PNG, "base64"));

  const written = input.pieces.filter((p) => p.status === "done");
  const missing = input.pieces.filter((p) => p.status !== "done");

  // ------------------------------------------------------------------
  // Portada
  // ------------------------------------------------------------------
  const cover = doc.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.obsidian });
  // Halo azul muy suave arriba a la derecha
  for (let r = 260; r > 0; r -= 20) {
    cover.drawCircle({ x: W - 40, y: H - 60, size: r, color: C.blue, opacity: 0.018 });
  }
  const wmW = 150;
  cover.drawImage(wordmark, { x: M, y: H - M - (wmW * wordmark.height) / wordmark.width, width: wmW, height: (wmW * wordmark.height) / wordmark.width });

  let y = H * 0.56;
  gradientBar(cover, M, y + 70, 120, 4);
  cover.drawText("Tu sistema", { x: M, y, size: 58, font: bold, color: C.porcelain });
  y -= 44;
  for (const line of wrap(clean(input.name), bold, 22, W - 2 * M)) {
    cover.drawText(line, { x: M, y, size: 22, font: bold, color: C.porcelain });
    y -= 28;
  }
  y -= 6;
  cover.drawText(clean(`Del ${input.startLabel} al ${input.endLabel}`), { x: M, y, size: 12, font: regular, color: C.ash });
  y -= 18;
  cover.drawText("Lo que has escrito en tus 30 días, para seguir mucho después.", { x: M, y, size: 12, font: regular, color: C.ash });

  // Datos
  const stats: [string, string][] = [
    ["Días que cuentan", `${input.daysCounted} de 30`],
    ["Piezas escritas", `${written.length} de ${input.pieces.length}`],
  ];
  if (input.anchorName) stats.push(["Tu ancla", input.anchorName]);
  const colW = (W - 2 * M) / 3;
  stats.forEach(([label, value], i) => {
    const x = M + i * colW;
    cover.drawLine({ start: { x, y: 210 }, end: { x: x + colW - 16, y: 210 }, thickness: 1, color: C.steel });
    cover.drawText(clean(label), { x, y: 190, size: 10, font: regular, color: C.ash });
    const lines = wrap(clean(value), bold, 16, colW - 20).slice(0, 2);
    lines.forEach((l, j) => cover.drawText(l, { x, y: 168 - j * 19, size: 16, font: bold, color: C.porcelain }));
  });

  cover.drawImage(isotipo, { x: M, y: M - 4, width: 22, height: (22 * isotipo.height) / isotipo.width });
  cover.drawText("Progress is built.", { x: M + 32, y: M + 2, size: 11, font: bold, color: C.porcelain });
  const gen = clean(`Generado el ${input.generatedLabel}`);
  cover.drawText(gen, { x: W - M - regular.widthOfTextAtSize(gen, 10), y: M + 2, size: 10, font: regular, color: C.ash });

  // ------------------------------------------------------------------
  // Piezas
  // ------------------------------------------------------------------
  const contentW = W - 2 * M;
  const bottom = M + 28;
  let page = doc.addPage([W, H]);
  y = H - M;

  const header = (p: PDFPage) => {
    p.drawText("ELEVATE 30 · Tu sistema", { x: M, y: H - 34, size: 9, font: regular, color: C.muted });
    const who = clean(input.name);
    p.drawText(who, { x: W - M - regular.widthOfTextAtSize(who, 9), y: H - 34, size: 9, font: regular, color: C.muted });
  };
  header(page);
  y = H - M - 24;

  const newPage = () => {
    page = doc.addPage([W, H]);
    header(page);
    y = H - M - 10;
  };
  const ensure = (h: number) => {
    if (y - h < bottom) newPage();
  };

  if (!written.length) {
    page.drawText("Aún no has escrito ninguna pieza.", { x: M, y, size: 16, font: bold, color: C.ink });
    y -= 22;
    page.drawText("Se escriben en las lecciones. Vuelve a descargar el PDF cuando tengas alguna.", {
      x: M,
      y,
      size: 11,
      font: regular,
      color: C.muted,
    });
    y -= 30;
  }

  written.forEach((p, idx) => {
    const titleLines = wrap(clean(p.title), bold, 18, contentW);
    // Que el título no se quede solo al final de una página
    ensure(16 + titleLines.length * 23 + 50);
    if (idx > 0) {
      page.drawLine({ start: { x: M, y: y + 14 }, end: { x: W - M, y: y + 14 }, thickness: 0.75, color: C.rule });
    }
    page.drawText(`Día ${p.day}`, { x: M, y, size: 9.5, font: bold, color: C.blue });
    y -= 22;
    for (const l of titleLines) {
      page.drawText(l, { x: M, y, size: 18, font: bold, color: C.ink });
      y -= 23;
    }
    y -= 4;
    for (const item of p.items) {
      const label = clean(item.label);
      const lines = wrap(clean(item.text), regular, 11, contentW - 14);
      ensure(16 + Math.min(lines.length, 3) * 16);
      page.drawText(label, { x: M, y, size: 9.5, font: bold, color: C.muted });
      y -= 16;
      for (const l of lines) {
        ensure(16);
        // Filete de marca a la izquierda del texto
        page.drawRectangle({ x: M, y: y - 4.5, width: 2, height: 16.8, color: C.blue, opacity: 0.35 });
        page.drawText(l, { x: M + 14, y, size: 11, font: regular, color: C.body });
        y -= 16;
      }
      y -= 10;
    }
    y -= 26;
  });

  if (missing.length) {
    ensure(60 + missing.length * 18);
    page.drawRectangle({ x: M, y: y - missing.length * 18 - 34, width: contentW, height: missing.length * 18 + 56, color: C.tint });
    page.drawText("Por escribir", { x: M + 18, y: y, size: 12, font: bold, color: C.ink });
    y -= 20;
    for (const p of missing) {
      page.drawText(clean(`Día ${p.day}  ·  ${p.title}`), { x: M + 18, y, size: 10.5, font: regular, color: C.muted });
      y -= 18;
    }
    page.drawText("Complétalas en la app: el PDF se genera de nuevo cada vez que lo descargas.", {
      x: M + 18,
      y: y - 4,
      size: 9.5,
      font: italic,
      color: C.muted,
    });
    y -= 40;
  }

  // Números de página (sin contar la portada)
  const pages = doc.getPages().slice(1);
  pages.forEach((p, i) => {
    const label = `${i + 1} de ${pages.length}`;
    p.drawText(label, { x: W - M - regular.widthOfTextAtSize(label, 9), y: 30, size: 9, font: regular, color: C.muted });
    p.drawText("Progress is built.", { x: M, y: 30, size: 9, font: bold, color: C.muted });
  });

  return doc.save();
}
