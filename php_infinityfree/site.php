<?php

require __DIR__ . '/bootstrap.php';

$empresa = db()->query('SELECT nomeFantasia, razaoSocial, descricaoPublica, missao, valores, visao, telefone, whatsapp, email, cidade, uf FROM empresa ORDER BY createdAt ASC LIMIT 1')->fetch();
$nome = $empresa['nomeFantasia'] ?: $empresa['razaoSocial'] ?: 'Barbearia';
render_header('Site');
?>
<main class="public-site">
    <section class="public-hero">
        <p class="eyebrow eyebrow-center">Site</p>
        <h1 class="font-display"><?= h($nome) ?></h1>
        <p class="public-copy"><?= h($empresa['descricaoPublica'] ?: 'Atendimento profissional com estilo barbearia.') ?></p>
        <div class="hero-actions">
            <a class="btn btn-brand" href="login.php">Entrar no painel</a>
            <a class="btn btn-outline" href="cliente_login.php">Área do cliente</a>
        </div>
    </section>
    <section class="cards-grid cards-grid-products">
        <article class="panel-card report-card"><p class="eyebrow">Missão</p><h3><?= h($empresa['missao'] ?: 'Cuidar do visual com excelência.') ?></h3></article>
        <article class="panel-card report-card"><p class="eyebrow">Valores</p><h3><?= h($empresa['valores'] ?: 'Qualidade, pontualidade e atendimento.') ?></h3></article>
        <article class="panel-card report-card"><p class="eyebrow">Contato</p><h3><?= h($empresa['telefone'] ?: $empresa['whatsapp'] ?: $empresa['email'] ?: '-') ?></h3><p class="muted"><?= h(trim(($empresa['cidade'] ?: '') . ' / ' . ($empresa['uf'] ?: ''))) ?></p></article>
    </section>
</main>
<?php render_footer(); ?>
