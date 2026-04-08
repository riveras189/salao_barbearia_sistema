<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$produtos = $pdo->prepare('SELECT nome, estoqueAtual, estoqueMinimo, unidade, preco FROM produto WHERE empresaId = :empresaId ORDER BY nome ASC');
$produtos->execute(['empresaId' => $user['empresaId']]);
$produtos = $produtos->fetchAll();
$movs = $pdo->prepare('SELECT m.createdAt, p.nome AS produto_nome, m.tipo, m.quantidade, m.saldoAtual FROM estoquemovimentacao m INNER JOIN produto p ON p.id = m.produtoId WHERE m.empresaId = :empresaId ORDER BY m.createdAt DESC LIMIT 40');
$movs->execute(['empresaId' => $user['empresaId']]);
$movs = $movs->fetchAll();

render_header('Relatório de Estoque', $user);
?>
<section class="panel-card"><div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Produtos em estoque</h3></div></div><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Saldo</th><th>Mínimo</th><th>Unidade</th><th>Preço</th></tr></thead><tbody>
<?php foreach ($produtos as $item): ?><tr><td><?= h($item['nome']) ?></td><td><?= h((string)$item['estoqueAtual']) ?></td><td><?= h((string)$item['estoqueMinimo']) ?></td><td><?= h($item['unidade']) ?></td><td><?= h(money_br($item['preco'])) ?></td></tr><?php endforeach; ?>
<?php if (!$produtos): ?><tr><td colspan="5" class="empty">Nenhum produto encontrado.</td></tr><?php endif; ?>
</tbody></table></div></section>
<section class="panel-card"><div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Últimas movimentações</h3></div></div><div class="table-wrap"><table><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Saldo</th></tr></thead><tbody>
<?php foreach ($movs as $mov): ?><tr><td><?= h(datetime_br($mov['createdAt'])) ?></td><td><?= h($mov['produto_nome']) ?></td><td><?= h($mov['tipo']) ?></td><td><?= h((string)$mov['quantidade']) ?></td><td><?= h((string)$mov['saldoAtual']) ?></td></tr><?php endforeach; ?>
<?php if (!$movs): ?><tr><td colspan="5" class="empty">Nenhuma movimentação encontrada.</td></tr><?php endif; ?>
</tbody></table></div></section>
<?php render_footer($user); ?>
