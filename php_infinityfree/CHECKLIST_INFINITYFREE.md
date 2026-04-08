# Checklist InfinityFree

## Antes do upload

1. Tenha em mãos o arquivo:
   `C:\projetos\php_infinityfree_infinityfree_2026-04-06.zip`
2. Tenha um backup SQL do banco migrado.

## No InfinityFree

1. Crie a conta e o domínio/subdomínio.
2. Crie o banco MySQL.
3. Anote:
   - host do banco
   - nome do banco
   - usuário do banco
   - senha do banco

## Banco de dados

1. Abra o phpMyAdmin do InfinityFree.
2. Importe o backup SQL do sistema.

## Arquivos do sistema

1. Extraia o `.zip` localmente.
2. Envie o conteúdo da pasta extraída para `htdocs/`.
3. Confirme que estes arquivos estão no servidor:
   - `login.php`
   - `dashboard.php`
   - `config.example.php`
   - `.htaccess`
   - pasta `assets/`

## Configuração

1. Crie `config.php` com base em `config.example.php`.
2. Preencha com os dados reais do MySQL do InfinityFree.
3. Se precisar diagnosticar erro de conexao, use temporariamente `'app_debug' => true`.

Modelo:

```php
<?php

return [
    'app_name' => 'RF Sistema PHP',
    'base_url' => '',
    'app_debug' => false,
    'db' => [
        'host' => 'sqlXXX.infinityfree.com',
        'port' => 3306,
        'database' => 'if0_XXXXXXXX_salao_rf_sistema',
        'username' => 'if0_XXXXXXXX',
        'password' => 'SUA_SENHA',
        'charset' => 'utf8mb4',
    ],
    'session' => [
        'name' => 'salao_php_session',
    ],
];
```

## Teste final

1. Abra `https://seu-dominio/login.php`
2. Entre com:
   - login: `admin`
   - senha: `123456`
3. Teste:
   - dashboard
   - clientes
   - agenda
   - comandas
   - financeiro
   - produtos
   - profissionais
   - usuários
   - empresa
   - relatórios

## Se der erro

1. Revise `config.php`
2. Confirme se o banco foi importado corretamente
3. Confirme se os arquivos foram enviados para `htdocs/`
