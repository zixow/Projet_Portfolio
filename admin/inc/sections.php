<?php
/*
 * Description des contenus modifiables dans l'administration.
 * La page gerer.php s'en sert pour afficher la liste et le formulaire, et pour vérifier les champs.
 * Types de champ : texte, zone (texte long), code (extrait de code), url, date, nombre, annee,
 *                  choix (liste fixe), liste (lue dans une autre table), case (oui / non).
 * Les noms de tables et de colonnes viennent uniquement d'ici (jamais du navigateur) :
 * les valeurs, elles, passent toujours par des requêtes préparées.
 */
declare(strict_types=1);

return [
    'actualites' => [
        'titre'     => 'Actualités de la veille',
        'element'   => 'une actualité',
        'table'     => 'actualite',
        'tri'       => 'date_publication DESC, id DESC',
        'voir'      => '../veille.html',
        'colonnes'  => ['date_publication' => 'Date', 'categorie' => 'Catégorie', 'titre' => 'Titre', 'publiee' => 'Publiée'],
        'champs'    => [
            'date_publication' => ['libelle' => 'Date', 'type' => 'date', 'requis' => true, 'aide' => 'Le site affiche le mois et l\'année.'],
            'categorie'        => ['libelle' => 'Catégorie', 'type' => 'choix', 'requis' => true,
                                   'choix' => ['vr' => 'Réalité virtuelle (VR)', 'ar' => 'Réalité augmentée (AR)', 'mr' => 'Réalité mixte (MR)']],
            'titre'            => ['libelle' => 'Titre', 'type' => 'texte', 'max' => 150, 'requis' => true],
            'resume'           => ['libelle' => 'Résumé', 'type' => 'zone', 'max' => 400, 'requis' => true, 'aide' => 'Une phrase : ce qui s\'est passé.'],
            'avis'             => ['libelle' => 'Mon avis', 'type' => 'zone', 'max' => 400, 'requis' => true, 'aide' => 'Une phrase : ce que j\'en pense.'],
            'source_nom'       => ['libelle' => 'Nom de la source', 'type' => 'texte', 'max' => 80, 'requis' => true],
            'source_url'       => ['libelle' => 'Adresse de l\'article', 'type' => 'url', 'max' => 255, 'requis' => true],
            'publiee'          => ['libelle' => 'Publiée sur le site', 'type' => 'case', 'defaut' => 1],
        ],
    ],

    'competences' => [
        'titre'     => 'Compétences',
        'element'   => 'une compétence',
        'table'     => 'competence',
        'tri'       => 'categorie_id, ordre, id',
        'voir'      => '../competences.html',
        'colonnes'  => ['nom' => 'Nom', 'categorie_id' => 'Catégorie', 'langage' => 'Langage du code', 'ordre' => 'Ordre'],
        'champs'    => [
            'nom'          => ['libelle' => 'Nom', 'type' => 'texte', 'max' => 50, 'requis' => true],
            'categorie_id' => ['libelle' => 'Catégorie', 'type' => 'liste', 'requis' => true,
                               'requete' => 'SELECT id, libelle FROM categorie ORDER BY ordre, id'],
            'complement'   => ['libelle' => 'Précision', 'type' => 'texte', 'max' => 50, 'aide' => 'Facultatif, affiché après la catégorie : « Front-end · TypeScript ».'],
            'description'  => ['libelle' => 'Description', 'type' => 'zone', 'max' => 255, 'requis' => true],
            'icone'        => ['libelle' => 'Icône', 'type' => 'texte', 'max' => 60, 'requis' => true, 'aide' => 'Classe Devicon, ex. « devicon-php-plain colored » (liste sur devicon.dev).'],
            'langage'      => ['libelle' => 'Langage du code', 'type' => 'choix', 'requis' => true, 'aide' => 'Sert à colorer le code.',
                               'choix' => ['html' => 'HTML', 'css' => 'CSS', 'javascript' => 'JavaScript', 'typescript' => 'TypeScript',
                                           'php' => 'PHP', 'java' => 'Java', 'dart' => 'Dart', 'sql' => 'SQL']],
            'source'       => ['libelle' => 'Origine du code', 'type' => 'texte', 'max' => 80, 'requis' => true, 'aide' => 'Ex. « PixelStar · pages/home.php » ou « Exemple ».'],
            'code'         => ['libelle' => 'Extrait de code', 'type' => 'code', 'max' => 2000, 'requis' => true, 'aide' => 'Une quinzaine de lignes au plus : les espaces du début des lignes sont gardés.'],
            'explication'  => ['libelle' => 'Ce que fait ce code', 'type' => 'zone', 'max' => 500, 'requis' => true, 'aide' => 'Écrivez `entre accents graves` un mot de code (ex. `prepare()`).'],
            'ordre'        => ['libelle' => 'Ordre d\'affichage', 'type' => 'nombre', 'min' => 0, 'max' => 999, 'defaut' => 0],
        ],
    ],

    'certifications' => [
        'titre'     => 'Certifications',
        'element'   => 'une certification',
        'table'     => 'certification',
        'tri'       => 'ordre, id',
        'voir'      => '../competences.html#certifications',
        'colonnes'  => ['nom' => 'Nom', 'organisme' => 'Organisme', 'annee' => 'Année', 'statut' => 'Statut'],
        'champs'    => [
            'nom'         => ['libelle' => 'Nom', 'type' => 'texte', 'max' => 80, 'requis' => true],
            'organisme'   => ['libelle' => 'Organisme', 'type' => 'texte', 'max' => 80, 'requis' => true],
            'description' => ['libelle' => 'Description', 'type' => 'zone', 'max' => 300, 'requis' => true],
            'annee'       => ['libelle' => 'Année', 'type' => 'annee', 'aide' => 'Facultative : année d\'obtention.'],
            'statut'      => ['libelle' => 'Statut', 'type' => 'choix', 'requis' => true, 'choix' => ['obtenue' => 'Obtenue', 'en_cours' => 'En cours']],
            'detail'      => ['libelle' => 'Détail', 'type' => 'texte', 'max' => 50, 'aide' => 'Facultatif, ex. votre score Pix (« 512 pix ») ou « Certificat de réussite ».'],
            'lien'        => ['libelle' => 'Lien (attestation ou site officiel)', 'type' => 'url', 'max' => 255],
            'icone'       => ['libelle' => 'Icône', 'type' => 'texte', 'max' => 60, 'requis' => true, 'aide' => 'Classe Font Awesome, ex. « fa-solid fa-medal ».'],
            'style'       => ['libelle' => 'Couleur de l\'icône', 'type' => 'choix', 'requis' => true,
                              'choix' => ['pix' => 'Violet (Pix)', 'oc' => 'Violet foncé (OpenClassrooms)', 'anssi' => 'Bleu', 'cnil' => 'Rouge', 'fcc' => 'Vert']],
            'ordre'       => ['libelle' => 'Ordre d\'affichage', 'type' => 'nombre', 'min' => 0, 'max' => 999, 'defaut' => 0],
        ],
    ],

    'projets' => [
        'titre'     => 'Projets',
        'element'   => 'un projet',
        'table'     => 'projet',
        'tri'       => 'ordre, id',
        'voir'      => '../projets.html',
        'note'      => 'Les technologies, les rubriques des détails et les images se modifient dans phpMyAdmin '
                     . '(tables projet_technologie, projet_rubrique, projet_point et projet_image).',
        'colonnes'  => ['titre' => 'Titre', 'domaine' => 'Domaine', 'statut' => 'Statut', 'publie' => 'Publié'],
        'champs'    => [
            'titre'           => ['libelle' => 'Titre (carte)', 'type' => 'texte', 'max' => 80, 'requis' => true],
            'titre_complet'   => ['libelle' => 'Titre complet (détails)', 'type' => 'texte', 'max' => 120, 'requis' => true],
            'slug'            => ['libelle' => 'Lien direct', 'type' => 'texte', 'max' => 40, 'requis' => true, 'motif' => '/^[a-z0-9-]+$/',
                                  'aide' => 'Minuscules, chiffres et tirets : projets.html#mon-projet.'],
            'type'            => ['libelle' => 'Type', 'type' => 'texte', 'max' => 60, 'requis' => true, 'aide' => 'Ex. « Projet BTS individuel ».'],
            'domaine'         => ['libelle' => 'Domaine', 'type' => 'choix', 'requis' => true, 'choix' => ['web' => 'Web', 'mobile' => 'Mobile']],
            'statut'          => ['libelle' => 'Statut', 'type' => 'choix', 'requis' => true, 'choix' => ['en_cours' => 'En cours', 'termine' => 'Terminé']],
            'resume'          => ['libelle' => 'Résumé (carte)', 'type' => 'zone', 'max' => 400, 'requis' => true],
            'description'     => ['libelle' => 'Description (détails)', 'type' => 'zone', 'max' => 2000, 'requis' => true],
            'contexte'        => ['libelle' => 'Contexte', 'type' => 'texte', 'max' => 150, 'requis' => true],
            'periode'         => ['libelle' => 'Période', 'type' => 'texte', 'max' => 60, 'requis' => true],
            'equipe'          => ['libelle' => 'Équipe', 'type' => 'texte', 'max' => 80, 'requis' => true],
            'image'           => ['libelle' => 'Image de la carte', 'type' => 'texte', 'max' => 255, 'requis' => true, 'aide' => 'Chemin d\'une image du site, ex. « assets/projets/mon-projet.jpg ».'],
            'lien_code'       => ['libelle' => 'Lien vers le code (GitHub)', 'type' => 'url', 'max' => 255],
            'lien_conception' => ['libelle' => 'Lien vers la conception (UML)', 'type' => 'url', 'max' => 255],
            'publie'          => ['libelle' => 'Publié sur le site', 'type' => 'case', 'defaut' => 1],
            'ordre'           => ['libelle' => 'Ordre d\'affichage', 'type' => 'nombre', 'min' => 0, 'max' => 999, 'defaut' => 0],
        ],
    ],
];
