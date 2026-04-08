<?php

require __DIR__ . '/bootstrap.php';

if (app_user()) {
    redirect_to('dashboard.php');
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = (string) ($_POST['login'] ?? '');
    $password = (string) ($_POST['senha'] ?? '');

    if (attempt_login($login, $password)) {
        redirect_to('dashboard.php');
    }

    $error = 'Usuário ou senha inválidos.';
}

render_header('Login');
?>
<main class="login-page">
    <div class="login-glow login-glow-top"></div>
    <div class="login-glow login-glow-bottom"></div>
    <section class="login-card">
        <div class="login-icon">✂</div>
        <p class="eyebrow eyebrow-center">Barbearia Sistema</p>
        <h1 class="login-title font-display">Bem-vindo</h1>
        <p class="login-copy">Faça login para acessar o painel da barbearia.</p>

        <?php if ($error): ?>
            <div class="flash flash-error"><?= h($error) ?></div>
        <?php endif; ?>

        <form method="post" class="login-form">
            <label>
                <span>Login ou e-mail</span>
                <input type="text" name="login" placeholder="Ex: admin" required>
            </label>
            <label>
                <span>Senha</span>
                <input type="password" name="senha" placeholder="••••••••" required>
            </label>
            <button class="btn btn-brand btn-full" type="submit">Entrar no painel</button>
        </form>
    </section>
</main>
<?php render_footer(); ?>
