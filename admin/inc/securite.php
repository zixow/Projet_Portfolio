<?php
/*
 * Sécurité de l'espace d'administration : session, jeton CSRF, connexion obligatoire.
 * Inclus en premier par toutes les pages de admin/.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../api/lib/base.php';
require_once __DIR__ . '/../../api/lib/export.php';

// En-têtes de sécurité : pas d'affichage dans un cadre d'un autre site, pas de devinette du type de fichier
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

// Session : cookie inaccessible au JavaScript et envoyé seulement par ce site
session_name('portfolio_admin');
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'cookie_secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'use_strict_mode' => true,
]);

/** Échappe un texte pour l'afficher dans la page (protection contre l'injection de code, XSS). */
function e(mixed $texte): string
{
    return htmlspecialchars((string) ($texte ?? ''), ENT_QUOTES, 'UTF-8');
}

/** Jeton CSRF : prouve qu'un formulaire envoyé vient bien de cette administration. */
function jetonCsrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function champCsrf(): string
{
    return '<input type="hidden" name="csrf" value="' . e(jetonCsrf()) . '">';
}

function verifierCsrf(): void
{
    if (!hash_equals(jetonCsrf(), (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Jeton de sécurité invalide : rechargez la page et recommencez.');
    }
}

/** Renvoie l'administrateur connecté, ou redirige vers la page de connexion. */
function exigerConnexion(): array
{
    if (empty($_SESSION['admin'])) {
        header('Location: index.php');
        exit;
    }
    return $_SESSION['admin'];
}

/** Message affiché une seule fois sur la page suivante (après une redirection). */
function rediriger(string $page, string $message = '', string $type = 'succes'): never
{
    if ($message !== '') {
        $_SESSION['flash'] = ['message' => $message, 'type' => $type];
    }
    header('Location: ' . $page);
    exit;
}

function lireFlash(): ?array
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash;
}

/** Après une modification : met à jour la copie du site (data/contenu.js) pour GitHub Pages. */
function mettreAJourCopie(): string
{
    try {
        exporterCopie(connexion());
        return ' La copie pour GitHub Pages est à jour.';
    } catch (Throwable $erreur) {
        error_log('Export : ' . $erreur->getMessage());
        return ' Attention : la copie pour GitHub Pages n\'a pas pu être mise à jour.';
    }
}
