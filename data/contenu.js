/* Copie du contenu de la base de données, générée automatiquement : ne pas modifier à la main.
   Utilisée quand la base n'est pas disponible (GitHub Pages, ouverture sans serveur).
   Pour la mettre à jour : administration du site, ou « php outils/exporter.php ». */
window.CONTENU_PORTFOLIO = {
    "categories": [
        {
            "code": "front",
            "libelle": "Front-end"
        },
        {
            "code": "back",
            "libelle": "Back-end"
        },
        {
            "code": "mobile",
            "libelle": "Mobile"
        },
        {
            "code": "bdd",
            "libelle": "Base de données"
        }
    ],
    "competences": [
        {
            "nom": "HTML5",
            "categorie": "front",
            "categorie_libelle": "Front-end",
            "complement": null,
            "description": "Structure sémantique, formulaires, accessibilité et bonnes pratiques SEO.",
            "icone": "devicon-html5-plain colored",
            "langage": "html",
            "source": "Portfolio · contact.html",
            "code": "\u003Cform id=\"contact-form\"\u003E\n  \u003Clabel for=\"email\"\u003EE-mail\u003C/label\u003E\n  \u003Cinput type=\"email\" id=\"email\" name=\"email\"\n         autocomplete=\"email\" required\u003E\n\n  \u003Cbutton type=\"submit\"\u003EEnvoyer le message\u003C/button\u003E\n  \u003Cp id=\"form-status\" role=\"status\" aria-live=\"polite\"\u003E\u003C/p\u003E\n\u003C/form\u003E",
            "explication": "Un extrait du formulaire de contact de ce portfolio. Le `label` est relié au champ (`for` = `id`) : un clic sur « E-mail » place le curseur dans le champ, et les lecteurs d'écran annoncent ce qu'il faut saisir. `type=\"email\"` affiche le clavier e-mail sur téléphone et `required` rend le champ obligatoire. La zone `role=\"status\"` fait lire le résultat de l'envoi par les lecteurs d'écran."
        },
        {
            "nom": "CSS3",
            "categorie": "front",
            "categorie_libelle": "Front-end",
            "complement": null,
            "description": "Flexbox, Grid, responsive design, variables CSS et animations.",
            "icone": "devicon-css3-plain colored",
            "langage": "css",
            "source": "Portfolio · base.css et projets.css",
            "code": ":root {                  /* thème sombre */\n  --surface: #31263d;\n  --text: #f6eefc;\n}\n[data-theme=\"light\"] {   /* thème clair */\n  --surface: #fffaf2;\n  --text: #2f2219;\n}\n\n.projects__grid {\n  display: grid;\n  grid-template-columns:\n    repeat(auto-fit, minmax(min(100%, 420px), 1fr));\n  gap: 1.75rem;\n}",
            "explication": "Deux techniques de ce portfolio. Les couleurs sont rangées dans des variables (`--surface`, `--text`) : le bouton de thème change seulement l'attribut `data-theme`, et toute la page passe du sombre au clair. La grille des projets crée autant de colonnes de 420 px minimum que l'écran le permet (`auto-fit` + `minmax`) : deux cartes sur ordinateur, une seule sur téléphone, sans media query."
        },
        {
            "nom": "JavaScript",
            "categorie": "front",
            "categorie_libelle": "Front-end",
            "complement": null,
            "description": "Manipulation du DOM, événements, ES6+, appels d'API REST avec fetch.",
            "icone": "devicon-javascript-plain colored",
            "langage": "javascript",
            "source": "Portfolio · js/donnees.js",
            "code": "try {\n  const reponse = await fetch('api/contenu.php', {\n    headers: { Accept: 'application/json' },\n    signal: AbortSignal.timeout(3000),\n  });\n  if (reponse.ok) {\n    return await reponse.json();\n  }\n} catch (erreur) {\n  // serveur sans PHP ou base arrêtée\n}\nreturn window.CONTENU_PORTFOLIO; // copie de secours",
            "explication": "Le chargement du contenu de ce portfolio. `fetch()` demande les données à l'API PHP, et `await` attend la réponse sans bloquer la page. Si le serveur ne répond pas en 3 secondes ou ne fait pas tourner PHP (comme GitHub Pages), on passe dans le `catch` et le site utilise sa copie de secours : il s'affiche dans tous les cas."
        },
        {
            "nom": "Angular",
            "categorie": "front",
            "categorie_libelle": "Front-end",
            "complement": "TypeScript",
            "description": "Composants, services, routing, formulaires réactifs et HttpClient.",
            "icone": "devicon-angularjs-plain colored",
            "langage": "typescript",
            "source": "Exemple · composant Angular",
            "code": "@Component({\n  selector: 'app-carte-jeu',\n  template: `\n    \u003Ch3\u003E{{ jeu.titre }}\u003C/h3\u003E\n    \u003Cp\u003E{{ jeu.prix | currency:'EUR' }}\u003C/p\u003E\n    \u003Cbutton (click)=\"ajouter()\"\u003EAjouter au panier\u003C/button\u003E\n  `,\n})\nexport class CarteJeuComponent {\n  @Input() jeu!: Jeu;\n  @Output() ajout = new EventEmitter\u003CJeu\u003E();\n\n  ajouter() {\n    this.ajout.emit(this.jeu);\n  }\n}",
            "explication": "Un composant Angular, une brique réutilisable de l'interface : une carte qui affiche un jeu et son prix (le pipe `currency` le met en forme en euros). `@Input()` reçoit le jeu depuis le composant parent ; au clic sur le bouton, `@Output()` envoie un événement au parent, qui ajoute le jeu au panier."
        },
        {
            "nom": "PHP",
            "categorie": "back",
            "categorie_libelle": "Back-end",
            "complement": null,
            "description": "POO, architecture MVC, PDO et requêtes préparées, sessions, API REST.",
            "icone": "devicon-php-plain colored",
            "langage": "php",
            "source": "PixelStar · pages/home.php",
            "code": "\u003C?php\n$genreFilter = isset($_GET['genre']) ? (int)$_GET['genre'] : 0;\n\n$stmt = $pdo-\u003Eprepare('SELECT g.* FROM games g\n    INNER JOIN game_genres gg ON gg.game_id = g.id\n    WHERE gg.genre_id = :genre AND g.stock \u003E 0');\n$stmt-\u003Eexecute([':genre' =\u003E $genreFilter]);\n$games = $stmt-\u003EfetchAll(PDO::FETCH_ASSOC);\n?\u003E\n\u003C?php foreach ($games as $game): ?\u003E\n    \u003Ch3\u003E\u003C?php echo htmlspecialchars($game['title']); ?\u003E\u003C/h3\u003E\n\u003C?php endforeach; ?\u003E",
            "explication": "La page d'accueil de PixelStar affiche les jeux d'un genre. Le numéro du genre vient de l'adresse (`?genre=3`) : il est converti en nombre avec `(int)`, puis passé à une requête préparée (`:genre`), ce qui empêche les injections SQL. À l'affichage, `htmlspecialchars()` neutralise les caractères spéciaux du titre pour bloquer les attaques XSS."
        },
        {
            "nom": "Java",
            "categorie": "back",
            "categorie_libelle": "Back-end",
            "complement": "Desktop",
            "description": "POO, collections, JavaFX, accès aux données avec JDBC, tests JUnit.",
            "icone": "devicon-java-plain colored",
            "langage": "java",
            "source": "Cours de POO · Eleves.java",
            "code": "public class Eleves extends Personne {\n    private String classe;\n\n    public Eleves(String nom, String prenom,\n                  int age, String classe) {\n        super(nom, prenom, age);\n        this.classe = classe;\n    }\n\n    @Override\n    public void afficher() {\n        super.afficher();\n        System.out.println(\"Classe : \" + classe);\n    }\n}",
            "explication": "La classe `Eleves` hérite de `Personne` (`extends`) : elle récupère le nom, le prénom et l'âge sans les réécrire. `super(...)` appelle le constructeur de la classe mère. `@Override` redéfinit la méthode `afficher()` : elle affiche d'abord la personne (`super.afficher()`), puis la classe de l'élève. C'est l'héritage et le polymorphisme de la programmation objet."
        },
        {
            "nom": "Flutter",
            "categorie": "mobile",
            "categorie_libelle": "Mobile",
            "complement": "Dart",
            "description": "Widgets, navigation, gestion d'état et consommation d'API REST.",
            "icone": "devicon-flutter-plain colored",
            "langage": "dart",
            "source": "Caillou Tour · pages/navigation.dart",
            "code": "NavigationBar(\n  selectedIndex: _index,\n  onDestinationSelected: (index) {\n    setState(() =\u003E _index = index); // change d'onglet\n  },\n  destinations: [\n    const NavigationDestination(\n      icon: Icon(Icons.explore_outlined),\n      selectedIcon: Icon(Icons.explore),\n      label: 'Explorer',\n    ),\n    // … Agenda et Séjour, sur le même modèle\n    NavigationDestination(\n      icon: Badge(\n        isLabelVisible: nombreFavoris \u003E 0,\n        label: Text('$nombreFavoris'),\n        child: const Icon(Icons.favorite_border),\n      ),\n      label: 'Favoris',\n    ),\n  ],\n)",
            "explication": "La barre de navigation en bas de l'application Caillou Tour (Explorer, Agenda, Séjour, Favoris). Quand on touche un onglet, `onDestinationSelected` reçoit son numéro et `setState()` l'enregistre dans `_index` : Flutter redessine l'écran, l'onglet choisi s'allume (`selectedIcon`, l'icône pleine) et sa page s'affiche. Sur « Favoris », un `Badge` montre le nombre de lieux en favoris, seulement s'il y en a au moins un."
        },
        {
            "nom": "MySQL",
            "categorie": "bdd",
            "categorie_libelle": "Base de données",
            "complement": null,
            "description": "Modélisation Merise (MCD / MLD), requêtes SQL, jointures, procédures et triggers.",
            "icone": "devicon-mysql-plain colored",
            "langage": "sql",
            "source": "PixelStar · meilleures ventes",
            "code": "SELECT jeu, plateforme,\n       SUM(quantite) AS total_vendus,\n       COUNT(DISTINCT commande_id) AS nb_commandes\nFROM vue_jeux_achetes\nGROUP BY jeu_id, jeu, plateforme\nORDER BY total_vendus DESC\nLIMIT 6;",
            "explication": "Le classement des meilleures ventes de PixelStar. La requête lit la vue `vue_jeux_achetes` (les jeux de chaque commande) et regroupe les lignes par jeu avec `GROUP BY`. Pour chaque jeu, `SUM` additionne les quantités vendues et `COUNT(DISTINCT …)` compte les commandes. `ORDER BY … DESC` puis `LIMIT 6` gardent les 6 jeux les plus vendus."
        },
        {
            "nom": "PostgreSQL",
            "categorie": "bdd",
            "categorie_libelle": "Base de données",
            "complement": null,
            "description": "Contraintes d'intégrité, vues, fonctions, gestion des rôles et des droits.",
            "icone": "devicon-postgresql-plain colored",
            "langage": "sql",
            "source": "Exemple · vue et droits",
            "code": "-- Une vue : seulement les projets publiés\nCREATE VIEW projets_publies AS\n  SELECT titre, resume, periode\n  FROM projet\n  WHERE publie = TRUE;\n\n-- Un rôle qui peut lire la vue, et rien d'autre\nCREATE ROLE visiteur LOGIN;\nGRANT SELECT ON projets_publies TO visiteur;",
            "explication": "Une vue est une requête enregistrée qu'on interroge comme une table : ici, seulement les projets publiés. Le rôle `visiteur` reçoit uniquement le droit de lire cette vue (`GRANT SELECT`) : il ne peut rien modifier et ne voit pas les projets non publiés. C'est le principe du moindre privilège."
        }
    ],
    "certifications": [
        {
            "annee": null,
            "nom": "Certification Pix",
            "organisme": "Pix — service public",
            "description": "Certification des compétences numériques : information, communication, création de contenu, protection et sécurité, environnement numérique.",
            "statut": "obtenue",
            "detail": null,
            "lien": "https://pix.fr/",
            "icone": "fa-solid fa-medal",
            "style": "pix"
        },
        {
            "annee": null,
            "nom": "HTML et CSS",
            "organisme": "OpenClassrooms",
            "description": "Créer des pages web avec HTML et les mettre en forme avec CSS.",
            "statut": "obtenue",
            "detail": "Certificat de réussite",
            "lien": null,
            "icone": "fa-brands fa-html5",
            "style": "oc"
        },
        {
            "annee": null,
            "nom": "JavaScript",
            "organisme": "OpenClassrooms",
            "description": "Les bases de JavaScript pour rendre une page web interactive.",
            "statut": "obtenue",
            "detail": "Certificat de réussite",
            "lien": null,
            "icone": "fa-brands fa-js",
            "style": "oc"
        },
        {
            "annee": null,
            "nom": "Java",
            "organisme": "OpenClassrooms",
            "description": "Les bases de la programmation en Java, un langage orienté objet.",
            "statut": "obtenue",
            "detail": "Certificat de réussite",
            "lien": null,
            "icone": "fa-brands fa-java",
            "style": "oc"
        },
        {
            "annee": null,
            "nom": "Python",
            "organisme": "OpenClassrooms",
            "description": "Les bases de la programmation en Python.",
            "statut": "obtenue",
            "detail": "Certificat de réussite",
            "lien": null,
            "icone": "fa-brands fa-python",
            "style": "oc"
        },
        {
            "annee": null,
            "nom": "Angular",
            "organisme": "OpenClassrooms",
            "description": "Créer une application web avec le framework Angular et TypeScript.",
            "statut": "obtenue",
            "detail": "Certificat de réussite",
            "lien": null,
            "icone": "fa-brands fa-angular",
            "style": "oc"
        },
        {
            "annee": null,
            "nom": "ChatGPT",
            "organisme": "OpenClassrooms",
            "description": "Utiliser ChatGPT et l'intelligence artificielle générative de façon efficace.",
            "statut": "obtenue",
            "detail": "Certificat de réussite",
            "lien": null,
            "icone": "fa-solid fa-robot",
            "style": "oc"
        }
    ],
    "projets": [
        {
            "slug": "pixelstar",
            "titre": "PixelStar",
            "titre_complet": "PixelStar — boutique de jeux vidéo",
            "type": "Projet BTS individuel",
            "domaine": "web",
            "statut": "en_cours",
            "resume": "Site web dynamique de vente de jeux vidéo (PC, PS5, Xbox, Switch) : catalogue lu dans une base MySQL, filtre par genre, notes des joueurs et page de contact.",
            "description": "Site web dynamique en PHP pour une boutique de jeux vidéo multiplateforme. Les jeux, les genres et les avis sont enregistrés dans une base de données MySQL.",
            "contexte": "Projet de BTS SIO en développement web",
            "periode": "Depuis mai 2026",
            "equipe": "Projet individuel",
            "image": "assets/projets/pixelstar-accueil.jpg",
            "lien_code": "https://github.com/zixow/projet-steam-php-html-css",
            "lien_conception": null,
            "technologies": [
                {
                    "nom": "PHP",
                    "sur_carte": true
                },
                {
                    "nom": "PDO",
                    "sur_carte": true
                },
                {
                    "nom": "MySQL",
                    "sur_carte": true
                },
                {
                    "nom": "HTML",
                    "sur_carte": true
                },
                {
                    "nom": "CSS",
                    "sur_carte": true
                },
                {
                    "nom": "Git",
                    "sur_carte": false
                }
            ],
            "rubriques": [
                {
                    "titre": "Fonctionnalités réalisées",
                    "points": [
                        "Navigation entre les pages (Accueil, À propos, Contact) avec un routeur PHP et une page 404",
                        "En-tête et pied de page réutilisables",
                        "Catalogue des jeux mis en avant, filtre par genre, note moyenne et nombre d'avis",
                        "Statistiques : nombre de jeux, note moyenne, clients",
                        "Formulaire de contact avec vérification des champs et de l'adresse e-mail"
                    ]
                },
                {
                    "titre": "Base de données",
                    "points": [
                        "Tables jeux, genres, utilisateurs, avis, commandes et panier",
                        "Relation plusieurs-à-plusieurs entre jeux et genres (table game_genres)",
                        "Requêtes avec jointures et calculs (AVG, COUNT) et vues SQL"
                    ]
                },
                {
                    "titre": "Prochaines étapes",
                    "points": [
                        "Inscription et connexion des utilisateurs",
                        "Panier et passage de commande"
                    ]
                }
            ],
            "images": [
                {
                    "chemin": "assets/projets/pixelstar-accueil.jpg",
                    "legende": "Page d'accueil",
                    "alt": "Page d'accueil de PixelStar",
                    "format": "paysage",
                    "apres_rubrique": 0
                }
            ]
        },
        {
            "slug": "caillou-tour",
            "titre": "Caillou Tour",
            "titre_complet": "Caillou Tour",
            "type": "Projet POO en binôme",
            "domaine": "mobile",
            "statut": "en_cours",
            "resume": "Application mobile Flutter pour découvrir la Nouvelle-Calédonie : recherche, fiches des lieux avec carte, agenda des activités et événements, hôtels et restaurants, favoris et avis des membres.",
            "description": "Application mobile en Flutter pour un office du tourisme : elle aide les visiteurs à découvrir la Nouvelle-Calédonie (lieux touristiques, activités, événements, restaurants et hébergements). Projet client de programmation orientée objet (POO), réalisé en binôme avec Weimin.",
            "contexte": "Projet de POO du BTS SIO pour un office du tourisme",
            "periode": "Depuis août 2026",
            "equipe": "En binôme avec Weimin",
            "image": "assets/projets/caillou-tour-apercu.jpg",
            "lien_code": "https://github.com/zixow/POO_nathan_weinim",
            "lien_conception": "https://github.com/zixow/PO-Nathan-Weimin",
            "technologies": [
                {
                    "nom": "Flutter",
                    "sur_carte": true
                },
                {
                    "nom": "Dart",
                    "sur_carte": true
                },
                {
                    "nom": "Material 3",
                    "sur_carte": true
                },
                {
                    "nom": "UML",
                    "sur_carte": true
                },
                {
                    "nom": "Tests",
                    "sur_carte": true
                },
                {
                    "nom": "Git",
                    "sur_carte": false
                }
            ],
            "rubriques": [
                {
                    "titre": "Fonctionnalités réalisées",
                    "points": [
                        "Navigation à 5 onglets (Material 3) : Accueil, Explorer, Agenda, Séjour et Favoris",
                        "Recherche instantanée des lieux, activités et événements, sans tenir compte des accents",
                        "Fiche de chaque lieu : description, note moyenne, coordonnées GPS et carte de la Nouvelle-Calédonie dessinée avec CustomPainter",
                        "Agenda : activités filtrées par difficulté et prochains événements",
                        "Hôtels et restaurants : prix en F CFP, notes et réservation de démonstration",
                        "Comptes membres : connexion, création de compte, profil, favoris et avis (note de 1 à 5)",
                        "Rôle administrateur qui peut modérer les avis",
                        "Infos pratiques : horaires de l'office, numéros d'urgence et formulaire de contact"
                    ]
                },
                {
                    "titre": "Conception et qualité",
                    "points": [
                        "Classes issues du diagramme UML, avec de l'héritage : Utilisateur → UtilisateurConnecte → Administrateur, Etablissement → Restaurant / Hebergement",
                        "Services (connexion, favoris, avis, recherche) séparés des écrans",
                        "29 tests automatisés (tests unitaires et tests de widgets) lancés avec `flutter test`"
                    ]
                },
                {
                    "titre": "Prochaines étapes",
                    "points": [
                        "Enregistrer les comptes, les favoris et les avis dans une base de données via une API",
                        "Vraie carte interactive et appel téléphonique depuis l'application",
                        "Espace administrateur pour ajouter des lieux et des événements"
                    ]
                }
            ],
            "images": [
                {
                    "chemin": "assets/projets/caillou-tour-detail.jpg",
                    "legende": "Fiche d'un lieu",
                    "alt": "Fiche du Centre culturel Tjibaou dans Caillou Tour",
                    "format": "telephone",
                    "apres_rubrique": 0
                },
                {
                    "chemin": "assets/projets/caillou-tour-agenda.jpg",
                    "legende": "Agenda des activités",
                    "alt": "Agenda des activités dans Caillou Tour",
                    "format": "telephone",
                    "apres_rubrique": 0
                },
                {
                    "chemin": "assets/projets/caillou-tour-sejour.jpg",
                    "legende": "Hôtels et restaurants",
                    "alt": "Hôtels et restaurants dans Caillou Tour",
                    "format": "telephone",
                    "apres_rubrique": 0
                },
                {
                    "chemin": "assets/projets/caillou-tour-cas-utilisation.jpg",
                    "legende": "Cas d'utilisation",
                    "alt": "Diagramme de cas d'utilisation de Caillou Tour",
                    "format": "paysage",
                    "apres_rubrique": 2
                },
                {
                    "chemin": "assets/projets/caillou-tour-classes.jpg",
                    "legende": "Diagramme de classes",
                    "alt": "Diagramme de classes de Caillou Tour",
                    "format": "paysage",
                    "apres_rubrique": 2
                }
            ]
        },
        {
            "slug": "portfolio",
            "titre": "Ce portfolio",
            "titre_complet": "Ce portfolio — site web et base de données",
            "type": "Projet personnel",
            "domaine": "web",
            "statut": "en_cours",
            "resume": "Le site que vous visitez : mon bureau en 3D avec Three.js, sept pages en HTML, CSS et JavaScript, et une base de données MySQL gérée par une API PHP et un espace d'administration.",
            "description": "Mon portfolio de BTS SIO, conçu et développé entièrement par moi. Son contenu (projets, compétences, certifications, actualités de ma veille et messages du formulaire de contact) est enregistré dans une base de données MySQL.",
            "contexte": "Portfolio de BTS SIO",
            "periode": "Depuis octobre 2026",
            "equipe": "Projet individuel",
            "image": "assets/apercu-partage.jpg",
            "lien_code": "https://github.com/zixow/Projet_Portfolio",
            "lien_conception": null,
            "technologies": [
                {
                    "nom": "HTML",
                    "sur_carte": true
                },
                {
                    "nom": "CSS",
                    "sur_carte": true
                },
                {
                    "nom": "JavaScript",
                    "sur_carte": true
                },
                {
                    "nom": "Three.js",
                    "sur_carte": true
                },
                {
                    "nom": "PHP",
                    "sur_carte": true
                },
                {
                    "nom": "MySQL",
                    "sur_carte": true
                },
                {
                    "nom": "PDO",
                    "sur_carte": false
                },
                {
                    "nom": "Git",
                    "sur_carte": false
                }
            ],
            "rubriques": [
                {
                    "titre": "Fonctionnalités",
                    "points": [
                        "Accueil en 3D (Three.js) : mon bureau reconstitué, de jour comme de nuit",
                        "Sept pages avec un menu et un pied de page communs, écrits une seule fois en JavaScript",
                        "Filtres, fenêtres de détails, liens directs vers les projets et formulaire de contact vérifié",
                        "Version 2D de secours si la 3D n'est pas disponible"
                    ]
                },
                {
                    "titre": "Base de données",
                    "points": [
                        "Base MySQL de 12 tables : projets, technologies, compétences, certifications, actualités, messages…",
                        "Relations un-à-plusieurs et plusieurs-à-plusieurs (table projet_technologie)",
                        "API PHP avec PDO et requêtes préparées, qui renvoie le contenu en JSON",
                        "Espace d'administration protégé (mots de passe hachés, jeton CSRF) : actualités, compétences, certifications, projets et messages",
                        "Copie de la base mise à jour automatiquement pour la version en ligne sur GitHub Pages"
                    ]
                },
                {
                    "titre": "Qualité",
                    "points": [
                        "Accessibilité vérifiée avec axe-core : contrastes, clavier et lecteurs d'écran",
                        "Tests automatisés de toutes les pages, sur ordinateur et sur téléphone",
                        "Adapté aux écrans dès 320 pixels de large"
                    ]
                }
            ],
            "images": [
                {
                    "chemin": "assets/visuel-portfolio.jpg",
                    "legende": "Le portfolio sur ordinateur et sur téléphone",
                    "alt": "Pages du portfolio sur un ordinateur et sur un téléphone",
                    "format": "paysage",
                    "apres_rubrique": 0
                }
            ]
        }
    ],
    "actualites": [
        {
            "date": "2026-09-01",
            "categorie": "vr",
            "titre": "Valve ouvre les réservations du Steam Frame",
            "resume": "Le casque VR autonome de Valve est réservable sur Steam, à partir de 1 059 $.",
            "avis": "Plus cher que prévu à cause du prix des composants : il vise surtout les joueurs PC.",
            "source_nom": "UploadVR",
            "source_url": "https://www.uploadvr.com/steam-frame-price-revealed-reservations-opened-alyx-included/"
        },
        {
            "date": "2026-01-01",
            "categorie": "ar",
            "titre": "CES 2026 : les lunettes ROG XREAL R1 d'Asus et XREAL",
            "resume": "Des lunettes-écran pour jouer : écran micro-OLED à 240 Hz pour seulement 91 grammes.",
            "avis": "Une alternative légère aux casques, qui fait des lunettes un vrai accessoire de jeu.",
            "source_nom": "XREAL (communiqué)",
            "source_url": "https://www.xreal.com/blog/rog-xreal-r1-ar-gaming-glasses-announce-en"
        },
        {
            "date": "2025-12-01",
            "categorie": "ar",
            "titre": "Google présente ses lunettes Android XR pour 2026",
            "resume": "Des lunettes avec l'IA Gemini, avec ou sans écran, conçues avec Samsung et des marques de lunettes.",
            "avis": "Google mise sur le design et l'IA pour qu'on les porte tous les jours.",
            "source_nom": "Blog Google",
            "source_url": "https://blog.google/"
        },
        {
            "date": "2025-11-01",
            "categorie": "vr",
            "titre": "Valve annonce le Steam Frame",
            "resume": "Un casque VR autonome qui lance les jeux Steam ou les diffuse sans fil depuis un PC.",
            "avis": "Valve relance la concurrence face à Meta sur le marché de la VR pour les joueurs.",
            "source_nom": "Steam / Valve",
            "source_url": "https://store.steampowered.com/"
        },
        {
            "date": "2025-10-01",
            "categorie": "mr",
            "titre": "Samsung lance le Galaxy XR",
            "resume": "Le premier casque Android XR : 1 799 $, IA Gemini, suivi des yeux et des mains.",
            "avis": "Android pourrait faire pour la XR ce qu'il a fait pour le smartphone.",
            "source_nom": "Samsung Newsroom",
            "source_url": "https://news.samsung.com/fr/"
        },
        {
            "date": "2025-09-01",
            "categorie": "ar",
            "titre": "Meta présente les Ray-Ban Display et le Neural Band",
            "resume": "Des lunettes avec un petit écran dans le verre, pilotées par un bracelet qui détecte les gestes.",
            "avis": "Le bracelet règle un vrai problème : comment piloter des lunettes sans écran tactile ?",
            "source_nom": "Meta Newsroom",
            "source_url": "https://about.fb.com/news/"
        },
        {
            "date": "2025-06-01",
            "categorie": "ar",
            "titre": "Snap annonce ses lunettes AR « Specs » pour 2026",
            "resume": "Une version grand public de ses lunettes de réalité augmentée.",
            "avis": "La course aux lunettes AR ne se limite pas à Apple et Meta.",
            "source_nom": "Snap Newsroom",
            "source_url": "https://newsroom.snap.com/"
        },
        {
            "date": "2024-12-01",
            "categorie": "mr",
            "titre": "Google annonce Android XR",
            "resume": "Un système pour casques et lunettes, compatible avec Unity, OpenXR et WebXR.",
            "avis": "Bonne nouvelle pour les développeurs : on garde des outils qu'on connaît déjà.",
            "source_nom": "Blog Google",
            "source_url": "https://blog.google/"
        },
        {
            "date": "2024-09-01",
            "categorie": "ar",
            "titre": "Meta dévoile Orion, un prototype de lunettes AR",
            "resume": "Des lunettes holographiques présentées comme l'avenir des lunettes AR.",
            "avis": "La technologie existe, mais elle coûte encore trop cher à fabriquer.",
            "source_nom": "Meta Newsroom",
            "source_url": "https://about.fb.com/news/"
        },
        {
            "date": "2024-02-01",
            "categorie": "mr",
            "titre": "Sortie de l'Apple Vision Pro",
            "resume": "Le premier casque d'Apple, à 3 499 $, se contrôle avec les yeux et les mains.",
            "avis": "Trop cher pour le grand public, mais il a placé la barre très haut.",
            "source_nom": "Apple Newsroom",
            "source_url": "https://www.apple.com/fr/newsroom/"
        }
    ]
};
