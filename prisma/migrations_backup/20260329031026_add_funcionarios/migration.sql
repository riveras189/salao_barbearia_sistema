/*
  Warnings:

  - You are about to drop the column `cargo` on the `Funcionario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Funcionario_empresaId_cpf_key";

-- DropIndex
DROP INDEX "Funcionario_empresaId_nome_idx";

-- AlterTable
ALTER TABLE "Funcionario" DROP COLUMN "cargo",
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "fotoUrl" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Funcionario_empresaId_idx" ON "Funcionario"("empresaId");
