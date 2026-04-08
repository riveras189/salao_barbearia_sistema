<?php

require __DIR__ . '/bootstrap.php';

$user = require_login();
$pdo = db();
$q = trim((string) ($_GET['q'] ?? ''));

$sql = 'SELECT id, nome, cpf, cnpj, telefone, whatsapp, email, cidade, corAgenda, ativo, fotoUrl
        FROM profissional
        WHERE empresaId = :empresaId';
$params = ['empresaId' => $user['empresaId']];

if ($q !== '') {
    $sql .= ' AND (nome LIKE :q_nome OR email LIKE :q_email OR cidade LIKE :q_cidade OR telefone LIKE :q_telefone OR whatsapp LIKE :q_whatsapp OR cpf LIKE :q_cpf OR cnpj LIKE :q_cnpj)';
    $search = '%' . $q . '%';
    $params['q_nome'] = $search;
    $params['q_email'] = $search;
    $params['q_cidade'] = $search;
    $params['q_telefone'] = $search;
    $params['q_whatsapp'] = $search;
    $params['q_cpf'] = $search;
    $params['q_cnpj'] = $search;
}

$sql .= ' ORDER BY nome ASC LIMIT 90';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

render_header('Profissionais', $user);
?>
<section class="panel-card">
    <div class="section-head section-head-stack">
        <div>
            <p class="eyebrow">Equipe</p>
            <h3>Profissionais</h3>
        </div>
        <div class="search-form">
            <form method="get" class="search-form">
                <input type="search" name="q" value="<?= h($q) ?>" placeholder="Buscar por nome, documento, telefone, e-mail ou cidade">
                <button class="btn btn-outline" type="submit">Buscar</button>
            </form>
            <a class="btn btn-brand" href="profissional_form.php">Novo profissional</a>
        </div>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Profissional</th><th>Contato</th><th>Documento</th><th>Cidade</th><th>Cor</th><th>Status</th></tr></thead>
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
                                <div class="card-actions"><a class="btn btn-outline btn-small" href="profissional_form.php?id=<?= urlencode($row['id']) ?>">Editar</a></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div><?= h($row['telefone']) ?: '-' ?></div>
                        <div class="muted"><?= h($row['whatsapp']) ?: '-' ?></div>
                    </td>
                    <td>
                        <div>CPF: <?= h($row['cpf']) ?: '-' ?></div>
                        <div class="muted">CNPJ: <?= h($row['cnpj']) ?: '-' ?></div>
                    </td>
                    <td><?= h($row['cidade']) ?: '-' ?></td>
                    <td>
                        <?php if (!empty($row['corAgenda'])): ?>
                            <span class="color-dot" style="background: <?= h($row['corAgenda']) ?>"></span>
                            <?= h($row['corAgenda']) ?>
                        <?php else: ?>
                            -
                        <?php endif; ?>
                    </td>
                    <td><span class="badge <?= (int) $row['ativo'] ? '' : 'badge-warning' ?>"><?= (int) $row['ativo'] ? 'Ativo' : 'Inativo' ?></span></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?>
                <tr><td colspan="6" class="empty">Nenhum profissional encontrado.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php render_footer($user); ?>
