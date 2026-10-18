<?php
/*
 * Déconnexion : la session est vidée puis détruite (formulaire POST avec jeton CSRF).
 */
declare(strict_types=1);

require __DIR__ . '/inc/securite.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rediriger('tableau.php');
}
verifierCsrf();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $parametres = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600, $parametres['path'], $parametres['domain'], $parametres['secure'], $parametres['httponly']);
}
session_destroy();

header('Location: index.php');
exit;
