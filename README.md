# Projet_Portfolio

Portfolio de **Nathan THIBAULT**, étudiant en 2<sup>e</sup> année de **BTS SIO option SLAM** (Solutions Logicielles et Applications Métiers).

🌐 **Voir le site en ligne :** https://zixow.github.io/Projet_Portfolio/

![Aperçu du portfolio](assets/visuel-portfolio.jpg)

## Contenu

- **À propos** : présentation et objectifs
- **Parcours scolaire** : du baccalauréat au BTS SIO SLAM
- **Compétences** : HTML, CSS, JavaScript, Angular, PHP, Java, Flutter, MySQL, PostgreSQL
- **Projets** : PixelStar (site web PHP / MySQL) et Caillou Tour (application mobile Flutter)
- **Expériences** : stages en entreprise
- **Certifications** : Pix, SecNumacadémie (ANSSI), Atelier RGPD (CNIL)…
- **Veille technologique** : la réalité virtuelle et la réalité augmentée
- **Contact**

## Technologies

Site statique réalisé sans framework :

- **HTML5** sémantique et accessible
- **CSS3** : Grid, Flexbox, variables, thème « désert » de jour / de nuit, responsive
- **JavaScript** : animations au défilement, filtres, fenêtre modale, onglets, validation du formulaire
- **Three.js (3D)** : désert réaliste sur la page d'accueil (ciel physique, dunes, falaises, dinosaures aux formes organiques avec pattes articulées, textures générées par le code), avec une version 2D en Canvas si la 3D n'est pas disponible

## Structure

```
Projet_Portfolio/
├── index.html        # Page principale
├── css/style.css     # Styles
├── js/script.js      # Interactions (et fond 2D de secours)
├── js/desert3d.js    # Désert et dinosaures en 3D (Three.js)
└── assets/           # Images, captures des projets, CV
```

## Lancer le projet

Aucune installation nécessaire : ouvrir `index.html` dans un navigateur.
