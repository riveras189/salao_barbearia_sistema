<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '') {
    redirect_to('comandas.php');
}

$pdo = db();
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = post_text('action');
    $comandaId = post_text('comandaId') ?: $id;

    $baseStmt = $pdo->prepare('SELECT * FROM comanda WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $baseStmt->execute(['id' => $comandaId, 'empresaId' => $user['empresaId']]);
    $target = $baseStmt->fetch();

    if (!$target) {
        redirect_to('comandas.php');
    }

    if ($action === 'add_service') {
        $servicoId = post_text('servicoId');
        $profissionalId = post_text('profissionalId') ?: ($target['profissionalPrincipalId'] ?? null);
        $serviceStmt = $pdo->prepare('SELECT id, nome, preco, comissaoPercentualPadrao FROM servico WHERE id = :id AND empresaId = :empresaId LIMIT 1');
        $serviceStmt->execute(['id' => $servicoId, 'empresaId' => $user['empresaId']]);
        $servico = $serviceStmt->fetch();
        if ($servico) {
            $valor = (float) $servico['preco'];
            $pdo->prepare("INSERT INTO comandaitem (id, comandaId, tipo, servicoId, produtoId, profissionalId, descricao, quantidade, valorUnitario, valorTotal, custoUnitario, comissaoPercentual, valorComissao, createdAt) VALUES (:id,:comandaId,'SERVICO',:servicoId,NULL,:profissionalId,:descricao,1,:valorUnitario,:valorTotal,0,:comissaoPercentual,:valorComissao,NOW())")->execute([
                'id' => new_id(), 'comandaId' => $comandaId, 'servicoId' => $servico['id'], 'profissionalId' => $profissionalId ?: null,
                'descricao' => $servico['nome'], 'valorUnitario' => $valor, 'valorTotal' => $valor,
                'comissaoPercentual' => (float) $servico['comissaoPercentualPadrao'], 'valorComissao' => $valor * ((float) $servico['comissaoPercentualPadrao'] / 100),
            ]);
        }
    }

    if ($action === 'add_product') {
        $produtoId = post_text('produtoId');
        $quantidade = max(1, (int) ($_POST['quantidade'] ?? 1));
        $prodStmt = $pdo->prepare('SELECT id, nome, preco, custo, estoqueAtual FROM produto WHERE id = :id AND empresaId = :empresaId LIMIT 1');
        $prodStmt->execute(['id' => $produtoId, 'empresaId' => $user['empresaId']]);
        $produto = $prodStmt->fetch();
        if ($produto) {
            $valorUnitario = (float) $produto['preco'];
            $valorTotal = $valorUnitario * $quantidade;
            $pdo->prepare("INSERT INTO comandaitem (id, comandaId, tipo, servicoId, produtoId, profissionalId, descricao, quantidade, valorUnitario, valorTotal, custoUnitario, comissaoPercentual, valorComissao, createdAt) VALUES (:id,:comandaId,'PRODUTO',NULL,:produtoId,NULL,:descricao,:quantidade,:valorUnitario,:valorTotal,:custoUnitario,0,0,NOW())")->execute([
                'id' => new_id(), 'comandaId' => $comandaId, 'produtoId' => $produto['id'], 'descricao' => $produto['nome'], 'quantidade' => $quantidade,
                'valorUnitario' => $valorUnitario, 'valorTotal' => $valorTotal, 'custoUnitario' => (float) $produto['custo'],
            ]);

            $anterior = (int) $produto['estoqueAtual'];
            $atual = max(0, $anterior - $quantidade);
            $pdo->prepare('UPDATE produto SET estoqueAtual = :atual, updatedAt = NOW() WHERE id = :id')->execute(['atual' => $atual, 'id' => $produto['id']]);
            $pdo->prepare("INSERT INTO estoquemovimentacao (id, empresaId, produtoId, tipo, quantidade, usuarioId, createdAt, observacao, origem, saldoAnterior, saldoAtual) VALUES (:id,:empresaId,:produtoId,'CONSUMO_COMANDA',:quantidade,:usuarioId,NOW(),:observacao,'COMANDA',:saldoAnterior,:saldoAtual)")->execute([
                'id' => new_id(), 'empresaId' => $user['empresaId'], 'produtoId' => $produto['id'], 'quantidade' => $quantidade,
                'usuarioId' => $user['id'], 'observacao' => 'Consumo na comanda #' . $target['numeroSequencial'], 'saldoAnterior' => $anterior, 'saldoAtual' => $atual,
            ]);
        }
    }

    if ($action === 'remove_item') {
        $itemId = post_text('itemId');
        $itemStmt = $pdo->prepare('SELECT * FROM comandaitem WHERE id = :id AND comandaId = :comandaId LIMIT 1');
        $itemStmt->execute(['id' => $itemId, 'comandaId' => $comandaId]);
        $item = $itemStmt->fetch();
        if ($item) {
            if (($item['tipo'] ?? '') === 'PRODUTO' && !empty($item['produtoId'])) {
                $prodStmt = $pdo->prepare('SELECT estoqueAtual FROM produto WHERE id = :id LIMIT 1');
                $prodStmt->execute(['id' => $item['produtoId']]);
                $produtoAtual = (int) ($prodStmt->fetchColumn() ?: 0);
                $novoSaldo = $produtoAtual + (int) round((float) $item['quantidade']);
                $pdo->prepare('UPDATE produto SET estoqueAtual = :saldo, updatedAt = NOW() WHERE id = :id')->execute(['saldo' => $novoSaldo, 'id' => $item['produtoId']]);
            }
            $pdo->prepare('DELETE FROM comandaitem WHERE id = :id')->execute(['id' => $itemId]);
        }
    }

    if ($action === 'add_payment') {
        $metodo = post_text('metodo') ?: 'DINHEIRO';
        $valor = (float) str_replace(',', '.', (string) ($_POST['valor'] ?? 0));
        $observacoes = post_text('observacoes');
        if ($valor > 0) {
            $pdo->prepare('INSERT INTO comandapagamento (id, comandaId, metodo, valor, observacoes, pagoEm, recebidoPorUsuarioId) VALUES (:id,:comandaId,:metodo,:valor,:observacoes,NOW(),:usuarioId)')->execute([
                'id' => new_id(), 'comandaId' => $comandaId, 'metodo' => $metodo, 'valor' => $valor, 'observacoes' => $observacoes, 'usuarioId' => $user['id'],
            ]);
        }
    }

    if ($action === 'remove_payment') {
        $paymentId = post_text('paymentId');
        $pdo->prepare('DELETE FROM comandapagamento WHERE id = :id AND comandaId = :comandaId')->execute(['id' => $paymentId, 'comandaId' => $comandaId]);
    }

    if ($action === 'update_summary') {
        $pdo->prepare('UPDATE comanda SET descontoValor = :desconto, acrescimoValor = :acrescimo, observacoes = :observacoes, updatedAt = NOW() WHERE id = :id')->execute([
            'desconto' => (float) str_replace(',', '.', (string) ($_POST['descontoValor'] ?? 0)),
            'acrescimo' => (float) str_replace(',', '.', (string) ($_POST['acrescimoValor'] ?? 0)),
            'observacoes' => post_text('observacoes'),
            'id' => $comandaId,
        ]);
    }

    $totaisStmt = $pdo->prepare('SELECT tipo, COALESCE(SUM(valorTotal),0) total FROM comandaitem WHERE comandaId = :id GROUP BY tipo');
    $totaisStmt->execute(['id' => $comandaId]);
    $subtotalServicos = 0.0;
    $subtotalProdutos = 0.0;
    foreach ($totaisStmt->fetchAll() as $totalItem) {
        if ($totalItem['tipo'] === 'SERVICO') $subtotalServicos = (float) $totalItem['total'];
        if ($totalItem['tipo'] === 'PRODUTO') $subtotalProdutos = (float) $totalItem['total'];
    }
    $desconto = (float) ($_POST['descontoValor'] ?? $target['descontoValor'] ?? 0);
    $acrescimo = (float) ($_POST['acrescimoValor'] ?? $target['acrescimoValor'] ?? 0);
    $total = max(0, ($subtotalServicos + $subtotalProdutos + $acrescimo) - $desconto);

    $statusFinal = $target['status'];
    $fechadaEm = $target['fechadaEm'];
    if ($action === 'finalize') {
        $statusFinal = 'FECHADA';
        $fechadaEm = date('Y-m-d H:i:s');
    } elseif ($statusFinal !== 'FECHADA') {
        $statusFinal = ($subtotalServicos + $subtotalProdutos) > 0 ? 'EM_ANDAMENTO' : 'ABERTA';
    }

    $pdo->prepare('UPDATE comanda SET subtotalServicos = :subtotalServicos, subtotalProdutos = :subtotalProdutos, total = :total, status = :status, fechadaEm = :fechadaEm, updatedAt = NOW() WHERE id = :id')->execute([
        'subtotalServicos' => $subtotalServicos, 'subtotalProdutos' => $subtotalProdutos, 'total' => $total,
        'status' => $statusFinal, 'fechadaEm' => $fechadaEm, 'id' => $comandaId,
    ]);

    redirect_to('comanda.php?id=' . urlencode($comandaId));
}
$stmt = $pdo->prepare(
    'SELECT c.*, cli.nome AS cliente_nome, p.nome AS profissional_nome, a.inicio AS agendamento_inicio
     FROM comanda c
     LEFT JOIN cliente cli ON cli.id = c.clienteId
     LEFT JOIN profissional p ON p.id = c.profissionalPrincipalId
     LEFT JOIN agendamento a ON a.id = c.agendamentoId
     WHERE c.id = :id AND c.empresaId = :empresaId
     LIMIT 1'
);
$stmt->execute(['id' => $id, 'empresaId' => $user['empresaId']]);
$comanda = $stmt->fetch();
if (!$comanda) {
    redirect_to('comandas.php');
}

