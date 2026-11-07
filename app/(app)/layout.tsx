import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/lib/auth";
import s from "./shell.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <main id="contenido" className={s.main}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
