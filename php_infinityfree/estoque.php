<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $produtoId = post_text('produtoId');
    $tipo = post_text('tipo') ?: 'ENTRADA';
    $origem = post_text('origem') ?: 'MANUAL';
    $quantidade = max(1, (int) ($_POST['quantidade'] ?? 1));
    $observacao = post_text('observacao');

    $produtoStmt = $pdo->prepare('SELECT id, estoqueAtual FROM produto WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $produtoStmt->execute(['id'=>$produtoId,'empresaId'=>$user['empresaId']]);
    $produto = $produtoStmt->fetch();

    if (!$produto) {
        $error = 'Produto inválido.';
    } else {
        $anterior = (int) $produto['estoqueAtual'];
        $delta = in_array($tipo, ['SAIDA','CONSUMO_COMANDA','PERDA'], true) ? -$quantidade : $quantidade;
        $atual = max(0, $anterior + $delta);

        $pdo->prepare('UPDATE produto SET estoqueAtual = :atual, updatedAt = NOW() WHERE id = :id')->execute(['atual'=>$atual,'id'=>$produtoId]);
        $pdo->prepare('INSERT INTO estoquemovimentacao (id, empresaId, produtoId, tipo, quantidade, usuarioId, createdAt, observacao, origem, saldoAnterior, saldoAtual) VALUES (:id,:empresaId,:produtoId,:tipo,:quantidade,:usuarioId,NOW(),:observacao,:origem,:saldoAnterior,:saldoAtual)')->execute([
            'id'=>new_id(),'empresaId'=>$user['empresaId'],'produtoId'=>$produtoId,'tipo'=>$tipo,'quantidade'=>$quantidade,'usuarioId'=>$user['id'],'observacao'=>$observacao,'origem'=>$origem,'saldoAnterior'=>$anterior,'saldoAtual'=>$atual
        ]);
        redirect_to('estoque.php');
    }
}

$produtos = $pdo->prepare('SELECT id, nome, estoqueAtual, estoqueMinimo, unidade FROM produto WHERE empresaId = :empresaId AND ativo = 1 ORDER BY nome ASC');
$produtos->execute(['empresaId'=>$user['empresaId']]);
$produtos = $produtos->fetchAll();

$movs = $pdo->prepare('SELECT m.*, p.nome AS produto_nome, p.unidade FROM estoquemovimentacao m INNER JOIN produto p ON p.id = m.produtoId WHERE m.empresaId = :empresaId ORDER BY m.createdAt DESC LIMIT 50');
$movs->execute(['empresaId'=>$user['empresaId']]);
$movs = $movs->fetchAll();

$baixos = array_values(array_filter($produtos, fn($item) => (int)$item['estoqueAtual'] <= (int)$item['estoqueMinimo']));

render_header('Estoque', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<div class="grid-two">
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Movimentação</p><h3>Nova movimentação</h3></div></div>
    <form method="post" class="form-grid">
        <label class="field-wide"><span>Produto</span><select name="produtoId" class="select-inline"><?php foreach ($produtos as $produto): ?><option value="<?= h($produto['id']) ?>"><?= h($produto['nome']) ?> - saldo <?= h((string)$produto['estoqueAtual']) ?> <?= h($produto['unidade']) ?></option><?php endforeach; ?></select></label>
        <label><span>Tipo</span><select name="tipo" class="select-inline"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="AJUSTE">Ajuste</option><option value="PERDA">Perda</option></select></label>
        <label><span>Origem</span><select name="origem" class="select-inline"><option value="MANUAL">Manual</option><option value="COMPRA">Compra</option><option value="COMANDA">Comanda</option><option value="AJUSTE">Ajuste</option></select></label>
        <label><span>Quantidade</span><input type="number" name="quantidade" min="1" value="1"></label>
        <label class="field-wide"><span>Observação</span><textarea name="observacao"></textarea></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Registrar movimentação</button></div>
    </form>
</section>
<div class="stack-blocks">
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Alertas</p><h3>Estoque baixo</h3></div></div>
    <?php if ($baixos): ?>
        <div class="cards-grid"><?php foreach ($baixos as $item): ?><div class="alert-card"><strong><?= h($item['nome']) ?></strong><div class="muted">Saldo: <?= h((string)$item['estoqueAtual']) ?> | Mínimo: <?= h((string)$item['estoqueMinimo']) ?></div></div><?php endforeach; ?></div>
    <?php else: ?><div class="flash flash-success">Nenhum produto com estoque baixo.</div><?php endif; ?>
</section>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Histórico</p><h3>Últimas movimentações</h3></div></div>
    <div class="table-wrap"><table><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Saldo</th><th>Obs.</th></tr></thead><tbody>
    <?php foreach ($movs as $mov): ?><tr><td><?= h(datetime_br($mov['createdAt'])) ?></td><td><?= h($mov['produto_nome']) ?></td><td><span class="badge"><?= h($mov['tipo']) ?></span></td><td><?= h((string)$mov['quantidade']) ?></td><td><?= h((string)$mov['saldoAnterior']) ?> -> <?= h((string)$mov['saldoAtual']) ?></td><td><?= h($mov['observacao']) ?: '-' ?></td></tr><?php endforeach; ?>
    <?php if (!$movs): ?><tr><td colspan="6" class="empty">Nenhuma movimentação encontrada.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>
</div>
</div>
<?php render_footer($user); ?>
