<?php
/*
 * Gestion d'un contenu (actualités, compétences, certifications, projets) : liste, ajout,
 * modification et suppression. Les champs de chaque contenu sont décrits dans inc/sections.php.
 * Après chaque changement, la copie data/contenu.js (GitHub Pages) est mise à jour.
 */
declare(strict_types=1);

require __DIR__ . '/inc/securite.php';
require __DIR__ . '/inc/gabarit.php';

exigerConnexion();

$sections = require __DIR__ . '/inc/sections.php';
$cle = (string) ($_GET['section'] ?? '');
if (!isset($sections[$cle])) {
    rediriger('tableau.php');
}
$section = $sections[$cle];
$table = $section['table']; // nom de table venant de sections.php, jamais du navigateur
$champs = $section['champs'];
$page = 'gerer.php?section=' . $cle;
$bdd = connexion();

/** Choix d'un champ « liste », lus dans la table liée : [id => libellé]. */
$options = fn (array $champ): array => $bdd->query($champ['requete'])->fetchAll(PDO::FETCH_KEY_PAIR);

/** Lit et vérifie les valeurs envoyées par le formulaire. Renvoie [valeurs, erreurs]. */
function lireFormulaire(array $champs, callable $options): array
{
    $valeurs = [];
    $erreurs = [];
    foreach ($champs as $nom => $champ) {
        $libelle = $champ['libelle'];
        $texte = trim((string) ($_POST[$nom] ?? ''));

        if ($champ['type'] === 'case') {
            $valeurs[$nom] = isset($_POST[$nom]) ? 1 : 0;
            continue;
        }
        if ($champ['type'] === 'nombre' || $champ['type'] === 'annee') {
            $min = $champ['min'] ?? ($champ['type'] === 'annee' ? 2000 : 0);
            $max = $champ['max'] ?? ($champ['type'] === 'annee' ? 2100 : 65535);
            if ($texte === '' && empty($champ['requis'])) {
                $valeurs[$nom] = $champ['defaut'] ?? 0;
                continue;
            }
            if (filter_var($texte, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]) === false) {
                $erreurs[$nom] = "Entrez un nombre entre $min et $max.";
            }
            $valeurs[$nom] = (int) $texte;
            continue;
        }

        $valeurs[$nom] = $texte === '' ? null : $texte;
        if ($texte === '') {
            if (!empty($champ['requis'])) {
                $erreurs[$nom] = 'Ce champ est obligatoire.';
            }
            continue;
        }
        if (isset($champ['max']) && mb_strlen($texte) > $champ['max']) {
            $erreurs[$nom] = "{$champ['max']} caractères au maximum.";
        }
        if (isset($champ['motif']) && !preg_match($champ['motif'], $texte)) {
            $erreurs[$nom] = $champ['aide'] ?? 'Format invalide.';
        }
        switch ($champ['type']) {
            case 'url':
                if (!filter_var($texte, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $texte)) {
                    $erreurs[$nom] = 'Adresse web invalide (elle doit commencer par https://).';
                }
                break;
            case 'date':
                $date = DateTime::createFromFormat('!Y-m-d', $texte);
                if (!$date || $date->format('Y-m-d') !== $texte) {
                    $erreurs[$nom] = 'Date invalide.';
                }
                break;
            case 'choix':
                if (!array_key_exists($texte, $champ['choix'])) {
                    $erreurs[$nom] = 'Choix invalide.';
                }
                break;
            case 'liste':
                if (!array_key_exists((int) $texte, $options($champ))) {
                    $erreurs[$nom] = 'Choix invalide.';
                }
                $valeurs[$nom] = (int) $texte;
                break;
        }
    }
    return [$valeurs, $erreurs];
}

