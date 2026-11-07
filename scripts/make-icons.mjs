// Genera los iconos de la PWA a partir del isotipo de ELEVATE.
// Uso: node scripts/make-icons.mjs [ruta-del-isotipo]
// Con un isotipo de 1024 px o más (o SVG) los iconos salen más nítidos.
import sharp from "sharp";

const SOURCE = process.argv[2] ?? "public/brand/isotipo.webp";
const BG = { r: 3, g: 6, b: 12, alpha: 1 }; // --obsidian

async function icon(size, scale, out) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SOURCE).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("✓", out);
}

await icon(192, 0.7, "public/icons/icon-192.png");
await icon(512, 0.7, "public/icons/icon-512.png");
await icon(512, 0.56, "public/icons/maskable-512.png"); // zona segura del 80 %
await icon(180, 0.68, "public/icons/apple-touch-icon.png");
await icon(32, 0.86, "public/icons/favicon-32.png");
