<?php

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo 'Crie php_infinityfree/config.php a partir de config.example.php';
    exit;
}

$config = require $configPath;

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name($config['session']['name'] ?? 'salao_php_session');
    session_start();
}

if (!isset($_SESSION['cliente_id'])) {
    $_SESSION['cliente_id'] = null;
}

date_default_timezone_set('America/Sao_Paulo');

const PHP_ROLE_PERMISSIONS = [
    'ADMIN' => ['*'],
    'GERENTE' => ['dashboard.view','clientes.*','profissionais.*','funcionarios.*','empresa.*','servicos.*','produtos.*','agenda.*','comandas.*','financeiro.*','relatorios.*','usuarios.view','site.*','auditoria.view','backup.view'],
    'RECEPCIONISTA' => ['dashboard.view','clientes.*','agenda.*','comandas.*','financeiro.caixa.view','financeiro.caixa.create','relatorios.view','site.view'],
    'PROFISSIONAL' => ['dashboard.view','agenda.self','comandas.self','clientes.view','relatorios.self','site.view'],
];

const PHP_SYSTEM_MODELS = [
    'padrao_v1' => ['name' => 'Padrão', 'greeting' => 'Bem-vindo ao sistema!', 'serviceLabel' => 'serviço', 'appointmentLabel' => 'agendamento'],
    'barbearia_v1' => ['name' => 'Barbearia', 'greeting' => 'Bem-vindo à barbearia!', 'serviceLabel' => 'corte', 'appointmentLabel' => 'horário'],
    'personalizado_v1' => ['name' => 'Personalizado', 'greeting' => 'Olá!', 'serviceLabel' => 'serviço', 'appointmentLabel' => 'agendamento'],
];

function app_config(?string $key = null, $default = null)
{
    global $config;

    if ($key === null) {
        return $config;
    }

    $value = $config;
    foreach (explode('.', $key) as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return $default;
        }
        $value = $value[$segment];
    }

    return $value;
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = app_config('db.host');
    $port = (int) app_config('db.port', 3306);
    $database = app_config('db.database');
    $username = app_config('db.username');
    $password = app_config('db.password');
    $charset = app_config('db.charset', 'utf8mb4');

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $host, $port, $database, $charset);
    try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $exception) {
        http_response_code(500);
        $showDetails = (bool) app_config('app_debug', false);
        echo 'Falha ao conectar ao banco de dados. Revise host, nome do banco, usuario e senha em config.php.';
        if ($showDetails) {
            echo '<pre style="white-space:pre-wrap">' . h($exception->getMessage()) . '</pre>';
        }
        exit;
    }

    return $pdo;
}

