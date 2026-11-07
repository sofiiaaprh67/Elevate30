import { notFound } from "next/navigation";

/** Vistas previas con datos de ejemplo. Solo existen en desarrollo. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return children;
}