$itensStmt = $pdo->prepare('SELECT tipo, descricao, quantidade, valorUnitario, valorTotal FROM comandaitem WHERE comandaId = :id ORDER BY createdAt ASC');
$itensStmt->execute(['id' => $id]);
$itens = $itensStmt->fetchAll();

$pagamentosStmt = $pdo->prepare('SELECT metodo, valor, observacoes, pagoEm FROM comandapagamento WHERE comandaId = :id ORDER BY pagoEm ASC');
$pagamentosStmt->execute(['id' => $id]);
$pagamentos = $pagamentosStmt->fetchAll();

$totalPago = 0.0;
foreach ($pagamentos as $pagamento) {
    $totalPago += (float) $pagamento['valor'];
}
$restante = (float) $comanda['total'] - $totalPago;

$produtosDisponiveis = $pdo->prepare('SELECT id, nome, preco, estoqueAtual, unidade FROM produto WHERE empresaId = :empresaId AND ativo = 1 ORDER BY nome ASC');
$produtosDisponiveis->execute(['empresaId' => $user['empresaId']]);
$produtosDisponiveis = $produtosDisponiveis->fetchAll();

$servicosDisponiveis = $pdo->prepare('SELECT id, nome, preco FROM servico WHERE empresaId = :empresaId AND ativo = 1 ORDER BY nome ASC');
$servicosDisponiveis->execute(['empresaId' => $user['empresaId']]);
$servicosDisponiveis = $servicosDisponiveis->fetchAll();

