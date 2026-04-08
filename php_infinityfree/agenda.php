<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$date = trim((string) ($_GET['data'] ?? date('Y-m-d')));

$stmt = $pdo->prepare(
    'SELECT a.inicio, a.fim, a.status, c.nome AS cliente_nome, p.nome AS profissional_nome
     FROM agendamento a
     INNER JOIN cliente c ON c.id = a.clienteId
     INNER JOIN profissional p ON p.id = a.profissionalId
     WHERE a.empresaId = :empresaId AND DATE(a.inicio) = :date
     ORDER BY a.inicio ASC'
);
$stmt->execute(['empresaId' => $user['empresaId'], 'date' => $date]);
$rows = $stmt->fetchAll();

render_header('Agenda', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Operação</p>
            <h3>Agenda do dia</h3>
        </div>
        <form method="get" class="search-form">
            <input type="date" name="data" value="<?= h($date) ?>">
            <button class="btn btn-outline" type="submit">Filtrar</button>
        </form>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Início</th><th>Fim</th><th>Cliente</th><th>Profissional</th><th>Status</th></tr></thead>
            <tbody>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <td><?= h(datetime_br($row['inicio'])) ?></td>
                    <td><?= h(datetime_br($row['fim'])) ?></td>
                    <td><?= h($row['cliente_nome']) ?></td>
                    <td><?= h($row['profissional_nome']) ?></td>
                    <td><span class="badge"><?= h($row['status']) ?></span></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?>
                <tr><td colspan="5" class="empty">Nenhum agendamento para a data selecionada.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
