import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, PapelBaseUsuario } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida no .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "00000000000000" },
    update: {},
    create: {
      nomeFantasia: "Riveras Salão de Beleza e Barbearia",
      razaoSocial: "Riveras Salão de Beleza e Barbearia",
      cnpj: "00000000000000",
      ativo: true,
    },
  });

  const senhaHash = await bcrypt.hash("123456", 10);

  const usuario = await prisma.usuario.upsert({
    where: {
      empresaId_login: {
        empresaId: empresa.id,
        login: "admin",
      },
    },
    update: {
      nome: "Administrador",
      email: "admin@admin.com",
      senhaHash,
      papelBase: PapelBaseUsuario.ADMIN,
      ativo: true,
    },
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

  console.log("Admin criado/atualizado com sucesso.");
  console.log({
    empresaId: empresa.id,
    usuarioId: usuario.id,
    login: "admin",
    email: "admin@admin.com",
    senha: "123456",
  });
}

main()
  .catch((e) => {
    console.error("Erro ao criar admin:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });