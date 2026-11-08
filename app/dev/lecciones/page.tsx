import { AppBar } from "@/components/AppBar";
import { LessonsIndexView } from "@/app/(app)/lecciones/LessonsIndexView";
import s from "@/app/(app)/shell.module.css";
import { BottomNav } from "@/components/BottomNav";

export default async function DevLecciones({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { dia } = await searchParams;
  const day = Math.min(Math.max(Number(dia) || 9, 0), 31);
  const doneDays = [1, 2, 3, 5, 6, 8].filter((d) => d < day);
  return (
    <>
      <main id="contenido" className={s.main}>
        <AppBar name="Lucía" profileHref="/dev/perfil" homeHref="/dev/hoy" />
        <LessonsIndexView currentDay={day} doneDays={doneDays} start="2027-01-11" href={(d) => `/dev/hoy?dia=${d}`} />
      </main>
      <BottomNav />
    </>
  );
}
