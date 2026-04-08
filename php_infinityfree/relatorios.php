<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();

$items = [
    ['href' => 'relatorio_clientes.php', 'title' => 'Clientes', 'description' => 'Cadastros e clientes mais recentes'],
    ['href' => 'relatorio_profissionais.php', 'title' => 'Profissionais', 'description' => 'Equipe ativa e dados principais'],
    ['href' => 'relatorio_financeiro.php', 'title' => 'Financeiro', 'description' => 'Recebimentos e caixa'],
    ['href' => 'relatorio_servicos.php', 'title' => 'Serviços', 'description' => 'Tabela de serviços e preços'],
    ['href' => 'relatorio_estoque.php', 'title' => 'Estoque', 'description' => 'Saldos e movimentações recentes'],
    ['href' => 'relatorio_vendas.php', 'title' => 'Comandas', 'description' => 'Resumo operacional das comandas'],
];

render_header('Relatórios', $user);
?>
<section class="cards-grid cards-grid-products">
    <?php foreach ($items as $item): ?>
        <a class="panel-card report-card" href="<?= h($item['href']) ?>">
            <p class="eyebrow">Relatório</p>
            <h3><?= h($item['title']) ?></h3>
            <p class="muted"><?= h($item['description']) ?></p>
        </a>
    <?php endforeach; ?>
</section>
<?php render_footer($user); ?>
