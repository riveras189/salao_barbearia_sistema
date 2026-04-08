<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$q = trim((string) ($_GET['q'] ?? ''));

if ($_SERVER['REQUEST_METHOD'] === 'POST' && post_text('action') === 'delete') {
    $id = post_text('id');
    if ($id !== '') {
        try {
            $stmt = $pdo->prepare('DELETE FROM cliente WHERE id = :id AND empresaId = :empresaId');
            $stmt->execute(['id' => $id, 'empresaId' => $user['empresaId']]);
            flash_set('success', 'Cliente excluido com sucesso.');
        } catch (PDOException $exception) {
            flash_set('error', 'Nao foi possivel excluir o cliente. Ele pode estar vinculado a agendamentos, comandas ou outros registros.');
        }
    }

    redirect_to('clientes.php' . ($q !== '' ? '?q=' . urlencode($q) : ''));
}

$sql = 'SELECT id, nome, telefone, whatsapp, email, cidade, ativo, fotoUrl, createdAt FROM cliente WHERE empresaId = :empresaId';
$params = ['empresaId' => $user['empresaId']];

if ($q !== '') {
    $sql .= ' AND (nome LIKE :q OR telefone LIKE :q OR email LIKE :q)';
    $params['q'] = '%' . $q . '%';
}

$sql .= ' ORDER BY createdAt DESC LIMIT 60';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

render_header('Clientes', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Cadastro</p>
            <h3>Clientes</h3>
        </div>
        <div class="search-form">
            <form method="get" class="search-form">
                <input type="search" name="q" value="<?= h($q) ?>" placeholder="Buscar por nome, telefone ou e-mail">
                <button class="btn btn-outline" type="submit">Buscar</button>
            </form>
            <a class="btn btn-brand" href="cliente_form.php">Novo cliente</a>
        </div>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Cliente</th><th>Contato</th><th>Cidade</th><th>Status</th><th>Cadastro</th><th>Acoes</th></tr></thead>
            <tbody>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <td>
                        <div class="table-person">
                            <?php if (!empty($row['fotoUrl'])): ?>
                                <img class="avatar" src="<?= h($row['fotoUrl']) ?>" alt="<?= h($row['nome']) ?>">
                            <?php else: ?>
                                <span class="avatar avatar-fallback"><?= h(mb_strtoupper(mb_substr($row['nome'], 0, 1))) ?></span>
                            <?php endif; ?>
                            <div>
                                <strong><?= h($row['nome']) ?></strong>
                                <div class="muted"><?= h($row['email']) ?: '-' ?></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div><?= h($row['telefone']) ?: '-' ?></div>
                        <div class="muted"><?= h($row['whatsapp']) ?: '-' ?></div>
                    </td>
                    <td><?= h($row['cidade']) ?></td>
                    <td><span class="badge <?= (int) $row['ativo'] ? '' : 'badge-warning' ?>"><?= (int) $row['ativo'] ? 'Ativo' : 'Inativo' ?></span></td>
                    <td><?= h(datetime_br($row['createdAt'])) ?></td>
                    <td class="actions-cell">
                        <div class="card-actions card-actions-stack">
                            <a class="btn btn-outline btn-small" href="cliente_form.php?id=<?= urlencode($row['id']) ?>">Editar</a>
                            <form method="post" onsubmit="return confirm('Excluir este cliente?');">
                                <input type="hidden" name="action" value="delete">
                                <input type="hidden" name="id" value="<?= h($row['id']) ?>">
                                <button class="btn btn-outline btn-small" type="submit">Excluir</button>
                            </form>
                        </div>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?>
                <tr><td colspan="6" class="empty">Nenhum cliente encontrado.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
