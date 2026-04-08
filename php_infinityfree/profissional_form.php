<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$id = trim((string) ($_GET['id'] ?? $_POST['id'] ?? ''));
$editing = $id !== '';
$error = null;

$profissional = ['nome'=>'','cpf'=>'','cnpj'=>'','email'=>'','telefone'=>'','whatsapp'=>'','cep'=>'','logradouro'=>'','numero'=>'','complemento'=>'','bairro'=>'','cidade'=>'','uf'=>'','observacoes'=>'','corAgenda'=>'#c89b3c','fotoUrl'=>'','ativo'=>1];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM profissional WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $stmt->execute(['id'=>$id,'empresaId'=>$user['empresaId']]);
    $found = $stmt->fetch();
    if ($found) { $profissional = $found; } else { redirect_to('profissionais.php'); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = [
        'nome'=>post_text('nome'),'cpf'=>post_text('cpf'),'cnpj'=>post_text('cnpj'),'email'=>post_text('email'),'telefone'=>post_text('telefone'),'whatsapp'=>post_text('whatsapp'),'cep'=>post_text('cep'),'logradouro'=>post_text('logradouro'),'numero'=>post_text('numero'),'complemento'=>post_text('complemento'),'bairro'=>post_text('bairro'),'cidade'=>post_text('cidade'),'uf'=>post_text('uf'),'observacoes'=>post_text('observacoes'),'corAgenda'=>post_text('corAgenda'),'fotoUrl'=>post_text('fotoUrl'),'ativo'=>post_bool('ativo')
    ];
    if ($payload['nome'] === '') {
        $error = 'Informe o nome do profissional.';
        $profissional = array_merge($profissional, $payload);
    } else {
        if ($editing) {
            $sql = 'UPDATE profissional SET nome=:nome, cpf=:cpf, cnpj=:cnpj, email=:email, telefone=:telefone, whatsapp=:whatsapp, cep=:cep, logradouro=:logradouro, numero=:numero, complemento=:complemento, bairro=:bairro, cidade=:cidade, uf=:uf, observacoes=:observacoes, corAgenda=:corAgenda, fotoUrl=:fotoUrl, ativo=:ativo, updatedAt=NOW() WHERE id=:id AND empresaId=:empresaId';
            $pdo->prepare($sql)->execute($payload + ['id'=>$id,'empresaId'=>$user['empresaId']]);
        } else {
            $sql = 'INSERT INTO profissional (id, empresaId, nome, cpf, cnpj, email, telefone, whatsapp, cep, logradouro, numero, complemento, bairro, cidade, uf, observacoes, corAgenda, fotoUrl, ativo, createdAt, updatedAt) VALUES (:id, :empresaId, :nome, :cpf, :cnpj, :email, :telefone, :whatsapp, :cep, :logradouro, :numero, :complemento, :bairro, :cidade, :uf, :observacoes, :corAgenda, :fotoUrl, :ativo, NOW(), NOW())';
            $pdo->prepare($sql)->execute($payload + ['id'=>new_id(),'empresaId'=>$user['empresaId']]);
        }
        redirect_to('profissionais.php');
    }
}

render_header($editing ? 'Editar Profissional' : 'Novo Profissional', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Profissional</p><h3><?= $editing ? 'Editar profissional' : 'Novo profissional' ?></h3></div><a class="btn btn-outline" href="profissionais.php">Voltar</a></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="id" value="<?= h($id) ?>">
        <label><span>Nome</span><input type="text" name="nome" value="<?= h($profissional['nome']) ?>" required></label>
        <label><span>E-mail</span><input type="email" name="email" value="<?= h($profissional['email']) ?>"></label>
        <label><span>Telefone</span><input type="text" name="telefone" value="<?= h($profissional['telefone']) ?>"></label>
        <label><span>WhatsApp</span><input type="text" name="whatsapp" value="<?= h($profissional['whatsapp']) ?>"></label>
        <label><span>CPF</span><input type="text" name="cpf" value="<?= h($profissional['cpf']) ?>"></label>
        <label><span>CNPJ</span><input type="text" name="cnpj" value="<?= h($profissional['cnpj']) ?>"></label>
        <label><span>CEP</span><input type="text" name="cep" value="<?= h($profissional['cep']) ?>"></label>
        <label><span>Logradouro</span><input type="text" name="logradouro" value="<?= h($profissional['logradouro']) ?>"></label>
        <label><span>Número</span><input type="text" name="numero" value="<?= h($profissional['numero']) ?>"></label>
        <label><span>Complemento</span><input type="text" name="complemento" value="<?= h($profissional['complemento']) ?>"></label>
        <label><span>Bairro</span><input type="text" name="bairro" value="<?= h($profissional['bairro']) ?>"></label>
        <label><span>Cidade</span><input type="text" name="cidade" value="<?= h($profissional['cidade']) ?>"></label>
        <label><span>UF</span><input type="text" name="uf" value="<?= h($profissional['uf']) ?>"></label>
        <label><span>Cor da agenda</span><input type="text" name="corAgenda" value="<?= h($profissional['corAgenda']) ?>"></label>
        <label><span>Foto URL</span><input type="text" name="fotoUrl" value="<?= h($profissional['fotoUrl']) ?>"></label>
        <label class="field-wide"><span>Observações</span><textarea name="observacoes"><?= h($profissional['observacoes']) ?></textarea></label>
        <label class="checkbox-field"><input type="checkbox" name="ativo" value="1" <?= (int) $profissional['ativo'] ? 'checked' : '' ?>> <span>Profissional ativo</span></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Salvar profissional</button></div>
    </form>
</section>
<?php render_footer($user); ?>
