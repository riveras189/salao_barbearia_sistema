ALTER TABLE "AuditoriaLog"
ADD COLUMN IF NOT EXISTS "descricao" TEXT;

CREATE TABLE "SystemModel" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "configuracoes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemModel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsuarioSystemPreference" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioSystemPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmpresaSystemPreference" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmpresaSystemPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsuarioSystemPreference_usuarioId_key" ON "UsuarioSystemPreference"("usuarioId");
CREATE UNIQUE INDEX "EmpresaSystemPreference_empresaId_key" ON "EmpresaSystemPreference"("empresaId");

CREATE INDEX "SystemModel_empresaId_ativo_idx" ON "SystemModel"("empresaId", "ativo");
CREATE INDEX "SystemModel_padrao_ativo_idx" ON "SystemModel"("padrao", "ativo");
CREATE INDEX "UsuarioSystemPreference_empresaId_changedAt_idx" ON "UsuarioSystemPreference"("empresaId", "changedAt");
CREATE INDEX "UsuarioSystemPreference_modelId_idx" ON "UsuarioSystemPreference"("modelId");
CREATE INDEX "EmpresaSystemPreference_modelId_idx" ON "EmpresaSystemPreference"("modelId");
CREATE INDEX "EmpresaSystemPreference_changedAt_idx" ON "EmpresaSystemPreference"("changedAt");

ALTER TABLE "SystemModel"
ADD CONSTRAINT "SystemModel_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsuarioSystemPreference"
ADD CONSTRAINT "UsuarioSystemPreference_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsuarioSystemPreference"
ADD CONSTRAINT "UsuarioSystemPreference_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsuarioSystemPreference"
ADD CONSTRAINT "UsuarioSystemPreference_modelId_fkey"
FOREIGN KEY ("modelId") REFERENCES "SystemModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UsuarioSystemPreference"
ADD CONSTRAINT "UsuarioSystemPreference_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmpresaSystemPreference"
ADD CONSTRAINT "EmpresaSystemPreference_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmpresaSystemPreference"
ADD CONSTRAINT "EmpresaSystemPreference_modelId_fkey"
FOREIGN KEY ("modelId") REFERENCES "SystemModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmpresaSystemPreference"
ADD CONSTRAINT "EmpresaSystemPreference_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "SystemModel" ("id", "nome", "descricao", "icone", "ativo", "padrao", "configuracoes")
VALUES
(
  'padrao_v1',
  'Padrão',
  'Modelo original do sistema',
  'sparkles',
  true,
  false,
  '{"greeting":"Bem-vindo ao sistema!","priceTemplate":"R$ {value}","responseTone":"formal","serviceLabel":"serviço","appointmentLabel":"agendamento","heroVariant":"default"}'::jsonb
),
(
  'barbearia_v1',
  'Barbearia',
  'Tema e linguagem de barbearia',
  'scissors',
  true,
  true,
  '{"greeting":"Bem-vindo à barbearia!","priceTemplate":"R$ {value}","responseTone":"informal","serviceLabel":"corte","appointmentLabel":"horário","heroVariant":"barber-dark"}'::jsonb
),
(
  'personalizado_v1',
  'Personalizado',
  'Modelo customizável pelo administrador',
  'sliders',
  true,
  false,
  '{"greeting":"Olá!","priceTemplate":"R$ {value}","responseTone":"formal","serviceLabel":"serviço","appointmentLabel":"agendamento","heroVariant":"custom"}'::jsonb
)
ON CONFLICT ("id") DO UPDATE SET
  "nome" = EXCLUDED."nome",
  "descricao" = EXCLUDED."descricao",
  "icone" = EXCLUDED."icone",
  "ativo" = EXCLUDED."ativo",
  "padrao" = EXCLUDED."padrao",
  "configuracoes" = EXCLUDED."configuracoes",
  "updatedAt" = CURRENT_TIMESTAMP;
