# Versao PHP para InfinityFree

Esta pasta contem uma versao paralela do sistema em `PHP + MySQL`, pensada para hospedagem no InfinityFree.

## Estrutura

- `config.example.php`: modelo de configuracao
- `bootstrap.php`: sessao, PDO, autenticacao e layout base
- `login.php`: acesso ao painel
- `dashboard.php`: resumo operacional
- `clientes.php`: lista de clientes
- `agenda.php`: agenda por data
- `comandas.php`: ultimas comandas
- `financeiro.php`: resumo financeiro
- `produtos.php`: catálogo de produtos
- `profissionais.php`: equipe
- `usuarios.php`: acessos do sistema
- `empresa.php`: edição básica da empresa
- `relatorios.php`: hub de relatórios
- `cliente_login.php` e `cliente_agenda.php`: área do cliente
- `assets/app.css`: tema visual inspirado no painel atual

## Como publicar no InfinityFree

1. Copie `config.example.php` para `config.php`
2. Preencha os dados do MySQL do InfinityFree
3. Envie todo o conteudo de `php_infinityfree/` para a pasta `htdocs/`
4. Acesse `https://seu-dominio/login.php`

## Credenciais iniciais

- login: `admin`
- senha: `123456`

## Observacao importante

Esta versao PHP cobre o núcleo do painel, relatórios básicos e a área do cliente para manter compatibilidade com InfinityFree sem depender de Node.js.
