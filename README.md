# salao_barbearia_sistema

Clone funcional do `salao_rf_sistema` com identidade visual de barbearia e suporte a troca do modelo ativo do sistema.

## Stack

- Next.js App Router
- React + TypeScript
- Prisma
- PostgreSQL

## Setup

1. Instale dependências com `npm install`
2. Copie `.env.example` para `.env`
3. Rode `npx prisma generate`
4. Rode `npx prisma migrate deploy`
5. Rode `npm run db:seed`
6. Rode `npm run dev`

## Variáveis de ambiente

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_COOKIE_SECURE`
- `NEXT_PUBLIC_ENABLE_MODEL_SWITCH=true`
- `ENABLE_SYSTEM_MODEL_API=true`

## Deploy no Render

O repositório agora inclui `render.yaml` com:

- serviço web Node para o Next.js
- banco PostgreSQL gerenciado pelo Render
- `prisma migrate deploy` no build
- `npm run db:seed` no build para criar a empresa inicial
- disco persistente montado em `public/uploads`

Depois de conectar o repositório no Render:

1. Crie o Blueprint usando o `render.yaml`
2. Defina `APP_URL` com a URL pública do serviço, por exemplo `https://seu-app.onrender.com`
3. Defina `NEXT_PUBLIC_APP_URL` com a mesma URL pública
4. Se estiver usando Neon ou outro pooler, defina `DIRECT_URL` com a string de conexão direta do Postgres, sem `-pooler`
5. Faça o primeiro deploy

Observação: os uploads do sistema são gravados localmente em `public/uploads`, então o disco persistente precisa permanecer ativo no serviço. As migrações do Prisma usam `DIRECT_URL` quando ela existir para evitar timeout de advisory lock em conexões com pooler.

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
