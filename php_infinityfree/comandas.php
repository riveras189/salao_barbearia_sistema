<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();

$q = trim((string) ($_GET['q'] ?? ''));
$status = trim((string) ($_GET['status'] ?? ''));

$stmt = $pdo->prepare(
    "SELECT c.id, c.numeroSequencial, c.status, c.total, c.createdAt, c.abertaEm, c.fechadaEm, c.observacoes, cli.nome AS cliente_nome, pro.nome AS profissional_nome
     FROM comanda c
     LEFT JOIN cliente cli ON cli.id = c.clienteId
     LEFT JOIN profissional pro ON pro.id = c.profissionalPrincipalId
     WHERE c.empresaId = :empresaId
       AND (:status_filter = '' OR c.status = :status_value)
       AND (:q_filter = '' OR c.observacoes LIKE :q_like_obs OR cli.nome LIKE :q_like_cli OR pro.nome LIKE :q_like_pro)
     ORDER BY c.createdAt DESC
     LIMIT 60"
);
$stmt->execute([
    'empresaId' => $user['empresaId'],
    'status_filter' => $status,
    'status_value' => $status,
    'q_filter' => $q,
    'q_like_obs' => '%' . $q . '%',
    'q_like_cli' => '%' . $q . '%',
    'q_like_pro' => '%' . $q . '%',
]);
$rows = $stmt->fetchAll();

$summary = [];
$sumStmt = $pdo->prepare('SELECT status, COUNT(*) total FROM comanda WHERE empresaId = :empresaId GROUP BY status');
$sumStmt->execute(['empresaId' => $user['empresaId']]);
foreach ($sumStmt->fetchAll() as $item) {
    $summary[$item['status']] = (int) $item['total'];
}

render_header('Comandas', $user);
?>
<section class="stats-grid compact-grid">
    <article class="stat-card"><span>Abertas</span><strong><?= h((string) ($summary['ABERTA'] ?? 0)) ?></strong></article>
    <article class="stat-card"><span>Em andamento</span><strong><?= h((string) ($summary['EM_ANDAMENTO'] ?? 0)) ?></strong></article>
    <article class="stat-card"><span>Fechadas</span><strong><?= h((string) ($summary['FECHADA'] ?? 0)) ?></strong></article>
    <article class="stat-card"><span>Canceladas</span><strong><?= h((string) ($summary['CANCELADA'] ?? 0)) ?></strong></article>
</section>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Atendimento</p>
            <h3>Últimas comandas</h3>
        </div>
        <form method="get" class="search-form">
            <input type="search" name="q" value="<?= h($q) ?>" placeholder="Buscar por cliente, profissional ou observação">
            <select name="status" class="select-inline">
                <option value="">Todos os status</option>
                <?php foreach (['ABERTA', 'EM_ANDAMENTO', 'FECHADA', 'CANCELADA'] as $itemStatus): ?>
                    <option value="<?= h($itemStatus) ?>" <?= $status === $itemStatus ? 'selected' : '' ?>><?= h($itemStatus) ?></option>
                <?php endforeach; ?>
            </select>
            <button class="btn btn-outline" type="submit">Buscar</button>
        </form>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Número</th><th>Cliente</th><th>Profissional</th><th>Status</th><th>Total</th><th>Abertura</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <td>#<?= h((string) $row['numeroSequencial']) ?></td>
                    <td><?= h($row['cliente_nome']) ?></td>
                    <td><?= h($row['profissional_nome']) ?></td>
                    <td><span class="badge"><?= h($row['status']) ?></span></td>
                    <td><?= h(money_br($row['total'])) ?></td>
                    <td><?= h(datetime_br($row['abertaEm'] ?: $row['createdAt'])) ?></td>
                    <td><a class="btn btn-outline btn-small" href="comanda.php?id=<?= urlencode($row['id']) ?>">Abrir</a></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?>
                <tr><td colspan="7" class="empty">Nenhuma comanda encontrada.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