function h(?string $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function redirect_to(string $path): void
{
    $base = rtrim((string) app_config('base_url', ''), '/');
    $location = $base . '/' . ltrim($path, '/');
    header('Location: ' . ($location ?: '/'));
    exit;
}

function current_path(): string
{
    return basename(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '');
}

function is_active_page(string $file): bool
{
    return current_path() === $file;
}

function current_theme(): string
{
    return $_SESSION['theme'] ?? 'dark';
}

function current_model_id(): string
{
    $modelId = $_SESSION['model_id'] ?? 'barbearia_v1';
    return array_key_exists($modelId, PHP_SYSTEM_MODELS) ? $modelId : 'barbearia_v1';
}

function current_model(): array
{
    return PHP_SYSTEM_MODELS[current_model_id()];
}

function set_theme(string $theme): void
{
    $_SESSION['theme'] = $theme === 'light' ? 'light' : 'dark';
}

function set_model(string $modelId): void
{
    if (array_key_exists($modelId, PHP_SYSTEM_MODELS)) {
        $_SESSION['model_id'] = $modelId;
    }
}

function can_access(array $user, string $permission): bool
{
    $role = $user['papelBase'] ?? '';
    $list = PHP_ROLE_PERMISSIONS[$role] ?? [];
    if (in_array('*', $list, true) || in_array($permission, $list, true)) {
        return true;
    }
    $module = explode('.', $permission)[0];
    return in_array($module . '.*', $list, true);
}

function handle_preferences_request(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    $action = (string) ($_POST['action'] ?? '');
    if ($action === 'set_theme') {
        set_theme((string) ($_POST['theme'] ?? 'dark'));
        redirect_to(current_path() ?: 'dashboard.php');
    }

    if ($action === 'set_model') {
        set_model((string) ($_POST['model_id'] ?? 'barbearia_v1'));
        redirect_to(current_path() ?: 'dashboard.php');
    }
}

handle_preferences_request();

function flash_set(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function flash_get(): ?array
{
    if (!isset($_SESSION['flash'])) {
        return null;
    }

    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

function money_br($value): string
{
    return 'R$ ' . number_format((float) ($value ?? 0), 2, ',', '.');
}

function new_id(): string
{
    return bin2hex(random_bytes(12));
}

function post_bool(string $key): int
{
    return isset($_POST[$key]) ? 1 : 0;
}

function post_text(string $key): string
{
    return trim((string) ($_POST[$key] ?? ''));
}

function public_upload_dir(string $folder): string
{
    $path = __DIR__ . '/uploads/' . trim($folder, '/\\');
    if (!is_dir($path)) {
        mkdir($path, 0775, true);
    }

    return $path;
}

function handle_image_upload(string $field, string $folder): ?string
{
    if (empty($_FILES[$field]) || !is_array($_FILES[$field])) {
        return null;
    }

    $file = $_FILES[$field];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Falha no upload da imagem.');
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $originalName = (string) ($file['name'] ?? '');
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!in_array($extension, $allowedExtensions, true)) {
        throw new RuntimeException('Formato de imagem invalido. Use JPG, PNG, WEBP ou GIF.');
    }

    $uploadDir = public_upload_dir($folder);
    $fileName = uniqid('', true) . '.' . $extension;
    $targetPath = $uploadDir . '/' . $fileName;

    if (!move_uploaded_file($tmpName, $targetPath)) {
        throw new RuntimeException('Nao foi possivel salvar a imagem enviada.');
    }

    return 'uploads/' . trim($folder, '/\\') . '/' . $fileName;
}

function datetime_br(?string $value): string
{
    if (!$value) {
        return '-';
    }

    return date('d/m/Y H:i', strtotime($value));
}

function date_br(?string $value): string
{
    if (!$value) {
        return '-';
    }

    return date('d/m/Y', strtotime($value));
}

function app_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    static $user = false;
    if ($user !== false) {
        return $user;
    }

    $stmt = db()->prepare(
        'SELECT u.id, u.empresaId, u.nome, u.login, u.email, u.papelBase, e.nomeFantasia, e.razaoSocial
         FROM usuario u
         INNER JOIN empresa e ON e.id = u.empresaId
         WHERE u.id = :id AND u.ativo = 1
         LIMIT 1'
    );
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $row = $stmt->fetch();

    $user = $row ?: null;
    return $user;
}

function require_login(): array
{
    $user = app_user();
    if (!$user) {
        flash_set('error', 'Faça login para acessar o painel.');
        redirect_to('login.php');
    }

    return $user;
}

function attempt_login(string $login, string $password): bool
{
    $normalized = mb_strtolower(trim($login));
    if ($normalized === '' || $password === '') {
        return false;
    }

    $stmt = db()->prepare(
        'SELECT id, senhaHash
         FROM usuario
         WHERE ativo = 1 AND (LOWER(login) = :login_login OR LOWER(email) = :login_email)
         ORDER BY createdAt ASC
         LIMIT 1'
    );
    $stmt->execute([
        'login_login' => $normalized,
        'login_email' => $normalized,
    ]);
    $user = $stmt->fetch();

    if (!$user || empty($user['senhaHash'])) {
        return false;
    }

    if (!password_verify($password, $user['senhaHash'])) {
        return false;
    }

    $_SESSION['user_id'] = $user['id'];
    db()->prepare('UPDATE usuario SET ultimoLoginEm = NOW() WHERE id = :id')->execute(['id' => $user['id']]);
    return true;
}

function logout_user(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function cliente_user(): ?array
{
    if (empty($_SESSION['cliente_id'])) {
        return null;
    }

    static $cliente = false;
    if ($cliente !== false) {
        return $cliente;
    }

    $stmt = db()->prepare(
        'SELECT ca.id, ca.clienteId, ca.empresaId, ca.login, c.nome, c.email, c.telefone
         FROM clienteacesso ca
         INNER JOIN cliente c ON c.id = ca.clienteId
         WHERE ca.id = :id AND ca.ativo = 1
         LIMIT 1'
    );
    $stmt->execute(['id' => $_SESSION['cliente_id']]);
    $row = $stmt->fetch();
    $cliente = $row ?: null;
    return $cliente;
}

function attempt_cliente_login(string $login, string $password): bool
{
    $normalized = mb_strtolower(trim($login));
    if ($normalized === '' || $password === '') {
        return false;
    }

    $stmt = db()->prepare(
        'SELECT id, senhaHash
         FROM clienteacesso
         WHERE ativo = 1 AND LOWER(login) = :login
         LIMIT 1'
    );
    $stmt->execute(['login' => $normalized]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['senhaHash'])) {
        return false;
    }

    $_SESSION['cliente_id'] = $row['id'];
    db()->prepare('UPDATE clienteacesso SET ultimoLoginEm = NOW() WHERE id = :id')->execute(['id' => $row['id']]);
    return true;
}

function require_cliente_login(): array
{
    $cliente = cliente_user();
    if (!$cliente) {
        flash_set('error', 'Entre para acessar sua área.');
        redirect_to('cliente_login.php');
    }

    return $cliente;
}

function logout_cliente_user(): void
{
    $_SESSION['cliente_id'] = null;
}

function page_title(string $title): string
{
    return $title . ' | ' . (app_config('app_name', 'RF Sistema'));
}

function render_header(string $title, ?array $user = null): void
{
    $companyName = $user['nomeFantasia'] ?? $user['razaoSocial'] ?? 'Riveras Barbearia';
    $flash = flash_get();
    $theme = current_theme();
    $modelId = current_model_id();
    $model = current_model();

    $menuGroups = [];
    if ($user) {
        $menuGroups = [
            'Operacional' => [
                ['file' => 'dashboard.php', 'label' => 'Dashboard', 'permission' => 'dashboard.view'],
                ['file' => 'agenda.php', 'label' => 'Agenda', 'permission' => ($user['papelBase'] === 'PROFISSIONAL' ? 'agenda.self' : 'agenda.view')],
                ['file' => 'comandas.php', 'label' => 'Comandas', 'permission' => ($user['papelBase'] === 'PROFISSIONAL' ? 'comandas.self' : 'comandas.view')],
                ['file' => 'financeiro.php', 'label' => 'Financeiro', 'permission' => 'financeiro.view'],
            ],
            'Cadastros' => [
                ['file' => 'clientes.php', 'label' => 'Clientes', 'permission' => 'clientes.view'],
                ['file' => 'servicos.php', 'label' => 'Serviços', 'permission' => 'servicos.view'],
                ['file' => 'produtos.php', 'label' => 'Produtos', 'permission' => 'produtos.view'],
                ['file' => 'estoque.php', 'label' => 'Estoque', 'permission' => 'produtos.view'],
                ['file' => 'profissionais.php', 'label' => 'Profissionais', 'permission' => 'profissionais.view'],
                ['file' => 'funcionarios.php', 'label' => 'Funcionários', 'permission' => 'funcionarios.view'],
            ],
            'Gestão' => [
                ['file' => 'usuarios.php', 'label' => 'Usuários', 'permission' => 'usuarios.view'],
                ['file' => 'empresa.php', 'label' => 'Empresa', 'permission' => 'empresa.view'],
                ['file' => 'relatorios.php', 'label' => 'Relatórios', 'permission' => ($user['papelBase'] === 'PROFISSIONAL' ? 'relatorios.self' : 'relatorios.view')],
                ['file' => 'site.php', 'label' => 'Site', 'permission' => 'site.view'],
            ],
        ];
    }
    ?>
<!DOCTYPE html>
<html lang="pt-BR" data-model="<?= h($modelId) ?>" class="theme-<?= h($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h(page_title($title)) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/app.css">
</head>
<body>
<?php if ($user): ?>
<div class="app-shell">
    <aside class="sidebar barber-stripes">
        <div>
            <div class="brand-box">
                <div class="brand-icon">✂</div>
                <div>
                    <div class="eyebrow">Barbearia Sistema</div>
                    <strong><?= h($companyName) ?></strong>
                </div>
            </div>
            <nav class="nav-list grouped-nav">
                <?php foreach ($menuGroups as $groupLabel => $items): ?>
                    <div class="nav-group">
                        <div class="nav-group-label"><?= h($groupLabel) ?></div>
                        <?php foreach ($items as $item): ?>
                            <?php if (!can_access($user, $item['permission'])) continue; ?>
                            <a class="nav-link <?= is_active_page($item['file']) ? 'is-active' : '' ?>" href="<?= h($item['file']) ?>"><?= h($item['label']) ?></a>
                        <?php endforeach; ?>
                    </div>
                <?php endforeach; ?>
            </nav>
        </div>
        <div class="sidebar-footer">
            <div class="user-chip">
                <strong><?= h($user['nome']) ?></strong>
                <span><?= h($user['papelBase']) ?></span>
            </div>
            <a class="btn btn-outline" href="logout.php">Sair</a>
        </div>
    </aside>
    <main class="content">
        <header class="topbar">
            <div class="topbar-copy">
                <p class="eyebrow">Painel administrativo</p>
                <h1><?= h($title) ?></h1>
                <div class="topbar-subtitle muted"><?= h($model['greeting']) ?> Organize <?= h($model['serviceLabel']) ?>s, <?= h($model['appointmentLabel']) ?>s e atendimento.</div>
            </div>
            <div class="topbar-actions">
                <?php if (can_access($user, 'site.view')): ?>
                    <a class="btn btn-outline btn-small" href="site.php" target="_blank">Ver site</a>
                <?php endif; ?>
                <?php if (($user['papelBase'] ?? '') === 'ADMIN' || ($user['papelBase'] ?? '') === 'GERENTE'): ?>
                    <form method="post" class="inline-form">
                        <input type="hidden" name="action" value="set_model">
                        <select name="model_id" class="select-inline" onchange="this.form.submit()">
                            <?php foreach (PHP_SYSTEM_MODELS as $id => $item): ?>
                                <option value="<?= h($id) ?>" <?= $id === $modelId ? 'selected' : '' ?>><?= h($item['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </form>
                <?php endif; ?>
                <form method="post" class="inline-form">
                    <input type="hidden" name="action" value="set_theme">
                    <input type="hidden" name="theme" value="<?= $theme === 'dark' ? 'light' : 'dark' ?>">
                    <button class="btn btn-outline btn-small" type="submit"><?= $theme === 'dark' ? 'Tema claro' : 'Tema escuro' ?></button>
                </form>
            </div>
        </header>
        <?php if ($flash): ?>
            <div class="flash flash-<?= h($flash['type']) ?>"><?= h($flash['message']) ?></div>
        <?php endif; ?>
<?php else: ?>
    <?php if ($flash): ?>
        <div class="login-flash flash flash-<?= h($flash['type']) ?>"><?= h($flash['message']) ?></div>
    <?php endif; ?>
<?php endif; ?>
<?php
}

function render_footer(?array $user = null): void
{
    ?>
<?php if ($user): ?>
    </main>
</div>
<?php endif; ?>
</body>
</html>
<?php
}
