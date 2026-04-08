<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$id = trim((string) ($_GET['id'] ?? $_POST['id'] ?? ''));
$editing = $id !== '';
$error = null;
$funcionario = ['nome'=>'','cpf'=>'','email'=>'','telefone'=>'','whatsapp'=>'','cep'=>'','logradouro'=>'','numero'=>'','complemento'=>'','bairro'=>'','cidade'=>'','uf'=>'','observacoes'=>'','fotoUrl'=>'','ativo'=>1];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM funcionario WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $stmt->execute(['id'=>$id,'empresaId'=>$user['empresaId']]);
    $found = $stmt->fetch();
    if ($found) $funcionario = $found; else redirect_to('funcionarios.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = ['nome'=>post_text('nome'),'cpf'=>post_text('cpf'),'email'=>post_text('email'),'telefone'=>post_text('telefone'),'whatsapp'=>post_text('whatsapp'),'cep'=>post_text('cep'),'logradouro'=>post_text('logradouro'),'numero'=>post_text('numero'),'complemento'=>post_text('complemento'),'bairro'=>post_text('bairro'),'cidade'=>post_text('cidade'),'uf'=>post_text('uf'),'observacoes'=>post_text('observacoes'),'fotoUrl'=>post_text('fotoUrl'),'ativo'=>post_bool('ativo')];
    if ($payload['nome'] === '') {
        $error = 'Informe o nome do funcionário.';
        $funcionario = array_merge($funcionario, $payload);
    } else {
        if ($editing) {
            $pdo->prepare('UPDATE funcionario SET nome=:nome, cpf=:cpf, email=:email, telefone=:telefone, whatsapp=:whatsapp, cep=:cep, logradouro=:logradouro, numero=:numero, complemento=:complemento, bairro=:bairro, cidade=:cidade, uf=:uf, observacoes=:observacoes, fotoUrl=:fotoUrl, ativo=:ativo, updatedAt=NOW() WHERE id=:id AND empresaId=:empresaId')->execute($payload + ['id'=>$id,'empresaId'=>$user['empresaId']]);
        } else {
            $pdo->prepare('INSERT INTO funcionario (id, empresaId, nome, cpf, email, telefone, whatsapp, cep, logradouro, numero, complemento, bairro, cidade, uf, observacoes, fotoUrl, ativo, createdAt, updatedAt) VALUES (:id,:empresaId,:nome,:cpf,:email,:telefone,:whatsapp,:cep,:logradouro,:numero,:complemento,:bairro,:cidade,:uf,:observacoes,:fotoUrl,:ativo,NOW(),NOW())')->execute($payload + ['id'=>new_id(),'empresaId'=>$user['empresaId']]);
        }
        redirect_to('funcionarios.php');
    }
}

render_header($editing ? 'Editar Funcionário' : 'Novo Funcionário', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Funcionário</p><h3><?= $editing ? 'Editar funcionário' : 'Novo funcionário' ?></h3></div><a class="btn btn-outline" href="funcionarios.php">Voltar</a></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="id" value="<?= h($id) ?>">
        <label><span>Nome</span><input type="text" name="nome" value="<?= h($funcionario['nome']) ?>" required></label>
        <label><span>E-mail</span><input type="email" name="email" value="<?= h($funcionario['email']) ?>"></label>
        <label><span>Telefone</span><input type="text" name="telefone" value="<?= h($funcionario['telefone']) ?>"></label>
        <label><span>WhatsApp</span><input type="text" name="whatsapp" value="<?= h($funcionario['whatsapp']) ?>"></label>
        <label><span>CPF</span><input type="text" name="cpf" value="<?= h($funcionario['cpf']) ?>"></label>
        <label><span>CEP</span><input type="text" name="cep" value="<?= h($funcionario['cep']) ?>"></label>
        <label><span>Logradouro</span><input type="text" name="logradouro" value="<?= h($funcionario['logradouro']) ?>"></label>
        <label><span>Número</span><input type="text" name="numero" value="<?= h($funcionario['numero']) ?>"></label>
        <label><span>Complemento</span><input type="text" name="complemento" value="<?= h($funcionario['complemento']) ?>"></label>
        <label><span>Bairro</span><input type="text" name="bairro" value="<?= h($funcionario['bairro']) ?>"></label>
        <label><span>Cidade</span><input type="text" name="cidade" value="<?= h($funcionario['cidade']) ?>"></label>
        <label><span>UF</span><input type="text" name="uf" value="<?= h($funcionario['uf']) ?>"></label>
        <label><span>Foto URL</span><input type="text" name="fotoUrl" value="<?= h($funcionario['fotoUrl']) ?>"></label>
        <label class="field-wide"><span>Observações</span><textarea name="observacoes"><?= h($funcionario['observacoes']) ?></textarea></label>
        <label class="checkbox-field"><input type="checkbox" name="ativo" value="1" <?= (int)$funcionario['ativo']?'checked':'' ?>> <span>Funcionário ativo</span></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Salvar funcionário</button></div>
    </form>
</section>
<?php render_footer($user); ?>
