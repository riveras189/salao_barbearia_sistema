<?php

require __DIR__ . '/bootstrap.php';

$cliente = require_cliente_login();
$stmt = db()->prepare(
    'SELECT a.inicio, a.fim, a.status, p.nome AS profissional_nome
     FROM agendamento a
     INNER JOIN profissional p ON p.id = a.profissionalId
     WHERE a.empresaId = :empresaId AND a.clienteId = :clienteId
     ORDER BY a.inicio DESC
     LIMIT 50'
);
$stmt->execute([
    'empresaId' => $cliente['empresaId'],
    'clienteId' => $cliente['clienteId'],
]);
$rows = $stmt->fetchAll();

render_header('Minha Agenda');
?>
<main class="client-area">
    <section class="client-card">
        <div class="section-head">
            <div>
                <p class="eyebrow">Cliente</p>
                <h3><?= h($cliente['nome']) ?></h3>
                <p class="muted">Login: <?= h($cliente['login']) ?></p>
            </div>
            <a class="btn btn-outline" href="cliente_logout.php">Sair</a>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Início</th><th>Fim</th><th>Profissional</th><th>Status</th></tr></thead><tbody>
        <?php foreach ($rows as $row): ?><tr><td><?= h(datetime_br($row['inicio'])) ?></td><td><?= h(datetime_br($row['fim'])) ?></td><td><?= h($row['profissional_nome']) ?></td><td><span class="badge"><?= h($row['status']) ?></span></td></tr><?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="4" class="empty">Nenhum agendamento encontrado.</td></tr><?php endif; ?>
        </tbody></table></div>
    </section>
</main>
<?php render_footer(); ?>
