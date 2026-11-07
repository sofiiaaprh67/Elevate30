import { CommitView } from "@/app/compromiso/CommitView";
import s from "@/app/compromiso/compromiso.module.css";
import { devCommit } from "../actions";

export default function DevCompromiso() {
  return (
    <main id="contenido" className={s.page}>
      <CommitView
        name="Lucía"
        startText="lunes, 11 de enero"
        anchorName="Bloque de estudio"
        anchorMin="Abrir los apuntes y hacer 1 ejercicio"
        action={devCommit}
      />
    </main>
  );
}
