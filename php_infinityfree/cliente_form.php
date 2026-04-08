<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$id = trim((string) ($_GET['id'] ?? $_POST['id'] ?? ''));
$editing = $id !== '';
$error = null;

$cliente = [
    'nome' => '',
    'cpf' => '',
    'dataNascimento' => '',
    'email' => '',
    'telefone' => '',
    'whatsapp' => '',
    'cep' => '',
    'logradouro' => '',
    'numero' => '',
    'complemento' => '',
    'bairro' => '',
    'cidade' => '',
    'uf' => '',
    'observacoes' => '',
    'origemCadastro' => '',
    'fotoUrl' => '',
    'ativo' => 1,
];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM cliente WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $stmt->execute(['id' => $id, 'empresaId' => $user['empresaId']]);
    $found = $stmt->fetch();
    if ($found) {
        $cliente = $found;
    } else {
        redirect_to('clientes.php');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dataNascimento = post_text('dataNascimento');
    $payload = [
        'nome' => post_text('nome'),
        'cpf' => post_text('cpf'),
        'dataNascimento' => $dataNascimento !== '' ? $dataNascimento . ' 00:00:00' : null,
        'email' => post_text('email'),
        'telefone' => post_text('telefone'),
        'whatsapp' => post_text('whatsapp'),
        'cep' => post_text('cep'),
        'logradouro' => post_text('logradouro'),
        'numero' => post_text('numero'),
        'complemento' => post_text('complemento'),
        'bairro' => post_text('bairro'),
        'cidade' => post_text('cidade'),
        'uf' => post_text('uf'),
        'observacoes' => post_text('observacoes'),
        'origemCadastro' => post_text('origemCadastro'),
        'fotoUrl' => (string) ($cliente['fotoUrl'] ?? ''),
        'ativo' => post_bool('ativo'),
    ];

    try {
        $uploadedPhoto = handle_image_upload('fotoArquivo', 'clientes');
        if ($uploadedPhoto !== null) {
            $payload['fotoUrl'] = $uploadedPhoto;
        }

        if ($payload['nome'] === '') {
            $error = 'Informe o nome do cliente.';
            $cliente = array_merge($cliente, $payload, ['dataNascimento' => $dataNascimento]);
        } else {
            if ($editing) {
                $sql = 'UPDATE cliente SET nome=:nome, cpf=:cpf, dataNascimento=:dataNascimento, email=:email, telefone=:telefone, whatsapp=:whatsapp, cep=:cep, logradouro=:logradouro, numero=:numero, complemento=:complemento, bairro=:bairro, cidade=:cidade, uf=:uf, observacoes=:observacoes, origemCadastro=:origemCadastro, fotoUrl=:fotoUrl, ativo=:ativo, updatedAt=NOW() WHERE id=:id AND empresaId=:empresaId';
                $pdo->prepare($sql)->execute($payload + ['id' => $id, 'empresaId' => $user['empresaId']]);
            } else {
                $sql = 'INSERT INTO cliente (id, empresaId, nome, cpf, dataNascimento, email, telefone, whatsapp, cep, logradouro, numero, complemento, bairro, cidade, uf, observacoes, origemCadastro, fotoUrl, ativo, createdAt, updatedAt) VALUES (:id, :empresaId, :nome, :cpf, :dataNascimento, :email, :telefone, :whatsapp, :cep, :logradouro, :numero, :complemento, :bairro, :cidade, :uf, :observacoes, :origemCadastro, :fotoUrl, :ativo, NOW(), NOW())';
                $pdo->prepare($sql)->execute($payload + ['id' => new_id(), 'empresaId' => $user['empresaId']]);
            }

            flash_set('success', $editing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
            redirect_to('clientes.php');
        }
    } catch (RuntimeException $exception) {
        $error = $exception->getMessage();
        $cliente = array_merge($cliente, $payload, ['dataNascimento' => $dataNascimento]);
    }
}

$dataNascimentoValue = '';
if (!empty($cliente['dataNascimento'])) {
    $timestamp = strtotime((string) $cliente['dataNascimento']);
    if ($timestamp) {
        $dataNascimentoValue = date('Y-m-d', $timestamp);
    }
}

render_header($editing ? 'Editar Cliente' : 'Novo Cliente', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Cliente</p><h3><?= $editing ? 'Editar cliente' : 'Novo cliente' ?></h3></div><a class="btn btn-outline" href="clientes.php">Voltar</a></div>
    <form method="post" enctype="multipart/form-data" class="form-grid">
        <input type="hidden" name="id" value="<?= h($id) ?>">
        <label><span>Nome</span><input type="text" name="nome" value="<?= h($cliente['nome']) ?>" required></label>
        <label><span>CPF</span><input type="text" name="cpf" value="<?= h($cliente['cpf']) ?>"></label>
        <label><span>Data de nascimento</span><input type="date" name="dataNascimento" value="<?= h($dataNascimentoValue) ?>"></label>
        <label><span>E-mail</span><input type="email" name="email" value="<?= h($cliente['email']) ?>"></label>
        <label><span>Telefone</span><input type="text" name="telefone" value="<?= h($cliente['telefone']) ?>"></label>
        <label><span>WhatsApp</span><input type="text" name="whatsapp" value="<?= h($cliente['whatsapp']) ?>"></label>
        <label><span>CEP</span><input type="text" name="cep" value="<?= h($cliente['cep']) ?>"></label>
        <label><span>Logradouro</span><input type="text" name="logradouro" value="<?= h($cliente['logradouro']) ?>"></label>
        <label><span>Número</span><input type="text" name="numero" value="<?= h($cliente['numero']) ?>"></label>
        <label><span>Complemento</span><input type="text" name="complemento" value="<?= h($cliente['complemento']) ?>"></label>
        <label><span>Bairro</span><input type="text" name="bairro" value="<?= h($cliente['bairro']) ?>"></label>
        <label><span>Cidade</span><input type="text" name="cidade" value="<?= h($cliente['cidade']) ?>"></label>
        <label><span>UF</span><input type="text" name="uf" value="<?= h($cliente['uf']) ?>"></label>
        <label><span>Origem do cadastro</span><input type="text" name="origemCadastro" value="<?= h($cliente['origemCadastro']) ?>"></label>
        <label><span>Foto do cliente</span><input type="file" name="fotoArquivo" accept=".jpg,.jpeg,.png,.webp,.gif,image/*"></label>
        <?php if (!empty($cliente['fotoUrl'])): ?>
            <label>
                <span>Foto atual</span>
                <div class="upload-preview"><img class="avatar avatar-large" src="<?= h($cliente['fotoUrl']) ?>" alt="<?= h($cliente['nome']) ?>"></div>
            </label>
        <?php endif; ?>
        <label class="field-wide"><span>Observações</span><textarea name="observacoes"><?= h($cliente['observacoes']) ?></textarea></label>
        <label class="checkbox-field"><input type="checkbox" name="ativo" value="1" <?= (int) $cliente['ativo'] ? 'checked' : '' ?>> <span>Cliente ativo</span></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Salvar cliente</button></div>
    </form>
</section>
<?php render_footer($user); ?>