/* ---------- Enregistrement et suppression (formulaires POST avec jeton CSRF) ---------- */
$erreurs = [];
$formulaire = null; // valeurs à réafficher dans le formulaire
$idEdite = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifierCsrf();
    $id = (int) ($_POST['id'] ?? 0);
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'supprimer' && $id > 0) {
        $bdd->prepare("DELETE FROM `$table` WHERE id = ?")->execute([$id]);
        rediriger($page, 'Élément supprimé.' . mettreAJourCopie());
    }

    if ($action === 'enregistrer') {
        [$valeurs, $erreurs] = lireFormulaire($champs, $options);
        if (!$erreurs) {
            $colonnes = array_keys($valeurs);
            try {
                if ($id > 0) {
                    $affectations = implode(', ', array_map(fn ($c) => "`$c` = :$c", $colonnes));
                    $bdd->prepare("UPDATE `$table` SET $affectations WHERE id = :id")->execute($valeurs + ['id' => $id]);
                    rediriger($page, 'Modifications enregistrées.' . mettreAJourCopie());
                }
                $liste = '`' . implode('`, `', $colonnes) . '`';
                $parametres = ':' . implode(', :', $colonnes);
                $bdd->prepare("INSERT INTO `$table` ($liste) VALUES ($parametres)")->execute($valeurs);
                rediriger($page, 'Élément ajouté.' . mettreAJourCopie());
            } catch (PDOException $exception) {
                if ($exception->getCode() !== '23000') { // 23000 : contrainte de la base non respectée
                    throw $exception;
                }
                $erreurs['_'] = 'Enregistrement refusé par la base : une valeur existe peut-être déjà (lien direct d\'un projet…).';
            }
        }
        $formulaire = $valeurs;
        $idEdite = $id;
    }
}

/* ---------- Affichage : formulaire (ajout ou modification) ou liste ---------- */
if ($formulaire === null && isset($_GET['modifier'])) {
    $requete = $bdd->prepare("SELECT * FROM `$table` WHERE id = ?");
    $requete->execute([(int) $_GET['modifier']]);
    $formulaire = $requete->fetch() ?: null;
    $idEdite = $formulaire ? (int) $formulaire['id'] : 0;
}
if ($formulaire === null && isset($_GET['ajouter'])) {
    // Valeurs de départ : celles de sections.php, et la date du jour pour une date
    $formulaire = array_map(fn ($champ) => $champ['type'] === 'date' ? date('Y-m-d') : ($champ['defaut'] ?? null), $champs);
}

/** Valeur lisible pour la liste (Oui / Non, libellé d'un choix, date en français…). */
$afficher = function (string $nom, mixed $valeur) use ($champs, $options): string {
    $champ = $champs[$nom] ?? ['type' => 'texte'];
    return match ($champ['type']) {
        'case'  => $valeur ? 'Oui' : 'Non',
        'choix' => $champ['choix'][$valeur] ?? (string) $valeur,
        'liste' => $options($champ)[$valeur] ?? (string) $valeur,
        'date'  => $valeur ? date('d/m/Y', strtotime((string) $valeur)) : '',
        default => (string) $valeur,
    };
};

entete($section['titre'], $page);

