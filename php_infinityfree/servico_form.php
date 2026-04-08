<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$id = trim((string) ($_GET['id'] ?? $_POST['id'] ?? ''));
$editing = $id !== '';
$error = null;
$servico = ['nome'=>'','descricao'=>'','duracaoMin'=>30,'preco'=>0,'comissaoPercentualPadrao'=>0,'ativo'=>1,'exibirNoSite'=>1];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM servico WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $stmt->execute(['id'=>$id,'empresaId'=>$user['empresaId']]);
    $found = $stmt->fetch();
    if ($found) $servico = $found; else redirect_to('servicos.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = [
        'nome'=>post_text('nome'),'descricao'=>post_text('descricao'),'duracaoMin'=>(int)($_POST['duracaoMin'] ?? 30),
        'preco'=>(float)str_replace(',', '.', (string)($_POST['preco'] ?? 0)),'comissaoPercentualPadrao'=>(float)str_replace(',', '.', (string)($_POST['comissaoPercentualPadrao'] ?? 0)),
        'ativo'=>post_bool('ativo'),'exibirNoSite'=>post_bool('exibirNoSite')
    ];
    if ($payload['nome'] === '') {
        $error = 'Informe o nome do serviço.';
        $servico = array_merge($servico, $payload);
    } else {
        if ($editing) {
            $pdo->prepare('UPDATE servico SET nome=:nome, descricao=:descricao, duracaoMin=:duracaoMin, preco=:preco, comissaoPercentualPadrao=:comissaoPercentualPadrao, ativo=:ativo, exibirNoSite=:exibirNoSite, updatedAt=NOW() WHERE id=:id AND empresaId=:empresaId')->execute($payload + ['id'=>$id,'empresaId'=>$user['empresaId']]);
        } else {
            $pdo->prepare('INSERT INTO servico (id, empresaId, nome, descricao, duracaoMin, preco, comissaoPercentualPadrao, ativo, exibirNoSite, createdAt, updatedAt) VALUES (:id,:empresaId,:nome,:descricao,:duracaoMin,:preco,:comissaoPercentualPadrao,:ativo,:exibirNoSite,NOW(),NOW())')->execute($payload + ['id'=>new_id(),'empresaId'=>$user['empresaId']]);
        }
        redirect_to('servicos.php');
    }
}

render_header($editing ? 'Editar Serviço' : 'Novo Serviço', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Serviço</p><h3><?= $editing ? 'Editar serviço' : 'Novo serviço' ?></h3></div><a class="btn btn-outline" href="servicos.php">Voltar</a></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="id" value="<?= h($id) ?>">
        <label><span>Nome</span><input type="text" name="nome" value="<?= h($servico['nome']) ?>" required></label>
        <label><span>Duração (min)</span><input type="number" name="duracaoMin" value="<?= h((string)$servico['duracaoMin']) ?>"></label>
        <label><span>Preço</span><input type="number" step="0.01" name="preco" value="<?= h((string)$servico['preco']) ?>"></label>
        <label><span>Comissão (%)</span><input type="number" step="0.01" name="comissaoPercentualPadrao" value="<?= h((string)$servico['comissaoPercentualPadrao']) ?>"></label>
        <label class="field-wide"><span>Descrição</span><textarea name="descricao"><?= h($servico['descricao']) ?></textarea></label>
        <label class="checkbox-field"><input type="checkbox" name="ativo" value="1" <?= (int)$servico['ativo']?'checked':'' ?>> <span>Serviço ativo</span></label>
        <label class="checkbox-field"><input type="checkbox" name="exibirNoSite" value="1" <?= (int)$servico['exibirNoSite']?'checked':'' ?>> <span>Exibir no site</span></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Salvar serviço</button></div>
    </form>
</section>
<?php render_footer($user); ?>
