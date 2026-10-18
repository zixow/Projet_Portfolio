<?php
/*
 * Connexion à la base de données (PDO).
 * Les réglages viennent de api/config.php, remplacés par api/config.local.php s'il existe.
 */
declare(strict_types=1);

// Heure de la Nouvelle-Calédonie (UTC+11, sans heure d'été) pour PHP comme pour MySQL
date_default_timezone_set('Pacific/Noumea');

function connexion(): PDO
{
    static $bdd = null; // une seule connexion par requête
    if ($bdd instanceof PDO) {
        return $bdd;
    }

    $config = require __DIR__ . '/../config.php';
    $local = __DIR__ . '/../config.local.php';
    if (is_file($local)) {
        $config = array_merge($config, require $local);
    }

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['hote'], $config['port'], $config['base']);
    $bdd = new PDO($dsn, $config['utilisateur'], $config['mot_de_passe'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // une erreur SQL lève une exception
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,                  // vraies requêtes préparées
    ]);
    $bdd->exec("SET time_zone = '+11:00'"); // dates des messages à l'heure de Nouméa, quel que soit le serveur
    return $bdd;
}
