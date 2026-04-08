<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();

$cards = [];

$summaryQueries = [
    'A receber pendente' => 'SELECT COALESCE(SUM(valorAberto), 0) FROM contareceber WHERE empresaId = :empresaId AND status IN ("PENDENTE", "PARCIAL")',
    'A pagar pendente' => 'SELECT COALESCE(SUM(valorAberto), 0) FROM contapagar WHERE empresaId = :empresaId AND status IN ("PENDENTE", "PARCIAL")',
    'Entradas hoje' => 'SELECT COALESCE(SUM(valor), 0) FROM caixamovimento WHERE empresaId = :empresaId AND tipo = "ENTRADA" AND DATE(dataMovimento) = CURDATE()',
    'Saídas hoje' => 'SELECT COALESCE(SUM(valor), 0) FROM caixamovimento WHERE empresaId = :empresaId AND tipo = "SAIDA" AND DATE(dataMovimento) = CURDATE()',
];

foreach ($summaryQueries as $label => $sql) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['empresaId' => $user['empresaId']]);
    $cards[$label] = $stmt->fetchColumn();
}

$latestStmt = $pdo->prepare(
    'SELECT tipo, categoria, descricao, valor, dataMovimento
     FROM caixamovimento
     WHERE empresaId = :empresaId
     ORDER BY dataMovimento DESC
     LIMIT 30'
);
$latestStmt->execute(['empresaId' => $user['empresaId']]);
$rows = $latestStmt->fetchAll();

render_header('Financeiro', $user);
?>
<section class="stats-grid">
    <?php foreach ($cards as $label => $value): ?>
        <article class="stat-card"><span><?= h($label) ?></span><strong><?= h(money_br($value)) ?></strong></article>
    <?php endforeach; ?>
</section>

<section class="panel-card">
    <div class="section-head">
        <div>
            <p class="eyebrow">Fluxo de caixa</p>
            <h3>Movimentações recentes</h3>
        </div>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <td><?= h(datetime_br($row['dataMovimento'])) ?></td>
                    <td><span class="badge"><?= h($row['tipo']) ?></span></td>
                    <td><?= h($row['categoria']) ?></td>
                    <td><?= h($row['descricao']) ?></td>
                    <td><?= h(money_br($row['valor'])) ?></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?>
                <tr><td colspan="5" class="empty">Nenhuma movimentação encontrada.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
