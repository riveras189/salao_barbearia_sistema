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
5. Rode `npm run dev`

## Variáveis de ambiente

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_ENABLE_MODEL_SWITCH=true`
- `ENABLE_SYSTEM_MODEL_API=true`

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
