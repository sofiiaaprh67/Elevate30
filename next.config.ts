import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Todas las pantallas dependen de la sesión, así que usamos el modelo de
  // renderizado dinámico clásico (sin Cache Components).
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Cabeceras básicas de seguridad para todas las páginas
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // El service worker siempre se revisa para que las actualizaciones lleguen enseguida
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
