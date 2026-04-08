<?php

require __DIR__ . '/bootstrap.php';

if (cliente_user()) {
    redirect_to('cliente_agenda.php');
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = (string) ($_POST['login'] ?? '');
    $password = (string) ($_POST['senha'] ?? '');

    if (attempt_cliente_login($login, $password)) {
        redirect_to('cliente_agenda.php');
    }

    $error = 'Login inválido.';
}

render_header('Área do Cliente');
?>
<main class="login-page">
    <div class="login-glow login-glow-top"></div>
    <div class="login-glow login-glow-bottom"></div>
    <section class="login-card">
        <div class="login-icon">✂</div>
        <p class="eyebrow eyebrow-center">Área do Cliente</p>
        <h1 class="login-title font-display">Entrar</h1>
        <p class="login-copy">Acesse sua área para consultar seus agendamentos.</p>
        <?php if ($error): ?><div class="flash flash-error"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="login-form">
            <label><span>Login</span><input type="text" name="login" required></label>
            <label><span>Senha</span><input type="password" name="senha" required></label>
            <button class="btn btn-brand btn-full" type="submit">Entrar</button>
        </form>
    </section>
</main>
<?php render_footer(); ?>
