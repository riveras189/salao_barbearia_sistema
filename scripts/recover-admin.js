const { PrismaClient, PapelBaseUsuario } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  let empresa = await prisma.empresa.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        razaoSocial: "Riveras Salão de Beleza e Barbearia",
        nomeFantasia: "Riveras Salão de Beleza e Barbearia",
        ativo: true,
      },
    });
  }

  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: {
      empresaId_login: {
        empresaId: empresa.id,
        login: "admin",
      },
    },
    update: {
      nome: "Administrador",
      email: "admin@salao.local",
      senhaHash,
      papelBase: PapelBaseUsuario.ADMIN,
      ativo: true,
      desativadoEm: null,
      desativadoPorId: null,
      motivoDesativacao: null,
    },
    create: {
      empresaId: empresa.id,
      nome: "Administrador",
      email: "admin@salao.local",
      login: "admin",
      senhaHash,
      papelBase: PapelBaseUsuario.ADMIN,
      ativo: true,
    },
  });

  console.log("OK");
  console.log("login: admin");
  console.log("senha: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });