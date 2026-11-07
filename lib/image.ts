"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Reduce una foto en el navegador (lado largo máximo `max` px, JPEG) y la sube
 * al bucket privado de la comunidad, en la carpeta de la persona.
 * Devuelve la ruta guardada.
 */
export async function uploadCommunityImage(file: File, userId: string, max = 1280): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elige una imagen.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se ha podido preparar la imagen."))), "image/jpeg", 0.82),
  );
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient().storage.from("community").upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "3600",
  });
  if (error) throw new Error("No se ha podido subir la foto. Inténtalo de nuevo.");
  return path;
}
