import PageHeader from "@/components/layout/PageHeader";

type Props = {
  title: string;
  description: string;
};

export default function ModuleComingSoon({ title, description }: Props) {
  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Módulo preparado
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Esta página já está criada e pronta para receber formulário, listagem,
          filtros, ações e integração com Prisma.
        </p>
      </div>
    </div>
  );
}