if ($formulaire !== null):
    $titreFormulaire = $idEdite ? 'Modifier ' . $section['element'] : 'Ajouter ' . $section['element'];
    ?>
    <section class="carte">
        <h2><?= e($titreFormulaire) ?></h2>
        <?php if (isset($erreurs['_'])): ?><p class="flash flash--erreur" role="alert"><?= e($erreurs['_']) ?></p><?php endif; ?>
        <?php if ($erreurs && !isset($erreurs['_'])): ?><p class="flash flash--erreur" role="alert">Certains champs sont à corriger.</p><?php endif; ?>
        <form method="post" action="<?= e($page) ?>" class="formulaire formulaire--grille" novalidate>
            <?= champCsrf() ?>
            <input type="hidden" name="action" value="enregistrer">
            <input type="hidden" name="id" value="<?= $idEdite ?>">
            <?php foreach ($champs as $nom => $champ):
                $valeur = $formulaire[$nom] ?? null;
                $idChamp = 'champ-' . $nom;
                $descriptions = trim((isset($champ['aide']) ? "aide-$nom " : '') . (isset($erreurs[$nom]) ? "erreur-$nom" : ''));
                $attributs = 'id="' . $idChamp . '" name="' . e($nom) . '"'
                    . (!empty($champ['requis']) ? ' required' : '')
                    . ($descriptions ? ' aria-describedby="' . e($descriptions) . '"' : '')
                    . (isset($erreurs[$nom]) ? ' aria-invalid="true"' : '');
                $large = in_array($champ['type'], ['zone'], true) ? ' champ--large' : '';
                ?>
                <div class="champ<?= $large ?><?= isset($erreurs[$nom]) ? ' champ--erreur' : '' ?>">
                    <?php if ($champ['type'] === 'case'): ?>
                        <label class="case"><input type="checkbox" <?= $attributs ?> value="1"<?= $valeur ? ' checked' : '' ?>> <?= e($champ['libelle']) ?></label>
                    <?php else: ?>
                        <label for="<?= $idChamp ?>"><?= e($champ['libelle']) ?><?= !empty($champ['requis']) ? ' <abbr title="obligatoire">*</abbr>' : '' ?></label>
                        <?php if ($champ['type'] === 'zone'): ?>
                            <textarea <?= $attributs ?> rows="<?= ($champ['max'] ?? 0) > 500 ? 6 : 3 ?>" maxlength="<?= (int) $champ['max'] ?>"><?= e($valeur) ?></textarea>
                        <?php elseif ($champ['type'] === 'choix' || $champ['type'] === 'liste'): ?>
                            <select <?= $attributs ?>>
                                <?php foreach (($champ['type'] === 'choix' ? $champ['choix'] : $options($champ)) as $code => $libelle): ?>
                                    <option value="<?= e($code) ?>"<?= (string) $code === (string) $valeur ? ' selected' : '' ?>><?= e($libelle) ?></option>
                                <?php endforeach; ?>
                            </select>
                        <?php else:
                            $type = ['url' => 'url', 'date' => 'date', 'nombre' => 'number', 'annee' => 'number'][$champ['type']] ?? 'text';
                            $limites = $type === 'number'
                                ? ' min="' . ($champ['min'] ?? ($champ['type'] === 'annee' ? 2000 : 0)) . '" max="' . ($champ['max'] ?? ($champ['type'] === 'annee' ? 2100 : 65535)) . '"'
                                : (isset($champ['max']) ? ' maxlength="' . (int) $champ['max'] . '"' : '');
                            ?>
                            <input type="<?= $type ?>" <?= $attributs ?> value="<?= e($valeur) ?>"<?= $limites ?>>
                        <?php endif; ?>
                    <?php endif; ?>
                    <?php if (isset($champ['aide'])): ?><small id="aide-<?= e($nom) ?>" class="aide"><?= e($champ['aide']) ?></small><?php endif; ?>
                    <?php if (isset($erreurs[$nom])): ?><small id="erreur-<?= e($nom) ?>" class="erreur"><?= e($erreurs[$nom]) ?></small><?php endif; ?>
                </div>
            <?php endforeach; ?>
            <div class="actions champ--large">
                <button type="submit" class="bouton"><i class="fa-solid fa-floppy-disk"></i> Enregistrer</button>
                <a class="bouton bouton--secondaire" href="<?= e($page) ?>">Annuler</a>
            </div>
        </form>
    </section>
<?php else:
    $lignes = $bdd->query("SELECT * FROM `$table` ORDER BY {$section['tri']}")->fetchAll();
    ?>
    <div class="outils">
        <a class="bouton" href="<?= e($page) ?>&amp;ajouter=1"><i class="fa-solid fa-plus"></i> Ajouter <?= e($section['element']) ?></a>
        <a class="bouton bouton--secondaire" href="<?= e($section['voir']) ?>" target="_blank" rel="noopener"><i class="fa-solid fa-eye"></i> Voir sur le site</a>
    </div>
    <?php if (isset($section['note'])): ?><p class="note"><i class="fa-solid fa-circle-info"></i> <?= e($section['note']) ?></p><?php endif; ?>
    <section class="carte">
        <?php if (!$lignes): ?>
            <p class="vide">Rien pour l'instant.</p>
        <?php else: ?>
            <div class="tableau-defilant">
                <table class="tableau">
                    <thead>
                        <tr>
                            <?php foreach ($section['colonnes'] as $libelle): ?><th scope="col"><?= e($libelle) ?></th><?php endforeach; ?>
                            <th scope="col"><span class="visuellement-cache">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($lignes as $ligne): ?>
                            <tr>
                                <?php foreach (array_keys($section['colonnes']) as $colonne): ?>
                                    <td><?= e($afficher($colonne, $ligne[$colonne])) ?></td>
                                <?php endforeach; ?>
                                <td><div class="tableau__actions">
                                    <a class="bouton bouton--petit bouton--secondaire" href="<?= e($page) ?>&amp;modifier=<?= (int) $ligne['id'] ?>"><i class="fa-solid fa-pen"></i> Modifier</a>
                                    <form method="post" action="<?= e($page) ?>">
                                        <?= champCsrf() ?>
                                        <input type="hidden" name="action" value="supprimer">
                                        <input type="hidden" name="id" value="<?= (int) $ligne['id'] ?>">
                                        <button type="submit" class="bouton bouton--petit bouton--danger" onclick="return confirm('Supprimer définitivement cet élément ?')"><i class="fa-solid fa-trash"></i> Supprimer</button>
                                    </form>
                                </div></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </section>
<?php endif;

pied();
