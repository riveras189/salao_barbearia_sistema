<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();

$stats = [
    'clientes' => 0,
    'profissionais' => 0,
    'agendamentos_hoje' => 0,
    'comandas_abertas' => 0,
    'receber_aberto' => 0,
    'caixa_hoje' => 0,
    'estoque_baixo' => 0,
    'aniversariantes_hoje' => 0,
    'contas_vencidas' => 0,
];

$empresaId = $user['empresaId'];

$queries = [
    'clientes' => 'SELECT COUNT(*) FROM cliente WHERE empresaId = :empresaId AND ativo = 1',
    'profissionais' => 'SELECT COUNT(*) FROM profissional WHERE empresaId = :empresaId AND ativo = 1',
    'agendamentos_hoje' => 'SELECT COUNT(*) FROM agendamento WHERE empresaId = :empresaId AND DATE(inicio) = CURDATE() AND status <> "CANCELADO"',
    'comandas_abertas' => 'SELECT COUNT(*) FROM comanda WHERE empresaId = :empresaId AND status = "ABERTA"',
    'receber_aberto' => 'SELECT COALESCE(SUM(valorAberto), 0) FROM contareceber WHERE empresaId = :empresaId AND status IN ("PENDENTE", "PARCIAL")',
    'caixa_hoje' => 'SELECT COALESCE(SUM(CASE WHEN tipo = "ENTRADA" THEN valor ELSE -valor END), 0) FROM caixamovimento WHERE empresaId = :empresaId AND DATE(dataMovimento) = CURDATE()',
    'estoque_baixo' => 'SELECT COUNT(*) FROM produto WHERE empresaId = :empresaId AND ativo = 1 AND estoqueAtual <= estoqueMinimo',
    'aniversariantes_hoje' => 'SELECT COUNT(*) FROM cliente WHERE empresaId = :empresaId AND MONTH(dataNascimento) = MONTH(CURDATE()) AND DAY(dataNascimento) = DAY(CURDATE())',
    'contas_vencidas' => 'SELECT COUNT(*) FROM contareceber WHERE empresaId = :empresaId AND status IN ("ABERTA", "PARCIAL", "VENCIDA") AND vencimento IS NOT NULL AND DATE(vencimento) < CURDATE()',
];

foreach ($queries as $key => $sql) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['empresaId' => $empresaId]);
    $stats[$key] = $stmt->fetchColumn();
}

$upcomingStmt = $pdo->prepare(
    'SELECT a.inicio, a.status, c.nome AS cliente_nome, p.nome AS profissional_nome
     FROM agendamento a
     INNER JOIN cliente c ON c.id = a.clienteId
     INNER JOIN profissional p ON p.id = a.profissionalId
     WHERE a.empresaId = :empresaId AND a.inicio >= NOW()
     ORDER BY a.inicio ASC
     LIMIT 8'
);
$upcomingStmt->execute(['empresaId' => $empresaId]);
$upcoming = $upcomingStmt->fetchAll();

render_header('Dashboard', $user);
?>
<section class="hero-card dashboard-hero">
    <div>
        <h2 class="dashboard-title font-display">Dashboard</h2>
        <p class="dashboard-copy">Visão geral do sistema para <?= h($user['nome']) ?>.</p>
        <p class="dashboard-company"><?= h($user['nomeFantasia'] ?: $user['razaoSocial'] ?: 'Riveras Salão de Beleza e Barbearia') ?></p>
    </div>
</section>

<section class="stats-grid dashboard-cards">
    <article class="stat-card stat-accent-blue"><span>Agendamentos hoje</span><strong><?= h((string) $stats['agendamentos_hoje']) ?></strong><small>Agenda do dia</small></article>
    <article class="stat-card stat-accent-purple"><span>Comandas abertas</span><strong><?= h((string) $stats['comandas_abertas']) ?></strong><small>Abertas e em andamento</small></article>
    <article class="stat-card stat-accent-green"><span>Receita do dia</span><strong><?= h(money_br($stats['caixa_hoje'])) ?></strong><small>Fechamentos de hoje</small></article>
    <article class="stat-card stat-accent-amber"><span>Estoque baixo</span><strong><?= h((string) $stats['estoque_baixo']) ?></strong><small>Produtos abaixo do mínimo</small></article>
    <article class="stat-card stat-accent-pink"><span>Aniversariantes hoje</span><strong><?= h((string) $stats['aniversariantes_hoje']) ?></strong><small>Clientes para felicitar</small></article>
    <article class="stat-card stat-accent-cyan"><span>Clientes ativos</span><strong><?= h((string) $stats['clientes']) ?></strong><small>Base ativa</small></article>
    <article class="stat-card stat-accent-violet"><span>Profissionais ativos</span><strong><?= h((string) $stats['profissionais']) ?></strong><small>Equipe disponível</small></article>
    <article class="stat-card stat-accent-red"><span>Contas vencidas</span><strong><?= h((string) $stats['contas_vencidas']) ?></strong><small>A receber vencidas</small></article>
</section>

<?php if (!$upcoming): ?>
<div class="flash flash-warn">Hoje ainda não há agendamentos encontrados no dashboard.</div>
<?php endif; ?>

<section class="panel-card dashboard-section">
    <div class="section-head">
        <div>
            <h3>Horários de hoje</h3>
            <p class="muted section-copy">Lista do dia com cliente, profissional e serviços.</p>
        </div>
        <a class="btn btn-outline btn-small" href="agenda.php">Abrir agenda</a>
    </div>
    <div class="table-wrap">
        <table>
            <thead>
            <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Profissional</th>
                <th>Status</th>
            </tr>
            </thead>
            <tbody>
            <?php foreach ($upcoming as $row): ?>
                <tr>
                    <td><?= h(datetime_br($row['inicio'])) ?></td>
                    <td><?= h($row['cliente_nome']) ?></td>
                    <td><?= h($row['profissional_nome']) ?></td>
                    <td><span class="badge"><?= h($row['status']) ?></span></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$upcoming): ?>
                <tr><td colspan="4" class="empty">Nenhum horário encontrado para hoje.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>

<section class="panel-card dashboard-section">
    <div class="section-head">
        <div>
            <h3>Alertas de aniversário</h3>
            <p class="muted section-copy">Clientes em faixa de aniversário nos próximos dias.</p>
        </div>
    </div>
    <div class="empty-block">Painel PHP em evolução para reproduzir os alertas avançados do sistema original.</div>
</section>
<?php render_footer($user); ?>
