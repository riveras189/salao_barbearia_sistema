import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PainelShell from "@/components/PainelShell";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser().catch(() => null);

  const empresa = await prisma.empresa
    .findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        nomeFantasia: true,
        razaoSocial: true,
      },
    })
    .catch(() => null);

  const companyName =
    empresa?.nomeFantasia ||
    empresa?.razaoSocial ||
    "Riveras Barbearia";

  return <PainelShell companyName={companyName} userPapelBase={user?.papelBase}>{children}</PainelShell>;
}
