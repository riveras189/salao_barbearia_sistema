# Upload no InfinityFree

## 1. Banco MySQL

1. Crie um banco MySQL no painel do InfinityFree.
2. Anote:
   - `DB Host`
   - `DB Name`
   - `DB User`
   - `DB Password`

## 2. Configuração

1. Copie `config.example.php` para `config.php`.
2. Preencha os dados do MySQL do InfinityFree.
3. Se o sistema ficar numa subpasta, ajuste `base_url`.
4. Se precisar diagnosticar erro de conexao, use temporariamente `'app_debug' => true`.

Exemplo:

```php
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

## 3. Upload dos arquivos

1. Abra o `File Manager` do InfinityFree.
2. Envie o conteúdo de `php_infinityfree/` para `htdocs/`.
3. Não envie `config.php` com credenciais locais.

## 4. Banco de dados

1. Importe o dump SQL no phpMyAdmin do InfinityFree.
2. Use um dos backups gerados do projeto como base.

## 5. Teste final

1. Abra `https://seu-dominio/login.php`
2. Teste o login admin.
3. Verifique `dashboard`, `clientes`, `agenda`, `comandas`, `financeiro`.
