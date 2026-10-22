<?php
/*
 * Lecture du contenu public du portfolio dans la base de données.
 * Utilisée par l'API (api/contenu.php) et par l'export pour GitHub Pages (api/lib/export.php).
 */
declare(strict_types=1);

/** Regroupe des lignes selon une colonne : [valeur => [lignes…]]. */
function regrouper(array $lignes, string $colonne): array
{
    $groupes = [];
    foreach ($lignes as $ligne) {
        $groupes[$ligne[$colonne]][] = $ligne;
    }
    return $groupes;
}

function lireContenu(PDO $bdd): array
{
    // Catégories qui ont au moins une compétence (ce sont les boutons de filtre)
    $categories = $bdd->query(
        'SELECT DISTINCT cat.code, cat.libelle, cat.ordre
           FROM categorie cat JOIN competence c ON c.categorie_id = cat.id
          ORDER BY cat.ordre, cat.code'
    )->fetchAll();

    $competences = $bdd->query(
        'SELECT c.nom, cat.code AS categorie, cat.libelle AS categorie_libelle, c.complement,
                c.description, c.icone, c.langage, c.source, c.code, c.explication
           FROM competence c JOIN categorie cat ON cat.id = c.categorie_id
          ORDER BY cat.ordre, c.ordre, c.id'
    )->fetchAll();

    $certifications = $bdd->query(
        'SELECT nom, organisme, description, annee, statut, detail, lien, icone, style
           FROM certification ORDER BY ordre, id'
    )->fetchAll();

    $actualites = $bdd->query(
        "SELECT DATE_FORMAT(date_publication, '%Y-%m-%d') AS date, categorie, titre, resume, avis, source_nom, source_url
           FROM actualite WHERE publiee = TRUE
          ORDER BY date_publication DESC, id DESC"
    )->fetchAll();

    // Projets : quatre requêtes en tout (pas une par projet), puis regroupement en PHP
    $projets = $bdd->query(
        'SELECT id, slug, titre, titre_complet, type, domaine, statut, resume, description,
                contexte, periode, equipe, image, lien_code, lien_conception
           FROM projet WHERE publie = TRUE ORDER BY ordre, id'
    )->fetchAll();
    $technologies = regrouper($bdd->query(
        'SELECT pt.projet_id, t.nom, pt.sur_carte
           FROM projet_technologie pt JOIN technologie t ON t.id = pt.technologie_id
          ORDER BY pt.projet_id, pt.ordre, t.nom'
    )->fetchAll(), 'projet_id');
    $rubriques = regrouper($bdd->query(
        'SELECT id, projet_id, titre FROM projet_rubrique ORDER BY projet_id, ordre, id'
    )->fetchAll(), 'projet_id');
    $points = regrouper($bdd->query(
        'SELECT rubrique_id, texte FROM projet_point ORDER BY rubrique_id, ordre, id'
    )->fetchAll(), 'rubrique_id');
    $images = regrouper($bdd->query(
        'SELECT projet_id, chemin, legende, texte_alternatif, format, apres_rubrique
           FROM projet_image ORDER BY projet_id, apres_rubrique, ordre, id'
    )->fetchAll(), 'projet_id');

    foreach ($projets as &$projet) {
        $id = $projet['id'];
        $projet['technologies'] = array_map(
            fn ($t) => ['nom' => $t['nom'], 'sur_carte' => (bool) $t['sur_carte']],
            $technologies[$id] ?? []
        );
        $projet['rubriques'] = array_map(
            fn ($r) => ['titre' => $r['titre'], 'points' => array_column($points[$r['id']] ?? [], 'texte')],
            $rubriques[$id] ?? []
        );
        $projet['images'] = array_map(
            fn ($i) => [
                'chemin' => $i['chemin'], 'legende' => $i['legende'], 'alt' => $i['texte_alternatif'],
                'format' => $i['format'], 'apres_rubrique' => (int) $i['apres_rubrique'],
            ],
            $images[$id] ?? []
        );
        unset($projet['id']); // l'identifiant interne n'est pas utile au site
    }
    unset($projet);

    return [
        'categories'     => array_map(fn ($c) => ['code' => $c['code'], 'libelle' => $c['libelle']], $categories),
        'competences'    => $competences,
        'certifications' => array_map(fn ($c) => ['annee' => $c['annee'] === null ? null : (int) $c['annee']] + $c, $certifications),
        'projets'        => $projets,
        'actualites'     => $actualites,
    ];
}
