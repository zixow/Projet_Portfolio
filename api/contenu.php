<?php
/*
 * API : tout le contenu public du portfolio, lu dans la base de données, au format JSON.
 * Appelée par js/donnees.js. Si elle ne répond pas, le site utilise la copie data/contenu.js.
 */
declare(strict_types=1);

require __DIR__ . '/lib/base.php';
require __DIR__ . '/lib/contenu.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    echo json_encode(lireContenu(connexion()), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $erreur) {
    error_log('api/contenu.php : ' . $erreur->getMessage());
    http_response_code(503);
    echo json_encode(['erreur' => 'Base de données indisponible']);
}
