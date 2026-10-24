-- =========================================================
-- Portfolio de Nathan THIBAULT · BTS SIO option SLAM
-- Base de données MySQL / MariaDB : structure et contenu
-- ---------------------------------------------------------
-- Installation : importer ce fichier dans phpMyAdmin (XAMPP),
-- ou en ligne de commande : mysql -u root < database/portfolio.sql
-- Attention : réimporter ce fichier remet la base à zéro
-- (les messages reçus et les comptes administrateurs sont effacés).
-- Compte administrateur : php outils/creer-admin.php identifiant
-- =========================================================

CREATE DATABASE IF NOT EXISTS portfolio_nathan
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_nathan;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS projet_point, projet_rubrique, projet_image, projet_technologie,
    technologie, projet, competence, categorie, certification, actualite, message, administrateur;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- Compétences, classées par catégorie (filtres de la page Compétences)
-- ---------------------------------------------------------
CREATE TABLE categorie (
    id      TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code    VARCHAR(20)  NOT NULL UNIQUE,           -- front, back, mobile, bdd
    libelle VARCHAR(50)  NOT NULL,
    ordre   TINYINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE competence (
    id           SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(50)  NOT NULL,
    categorie_id TINYINT UNSIGNED NOT NULL,
    complement   VARCHAR(50)  NULL,                 -- affiché après la catégorie : « Front-end · TypeScript »
    description  VARCHAR(255) NOT NULL,
    icone        VARCHAR(60)  NOT NULL,             -- classe Devicon, ex. « devicon-php-plain colored »
    langage      VARCHAR(20)  NOT NULL,             -- langage de l'extrait de code (pour la coloration)
    source       VARCHAR(80)  NOT NULL,             -- d'où vient l'extrait : « PixelStar · pages/home.php »
    code         TEXT         NOT NULL,             -- extrait de code affiché sur la carte
    explication  VARCHAR(500) NOT NULL,             -- ce que fait ce code, en quelques phrases
    ordre        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT ck_competence_langage CHECK (langage IN ('html', 'css', 'javascript', 'typescript', 'php', 'java', 'dart', 'sql')),
    CONSTRAINT fk_competence_categorie FOREIGN KEY (categorie_id) REFERENCES categorie (id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- Certifications
-- ---------------------------------------------------------
CREATE TABLE certification (
    id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(80)  NOT NULL,
    organisme   VARCHAR(80)  NOT NULL,
    description VARCHAR(300) NOT NULL,
    annee       YEAR         NULL,              -- facultative
    statut      ENUM('obtenue', 'en_cours') NOT NULL DEFAULT 'obtenue',
    detail      VARCHAR(50)  NULL,                  -- ex. score Pix
    lien        VARCHAR(255) NULL,
    icone       VARCHAR(60)  NOT NULL,              -- classe Font Awesome
    style       VARCHAR(20)  NOT NULL DEFAULT 'pix', -- couleur de l'icône : pix, oc (OpenClassrooms), anssi, cnil, fcc
    ordre       SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- Projets : technologies (plusieurs-à-plusieurs), rubriques et points des détails, images
-- ---------------------------------------------------------
CREATE TABLE projet (
    id              SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug            VARCHAR(40)  NOT NULL UNIQUE,   -- lien direct : projets.html#slug
    titre           VARCHAR(80)  NOT NULL,
    titre_complet   VARCHAR(120) NOT NULL,
    type            VARCHAR(60)  NOT NULL,          -- « Projet BTS individuel »…
    domaine         ENUM('web', 'mobile') NOT NULL,
    statut          ENUM('en_cours', 'termine') NOT NULL DEFAULT 'en_cours',
    resume          VARCHAR(400) NOT NULL,          -- texte de la carte
    description     TEXT         NOT NULL,          -- introduction des détails
    contexte        VARCHAR(150) NOT NULL,
    periode         VARCHAR(60)  NOT NULL,
    equipe          VARCHAR(80)  NOT NULL,
    image           VARCHAR(255) NOT NULL,
    lien_code       VARCHAR(255) NULL,
    lien_conception VARCHAR(255) NULL,
    publie          BOOLEAN      NOT NULL DEFAULT TRUE,
    ordre           SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE technologie (
    id  SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(40) NOT NULL UNIQUE
) ENGINE = InnoDB;

CREATE TABLE projet_technologie (
    projet_id      SMALLINT UNSIGNED NOT NULL,
    technologie_id SMALLINT UNSIGNED NOT NULL,
    sur_carte      BOOLEAN NOT NULL DEFAULT TRUE,   -- affichée sur la carte (sinon seulement dans les détails)
    ordre          TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (projet_id, technologie_id),
    CONSTRAINT fk_pt_projet FOREIGN KEY (projet_id) REFERENCES projet (id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_technologie FOREIGN KEY (technologie_id) REFERENCES technologie (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE projet_rubrique (
    id        SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    projet_id SMALLINT UNSIGNED NOT NULL,
    titre     VARCHAR(80) NOT NULL,                 -- « Fonctionnalités réalisées »…
    ordre     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_rubrique_projet FOREIGN KEY (projet_id) REFERENCES projet (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE projet_point (
    id          SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rubrique_id SMALLINT UNSIGNED NOT NULL,
    texte       VARCHAR(300) NOT NULL,              -- `texte entre accents graves` affiché comme du code
    ordre       TINYINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_point_rubrique FOREIGN KEY (rubrique_id) REFERENCES projet_rubrique (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE projet_image (
    id               SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    projet_id        SMALLINT UNSIGNED NOT NULL,
    chemin           VARCHAR(255) NOT NULL,
    legende          VARCHAR(100) NOT NULL,
    texte_alternatif VARCHAR(200) NOT NULL,
    format           ENUM('paysage', 'telephone') NOT NULL DEFAULT 'paysage',
    apres_rubrique   TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0 = avant les rubriques, n = après la rubrique n
    ordre            TINYINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT fk_image_projet FOREIGN KEY (projet_id) REFERENCES projet (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- Veille technologique : actualités
-- ---------------------------------------------------------
CREATE TABLE actualite (
    id               SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date_publication DATE         NOT NULL,         -- le site affiche le mois et l'année
    categorie        ENUM('vr', 'ar', 'mr') NOT NULL,
    titre            VARCHAR(150) NOT NULL,
    resume           VARCHAR(400) NOT NULL,
    avis             VARCHAR(400) NOT NULL,         -- « Mon avis »
    source_nom       VARCHAR(80)  NOT NULL,
    source_url       VARCHAR(255) NOT NULL,
    publiee          BOOLEAN      NOT NULL DEFAULT TRUE,
    INDEX idx_actualite_date (date_publication)
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- Messages du formulaire de contact
-- ---------------------------------------------------------
CREATE TABLE message (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom        VARCHAR(80)  NOT NULL,
    email      VARCHAR(150) NOT NULL,
    objet      VARCHAR(150) NOT NULL,
    contenu    TEXT         NOT NULL,
    date_envoi DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lu         BOOLEAN      NOT NULL DEFAULT FALSE,
    INDEX idx_message_date (date_envoi)
) ENGINE = InnoDB;

-- ---------------------------------------------------------
-- Comptes de l'espace d'administration (mot de passe haché avec password_hash)
-- ---------------------------------------------------------
CREATE TABLE administrateur (
    id                 TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifiant        VARCHAR(40)  NOT NULL UNIQUE,
    mot_de_passe       VARCHAR(255) NOT NULL,
    derniere_connexion DATETIME     NULL
) ENGINE = InnoDB;

-- =========================================================
-- Contenu
-- =========================================================

INSERT INTO categorie (id, code, libelle, ordre) VALUES
    (1, 'front', 'Front-end', 1),
    (2, 'back', 'Back-end', 2),
    (3, 'mobile', 'Mobile', 3),
    (4, 'bdd', 'Base de données', 4);

INSERT INTO competence (nom, categorie_id, complement, description, icone, langage, source, code, explication, ordre) VALUES
    ('HTML5', 1, NULL, 'Structure sémantique, formulaires, accessibilité et bonnes pratiques SEO.', 'devicon-html5-plain colored', 'html', 'Portfolio · contact.html', '<form id="contact-form">
  <label for="email">E-mail</label>
  <input type="email" id="email" name="email"
         autocomplete="email" required>

  <button type="submit">Envoyer le message</button>
  <p id="form-status" role="status" aria-live="polite"></p>
</form>', 'Un extrait du formulaire de contact de ce portfolio. Le `label` est relié au champ (`for` = `id`) : un clic sur « E-mail » place le curseur dans le champ, et les lecteurs d''écran annoncent ce qu''il faut saisir. `type="email"` affiche le clavier e-mail sur téléphone et `required` rend le champ obligatoire. La zone `role="status"` fait lire le résultat de l''envoi par les lecteurs d''écran.', 1),
    ('CSS3', 1, NULL, 'Flexbox, Grid, responsive design, variables CSS et animations.', 'devicon-css3-plain colored', 'css', 'Portfolio · base.css et projets.css', ':root {                  /* thème sombre */
  --surface: #31263d;
  --text: #f6eefc;
}
[data-theme="light"] {   /* thème clair */
  --surface: #fffaf2;
  --text: #2f2219;
}

.projects__grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: 1.75rem;
}', 'Deux techniques de ce portfolio. Les couleurs sont rangées dans des variables (`--surface`, `--text`) : le bouton de thème change seulement l''attribut `data-theme`, et toute la page passe du sombre au clair. La grille des projets crée autant de colonnes de 420 px minimum que l''écran le permet (`auto-fit` + `minmax`) : deux cartes sur ordinateur, une seule sur téléphone, sans media query.', 2),
    ('JavaScript', 1, NULL, 'Manipulation du DOM, événements, ES6+, appels d''API REST avec fetch.', 'devicon-javascript-plain colored', 'javascript', 'Portfolio · js/donnees.js', 'try {
  const reponse = await fetch(''api/contenu.php'', {
    headers: { Accept: ''application/json'' },
    signal: AbortSignal.timeout(3000),
  });
  if (reponse.ok) {
    return await reponse.json();
  }
} catch (erreur) {
  // serveur sans PHP ou base arrêtée
}
return window.CONTENU_PORTFOLIO; // copie de secours', 'Le chargement du contenu de ce portfolio. `fetch()` demande les données à l''API PHP, et `await` attend la réponse sans bloquer la page. Si le serveur ne répond pas en 3 secondes ou ne fait pas tourner PHP (comme GitHub Pages), on passe dans le `catch` et le site utilise sa copie de secours : il s''affiche dans tous les cas.', 3),
    ('Angular', 1, 'TypeScript', 'Composants, services, routing, formulaires réactifs et HttpClient.', 'devicon-angularjs-plain colored', 'typescript', 'Exemple · composant Angular', '@Component({
  selector: ''app-carte-jeu'',
  template: `
    <h3>{{ jeu.titre }}</h3>
    <p>{{ jeu.prix | currency:''EUR'' }}</p>
    <button (click)="ajouter()">Ajouter au panier</button>
  `,
})
export class CarteJeuComponent {
  @Input() jeu!: Jeu;
  @Output() ajout = new EventEmitter<Jeu>();

  ajouter() {
    this.ajout.emit(this.jeu);
  }
}', 'Un composant Angular, une brique réutilisable de l''interface : une carte qui affiche un jeu et son prix (le pipe `currency` le met en forme en euros). `@Input()` reçoit le jeu depuis le composant parent ; au clic sur le bouton, `@Output()` envoie un événement au parent, qui ajoute le jeu au panier.', 4),
    ('PHP', 2, NULL, 'POO, architecture MVC, PDO et requêtes préparées, sessions, API REST.', 'devicon-php-plain colored', 'php', 'PixelStar · pages/home.php', '<?php
$genreFilter = isset($_GET[''genre'']) ? (int)$_GET[''genre''] : 0;

$stmt = $pdo->prepare(''SELECT g.* FROM games g
    INNER JOIN game_genres gg ON gg.game_id = g.id
    WHERE gg.genre_id = :genre AND g.stock > 0'');
$stmt->execute(['':genre'' => $genreFilter]);
$games = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<?php foreach ($games as $game): ?>
    <h3><?php echo htmlspecialchars($game[''title'']); ?></h3>
<?php endforeach; ?>', 'La page d''accueil de PixelStar affiche les jeux d''un genre. Le numéro du genre vient de l''adresse (`?genre=3`) : il est converti en nombre avec `(int)`, puis passé à une requête préparée (`:genre`), ce qui empêche les injections SQL. À l''affichage, `htmlspecialchars()` neutralise les caractères spéciaux du titre pour bloquer les attaques XSS.', 1),
    ('Java', 2, 'Desktop', 'POO, collections, JavaFX, accès aux données avec JDBC, tests JUnit.', 'devicon-java-plain colored', 'java', 'Cours de POO · Eleves.java', 'public class Eleves extends Personne {
    private String classe;

    public Eleves(String nom, String prenom,
                  int age, String classe) {
        super(nom, prenom, age);
        this.classe = classe;
    }

    @Override
    public void afficher() {
        super.afficher();
        System.out.println("Classe : " + classe);
    }
}', 'La classe `Eleves` hérite de `Personne` (`extends`) : elle récupère le nom, le prénom et l''âge sans les réécrire. `super(...)` appelle le constructeur de la classe mère. `@Override` redéfinit la méthode `afficher()` : elle affiche d''abord la personne (`super.afficher()`), puis la classe de l''élève. C''est l''héritage et le polymorphisme de la programmation objet.', 2),
    ('Flutter', 3, 'Dart', 'Widgets, navigation, gestion d''état et consommation d''API REST.', 'devicon-flutter-plain colored', 'dart', 'Caillou Tour · pages/navigation.dart', 'NavigationBar(
  selectedIndex: _index,
  onDestinationSelected: (index) {
    setState(() => _index = index); // change d''onglet
  },
  destinations: [
    const NavigationDestination(
      icon: Icon(Icons.explore_outlined),
      selectedIcon: Icon(Icons.explore),
      label: ''Explorer'',
    ),
    // … Agenda et Séjour, sur le même modèle
    NavigationDestination(
      icon: Badge(
        isLabelVisible: nombreFavoris > 0,
        label: Text(''$nombreFavoris''),
        child: const Icon(Icons.favorite_border),
      ),
      label: ''Favoris'',
    ),
  ],
)', 'La barre de navigation en bas de l''application Caillou Tour (Explorer, Agenda, Séjour, Favoris). Quand on touche un onglet, `onDestinationSelected` reçoit son numéro et `setState()` l''enregistre dans `_index` : Flutter redessine l''écran, l''onglet choisi s''allume (`selectedIcon`, l''icône pleine) et sa page s''affiche. Sur « Favoris », un `Badge` montre le nombre de lieux en favoris, seulement s''il y en a au moins un.', 1),
    ('MySQL', 4, NULL, 'Modélisation Merise (MCD / MLD), requêtes SQL, jointures, procédures et triggers.', 'devicon-mysql-plain colored', 'sql', 'PixelStar · meilleures ventes', 'SELECT jeu, plateforme,
       SUM(quantite) AS total_vendus,
       COUNT(DISTINCT commande_id) AS nb_commandes
FROM vue_jeux_achetes
GROUP BY jeu_id, jeu, plateforme
ORDER BY total_vendus DESC
LIMIT 6;', 'Le classement des meilleures ventes de PixelStar. La requête lit la vue `vue_jeux_achetes` (les jeux de chaque commande) et regroupe les lignes par jeu avec `GROUP BY`. Pour chaque jeu, `SUM` additionne les quantités vendues et `COUNT(DISTINCT …)` compte les commandes. `ORDER BY … DESC` puis `LIMIT 6` gardent les 6 jeux les plus vendus.', 1),
    ('PostgreSQL', 4, NULL, 'Contraintes d''intégrité, vues, fonctions, gestion des rôles et des droits.', 'devicon-postgresql-plain colored', 'sql', 'Exemple · vue et droits', '-- Une vue : seulement les projets publiés
CREATE VIEW projets_publies AS
  SELECT titre, resume, periode
  FROM projet
  WHERE publie = TRUE;

-- Un rôle qui peut lire la vue, et rien d''autre
CREATE ROLE visiteur LOGIN;
GRANT SELECT ON projets_publies TO visiteur;', 'Une vue est une requête enregistrée qu''on interroge comme une table : ici, seulement les projets publiés. Le rôle `visiteur` reçoit uniquement le droit de lire cette vue (`GRANT SELECT`) : il ne peut rien modifier et ne voit pas les projets non publiés. C''est le principe du moindre privilège.', 2);

INSERT INTO certification (nom, organisme, description, annee, statut, detail, lien, icone, style, ordre) VALUES
    ('Certification Pix', 'Pix — service public', 'Certification des compétences numériques : information, communication, création de contenu, protection et sécurité, environnement numérique.', NULL, 'obtenue', NULL, 'https://pix.fr/', 'fa-solid fa-medal', 'pix', 1),
    ('HTML et CSS', 'OpenClassrooms', 'Créer des pages web avec HTML et les mettre en forme avec CSS.', NULL, 'obtenue', 'Certificat de réussite', NULL, 'fa-brands fa-html5', 'oc', 2),
    ('JavaScript', 'OpenClassrooms', 'Les bases de JavaScript pour rendre une page web interactive.', NULL, 'obtenue', 'Certificat de réussite', NULL, 'fa-brands fa-js', 'oc', 3),
    ('Java', 'OpenClassrooms', 'Les bases de la programmation en Java, un langage orienté objet.', NULL, 'obtenue', 'Certificat de réussite', NULL, 'fa-brands fa-java', 'oc', 4),
    ('Python', 'OpenClassrooms', 'Les bases de la programmation en Python.', NULL, 'obtenue', 'Certificat de réussite', NULL, 'fa-brands fa-python', 'oc', 5),
    ('Angular', 'OpenClassrooms', 'Créer une application web avec le framework Angular et TypeScript.', NULL, 'obtenue', 'Certificat de réussite', NULL, 'fa-brands fa-angular', 'oc', 6),
    ('ChatGPT', 'OpenClassrooms', 'Utiliser ChatGPT et l''intelligence artificielle générative de façon efficace.', NULL, 'obtenue', 'Certificat de réussite', NULL, 'fa-solid fa-robot', 'oc', 7);

-- Projets ------------------------------------------------
INSERT INTO projet (id, slug, titre, titre_complet, type, domaine, statut, resume, description, contexte, periode, equipe, image, lien_code, lien_conception, ordre) VALUES
    (1, 'pixelstar', 'PixelStar', 'PixelStar — boutique de jeux vidéo', 'Projet BTS individuel', 'web', 'en_cours',
     'Site web dynamique de vente de jeux vidéo (PC, PS5, Xbox, Switch) : catalogue lu dans une base MySQL, filtre par genre, notes des joueurs et page de contact.',
     'Site web dynamique en PHP pour une boutique de jeux vidéo multiplateforme. Les jeux, les genres et les avis sont enregistrés dans une base de données MySQL.',
     'Projet de BTS SIO en développement web', 'Depuis mai 2026', 'Projet individuel',
     'assets/projets/pixelstar-accueil.jpg', 'https://github.com/zixow/projet-steam-php-html-css', NULL, 1),
    (2, 'caillou-tour', 'Caillou Tour', 'Caillou Tour', 'Projet POO en binôme', 'mobile', 'en_cours',
     'Application mobile Flutter pour découvrir la Nouvelle-Calédonie : recherche, fiches des lieux avec carte, agenda des activités et événements, hôtels et restaurants, favoris et avis des membres.',
     'Application mobile en Flutter pour un office du tourisme : elle aide les visiteurs à découvrir la Nouvelle-Calédonie (lieux touristiques, activités, événements, restaurants et hébergements). Projet client de programmation orientée objet (POO), réalisé en binôme avec Weimin.',
     'Projet de POO du BTS SIO pour un office du tourisme', 'Depuis août 2026', 'En binôme avec Weimin',
     'assets/projets/caillou-tour-apercu.jpg', 'https://github.com/zixow/POO_nathan_weinim', 'https://github.com/zixow/PO-Nathan-Weimin', 2),
    (3, 'portfolio', 'Ce portfolio', 'Ce portfolio — site web et base de données', 'Projet personnel', 'web', 'en_cours',
     'Le site que vous visitez : mon bureau en 3D avec Three.js, sept pages en HTML, CSS et JavaScript, et une base de données MySQL gérée par une API PHP et un espace d''administration.',
     'Mon portfolio de BTS SIO, conçu et développé entièrement par moi. Son contenu (projets, compétences, certifications, actualités de ma veille et messages du formulaire de contact) est enregistré dans une base de données MySQL.',
     'Portfolio de BTS SIO', 'Depuis octobre 2026', 'Projet individuel',
     'assets/apercu-partage.jpg', 'https://github.com/zixow/Projet_Portfolio', NULL, 3);

INSERT INTO technologie (id, nom) VALUES
    (1, 'PHP'), (2, 'PDO'), (3, 'MySQL'), (4, 'HTML'), (5, 'CSS'), (6, 'Git'),
    (7, 'Flutter'), (8, 'Dart'), (9, 'Material 3'), (10, 'UML'), (11, 'Tests'),
    (12, 'JavaScript'), (13, 'Three.js');

INSERT INTO projet_technologie (projet_id, technologie_id, sur_carte, ordre) VALUES
    (1, 1, TRUE, 1), (1, 2, TRUE, 2), (1, 3, TRUE, 3), (1, 4, TRUE, 4), (1, 5, TRUE, 5), (1, 6, FALSE, 6),
    (2, 7, TRUE, 1), (2, 8, TRUE, 2), (2, 9, TRUE, 3), (2, 10, TRUE, 4), (2, 11, TRUE, 5), (2, 6, FALSE, 6),
    (3, 4, TRUE, 1), (3, 5, TRUE, 2), (3, 12, TRUE, 3), (3, 13, TRUE, 4), (3, 1, TRUE, 5), (3, 3, TRUE, 6),
    (3, 2, FALSE, 7), (3, 6, FALSE, 8);

INSERT INTO projet_rubrique (id, projet_id, titre, ordre) VALUES
    (1, 1, 'Fonctionnalités réalisées', 1),
    (2, 1, 'Base de données', 2),
    (3, 1, 'Prochaines étapes', 3),
    (4, 2, 'Fonctionnalités réalisées', 1),
    (5, 2, 'Conception et qualité', 2),
    (6, 2, 'Prochaines étapes', 3),
    (7, 3, 'Fonctionnalités', 1),
    (8, 3, 'Base de données', 2),
    (9, 3, 'Qualité', 3);

INSERT INTO projet_point (rubrique_id, texte, ordre) VALUES
    (1, 'Navigation entre les pages (Accueil, À propos, Contact) avec un routeur PHP et une page 404', 1),
    (1, 'En-tête et pied de page réutilisables', 2),
    (1, 'Catalogue des jeux mis en avant, filtre par genre, note moyenne et nombre d''avis', 3),
    (1, 'Statistiques : nombre de jeux, note moyenne, clients', 4),
    (1, 'Formulaire de contact avec vérification des champs et de l''adresse e-mail', 5),
    (2, 'Tables jeux, genres, utilisateurs, avis, commandes et panier', 1),
    (2, 'Relation plusieurs-à-plusieurs entre jeux et genres (table game_genres)', 2),
    (2, 'Requêtes avec jointures et calculs (AVG, COUNT) et vues SQL', 3),
    (3, 'Inscription et connexion des utilisateurs', 1),
    (3, 'Panier et passage de commande', 2),
    (4, 'Navigation à 5 onglets (Material 3) : Accueil, Explorer, Agenda, Séjour et Favoris', 1),
    (4, 'Recherche instantanée des lieux, activités et événements, sans tenir compte des accents', 2),
    (4, 'Fiche de chaque lieu : description, note moyenne, coordonnées GPS et carte de la Nouvelle-Calédonie dessinée avec CustomPainter', 3),
    (4, 'Agenda : activités filtrées par difficulté et prochains événements', 4),
    (4, 'Hôtels et restaurants : prix en F CFP, notes et réservation de démonstration', 5),
    (4, 'Comptes membres : connexion, création de compte, profil, favoris et avis (note de 1 à 5)', 6),
    (4, 'Rôle administrateur qui peut modérer les avis', 7),
    (4, 'Infos pratiques : horaires de l''office, numéros d''urgence et formulaire de contact', 8),
    (5, 'Classes issues du diagramme UML, avec de l''héritage : Utilisateur → UtilisateurConnecte → Administrateur, Etablissement → Restaurant / Hebergement', 1),
    (5, 'Services (connexion, favoris, avis, recherche) séparés des écrans', 2),
    (5, '29 tests automatisés (tests unitaires et tests de widgets) lancés avec `flutter test`', 3),
    (6, 'Enregistrer les comptes, les favoris et les avis dans une base de données via une API', 1),
    (6, 'Vraie carte interactive et appel téléphonique depuis l''application', 2),
    (6, 'Espace administrateur pour ajouter des lieux et des événements', 3),
    (7, 'Accueil en 3D (Three.js) : mon bureau reconstitué, de jour comme de nuit', 1),
    (7, 'Sept pages avec un menu et un pied de page communs, écrits une seule fois en JavaScript', 2),
    (7, 'Filtres, fenêtres de détails, liens directs vers les projets et formulaire de contact vérifié', 3),
    (7, 'Version 2D de secours si la 3D n''est pas disponible', 4),
    (8, 'Base MySQL de 12 tables : projets, technologies, compétences, certifications, actualités, messages…', 1),
    (8, 'Relations un-à-plusieurs et plusieurs-à-plusieurs (table projet_technologie)', 2),
    (8, 'API PHP avec PDO et requêtes préparées, qui renvoie le contenu en JSON', 3),
    (8, 'Espace d''administration protégé (mots de passe hachés, jeton CSRF) : actualités, compétences, certifications, projets et messages', 4),
    (8, 'Copie de la base mise à jour automatiquement pour la version en ligne sur GitHub Pages', 5),
    (9, 'Accessibilité vérifiée avec axe-core : contrastes, clavier et lecteurs d''écran', 1),
    (9, 'Tests automatisés de toutes les pages, sur ordinateur et sur téléphone', 2),
    (9, 'Adapté aux écrans dès 320 pixels de large', 3);

INSERT INTO projet_image (projet_id, chemin, legende, texte_alternatif, format, apres_rubrique, ordre) VALUES
    (1, 'assets/projets/pixelstar-accueil.jpg', 'Page d''accueil', 'Page d''accueil de PixelStar', 'paysage', 0, 1),
    (2, 'assets/projets/caillou-tour-detail.jpg', 'Fiche d''un lieu', 'Fiche du Centre culturel Tjibaou dans Caillou Tour', 'telephone', 0, 1),
    (2, 'assets/projets/caillou-tour-agenda.jpg', 'Agenda des activités', 'Agenda des activités dans Caillou Tour', 'telephone', 0, 2),
    (2, 'assets/projets/caillou-tour-sejour.jpg', 'Hôtels et restaurants', 'Hôtels et restaurants dans Caillou Tour', 'telephone', 0, 3),
    (2, 'assets/projets/caillou-tour-cas-utilisation.jpg', 'Cas d''utilisation', 'Diagramme de cas d''utilisation de Caillou Tour', 'paysage', 2, 1),
    (2, 'assets/projets/caillou-tour-classes.jpg', 'Diagramme de classes', 'Diagramme de classes de Caillou Tour', 'paysage', 2, 2),
    (3, 'assets/visuel-portfolio.jpg', 'Le portfolio sur ordinateur et sur téléphone', 'Pages du portfolio sur un ordinateur et sur un téléphone', 'paysage', 0, 1);

-- Actualités de la veille (le site affiche le mois et l'année) --------------
INSERT INTO actualite (date_publication, categorie, titre, resume, avis, source_nom, source_url) VALUES
    ('2026-09-01', 'vr', 'Valve ouvre les réservations du Steam Frame',
     'Le casque VR autonome de Valve est réservable sur Steam, à partir de 1 059 $.',
     'Plus cher que prévu à cause du prix des composants : il vise surtout les joueurs PC.',
     'UploadVR', 'https://www.uploadvr.com/steam-frame-price-revealed-reservations-opened-alyx-included/'),
    ('2026-01-01', 'ar', 'CES 2026 : les lunettes ROG XREAL R1 d''Asus et XREAL',
     'Des lunettes-écran pour jouer : écran micro-OLED à 240 Hz pour seulement 91 grammes.',
     'Une alternative légère aux casques, qui fait des lunettes un vrai accessoire de jeu.',
     'XREAL (communiqué)', 'https://www.xreal.com/blog/rog-xreal-r1-ar-gaming-glasses-announce-en'),
    ('2025-12-01', 'ar', 'Google présente ses lunettes Android XR pour 2026',
     'Des lunettes avec l''IA Gemini, avec ou sans écran, conçues avec Samsung et des marques de lunettes.',
     'Google mise sur le design et l''IA pour qu''on les porte tous les jours.',
     'Blog Google', 'https://blog.google/'),
    ('2025-11-01', 'vr', 'Valve annonce le Steam Frame',
     'Un casque VR autonome qui lance les jeux Steam ou les diffuse sans fil depuis un PC.',
     'Valve relance la concurrence face à Meta sur le marché de la VR pour les joueurs.',
     'Steam / Valve', 'https://store.steampowered.com/'),
    ('2025-10-01', 'mr', 'Samsung lance le Galaxy XR',
     'Le premier casque Android XR : 1 799 $, IA Gemini, suivi des yeux et des mains.',
     'Android pourrait faire pour la XR ce qu''il a fait pour le smartphone.',
     'Samsung Newsroom', 'https://news.samsung.com/fr/'),
    ('2025-09-01', 'ar', 'Meta présente les Ray-Ban Display et le Neural Band',
     'Des lunettes avec un petit écran dans le verre, pilotées par un bracelet qui détecte les gestes.',
     'Le bracelet règle un vrai problème : comment piloter des lunettes sans écran tactile ?',
     'Meta Newsroom', 'https://about.fb.com/news/'),
    ('2025-06-01', 'ar', 'Snap annonce ses lunettes AR « Specs » pour 2026',
     'Une version grand public de ses lunettes de réalité augmentée.',
     'La course aux lunettes AR ne se limite pas à Apple et Meta.',
     'Snap Newsroom', 'https://newsroom.snap.com/'),
    ('2024-12-01', 'mr', 'Google annonce Android XR',
     'Un système pour casques et lunettes, compatible avec Unity, OpenXR et WebXR.',
     'Bonne nouvelle pour les développeurs : on garde des outils qu''on connaît déjà.',
     'Blog Google', 'https://blog.google/'),
    ('2024-09-01', 'ar', 'Meta dévoile Orion, un prototype de lunettes AR',
     'Des lunettes holographiques présentées comme l''avenir des lunettes AR.',
     'La technologie existe, mais elle coûte encore trop cher à fabriquer.',
     'Meta Newsroom', 'https://about.fb.com/news/'),
    ('2024-02-01', 'mr', 'Sortie de l''Apple Vision Pro',
     'Le premier casque d''Apple, à 3 499 $, se contrôle avec les yeux et les mains.',
     'Trop cher pour le grand public, mais il a placé la barre très haut.',
     'Apple Newsroom', 'https://www.apple.com/fr/newsroom/');
