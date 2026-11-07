"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { ok: boolean; message?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Añade uno o varios emails (separados por comas, espacios o saltos de línea). */
export async function addEmails(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const raw = String(formData.get("emails") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;
  const emails = [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];

  if (!emails.length) return { ok: false, message: "Escribe al menos un email." };
  const invalid = emails.filter((e) => !EMAIL_RE.test(e));
  if (invalid.length) return { ok: false, message: `Revisa estos emails: ${invalid.join(", ")}` };

  const supabase = await createClient();
  const { error } = await supabase
    .from("allowed_emails")
    .upsert(emails.map((email) => ({ email, note })), { onConflict: "email", ignoreDuplicates: true });
  if (error) return { ok: false, message: "No hemos podido añadir los emails. Inténtalo de nuevo." };

  revalidatePath("/admin");
  return { ok: true, message: emails.length === 1 ? "Email añadido." : `${emails.length} emails añadidos.` };
}

export async function removeEmail(email: string): Promise<AdminState> {
  const admin = await requireAdmin();
  if (email === admin.email) return { ok: false, message: "No puedes quitar tu propio email." };

  const supabase = await createClient();
  const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
  if (error) return { ok: false, message: "No hemos podido quitar el email." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateStartDate(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const date = String(formData.get("start_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, message: "Elige una fecha válida." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("settings").update({ start_date: date }).eq("id", 1);
  if (error) return { ok: false, message: "No hemos podido guardar la fecha." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Fecha de inicio guardada." };
}

export async function reviewVideo(id: number, status: "approved" | "rejected"): Promise<AdminState> {
  await requireAdmin();
  if (status !== "approved" && status !== "rejected") return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("video_submissions")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "No hemos podido guardar la revisión." };
  revalidatePath("/admin");
  return { ok: true };
}
