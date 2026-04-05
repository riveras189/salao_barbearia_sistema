import Link from "next/link";

type PanelBackButtonProps = {
  href?: string;
  label?: string;
};

export default function PanelBackButton({
  href = "/dashboard",
  label = "Voltar",
}: PanelBackButtonProps) {
  return (
    <div className="mb-4">
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
      >
        <span aria-hidden="true">←</span>
        <span>{label}</span>
      </Link>
    </div>
  );
}