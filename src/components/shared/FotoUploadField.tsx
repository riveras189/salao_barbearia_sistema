"use client";

import { useRef, useState, type ChangeEvent } from "react";

type FotoUploadFieldProps = {
  label?: string;
  folder: "clientes" | "profissionais" | "funcionarios" | "produtos";
  value: string;
  onChange: (value: string) => void;
  previewName?: string;
};

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function FotoUploadField({
  label = "Foto",
  folder,
  value,
  onChange,
  previewName,
}: FotoUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setError("Formato não suportado. Use JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem é muito grande. Máximo permitido: 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const response = await fetch("/api/upload/foto", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok || !result?.ok || !result?.url) {
        throw new Error(result?.error || "Não foi possível enviar a imagem.");
      }

      onChange(result.url);
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
          {value ? (
            <img
              src={value}
              alt={previewName || "Foto"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
              {getInitials(previewName)}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          disabled={uploading}
        >
          {uploading ? "Enviando..." : "Escolher do computador"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
        </label>

        <input
          type="text"
          name="fotoUrl"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://site.com/foto.jpg ou /uploads/profissionais/foto.png"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        />

        <p className="mt-1 text-xs text-slate-500">
          Você pode colar a URL da foto ou clicar em{" "}
          <strong>Escolher do computador</strong>.
        </p>

        {error ? (
          <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
        ) : null}
      </div>
    </div>
  );
}