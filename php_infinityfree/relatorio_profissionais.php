<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$stmt = db()->prepare('SELECT nome, telefone, email, cidade, ativo FROM profissional WHERE empresaId = :empresaId ORDER BY nome ASC');
$stmt->execute(['empresaId' => $user['empresaId']]);
$rows = $stmt->fetchAll();

render_header('Relatório de Profissionais', $user);
?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Profissionais</h3></div></div>
    <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>Status</th></tr></thead><tbody>
    <?php foreach ($rows as $row): ?><tr><td><?= h($row['nome']) ?></td><td><?= h($row['telefone']) ?></td><td><?= h($row['email']) ?></td><td><?= h($row['cidade']) ?></td><td><span class="badge <?= (int) $row['ativo'] ? '' : 'badge-warning' ?>"><?= (int) $row['ativo'] ? 'Ativo' : 'Inativo' ?></span></td></tr><?php endforeach; ?>
    <?php if (!$rows): ?><tr><td colspan="5" class="empty">Nenhum dado encontrado.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>
<?php render_footer($user); ?>
