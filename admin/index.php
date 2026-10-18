<?php
/*
 * Administration du portfolio : page de connexion.
 * Le compte se crée une fois, en ligne de commande : php outils/creer-admin.php identifiant
 */
declare(strict_types=1);

require __DIR__ . '/inc/securite.php';
require __DIR__ . '/inc/gabarit.php';

if (!empty($_SESSION['admin'])) {
    rediriger('tableau.php');
}

// Limite des essais : après 5 échecs, il faut attendre 5 minutes
$essais = $_SESSION['essais'] ?? ['nombre' => 0, 'depuis' => time()];
if (time() - $essais['depuis'] > 300) {
    $essais = ['nombre' => 0, 'depuis' => time()];
}

$erreur = '';
$identifiant = '';
$baseDisponible = true;
$aucunCompte = false;
try {
    $aucunCompte = (int) connexion()->query('SELECT COUNT(*) FROM administrateur')->fetchColumn() === 0;
} catch (Throwable $exception) {
    $baseDisponible = false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $baseDisponible && $essais['nombre'] < 5) {
    verifierCsrf();
    $identifiant = trim((string) ($_POST['identifiant'] ?? ''));
    $motDePasse = (string) ($_POST['mot_de_passe'] ?? '');

    $requete = connexion()->prepare('SELECT id, identifiant, mot_de_passe FROM administrateur WHERE identifiant = ?');
    $requete->execute([$identifiant]);
    $compte = $requete->fetch();

    if ($compte && password_verify($motDePasse, $compte['mot_de_passe'])) {
        session_regenerate_id(true); // nouvel identifiant de session après la connexion (contre le vol de session)
        unset($_SESSION['essais']);
        $_SESSION['admin'] = ['id' => (int) $compte['id'], 'identifiant' => $compte['identifiant']];
        if (password_needs_rehash($compte['mot_de_passe'], PASSWORD_DEFAULT)) {
            connexion()->prepare('UPDATE administrateur SET mot_de_passe = ? WHERE id = ?')
                ->execute([password_hash($motDePasse, PASSWORD_DEFAULT), $compte['id']]);
        }
        connexion()->prepare('UPDATE administrateur SET derniere_connexion = NOW() WHERE id = ?')->execute([$compte['id']]);
        rediriger('tableau.php');
    }

    $essais['nombre']++;
    $_SESSION['essais'] = $essais;
    usleep(500000); // ralentit les essais automatiques
    $erreur = 'Identifiant ou mot de passe incorrect.';
}
$bloque = $essais['nombre'] >= 5;

entete('Connexion');
?>
<div class="carte carte--connexion">
    <?php if (!$baseDisponible): ?>
        <p class="flash flash--erreur">La base de données ne répond pas. Démarrez MySQL dans XAMPP, puis importez <code>database/portfolio.sql</code>.</p>
    <?php elseif ($aucunCompte): ?>
        <p class="flash flash--info">Aucun compte administrateur. Créez-le dans le dossier du portfolio avec :<br><code>php outils/creer-admin.php votre-identifiant</code></p>
    <?php elseif ($bloque): ?>
        <p class="flash flash--erreur">Trop d'essais. Réessayez dans quelques minutes.</p>
    <?php else: ?>
        <?php if ($erreur): ?><p class="flash flash--erreur" role="alert"><?= e($erreur) ?></p><?php endif; ?>
        <form method="post" class="formulaire">
            <?= champCsrf() ?>
            <label for="identifiant">Identifiant</label>
            <input type="text" id="identifiant" name="identifiant" value="<?= e($identifiant) ?>" autocomplete="username" required autofocus>
            <label for="mot_de_passe">Mot de passe</label>
            <input type="password" id="mot_de_passe" name="mot_de_passe" autocomplete="current-password" required>
            <button type="submit" class="bouton"><i class="fa-solid fa-right-to-bracket"></i> Se connecter</button>
        </form>
    <?php endif; ?>
    <p class="retour"><a href="../index.html"><i class="fa-solid fa-arrow-left"></i> Retour au portfolio</a></p>
</div>
<?php
pied();
