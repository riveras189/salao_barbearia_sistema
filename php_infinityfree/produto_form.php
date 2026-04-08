<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$id = trim((string) ($_GET['id'] ?? $_POST['id'] ?? ''));
$editing = $id !== '';
$error = null;

$produto = [
    'nome' => '', 'marca' => '', 'codigoBarras' => '', 'descricao' => '', 'unidade' => 'UN',
    'estoqueAtual' => 0, 'estoqueMinimo' => 0, 'preco' => 0, 'custo' => 0, 'comissao' => 0,
    'fotoUrl' => '', 'ativo' => 1,
];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM produto WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $stmt->execute(['id' => $id, 'empresaId' => $user['empresaId']]);
    $found = $stmt->fetch();
    if ($found) {
        $produto = $found;
    } else {
        redirect_to('produtos.php');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = [
        'nome' => post_text('nome'),
        'marca' => post_text('marca'),
        'codigoBarras' => post_text('codigoBarras'),
        'descricao' => post_text('descricao'),
        'unidade' => post_text('unidade') ?: 'UN',
        'estoqueAtual' => (int) ($_POST['estoqueAtual'] ?? 0),
        'estoqueMinimo' => (int) ($_POST['estoqueMinimo'] ?? 0),
        'preco' => (float) str_replace(',', '.', (string) ($_POST['preco'] ?? 0)),
        'custo' => (float) str_replace(',', '.', (string) ($_POST['custo'] ?? 0)),
        'comissao' => (float) str_replace(',', '.', (string) ($_POST['comissao'] ?? 0)),
        'fotoUrl' => post_text('fotoUrl'),
        'ativo' => post_bool('ativo'),
    ];

    if ($payload['nome'] === '') {
        $error = 'Informe o nome do produto.';
        $produto = array_merge($produto, $payload);
    } else {
        if ($editing) {
            $sql = 'UPDATE produto SET nome=:nome, marca=:marca, codigoBarras=:codigoBarras, descricao=:descricao, unidade=:unidade, estoqueAtual=:estoqueAtual, estoqueMinimo=:estoqueMinimo, preco=:preco, custo=:custo, comissao=:comissao, fotoUrl=:fotoUrl, ativo=:ativo, updatedAt=NOW() WHERE id=:id AND empresaId=:empresaId';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($payload + ['id' => $id, 'empresaId' => $user['empresaId']]);
        } else {
            $sql = 'INSERT INTO produto (id, empresaId, nome, marca, codigoBarras, descricao, unidade, estoqueAtual, estoqueMinimo, preco, custo, comissao, fotoUrl, ativo, createdAt, updatedAt) VALUES (:id, :empresaId, :nome, :marca, :codigoBarras, :descricao, :unidade, :estoqueAtual, :estoqueMinimo, :preco, :custo, :comissao, :fotoUrl, :ativo, NOW(), NOW())';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($payload + ['id' => new_id(), 'empresaId' => $user['empresaId']]);
        }
        redirect_to('produtos.php');
    }
}

render_header($editing ? 'Editar Produto' : 'Novo Produto', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Produto</p><h3><?= $editing ? 'Editar produto' : 'Novo produto' ?></h3></div><a class="btn btn-outline" href="produtos.php">Voltar</a></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="id" value="<?= h($id) ?>">
        <label><span>Nome</span><input type="text" name="nome" value="<?= h($produto['nome']) ?>" required></label>
        <label><span>Marca</span><input type="text" name="marca" value="<?= h($produto['marca']) ?>"></label>
        <label><span>Código de barras</span><input type="text" name="codigoBarras" value="<?= h($produto['codigoBarras']) ?>"></label>
        <label><span>Unidade</span><input type="text" name="unidade" value="<?= h($produto['unidade']) ?>"></label>
        <label><span>Preço</span><input type="number" step="0.01" name="preco" value="<?= h((string) $produto['preco']) ?>"></label>
        <label><span>Custo</span><input type="number" step="0.01" name="custo" value="<?= h((string) $produto['custo']) ?>"></label>
        <label><span>Comissão</span><input type="number" step="0.01" name="comissao" value="<?= h((string) $produto['comissao']) ?>"></label>
        <label><span>Estoque atual</span><input type="number" name="estoqueAtual" value="<?= h((string) $produto['estoqueAtual']) ?>"></label>
        <label><span>Estoque mínimo</span><input type="number" name="estoqueMinimo" value="<?= h((string) $produto['estoqueMinimo']) ?>"></label>
        <label><span>Foto URL</span><input type="text" name="fotoUrl" value="<?= h($produto['fotoUrl']) ?>"></label>
        <label class="field-wide"><span>Descrição</span><textarea name="descricao"><?= h($produto['descricao']) ?></textarea></label>
        <label class="checkbox-field"><input type="checkbox" name="ativo" value="1" <?= (int) $produto['ativo'] ? 'checked' : '' ?>> <span>Produto ativo</span></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Salvar produto</button></div>
    </form>
</section>
<?php render_footer($user); ?>
