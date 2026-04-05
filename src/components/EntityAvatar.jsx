"use client";

import { useMemo, useState } from "react";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function EntityAvatar({
  src,
  name,
  size = 40,
  className = "",
  rounded = "full",
}) {
  const [failed, setFailed] = useState(false);

  const initials = useMemo(() => getInitials(name), [name]);

  const radiusClass =
    rounded === "2xl"
      ? "rounded-2xl"
      : rounded === "lg"
      ? "rounded-lg"
      : "rounded-full";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Foto"}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`object-cover border border-black/10 shadow-sm bg-white ${radiusClass} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center border border-black/10 shadow-sm bg-[var(--card)] text-[var(--text)] font-semibold ${radiusClass} ${className}`}
      style={{ width: size, height: size }}
      title={name || "Sem foto"}
    >
      {initials}
    </div>
  );
}