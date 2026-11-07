"use client";

import { useRef, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import type { createPost } from "@/lib/data/community-actions";
import { uploadCommunityImage } from "@/lib/image";
import { Avatar } from "./Avatar";
import s from "./community.module.css";

/** Publicar en la comunidad: texto, una foto y, si quieres, el enlace a tu vídeo #ElevatePilot. */
export function Composer({
  userId,
  alias,
  avatarUrl,
  action,
}: {
  userId: string;
  alias: string;
  avatarUrl: string | null;
  action: typeof createPost;
}) {
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const empty = !body.trim() && !imagePath && !link.trim();

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    setError(null);
    setUploading(true);
    try {
      setImagePath(await uploadCommunityImage(f, userId));
      setPreview(URL.createObjectURL(f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className={s.composer}
      onSubmit={(e) => {
        e.preventDefault();
        if (empty) return;
        start(async () => {
          const res = await action({ body, imagePath, linkUrl: link });
          if (!res.ok) return setError(res.error);
          setBody("");
          setLink("");
          setShowLink(false);
          setImagePath(null);
          setPreview(null);
          setError(null);
        });
      }}
    >
      <div className={s.composerTop}>
        <Avatar name={alias} url={avatarUrl} size={40} />
        <label htmlFor="new-post" className="sr-only">
          Escribe una publicación
        </label>
        <textarea
          id="new-post"
          className={s.composerText}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="¿Cómo va tu día? Cuenta una vuelta, un mínimo o algo que te ha funcionado."
          maxLength={1000}
          rows={2}
        />
      </div>

      {preview ? (
        <div className={s.previewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
          <img src={preview} alt="Foto que vas a publicar" className={s.preview} />
          <button
            type="button"
            className={s.removePhoto}
            onClick={() => {
              setImagePath(null);
              setPreview(null);
            }}
          >
            Quitar foto
          </button>
        </div>
      ) : null}

      {showLink ? (
        <div className={s.field}>
          <label htmlFor="new-link" className={s.label}>
            Enlace a tu vídeo
          </label>
          <input
            id="new-link"
            className={s.input}
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.instagram.com/…"
          />
          <p className={s.hint}>Para el reto en público: un vídeo por semana con #ElevatePilot.</p>
        </div>
      ) : null}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.composerBar}>
        <div className={s.composerTools}>
          <button type="button" className={s.tool} onClick={() => file.current?.click()} aria-busy={uploading || undefined}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="2.5" y="4" width="15" height="12" rx="2.5" />
              <circle cx="7.5" cy="8.5" r="1.5" />
              <path d="M17.5 13l-4-4-6.5 7" strokeLinejoin="round" />
            </svg>
            {uploading ? "Subiendo…" : "Foto"}
          </button>
          <button type="button" className={s.tool} aria-expanded={showLink} onClick={() => setShowLink((v) => !v)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
            </svg>
            Vídeo
          </button>
        </div>
        <PillButton type="submit" size="sm" loading={pending} disabled={empty || uploading}>
          Publicar
        </PillButton>
      </div>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void onPhoto(e.target.files?.[0])} />
    </form>
  );
}
