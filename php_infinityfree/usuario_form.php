<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
if (($user['papelBase'] ?? '') !== 'ADMIN') {
    redirect_to('usuarios.php');
}

$pdo = db();
$id = trim((string) ($_GET['id'] ?? $_POST['id'] ?? ''));
$editing = $id !== '';
$error = null;

$usuario = ['nome'=>'','email'=>'','login'=>'','papelBase'=>'RECEPCIONISTA','ativo'=>1];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM usuario WHERE id = :id AND empresaId = :empresaId LIMIT 1');
    $stmt->execute(['id'=>$id,'empresaId'=>$user['empresaId']]);
    $found = $stmt->fetch();
    if ($found) { $usuario = $found; } else { redirect_to('usuarios.php'); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = ['nome'=>post_text('nome'),'email'=>post_text('email'),'login'=>mb_strtolower(post_text('login')),'papelBase'=>post_text('papelBase') ?: 'RECEPCIONISTA','ativo'=>post_bool('ativo')];
    $senha = (string) ($_POST['senha'] ?? '');
    if ($payload['nome'] === '' || $payload['login'] === '') {
        $error = 'Informe nome e login.';
        $usuario = array_merge($usuario, $payload);
    } elseif (!$editing && $senha === '') {
        $error = 'Informe a senha do novo usuário.';
        $usuario = array_merge($usuario, $payload);
    } else {
        if ($editing) {
            $sql = 'UPDATE usuario SET nome=:nome, email=:email, login=:login, papelBase=:papelBase, ativo=:ativo, updatedAt=NOW()' . ($senha !== '' ? ', senhaHash=:senhaHash' : '') . ' WHERE id=:id AND empresaId=:empresaId';
            $params = $payload + ['id'=>$id,'empresaId'=>$user['empresaId']];
            if ($senha !== '') { $params['senhaHash'] = password_hash($senha, PASSWORD_BCRYPT); }
            $pdo->prepare($sql)->execute($params);
        } else {
            $sql = 'INSERT INTO usuario (id, empresaId, nome, email, login, senhaHash, papelBase, ativo, createdAt, updatedAt) VALUES (:id, :empresaId, :nome, :email, :login, :senhaHash, :papelBase, :ativo, NOW(), NOW())';
            $pdo->prepare($sql)->execute($payload + ['id'=>new_id(),'empresaId'=>$user['empresaId'],'senhaHash'=>password_hash($senha, PASSWORD_BCRYPT)]);
        }
        redirect_to('usuarios.php');
    }
}

render_header($editing ? 'Editar Usuário' : 'Novo Usuário', $user);
?>
<?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Usuário</p><h3><?= $editing ? 'Editar usuário' : 'Novo usuário' ?></h3></div><a class="btn btn-outline" href="usuarios.php">Voltar</a></div>
    <form method="post" class="form-grid">
        <input type="hidden" name="id" value="<?= h($id) ?>">
        <label><span>Nome</span><input type="text" name="nome" value="<?= h($usuario['nome']) ?>" required></label>
        <label><span>E-mail</span><input type="email" name="email" value="<?= h($usuario['email']) ?>"></label>
        <label><span>Login</span><input type="text" name="login" value="<?= h($usuario['login']) ?>" required></label>
        <label><span>Papel</span><select name="papelBase" class="select-inline"><option value="ADMIN" <?= $usuario['papelBase']==='ADMIN'?'selected':'' ?>>ADMIN</option><option value="GERENTE" <?= $usuario['papelBase']==='GERENTE'?'selected':'' ?>>GERENTE</option><option value="RECEPCIONISTA" <?= $usuario['papelBase']==='RECEPCIONISTA'?'selected':'' ?>>RECEPCIONISTA</option><option value="PROFISSIONAL" <?= $usuario['papelBase']==='PROFISSIONAL'?'selected':'' ?>>PROFISSIONAL</option></select></label>
        <label><span><?= $editing ? 'Nova senha (opcional)' : 'Senha' ?></span><input type="password" name="senha"></label>
        <label class="checkbox-field"><input type="checkbox" name="ativo" value="1" <?= (int) $usuario['ativo'] ? 'checked' : '' ?>> <span>Usuário ativo</span></label>
        <div class="field-wide form-actions"><button class="btn btn-brand" type="submit">Salvar usuário</button></div>
    </form>
</section>
<?php render_footer($user); ?>
