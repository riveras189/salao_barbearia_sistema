<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$q = trim((string) ($_GET['q'] ?? ''));

$sql = 'SELECT id, nome, descricao, duracaoMin, preco, comissaoPercentualPadrao, ativo, exibirNoSite FROM servico WHERE empresaId = :empresaId';
$params = ['empresaId' => $user['empresaId']];
if ($q !== '') {
    $sql .= ' AND (nome LIKE :q_nome OR descricao LIKE :q_desc)';
    $params['q_nome'] = '%' . $q . '%';
    $params['q_desc'] = '%' . $q . '%';
}
$sql .= ' ORDER BY nome ASC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

render_header('Serviços', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div><p class="eyebrow">Catálogo</p><h3>Serviços</h3></div>
        <div class="search-form">
            <form method="get" class="search-form">
                <input type="search" name="q" value="<?= h($q) ?>" placeholder="Buscar por nome ou descrição">
                <button class="btn btn-outline" type="submit">Buscar</button>
            </form>
            <a class="btn btn-brand" href="servico_form.php">Novo serviço</a>
        </div>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Serviço</th><th>Duração</th><th>Preço</th><th>Comissão</th><th>Site</th><th>Status</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($rows as $row): ?>
                <tr>
                    <td><strong><?= h($row['nome']) ?></strong><div class="muted"><?= h($row['descricao']) ?: '-' ?></div></td>
                    <td><?= h((string) $row['duracaoMin']) ?> min</td>
                    <td><?= h(money_br($row['preco'])) ?></td>
                    <td><?= h((string) $row['comissaoPercentualPadrao']) ?>%</td>
                    <td><span class="badge <?= (int) $row['exibirNoSite'] ? '' : 'badge-warning' ?>"><?= (int) $row['exibirNoSite'] ? 'Exibir' : 'Oculto' ?></span></td>
                    <td><span class="badge <?= (int) $row['ativo'] ? '' : 'badge-warning' ?>"><?= (int) $row['ativo'] ? 'Ativo' : 'Inativo' ?></span></td>
                    <td><a class="btn btn-outline btn-small" href="servico_form.php?id=<?= urlencode($row['id']) ?>">Editar</a></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?><tr><td colspan="7" class="empty">Nenhum serviço encontrado.</td></tr><?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
