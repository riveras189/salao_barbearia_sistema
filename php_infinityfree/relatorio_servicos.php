<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$stmt = db()->prepare('SELECT nome, descricao, duracaoMin, preco, comissaoPercentualPadrao, ativo, exibirNoSite FROM servico WHERE empresaId = :empresaId ORDER BY nome ASC');
$stmt->execute(['empresaId' => $user['empresaId']]);
$rows = $stmt->fetchAll();

render_header('Relatório de Serviços', $user);
?>
<section class="panel-card"><div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Serviços</h3></div></div><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Duração</th><th>Preço</th><th>Comissão</th><th>Site</th><th>Status</th></tr></thead><tbody>
<?php foreach ($rows as $row): ?><tr><td><strong><?= h($row['nome']) ?></strong><div class="muted"><?= h($row['descricao']) ?: '-' ?></div></td><td><?= h((string)$row['duracaoMin']) ?> min</td><td><?= h(money_br($row['preco'])) ?></td><td><?= h((string)$row['comissaoPercentualPadrao']) ?>%</td><td><?= (int)$row['exibirNoSite'] ? 'Sim' : 'Não' ?></td><td><?= (int)$row['ativo'] ? 'Ativo' : 'Inativo' ?></td></tr><?php endforeach; ?>
<?php if (!$rows): ?><tr><td colspan="6" class="empty">Nenhum dado encontrado.</td></tr><?php endif; ?>
</tbody></table></div></section>
<?php render_footer($user); ?>
