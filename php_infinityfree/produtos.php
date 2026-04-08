<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$q = trim((string) ($_GET['q'] ?? ''));

$sql = 'SELECT id, nome, marca, codigoBarras, preco, custo, estoqueAtual, estoqueMinimo, ativo, fotoUrl
        FROM produto
        WHERE empresaId = :empresaId';
$params = ['empresaId' => $user['empresaId']];

if ($q !== '') {
    $sql .= ' AND (nome LIKE :q_nome OR marca LIKE :q_marca OR codigoBarras LIKE :q_codigo)';
    $search = '%' . $q . '%';
    $params['q_nome'] = $search;
    $params['q_marca'] = $search;
    $params['q_codigo'] = $search;
}

$sql .= ' ORDER BY nome ASC LIMIT 90';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

render_header('Produtos', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Catálogo</p>
            <h3>Produtos</h3>
        </div>
        <div class="search-form">
            <form method="get" class="search-form">
                <input type="search" name="q" value="<?= h($q) ?>" placeholder="Buscar por nome, marca ou código de barras">
                <button class="btn btn-outline" type="submit">Buscar</button>
            </form>
            <a class="btn btn-brand" href="produto_form.php">Novo produto</a>
        </div>
    </div>
    <div class="cards-grid cards-grid-products">
        <?php foreach ($rows as $row): ?>
            <?php $baixo = ((int) $row['estoqueAtual']) <= ((int) $row['estoqueMinimo']); ?>
            <article class="product-card">
                <div class="product-head">
                    <?php if (!empty($row['fotoUrl'])): ?>
                        <img class="product-image" src="<?= h($row['fotoUrl']) ?>" alt="<?= h($row['nome']) ?>">
                    <?php else: ?>
                        <div class="product-image product-image-empty">Sem foto</div>
                    <?php endif; ?>
                    <div class="product-meta">
                        <div class="product-title-row">
                            <h4><?= h($row['nome']) ?></h4>
                            <span class="badge <?= $baixo ? 'badge-warning' : '' ?>"><?= $baixo ? 'Estoque baixo' : 'Em estoque' ?></span>
                            <?php if (!(int) $row['ativo']): ?>
                                <span class="badge">Inativo</span>
                            <?php endif; ?>
                        </div>
                        <p>Marca: <?= h($row['marca']) ?: '-' ?></p>
                        <p>Código: <?= h($row['codigoBarras']) ?: '-' ?></p>
                        <p>Preço: <?= h(money_br($row['preco'])) ?></p>
                        <p>Custo: <?= h(money_br($row['custo'])) ?></p>
                        <p>Estoque: <strong><?= h((string) $row['estoqueAtual']) ?></strong> | Mínimo: <?= h((string) $row['estoqueMinimo']) ?></p>
                        <div class="card-actions"><a class="btn btn-outline btn-small" href="produto_form.php?id=<?= urlencode($row['id']) ?>">Editar</a></div>
                    </div>
                </div>
            </article>
        <?php endforeach; ?>
        <?php if (!$rows): ?>
            <div class="empty-block">Nenhum produto encontrado.</div>
        <?php endif; ?>
    </div>
</section>
<?php render_footer($user); ?>
