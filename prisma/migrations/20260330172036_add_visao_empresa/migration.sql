/*
  Warnings:

  - The values [RECEBIMENTO] on the enum `CategoriaCaixaMovimento` will be removed. If these variants are still used in the database, this will fail.
  - The `referenciaTipo` column on the `CaixaMovimento` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `categoria` on the `ContaPagar` table. All the data in the column will be lost.
  - The `origemTipo` column on the `ContaReceber` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrigemFinanceiraTipo" AS ENUM ('COMANDA', 'CONTA_RECEBER', 'CONTA_PAGAR', 'DESPESA', 'AJUSTE', 'OUTRO');

-- AlterEnum
BEGIN;
CREATE TYPE "CategoriaCaixaMovimento_new" AS ENUM ('COMANDA', 'CONTA_RECEBER', 'CONTA_PAGAR', 'DESPESA', 'SANGRIA', 'SUPRIMENTO', 'ESTORNO', 'OUTRO');
ALTER TABLE "CaixaMovimento" ALTER COLUMN "categoria" TYPE "CategoriaCaixaMovimento_new" USING ("categoria"::text::"CategoriaCaixaMovimento_new");
ALTER TYPE "CategoriaCaixaMovimento" RENAME TO "CategoriaCaixaMovimento_old";
ALTER TYPE "CategoriaCaixaMovimento_new" RENAME TO "CategoriaCaixaMovimento";
DROP TYPE "public"."CategoriaCaixaMovimento_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FormaPagamento" ADD VALUE 'TRANSFERENCIA';
ALTER TYPE "FormaPagamento" ADD VALUE 'BOLETO';
ALTER TYPE "FormaPagamento" ADD VALUE 'OUTRO';

-- AlterTable
ALTER TABLE "CaixaMovimento" DROP COLUMN "referenciaTipo",
ADD COLUMN     "referenciaTipo" "OrigemFinanceiraTipo";

-- AlterTable
ALTER TABLE "ContaPagar" DROP COLUMN "categoria",
ADD COLUMN     "categoriaId" TEXT;

-- AlterTable
ALTER TABLE "ContaPagarPagamento" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ContaReceber" DROP COLUMN "origemTipo",
ADD COLUMN     "origemTipo" "OrigemFinanceiraTipo";

-- AlterTable
ALTER TABLE "ContaReceberPagamento" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "visao" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "desativadoEm" TIMESTAMP(3),
ADD COLUMN     "desativadoPorId" TEXT,
ADD COLUMN     "motivoDesativacao" TEXT;

-- CreateTable
CREATE TABLE "DespesaCategoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DespesaCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DespesaCategoria_empresaId_ativo_idx" ON "DespesaCategoria"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "DespesaCategoria_empresaId_nome_key" ON "DespesaCategoria"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "CaixaMovimento_empresaId_categoria_dataMovimento_idx" ON "CaixaMovimento"("empresaId", "categoria", "dataMovimento");

-- CreateIndex
CREATE INDEX "CaixaMovimento_referenciaTipo_referenciaId_idx" ON "CaixaMovimento"("referenciaTipo", "referenciaId");

-- CreateIndex
CREATE INDEX "CaixaMovimento_usuarioId_idx" ON "CaixaMovimento"("usuarioId");

-- CreateIndex
CREATE INDEX "ContaPagar_fornecedorId_vencimento_idx" ON "ContaPagar"("fornecedorId", "vencimento");

-- CreateIndex
CREATE INDEX "ContaPagar_categoriaId_idx" ON "ContaPagar"("categoriaId");

-- CreateIndex
CREATE INDEX "ContaPagarPagamento_usuarioId_idx" ON "ContaPagarPagamento"("usuarioId");

-- CreateIndex
CREATE INDEX "ContaReceber_clienteId_vencimento_idx" ON "ContaReceber"("clienteId", "vencimento");

-- CreateIndex
CREATE INDEX "ContaReceber_origemTipo_origemId_idx" ON "ContaReceber"("origemTipo", "origemId");

-- CreateIndex
CREATE INDEX "ContaReceberPagamento_usuarioId_idx" ON "ContaReceberPagamento"("usuarioId");

-- AddForeignKey
ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "DespesaCategoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaCategoria" ADD CONSTRAINT "DespesaCategoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
