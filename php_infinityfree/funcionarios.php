<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$q = trim((string) ($_GET['q'] ?? ''));

$sql = 'SELECT id, nome, cpf, telefone, whatsapp, email, cidade, uf, ativo, fotoUrl FROM funcionario WHERE empresaId = :empresaId';
$params = ['empresaId' => $user['empresaId']];
if ($q !== '') {
    $sql .= ' AND (nome LIKE :q_nome OR cpf LIKE :q_cpf OR telefone LIKE :q_tel OR whatsapp LIKE :q_wpp OR email LIKE :q_email OR cidade LIKE :q_cidade)';
    $like = '%' . $q . '%';
    $params['q_nome'] = $like; $params['q_cpf'] = $like; $params['q_tel'] = $like; $params['q_wpp'] = $like; $params['q_email'] = $like; $params['q_cidade'] = $like;
}
$sql .= ' ORDER BY nome ASC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

render_header('Funcionários', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div><p class="eyebrow">Equipe</p><h3>Funcionários</h3></div>
        <div class="search-form">
            <form method="get" class="search-form"><input type="search" name="q" value="<?= h($q) ?>" placeholder="Buscar por nome, CPF, telefone, e-mail ou cidade"><button class="btn btn-outline" type="submit">Buscar</button></form>
            <a class="btn btn-brand" href="funcionario_form.php">Novo funcionário</a>
        </div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Contato</th><th>Cidade</th><th>Status</th><th></th></tr></thead><tbody>
    <?php foreach ($rows as $row): ?><tr><td><strong><?= h($row['nome']) ?></strong><div class="muted"><?= h($row['email']) ?: '-' ?></div></td><td><div><?= h($row['telefone']) ?: '-' ?></div><div class="muted"><?= h($row['whatsapp']) ?: '-' ?></div></td><td><?= h(trim(($row['cidade'] ?: '') . ' / ' . ($row['uf'] ?: ''))) ?: '-' ?></td><td><span class="badge <?= (int)$row['ativo'] ? '' : 'badge-warning' ?>"><?= (int)$row['ativo'] ? 'Ativo' : 'Inativo' ?></span></td><td><a class="btn btn-outline btn-small" href="funcionario_form.php?id=<?= urlencode($row['id']) ?>">Editar</a></td></tr><?php endforeach; ?>
    <?php if (!$rows): ?><tr><td colspan="5" class="empty">Nenhum funcionário encontrado.</td></tr><?php endif; ?>
    </tbody></table></div>
</section>
<?php render_footer($user); ?>
