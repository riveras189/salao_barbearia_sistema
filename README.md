# salao_barbearia_sistema

Clone funcional do `salao_rf_sistema` com identidade visual preservada e banco preparado para MySQL/phpMyAdmin.

## Stack

- Next.js App Router
- React + TypeScript
- Prisma
- MySQL

## Setup

1. Instale dependências com `npm install`
2. Copie `.env.example` para `.env`
3. Crie o banco MySQL no phpMyAdmin
4. Rode `npm run db:generate`
5. Rode `npm run db:push`
6. Rode `npm run db:seed`
7. Rode `npm run dev`

## Variáveis de ambiente

- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_COOKIE_SECURE`
- `NEXT_PUBLIC_ENABLE_MODEL_SWITCH=true`
- `ENABLE_SYSTEM_MODEL_API=true`
- `MYSQL_BIN_DIR` para backup/restauração local via `mysqldump` e `mysql`

## Banco MySQL

- Exemplo de `DATABASE_URL`: `mysql://root:senha@localhost:3306/salao_barbearia_sistema`
- O arquivo `salao.sql` pode ser importado no phpMyAdmin se você quiser partir do banco legado
- O schema atual do sistema deve ser aplicado com `npm run db:push`
- As migrações antigas em `prisma/migrations` foram geradas para PostgreSQL e não devem ser reaplicadas em MySQL

## Backup e restore

- `npm run db:backup` gera um dump SQL em `storage/backups`
- `npm run db:restore -- caminho\arquivo.sql` restaura um dump no banco apontado por `DATABASE_URL`
- Os scripts usam `MYSQL_BIN_DIR` ou `DB_BIN_DIR` para localizar `mysqldump` e `mysql`

## Deploy no Render

O repositório inclui `render.yaml` para subir o app Node usando um MySQL externo:

- serviço web Node para o Next.js
- `prisma db push` no build
- `npm run db:seed` no build para criar a empresa inicial
- disco persistente montado em `public/uploads`

Depois de conectar o repositório no Render:

1. Crie o Blueprint usando o `render.yaml`
2. Defina `APP_URL` com a URL pública do serviço, por exemplo `https://seu-app.onrender.com`
3. Defina `NEXT_PUBLIC_APP_URL` com a mesma URL pública
4. Defina `DATABASE_URL` apontando para o seu MySQL
5. Faça o primeiro deploy

Observação: os uploads do sistema são gravados localmente em `public/uploads`, então o disco persistente precisa permanecer ativo no serviço.

## Testes

- Unitários: `npm run test:unit`
- E2E: `npm run e2e`

## Rollback rápido

1. Defina `NEXT_PUBLIC_ENABLE_MODEL_SWITCH=false`
2. Defina `ENABLE_SYSTEM_MODEL_API=false`
3. Reinicie a aplicação

## Verificação manual

1. Login como admin
2. Abra o botão `Modelo` no topo
3. Troque entre `Barbearia` e `Padrão`
4. Valide mudança visual imediata
5. Recarregue a página e confirme persistência
6. Consulte o histórico de auditoria
