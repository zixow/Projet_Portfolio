<?php
/*
 * API : enregistre un message du formulaire de contact dans la base de données.
 * Reçoit du JSON { nom, email, objet, message, site_web } envoyé par js/contact.js.
 * Réponses : 201 enregistré, 422 champs invalides, 429 trop de messages, 503 base indisponible.
 */
declare(strict_types=1);

require __DIR__ . '/lib/base.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function repondre(int $code, array $donnees): never
{
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    repondre(405, ['erreur' => 'Méthode non autorisée.']);
}
// Le formulaire envoie du JSON : un autre site ne peut pas en envoyer à la place du visiteur
// sans l'accord du navigateur (protection contre les requêtes intersites, CSRF)
if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
    repondre(415, ['erreur' => 'Format non accepté.']);
}

$corps = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($corps)) {
    repondre(400, ['erreur' => 'Requête invalide.']);
}

// Champ piège invisible : un robot le remplit, un visiteur ne le voit pas
if (trim((string) ($corps['site_web'] ?? '')) !== '') {
    repondre(201, ['ok' => true]);
}

$nom = trim((string) ($corps['nom'] ?? ''));
$email = trim((string) ($corps['email'] ?? ''));
$objet = trim((string) ($corps['objet'] ?? ''));
$message = trim((string) ($corps['message'] ?? ''));

// Mêmes règles que dans le navigateur (on ne fait jamais confiance au navigateur seul)
$erreurs = [];
if (mb_strlen($nom) < 2 || mb_strlen($nom) > 80) {
    $erreurs['nom'] = 'Le nom doit contenir entre 2 et 80 caractères.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
    $erreurs['email'] = 'Adresse e-mail invalide.';
}
if (mb_strlen($objet) < 3 || mb_strlen($objet) > 150) {
    $erreurs['objet'] = "L'objet doit contenir entre 3 et 150 caractères.";
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    $erreurs['message'] = 'Le message doit contenir entre 10 et 5 000 caractères.';
}
if ($erreurs) {
    repondre(422, ['erreurs' => $erreurs]);
}

// Limite : 5 messages par heure et par visiteur (sans enregistrer d'adresse IP)
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Strict']);
$maintenant = time();
$_SESSION['envois'] = array_values(array_filter($_SESSION['envois'] ?? [], fn ($t) => $t > $maintenant - 3600));
if (count($_SESSION['envois']) >= 5) {
    repondre(429, ['erreur' => 'Trop de messages envoyés. Réessayez dans une heure.']);
}

try {
    $requete = connexion()->prepare('INSERT INTO message (nom, email, objet, contenu) VALUES (?, ?, ?, ?)');
    $requete->execute([$nom, $email, $objet, $message]);
} catch (Throwable $erreur) {
    error_log('api/contact.php : ' . $erreur->getMessage());
    repondre(503, ['erreur' => "Le message n'a pas pu être enregistré."]);
}

$_SESSION['envois'][] = $maintenant;
repondre(201, ['ok' => true]);
