-- CreateTable CaixaFechamento
CREATE TABLE "CaixaFechamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioAberturaId" TEXT,
    "usuarioFechamentoId" TEXT,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "saldoAbertura" NUMERIC(12,2) NOT NULL DEFAULT 0,
    "saldoFechamento" NUMERIC(12,2) NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaixaFechamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaixaFechamento_empresaId_dataAbertura_idx" ON "CaixaFechamento"("empresaId", "dataAbertura");

-- CreateIndex
CREATE INDEX "CaixaFechamento_empresaId_dataFechamento_idx" ON "CaixaFechamento"("empresaId", "dataFechamento");

-- CreateUnique
CREATE UNIQUE INDEX "CaixaFechamento_empresaId_dataAbertura_key" ON "CaixaFechamento"("empresaId", "dataAbertura");

-- AddForeignKey
ALTER TABLE "CaixaFechamento" ADD CONSTRAINT "CaixaFechamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaixaFechamento" ADD CONSTRAINT "CaixaFechamento_usuarioAberturaId_fkey" FOREIGN KEY ("usuarioAberturaId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaixaFechamento" ADD CONSTRAINT "CaixaFechamento_usuarioFechamentoId_fkey" FOREIGN KEY ("usuarioFechamentoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
