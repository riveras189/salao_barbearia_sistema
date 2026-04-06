ALTER TABLE "Cliente"
  ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT;

ALTER TABLE "Profissional"
  ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT;

ALTER TABLE "Funcionario"
  ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

ALTER TABLE "Produto"
  ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "custo" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "marca" TEXT,
  ADD COLUMN IF NOT EXISTS "preco" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "comissao" DECIMAL(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Produto'
      AND column_name = 'valorCusto'
  ) THEN
    EXECUTE 'UPDATE "Produto" SET "custo" = COALESCE("valorCusto", "custo") WHERE "valorCusto" IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Produto'
      AND column_name = 'valorVenda'
  ) THEN
    EXECUTE 'UPDATE "Produto" SET "preco" = COALESCE("valorVenda", "preco") WHERE "valorVenda" IS NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Produto'
      AND column_name = 'estoqueAtual'
  ) THEN
    EXECUTE 'ALTER TABLE "Produto" ALTER COLUMN "estoqueAtual" TYPE INTEGER USING ROUND("estoqueAtual")::INTEGER';
    EXECUTE 'ALTER TABLE "Produto" ALTER COLUMN "estoqueAtual" SET DEFAULT 0';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Produto'
      AND column_name = 'estoqueMinimo'
  ) THEN
    EXECUTE 'ALTER TABLE "Produto" ALTER COLUMN "estoqueMinimo" TYPE INTEGER USING ROUND("estoqueMinimo")::INTEGER';
    EXECUTE 'ALTER TABLE "Produto" ALTER COLUMN "estoqueMinimo" SET DEFAULT 0';
  END IF;
END $$;
