-- CreateTable
CREATE TABLE "ClienteAcesso" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLoginEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClienteAcesso_clienteId_key" ON "ClienteAcesso"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteAcesso_empresaId_ativo_idx" ON "ClienteAcesso"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteAcesso_empresaId_login_key" ON "ClienteAcesso"("empresaId", "login");

-- AddForeignKey
ALTER TABLE "ClienteAcesso" ADD CONSTRAINT "ClienteAcesso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAcesso" ADD CONSTRAINT "ClienteAcesso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
