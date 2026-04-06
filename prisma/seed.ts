import "dotenv/config";
import { PrismaClient, PapelBaseUsuario } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { DEFAULT_SYSTEM_MODELS } from "../src/lib/system-models";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL ou DIRECT_URL não definida para executar o seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const prismaClient = prisma as any;

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "00000000000000" },
    update: {},
    create: {
      nomeFantasia: "Riveras Barbearia",
      razaoSocial: "Riveras Barbearia Ltda",
      cnpj: "00000000000000",
      ativo: true,
    },
  });

  for (const model of DEFAULT_SYSTEM_MODELS) {
    await prismaClient.systemModel.upsert({
      where: { id: model.id },
      update: {
        nome: model.name,
        descricao: model.description,
        icone: model.icon,
        ativo: true,
        padrao: Boolean(model.isDefault),
        configuracoes: model.settings,
      },
      create: {
        id: model.id,
        nome: model.name,
        descricao: model.description,
        icone: model.icon,
        ativo: true,
        padrao: Boolean(model.isDefault),
        configuracoes: model.settings,
      },
    });
  }

  await prismaClient.empresaSystemPreference.upsert({
    where: { empresaId: empresa.id },
    update: {
      modelId: "barbearia_v1",
    },
    create: {
      empresaId: empresa.id,
      modelId: "barbearia_v1",
    },
  });

  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: {
      empresaId_login: {
        empresaId: empresa.id,
        login: "admin",
      },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      nome: "Administrador",
      login: "admin",
      email: "admin@admin.com",
      senhaHash,
      papelBase: PapelBaseUsuario.ADMIN,
      ativo: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
