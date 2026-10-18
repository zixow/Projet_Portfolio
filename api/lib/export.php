<?php
/*
 * Copie du contenu de la base dans data/contenu.js.
 * GitHub Pages ne fait pas tourner PHP ni MySQL : la version en ligne du site lit cette copie.
 * Elle est refaite automatiquement après chaque modification dans l'administration,
 * ou à la main : php outils/exporter.php
 */
declare(strict_types=1);

require_once __DIR__ . '/contenu.php';

function cheminCopie(): string
{
    return dirname(__DIR__, 2) . '/data/contenu.js';
}

function exporterCopie(PDO $bdd): string
{
    $json = json_encode(
        lireContenu($bdd),
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_THROW_ON_ERROR
    );
    $js = "/* Copie du contenu de la base de données, générée automatiquement : ne pas modifier à la main.\n"
        . "   Utilisée quand la base n'est pas disponible (GitHub Pages, ouverture sans serveur).\n"
        . "   Pour la mettre à jour : administration du site, ou « php outils/exporter.php ». */\n"
        . 'window.CONTENU_PORTFOLIO = ' . $json . ";\n";

    $chemin = cheminCopie();
    if (!is_dir(dirname($chemin))) {
        mkdir(dirname($chemin), 0775, true);
    }
    if (file_put_contents($chemin, $js, LOCK_EX) === false) {
        throw new RuntimeException("Impossible d'écrire la copie : $chemin");
    }
    return $chemin;
}
