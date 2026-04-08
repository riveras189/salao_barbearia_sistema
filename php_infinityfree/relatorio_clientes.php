<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$stmt = db()->prepare('SELECT nome, telefone, email, cidade, createdAt FROM cliente WHERE empresaId = :empresaId ORDER BY createdAt DESC LIMIT 100');
$stmt->execute(['empresaId' => $user['empresaId']]);
$rows = $stmt->fetchAll();

render_header('Relatório de Clientes', $user);
?>
<section class="panel-card">
    <div class="section-head"><div><p class="eyebrow">Relatório</p><h3>Clientes</h3></div></div>
    <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>Cadastro</th></tr></thead><tbody>
    <?php foreach ($rows as $row): ?><tr><td><?= h($row['nome']) ?></td><td><?= h($row['telefone']) ?></td><td><?= h($row['email']) ?></td><td><?= h($row['cidade']) ?></td><td><?= h(datetime_br($row['createdAt'])) ?></td></tr><?php endforeach; ?>
    <?php if (!$rows): ?><tr><td colspan="5" class="empty">Nenhum dado encontrado.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>
<?php render_footer($user); ?>
