ALTER TABLE "EstoqueMovimentacao"
  ADD COLUMN IF NOT EXISTS "observacao" TEXT,
  ADD COLUMN IF NOT EXISTS "origem" "OrigemMovimentacaoEstoque" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "saldoAnterior" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "saldoAtual" INTEGER NOT NULL DEFAULT 0;

UPDATE "EstoqueMovimentacao"
SET
  "observacao" = COALESCE("observacao", "motivo"),
  "origem" = COALESCE("origem", "origemTipo"),
  "saldoAnterior" = COALESCE("saldoAnterior", 0),
  "saldoAtual" = COALESCE("saldoAtual", 0);

ALTER TABLE "EstoqueMovimentacao"
  ALTER COLUMN "quantidade" TYPE INTEGER USING ROUND("quantidade")::INTEGER;

ALTER TABLE "CaixaMovimento"
  ADD COLUMN IF NOT EXISTS "caixaFechamentoId" TEXT,
  ADD COLUMN IF NOT EXISTS "referencia" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CaixaMovimento_caixaFechamentoId_fkey'
  ) THEN
    ALTER TABLE "CaixaMovimento"
      ADD CONSTRAINT "CaixaMovimento_caixaFechamentoId_fkey"
      FOREIGN KEY ("caixaFechamentoId") REFERENCES "CaixaFechamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CaixaMovimento_caixaFechamentoId_idx"
  ON "CaixaMovimento"("caixaFechamentoId");

CREATE TABLE IF NOT EXISTS "VendaPdv" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "acrescimo" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "formaPagamento" "FormaPagamento" NOT NULL,
  "observacoes" TEXT,
  "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VendaPdv_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VendaPdvItem" (
  "id" TEXT NOT NULL,
  "vendaPdvId" TEXT NOT NULL,
  "produtoId" TEXT NOT NULL,
  "quantidade" DECIMAL(12,3) NOT NULL,
  "precoUnitario" DECIMAL(12,2) NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,

  CONSTRAINT "VendaPdvItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VendaPdv_empresaId_dataCriacao_idx"
  ON "VendaPdv"("empresaId", "dataCriacao");

CREATE INDEX IF NOT EXISTS "VendaPdv_usuarioId_dataCriacao_idx"
  ON "VendaPdv"("usuarioId", "dataCriacao");

CREATE INDEX IF NOT EXISTS "VendaPdvItem_vendaPdvId_idx"
  ON "VendaPdvItem"("vendaPdvId");

CREATE INDEX IF NOT EXISTS "VendaPdvItem_produtoId_idx"
  ON "VendaPdvItem"("produtoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'VendaPdv_empresaId_fkey'
  ) THEN
    ALTER TABLE "VendaPdv"
      ADD CONSTRAINT "VendaPdv_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'VendaPdv_usuarioId_fkey'
  ) THEN
    ALTER TABLE "VendaPdv"
      ADD CONSTRAINT "VendaPdv_usuarioId_fkey"
      FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'VendaPdvItem_vendaPdvId_fkey'
  ) THEN
    ALTER TABLE "VendaPdvItem"
      ADD CONSTRAINT "VendaPdvItem_vendaPdvId_fkey"
      FOREIGN KEY ("vendaPdvId") REFERENCES "VendaPdv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'VendaPdvItem_produtoId_fkey'
  ) THEN
    ALTER TABLE "VendaPdvItem"
      ADD CONSTRAINT "VendaPdvItem_produtoId_fkey"
      FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
