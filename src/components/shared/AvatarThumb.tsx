type AvatarThumbProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
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

export default function AvatarThumb({
  src,
  name,
  size = 36,
}: AvatarThumbProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Foto"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold text-slate-500">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}