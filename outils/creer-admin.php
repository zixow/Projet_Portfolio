<?php
/*
 * Crée un compte pour l'espace d'administration (ou change son mot de passe s'il existe).
 * Utilisation (dans le dossier du portfolio) : php outils/creer-admin.php identifiant
 * Le mot de passe est demandé deux fois, puis enregistré haché (password_hash) : jamais en clair.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { // outil en ligne de commande uniquement
    http_response_code(404);
    exit;
}

require __DIR__ . '/../api/lib/base.php';

$identifiant = trim($argv[1] ?? '');
if (!preg_match('/^[a-zA-Z0-9._-]{3,40}$/', $identifiant)) {
    fwrite(STDERR, "Utilisation : php outils/creer-admin.php identifiant\n"
        . "(identifiant de 3 à 40 caractères : lettres, chiffres, point, tiret)\n");
    exit(1);
}

$demander = function (string $question): string {
    echo $question;
    return rtrim((string) fgets(STDIN), "\r\n");
};
$motDePasse = $demander('Mot de passe (12 caractères minimum) : ');
if (mb_strlen($motDePasse) < 12) {
    fwrite(STDERR, "Mot de passe trop court : 12 caractères minimum.\n");
    exit(1);
}
if ($demander('Confirmez le mot de passe : ') !== $motDePasse) {
    fwrite(STDERR, "Les deux mots de passe sont différents.\n");
    exit(1);
}

try {
    $requete = connexion()->prepare(
        'INSERT INTO administrateur (identifiant, mot_de_passe) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE mot_de_passe = VALUES(mot_de_passe)'
    );
    $requete->execute([$identifiant, password_hash($motDePasse, PASSWORD_DEFAULT)]);
    echo $requete->rowCount() === 1
        ? "Compte « $identifiant » créé.\n"
        : "Mot de passe du compte « $identifiant » modifié.\n";
} catch (Throwable $erreur) {
    fwrite(STDERR, 'Erreur : ' . $erreur->getMessage() . "\n");
    exit(1);
}
