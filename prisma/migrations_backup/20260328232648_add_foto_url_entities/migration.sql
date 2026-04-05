/*
  Warnings:

  - Added the required column `fotoUrl` to the `Funcionario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "fotoUrl" TEXT;

-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "fotoUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "fotoUrl" TEXT;

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "fotoUrl" TEXT;
