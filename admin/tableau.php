<?php
/*
 * Tableau de bord : chiffres clés, copie pour GitHub Pages et messages du formulaire de contact.
 */
declare(strict_types=1);

require __DIR__ . '/inc/securite.php';
require __DIR__ . '/inc/gabarit.php';

exigerConnexion();
$bdd = connexion();

// Actions sur les messages : marquer comme lu / non lu, supprimer
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifierCsrf();
    $id = (int) ($_POST['id'] ?? 0);
    switch ($_POST['action'] ?? '') {
        case 'lu':
            $bdd->prepare('UPDATE message SET lu = NOT lu WHERE id = ?')->execute([$id]);
            rediriger('tableau.php#messages');
        case 'supprimer':
            $bdd->prepare('DELETE FROM message WHERE id = ?')->execute([$id]);
            rediriger('tableau.php#messages', 'Message supprimé.');
        default:
            rediriger('tableau.php');
    }
}

$compter = fn (string $sql): int => (int) $bdd->query($sql)->fetchColumn();
$chiffres = [
    ['fa-solid fa-newspaper', 'Actualités publiées', $compter('SELECT COUNT(*) FROM actualite WHERE publiee = TRUE'), 'gerer.php?section=actualites'],
    ['fa-solid fa-laptop-code', 'Compétences', $compter('SELECT COUNT(*) FROM competence'), 'gerer.php?section=competences'],
    ['fa-solid fa-medal', 'Certifications', $compter('SELECT COUNT(*) FROM certification'), 'gerer.php?section=certifications'],
    ['fa-solid fa-diagram-project', 'Projets publiés', $compter('SELECT COUNT(*) FROM projet WHERE publie = TRUE'), 'gerer.php?section=projets'],
    ['fa-solid fa-envelope', 'Messages non lus', $compter('SELECT COUNT(*) FROM message WHERE lu = FALSE'), '#messages'],
];
$messages = $bdd->query(
    "SELECT id, nom, email, objet, contenu, lu, DATE_FORMAT(date_envoi, '%d/%m/%Y à %Hh%i') AS date
       FROM message ORDER BY date_envoi DESC, id DESC LIMIT 100"
)->fetchAll();
$copie = cheminCopie();
$dateCopie = is_file($copie) ? date('d/m/Y à H\hi', (int) filemtime($copie)) : null;

entete('Tableau de bord', 'tableau.php');
?>
<section class="chiffres" aria-label="Chiffres clés">
    <?php foreach ($chiffres as [$icone, $libelle, $nombre, $lien]): ?>
        <a class="chiffre" href="<?= e($lien) ?>">
            <i class="<?= e($icone) ?>"></i>
            <strong><?= $nombre ?></strong>
            <span><?= e($libelle) ?></span>
        </a>
    <?php endforeach; ?>
</section>

<section class="carte">
    <h2><i class="fa-brands fa-github"></i> Version en ligne (GitHub Pages)</h2>
    <p>GitHub Pages ne fait pas tourner PHP ni MySQL : le site en ligne lit une copie de la base, <code>data/contenu.js</code>.
       Elle est mise à jour automatiquement à chaque modification faite ici.</p>
    <p>Dernière mise à jour : <strong><?= $dateCopie ? e($dateCopie) : 'jamais' ?></strong>.
       Pour publier les changements : <em>commit</em> puis <em>push</em> du dossier du portfolio.</p>
    <form method="post" action="exporter.php">
        <?= champCsrf() ?>
        <button type="submit" class="bouton bouton--secondaire"><i class="fa-solid fa-rotate"></i> Mettre à jour la copie maintenant</button>
    </form>
</section>

<section class="carte" id="messages">
    <h2><i class="fa-solid fa-envelope"></i> Messages reçus (<?= count($messages) ?>)</h2>
    <?php if (!$messages): ?>
        <p class="vide">Aucun message pour l'instant. Ils arrivent ici quand quelqu'un remplit le formulaire de la page Contact.</p>
    <?php endif; ?>
    <?php foreach ($messages as $m): ?>
        <article class="message<?= $m['lu'] ? '' : ' message--nouveau' ?>">
            <header>
                <strong><?= e($m['objet']) ?></strong>
                <?php if (!$m['lu']): ?><span class="etiquette">Nouveau</span><?php endif; ?>
                <span class="message__de">de <?= e($m['nom']) ?> · <a href="mailto:<?= e($m['email']) ?>?subject=<?= e(rawurlencode('Re : ' . $m['objet'])) ?>"><?= e($m['email']) ?></a> · <?= e($m['date']) ?></span>
            </header>
            <p class="message__contenu"><?= nl2br(e($m['contenu'])) ?></p>
            <div class="actions">
                <form method="post">
                    <?= champCsrf() ?>
                    <input type="hidden" name="id" value="<?= (int) $m['id'] ?>">
                    <button type="submit" name="action" value="lu" class="bouton bouton--petit bouton--secondaire">
                        <i class="fa-regular fa-envelope<?= $m['lu'] ? '' : '-open' ?>"></i> <?= $m['lu'] ? 'Marquer comme non lu' : 'Marquer comme lu' ?>
                    </button>
                    <button type="submit" name="action" value="supprimer" class="bouton bouton--petit bouton--danger"
                            onclick="return confirm('Supprimer ce message ?')"><i class="fa-solid fa-trash"></i> Supprimer</button>
                </form>
            </div>
        </article>
    <?php endforeach; ?>
</section>
<?php
pied();