$profissionaisDisponiveis = $pdo->prepare('SELECT id, nome FROM profissional WHERE empresaId = :empresaId AND ativo = 1 ORDER BY nome ASC');
$profissionaisDisponiveis->execute(['empresaId' => $user['empresaId']]);
$profissionaisDisponiveis = $profissionaisDisponiveis->fetchAll();

render_header('Comanda #' . $comanda['numeroSequencial'], $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Comanda</p>
            <h3>#<?= h((string) $comanda['numeroSequencial']) ?></h3>
        </div>
        <a class="btn btn-outline" href="comandas.php">Voltar</a>
    </div>
    <div class="stats-grid compact-grid">
        <article class="stat-card"><span>Status</span><strong><?= h($comanda['status']) ?></strong></article>
        <article class="stat-card"><span>Cliente</span><strong><?= h($comanda['cliente_nome'] ?: '-') ?></strong></article>
        <article class="stat-card"><span>Profissional</span><strong><?= h($comanda['profissional_nome'] ?: '-') ?></strong></article>
        <article class="stat-card"><span>Total</span><strong><?= h(money_br($comanda['total'])) ?></strong></article>
        <article class="stat-card"><span>Pago</span><strong><?= h(money_br($totalPago)) ?></strong></article>
        <article class="stat-card"><span>Restante</span><strong><?= h(money_br($restante)) ?></strong></article>
    </div>
    <?php if (!empty($comanda['agendamento_inicio'])): ?>
        <div class="flash flash-success">Agendamento vinculado: <?= h(datetime_br($comanda['agendamento_inicio'])) ?></div>
    <?php endif; ?>
</section>

<?php if ($comanda['status'] !== 'FECHADA'): ?>
<div class="grid-two equal-two">
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Serviço</p><h3>Adicionar serviço</h3></div></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="action" value="add_service"><input type="hidden" name="comandaId" value="<?= h($comanda['id']) ?>">
        <label class="field-wide"><span>Serviço</span><select name="servicoId" class="select-inline" required><?php foreach ($servicosDisponiveis as $servico): ?><option value="<?= h($servico['id']) ?>"><?= h($servico['nome']) ?> - <?= h(money_br($servico['preco'])) ?></option><?php endforeach; ?></select></label>
        <label class="field-wide"><span>Profissional</span><select name="profissionalId" class="select-inline"><option value="">Usar principal</option><?php foreach ($profissionaisDisponiveis as $profissional): ?><option value="<?= h($profissional['id']) ?>" <?= $comanda['profissionalPrincipalId'] === $profissional['id'] ? 'selected' : '' ?>><?= h($profissional['nome']) ?></option><?php endforeach; ?></select></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Adicionar serviço</button></div>
    </form>
</section>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Produto</p><h3>Adicionar produto</h3></div></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="action" value="add_product"><input type="hidden" name="comandaId" value="<?= h($comanda['id']) ?>">
        <label class="field-wide"><span>Produto</span><select name="produtoId" class="select-inline" required><?php foreach ($produtosDisponiveis as $produto): ?><option value="<?= h($produto['id']) ?>"><?= h($produto['nome']) ?> - <?= h(money_br($produto['preco'])) ?> - saldo <?= h((string)$produto['estoqueAtual']) ?> <?= h($produto['unidade']) ?></option><?php endforeach; ?></select></label>
        <label><span>Quantidade</span><input type="number" name="quantidade" min="1" value="1"></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Adicionar produto</button></div>
    </form>
</section>
</div>

<div class="grid-two equal-two">
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Resumo</p><h3>Atualizar resumo</h3></div></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="action" value="update_summary"><input type="hidden" name="comandaId" value="<?= h($comanda['id']) ?>">
        <label><span>Desconto</span><input type="number" step="0.01" name="descontoValor" value="<?= h((string)$comanda['descontoValor']) ?>"></label>
        <label><span>Acréscimo</span><input type="number" step="0.01" name="acrescimoValor" value="<?= h((string)$comanda['acrescimoValor']) ?>"></label>
        <label class="field-wide"><span>Observações</span><textarea name="observacoes"><?= h($comanda['observacoes']) ?></textarea></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Atualizar resumo</button></div>
    </form>
</section>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Pagamento</p><h3>Adicionar pagamento</h3></div></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="action" value="add_payment"><input type="hidden" name="comandaId" value="<?= h($comanda['id']) ?>">
        <label><span>Método</span><select name="metodo" class="select-inline"><option value="DINHEIRO">DINHEIRO</option><option value="PIX">PIX</option><option value="CARTAO_CREDITO">CARTAO_CREDITO</option><option value="CARTAO_DEBITO">CARTAO_DEBITO</option><option value="TRANSFERENCIA">TRANSFERENCIA</option><option value="BOLETO">BOLETO</option><option value="MISTO">MISTO</option><option value="FIADO">FIADO</option><option value="OUTRO">OUTRO</option></select></label>
        <label><span>Valor</span><input type="number" step="0.01" name="valor" value="<?= h(number_format(max(0, $restante), 2, '.', '')) ?>"></label>
        <label class="field-wide"><span>Observações</span><input type="text" name="observacoes"></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Adicionar pagamento</button></div>
    </form>
</section>
</div>
<?php endif; ?>

<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Itens</p><h3>Itens da comanda</h3></div></div>
    <div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Quantidade</th><th>Unitário</th><th>Total</th></tr></thead><tbody>
    <?php foreach ($itens as $item): ?><tr><td><span class="badge"><?= h($item['tipo']) ?></span></td><td><?= h($item['descricao']) ?></td><td><?= h((string) $item['quantidade']) ?></td><td><?= h(money_br($item['valorUnitario'])) ?></td><td><?= h(money_br($item['valorTotal'])) ?></td></tr><?php endforeach; ?>
    <?php if (!$itens): ?><tr><td colspan="5" class="empty">Nenhum item na comanda.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>

<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Pagamentos</p><h3>Pagamentos lançados</h3></div></div>
    <div class="table-wrap"><table><thead><tr><th>Método</th><th>Valor</th><th>Pago em</th><th>Observações</th></tr></thead><tbody>
    <?php foreach ($pagamentos as $pagamento): ?><tr><td><span class="badge"><?= h($pagamento['metodo']) ?></span></td><td><?= h(money_br($pagamento['valor'])) ?></td><td><?= h(datetime_br($pagamento['pagoEm'])) ?></td><td><?= h($pagamento['observacoes']) ?: '-' ?></td></tr><?php endforeach; ?>
    <?php if (!$pagamentos): ?><tr><td colspan="4" class="empty">Nenhum pagamento lançado.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>

<?php if ($comanda['status'] !== 'FECHADA'): ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Fechamento</p><h3>Finalizar comanda</h3></div></div>
    <form method="post" class="form-actions">
        <input type="hidden" name="action" value="finalize"><input type="hidden" name="comandaId" value="<?= h($comanda['id']) ?>">
        <button class="btn btn-brand" type="submit">Finalizar comanda</button>
    </form>
</section>
<?php endif; ?>
<?php render_footer($user); ?>
