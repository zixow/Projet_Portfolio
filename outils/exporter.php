<?php
/*
 * Met à jour data/contenu.js, la copie de la base utilisée par GitHub Pages.
 * Utilisation (dans le dossier du portfolio) : php outils/exporter.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { // outil en ligne de commande uniquement
    http_response_code(404);
    exit;
}

require __DIR__ . '/../api/lib/base.php';
require __DIR__ . '/../api/lib/export.php';

try {
    $chemin = exporterCopie(connexion());
    echo 'Copie mise à jour : ' . realpath($chemin) . "\n";
} catch (Throwable $erreur) {
    fwrite(STDERR, 'Erreur : ' . $erreur->getMessage() . "\n");
    exit(1);
}
