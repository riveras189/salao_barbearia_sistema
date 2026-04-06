# Checklist de Implantacao

## XAMPP e MySQL

1. Inicie `Apache` e `MySQL` no XAMPP.
2. Abra o `phpMyAdmin`.
3. Crie o banco `salao_rf_sistema` com `utf8mb4`.

## Ambiente

1. Copie `.env.example` para `.env`.
2. Ajuste estas variaveis:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/salao_rf_sistema"
MYSQL_BIN_DIR="C:\\xampp\\mysql\\bin"
AUTH_SECRET="troque-esta-chave"
APP_URL="http://127.0.0.1:3000"
NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
AUTH_COOKIE_SECURE="false"
```

## Instalacao

1. Rode `npm install`.
2. Rode `npm run db:generate`.
3. Rode `npm run db:push`.

## Dados

1. Para criar dados iniciais, rode `npm run db:seed`.
2. Para restaurar um backup, rode:

```bash
npm run db:restore -- storage\backups\arquivo.sql
```

3. Para gerar backup manual, rode:

```bash
npm run db:backup
```

## Execucao

1. Desenvolvimento: `npm run dev`
2. Producao local:

```bash
npm run build
npm run start
```

## Acesso

- Login: `admin`
- Senha: `123456`

## Validacao rapida

1. Abra `/login`.
2. Entre no painel.
3. Verifique estas telas:
   `clientes`, `agenda`, `comandas`, `financeiro`.

## Arquivos uteis

- Backup final migrado: `storage/backups/salao_rf_sistema_migrado_final.sql`
- Pacote de entrega: `C:\projetos\salao_rf_sistema_entrega_2026-04-06_ed8d6e3.zip`
