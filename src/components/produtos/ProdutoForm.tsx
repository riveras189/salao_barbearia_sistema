"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type ProdutoFormData = {
  id?: string;
  nome?: string;
  descricao?: string | null;
  categoria?: string | null;
  marca?: string | null;
  codigoBarras?: string | null;
  unidade?: string | null;
  custo?: string | number | null;
  preco?: string | number | null;
  comissao?: string | number | null;
  estoqueAtual?: number | null;
  estoqueMinimo?: number | null;
  fotoUrl?: string | null;
  ativo?: boolean;
};

type Props = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  produto?: ProdutoFormData | null;
  cancelHref: string;
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
    >
      {pending
        ? "Salvando..."
        : mode === "create"
        ? "Salvar produto"
        : "Atualizar produto"}
    </button>
  );
}

export default function ProdutoForm({
  mode,
  action,
  produto,
  cancelHref,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(produto?.fotoUrl || "");

  useEffect(() => {
    if (!selectedFile) {
      setPreview(produto?.fotoUrl || "");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, produto?.fotoUrl]);

  const currentPreview = useMemo(() => preview || "", [preview]);

  return (
    <form action={action} className="space-y-6">
      {produto?.id ? (
        <input type="hidden" name="produtoId" value={produto.id} />
      ) : null}

      <input
        type="hidden"
        name="fotoAtualUrl"
        value={produto?.fotoUrl || ""}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
            Foto do produto
          </h2>

          <div className="mb-4 flex items-center justify-center">
            {currentPreview ? (
              <img
                src={currentPreview}
                alt="Prévia do produto"
                className="h-56 w-full rounded-2xl border border-[var(--line)] bg-white object-cover"
              />
            ) : (
              <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] text-sm text-[var(--muted)]">
                Sem imagem
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Enviar imagem
              </label>
              <input
                type="file"
                name="fotoFile"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="block w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] ?? null);
                }}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                JPG, PNG ou WEBP até 5MB.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Ou informe a URL da imagem
              </label>
              <input
                type="text"
                name="fotoUrl"
                defaultValue={produto?.fotoUrl || ""}
                placeholder="https://..."
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
            Dados do produto
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Nome *
              </label>
              <input
                type="text"
                name="nome"
                defaultValue={produto?.nome || ""}
                required
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Categoria
              </label>
              <input
                type="text"
                name="categoria"
                defaultValue={produto?.categoria || ""}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Marca
              </label>
              <input
                type="text"
                name="marca"
                defaultValue={produto?.marca || ""}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Código de barras
              </label>
              <input
                type="text"
                name="codigoBarras"
                defaultValue={produto?.codigoBarras || ""}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Unidade
              </label>
              <select
                name="unidade"
                defaultValue={produto?.unidade || "UN"}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              >
                <option value="UN">UN</option>
                <option value="CX">CX</option>
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Custo
              </label>
              <input
                type="number"
                name="custo"
                min="0"
                step="0.01"
                defaultValue={produto?.custo?.toString() || "0.00"}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Preço *
              </label>
              <input
                type="number"
                name="preco"
                min="0"
                step="0.01"
                required
                defaultValue={produto?.preco?.toString() || "0.00"}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Comissão (%)
              </label>
              <input
                type="number"
                name="comissao"
                min="0"
                max="100"
                step="0.01"
                defaultValue={produto?.comissao?.toString() || "0.00"}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Estoque atual
              </label>
              <input
                type="number"
                name="estoqueAtual"
                min="0"
                step="1"
                defaultValue={produto?.estoqueAtual ?? 0}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Estoque mínimo
              </label>
              <input
                type="number"
                name="estoqueMinimo"
                min="0"
                step="1"
                defaultValue={produto?.estoqueMinimo ?? 0}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Descrição
              </label>
              <textarea
                name="descricao"
                rows={4}
                defaultValue={produto?.descricao || ""}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                <input
                  type="checkbox"
                  name="ativo"
                  defaultChecked={produto?.ativo ?? true}
                  className="h-4 w-4 rounded border-[var(--line)]"
                />
                Produto ativo
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton mode={mode} />
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line)] px-5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--soft)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}