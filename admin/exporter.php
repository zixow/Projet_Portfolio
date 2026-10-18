<?php
/*
 * Bouton « Mettre à jour la copie maintenant » : refait data/contenu.js depuis la base.
 */
declare(strict_types=1);

require __DIR__ . '/inc/securite.php';

exigerConnexion();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rediriger('tableau.php');
}
verifierCsrf();

try {
    exporterCopie(connexion());
    rediriger('tableau.php', 'Copie pour GitHub Pages mise à jour. Pensez à faire un commit puis un push.');
} catch (Throwable $erreur) {
    error_log('Export : ' . $erreur->getMessage());
    rediriger('tableau.php', "La copie n'a pas pu être mise à jour (droits d'écriture sur le dossier data ?).", 'erreur');
}
