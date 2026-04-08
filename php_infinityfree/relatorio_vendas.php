<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$resumoStmt = $pdo->prepare('SELECT status, COUNT(*) total, COALESCE(SUM(total),0) valorTotal FROM comanda WHERE empresaId = :empresaId GROUP BY status');
$resumoStmt->execute(['empresaId'=>$user['empresaId']]);
$resumo = $resumoStmt->fetchAll();
$latestStmt = $pdo->prepare('SELECT numeroSequencial, status, total, abertaEm, fechadaEm FROM comanda WHERE empresaId = :empresaId ORDER BY createdAt DESC LIMIT 50');
$latestStmt->execute(['empresaId'=>$user['empresaId']]);
$rows = $latestStmt->fetchAll();

render_header('Relatório de Comandas', $user);
?>
<section class="stats-grid compact-grid">
<?php foreach ($resumo as $item): ?><article class="stat-card"><span><?= h($item['status']) ?></span><strong><?= h((string)$item['total']) ?></strong><div class="muted"><?= h(money_br($item['valorTotal'])) ?></div></article><?php endforeach; ?>
</section>
<section class="panel-card"><div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Últimas comandas</h3></div></div><div class="table-wrap"><table><thead><tr><th>Número</th><th>Status</th><th>Total</th><th>Abertura</th><th>Fechamento</th></tr></thead><tbody>
<?php foreach ($rows as $row): ?><tr><td>#<?= h((string)$row['numeroSequencial']) ?></td><td><?= h($row['status']) ?></td><td><?= h(money_br($row['total'])) ?></td><td><?= h(datetime_br($row['abertaEm'])) ?></td><td><?= h(datetime_br($row['fechadaEm'])) ?></td></tr><?php endforeach; ?>
<?php if (!$rows): ?><tr><td colspan="5" class="empty">Nenhuma comanda encontrada.</td></tr><?php endif; ?>
</tbody></table></div></section>
<?php render_footer($user); ?>
