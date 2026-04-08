<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();

$receber = $pdo->prepare('SELECT COALESCE(SUM(valorAberto), 0) FROM contareceber WHERE empresaId = :empresaId AND status IN ("ABERTA", "PARCIAL", "VENCIDA")');
$receber->execute(['empresaId' => $user['empresaId']]);

$caixa = $pdo->prepare('SELECT tipo, categoria, descricao, valor, dataMovimento FROM caixamovimento WHERE empresaId = :empresaId ORDER BY dataMovimento DESC LIMIT 80');
$caixa->execute(['empresaId' => $user['empresaId']]);
$rows = $caixa->fetchAll();

render_header('Relatório Financeiro', $user);
?>
<section class="stats-grid">
    <article class="stat-card"><span>A receber em aberto</span><strong><?= h(money_br($receber->fetchColumn())) ?></strong></article>
</section>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Caixa</h3></div></div>
    <div class="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>
    <?php foreach ($rows as $row): ?><tr><td><?= h(datetime_br($row['dataMovimento'])) ?></td><td><span class="badge"><?= h($row['tipo']) ?></span></td><td><?= h($row['categoria']) ?></td><td><?= h($row['descricao']) ?></td><td><?= h(money_br($row['valor'])) ?></td></tr><?php endforeach; ?>
    <?php if (!$rows): ?><tr><td colspan="5" class="empty">Nenhuma movimentação encontrada.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>
<?php render_footer($user); ?>
