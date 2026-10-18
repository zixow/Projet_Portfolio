<?php
/*
 * Mise en page commune de l'administration : en-tête avec menu, message flash, pied de page.
 */
declare(strict_types=1);

const MENU_ADMIN = [
    'tableau.php'                   => ['fa-solid fa-gauge', 'Tableau de bord'],
    'gerer.php?section=actualites'  => ['fa-solid fa-newspaper', 'Actualités'],
    'gerer.php?section=competences' => ['fa-solid fa-laptop-code', 'Compétences'],
    'gerer.php?section=certifications' => ['fa-solid fa-medal', 'Certifications'],
    'gerer.php?section=projets'     => ['fa-solid fa-diagram-project', 'Projets'],
];

function entete(string $titre, ?string $pageActive = null): void
{
    $admin = $_SESSION['admin'] ?? null;
    $flash = lireFlash();
    ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title><?= e($titre) ?> — Administration du portfolio</title>
    <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body>
<header class="barre">
    <a class="barre__logo" href="<?= $admin ? 'tableau.php' : 'index.php' ?>">NT<span>.</span> <small>Administration</small></a>
    <?php if ($admin): ?>
        <nav class="barre__menu" aria-label="Administration">
            <?php foreach (MENU_ADMIN as $lien => [$icone, $libelle]): ?>
                <a href="<?= e($lien) ?>"<?= $lien === $pageActive ? ' aria-current="page"' : '' ?>><i class="<?= e($icone) ?>"></i> <?= e($libelle) ?></a>
            <?php endforeach; ?>
        </nav>
        <div class="barre__compte">
            <a href="../index.html" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Voir le site</a>
            <form method="post" action="deconnexion.php">
                <?= champCsrf() ?>
                <button type="submit"><i class="fa-solid fa-right-from-bracket"></i> Se déconnecter (<?= e($admin['identifiant']) ?>)</button>
            </form>
        </div>
    <?php endif; ?>
</header>
<main class="page">
    <h1><?= e($titre) ?></h1>
    <?php if ($flash): ?>
        <p class="flash flash--<?= e($flash['type']) ?>" role="status"><?= e($flash['message']) ?></p>
    <?php endif; ?>
    <?php
}

function pied(): void
{
    ?>
</main>
</body>
</html>
    <?php
}
