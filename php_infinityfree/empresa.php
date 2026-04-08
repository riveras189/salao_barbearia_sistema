<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$success = null;
$error = null;

$stmt = $pdo->prepare('SELECT * FROM empresa WHERE id = :id LIMIT 1');
$stmt->execute(['id' => $user['empresaId']]);
$empresa = $stmt->fetch();

if (!$empresa) {
    $stmt = $pdo->query('SELECT * FROM empresa ORDER BY createdAt ASC LIMIT 1');
    $empresa = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $empresa) {
    $payload = [
        'razaoSocial' => trim((string) ($_POST['razaoSocial'] ?? '')),
        'nomeFantasia' => trim((string) ($_POST['nomeFantasia'] ?? '')),
        'cnpj' => trim((string) ($_POST['cnpj'] ?? '')),
        'email' => trim((string) ($_POST['email'] ?? '')),
        'telefone' => trim((string) ($_POST['telefone'] ?? '')),
        'whatsapp' => trim((string) ($_POST['whatsapp'] ?? '')),
        'cep' => trim((string) ($_POST['cep'] ?? '')),
        'logradouro' => trim((string) ($_POST['logradouro'] ?? '')),
        'numero' => trim((string) ($_POST['numero'] ?? '')),
        'complemento' => trim((string) ($_POST['complemento'] ?? '')),
        'bairro' => trim((string) ($_POST['bairro'] ?? '')),
        'cidade' => trim((string) ($_POST['cidade'] ?? '')),
        'uf' => trim((string) ($_POST['uf'] ?? '')),
        'descricaoPublica' => trim((string) ($_POST['descricaoPublica'] ?? '')),
        'missao' => trim((string) ($_POST['missao'] ?? '')),
        'valores' => trim((string) ($_POST['valores'] ?? '')),
        'visao' => trim((string) ($_POST['visao'] ?? '')),
        'corPrimaria' => trim((string) ($_POST['corPrimaria'] ?? '')),
        'corSecundaria' => trim((string) ($_POST['corSecundaria'] ?? '')),
    ];

    try {
        $update = $pdo->prepare(
            'UPDATE empresa SET
                razaoSocial = :razaoSocial,
                nomeFantasia = :nomeFantasia,
                cnpj = :cnpj,
                email = :email,
                telefone = :telefone,
                whatsapp = :whatsapp,
                cep = :cep,
                logradouro = :logradouro,
                numero = :numero,
                complemento = :complemento,
                bairro = :bairro,
                cidade = :cidade,
                uf = :uf,
                descricaoPublica = :descricaoPublica,
                missao = :missao,
                valores = :valores,
                visao = :visao,
                corPrimaria = :corPrimaria,
                corSecundaria = :corSecundaria,
                updatedAt = NOW()
             WHERE id = :id'
        );
        $update->execute($payload + ['id' => $empresa['id']]);

        $stmt->execute(['id' => $empresa['id']]);
        $empresa = $stmt->fetch();
        $success = 'Dados da empresa salvos com sucesso.';
    } catch (Throwable $e) {
        $error = 'Não foi possível salvar os dados da empresa.';
    }
}

render_header('Empresa', $user);
?>
<?php if ($success): ?><div class="flash flash-success"><?= h($success) ?></div><?php endif; ?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>

<section class="panel-card">
    <div class="section-head">
        <div>
            <p class="eyebrow">Cadastro</p>
            <h3>Dados da empresa</h3>
        </div>
    </div>
    <?php if (!$empresa): ?>
        <div class="empty-block">Nenhuma empresa encontrada.</div>
    <?php else: ?>
        <form method="post" class="form-grid">
            <label><span>Razão social</span><input type="text" name="razaoSocial" value="<?= h($empresa['razaoSocial']) ?>"></label>
            <label><span>Nome fantasia</span><input type="text" name="nomeFantasia" value="<?= h($empresa['nomeFantasia']) ?>"></label>
            <label><span>CNPJ</span><input type="text" name="cnpj" value="<?= h($empresa['cnpj']) ?>"></label>
            <label><span>E-mail</span><input type="email" name="email" value="<?= h($empresa['email']) ?>"></label>
            <label><span>Telefone</span><input type="text" name="telefone" value="<?= h($empresa['telefone']) ?>"></label>
            <label><span>WhatsApp</span><input type="text" name="whatsapp" value="<?= h($empresa['whatsapp']) ?>"></label>
            <label><span>CEP</span><input type="text" name="cep" value="<?= h($empresa['cep']) ?>"></label>
            <label><span>Logradouro</span><input type="text" name="logradouro" value="<?= h($empresa['logradouro']) ?>"></label>
            <label><span>Número</span><input type="text" name="numero" value="<?= h($empresa['numero']) ?>"></label>
            <label><span>Complemento</span><input type="text" name="complemento" value="<?= h($empresa['complemento']) ?>"></label>
            <label><span>Bairro</span><input type="text" name="bairro" value="<?= h($empresa['bairro']) ?>"></label>
            <label><span>Cidade</span><input type="text" name="cidade" value="<?= h($empresa['cidade']) ?>"></label>
            <label><span>UF</span><input type="text" name="uf" maxlength="2" value="<?= h($empresa['uf']) ?>"></label>
            <label><span>Cor primária</span><input type="text" name="corPrimaria" value="<?= h($empresa['corPrimaria']) ?>"></label>
            <label><span>Cor secundária</span><input type="text" name="corSecundaria" value="<?= h($empresa['corSecundaria']) ?>"></label>
            <label class="field-wide"><span>Descrição pública</span><textarea name="descricaoPublica"><?= h($empresa['descricaoPublica']) ?></textarea></label>
            <label class="field-wide"><span>Missão</span><textarea name="missao"><?= h($empresa['missao']) ?></textarea></label>
            <label class="field-wide"><span>Valores</span><textarea name="valores"><?= h($empresa['valores']) ?></textarea></label>
            <label class="field-wide"><span>Visão</span><textarea name="visao"><?= h($empresa['visao']) ?></textarea></label>
            <div class="field-wide form-actions">
                <button class="btn btn-brand" type="submit">Salvar empresa</button>
            </div>
        </form>
    <?php endif; ?>
</section>
<?php render_footer($user); ?>
