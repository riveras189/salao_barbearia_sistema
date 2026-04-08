<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();

$stmt = $pdo->prepare(
    'SELECT u.id, u.nome, u.email, u.login, u.papelBase, u.ativo, u.ultimoLoginEm,
            f.nome AS funcionario_nome,
            p.nome AS profissional_nome
     FROM usuario u
     LEFT JOIN funcionario f ON f.id = u.funcionarioId
     LEFT JOIN profissional p ON p.id = u.profissionalId
     WHERE u.empresaId = :empresaId
     ORDER BY u.nome ASC'
);
$stmt->execute(['empresaId' => $user['empresaId']]);
$rows = $stmt->fetchAll();

render_header('Usuários', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Acesso</p>
            <h3>Usuários do sistema</h3>
        </div>
        <a class="btn btn-brand" href="usuario_form.php">Novo usuário</a>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Nome</th><th>Login</th><th>Papel</th><th>Vínculo</th><th>Status</th><th>Último login</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <td>
                        <strong><?= h($row['nome']) ?></strong>
                        <div class="muted"><?= h($row['email']) ?: '-' ?></div>
                    </td>
                    <td><?= h($row['login']) ?></td>
                    <td><span class="badge"><?= h($row['papelBase']) ?></span></td>
                    <td><?= h($row['funcionario_nome'] ?: $row['profissional_nome'] ?: '-') ?></td>
                    <td><span class="badge <?= (int) $row['ativo'] ? '' : 'badge-warning' ?>"><?= (int) $row['ativo'] ? 'Ativo' : 'Inativo' ?></span></td>
                    <td><?= h(datetime_br($row['ultimoLoginEm'])) ?></td>
                    <td><a class="btn btn-outline btn-small" href="usuario_form.php?id=<?= urlencode($row['id']) ?>">Editar</a></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?>
                <tr><td colspan="7" class="empty">Nenhum usuário cadastrado.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
