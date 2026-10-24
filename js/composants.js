/* =========================================================
   Composants communs : en-tête (navigation) et pied de page
   ---------------------------------------------------------
   Ils sont écrits ici UNE seule fois, puis ajoutés à chaque page
   à la place de <div id="entete-site"> et <div id="pied-site">.
   Pour ajouter une page au menu : ajoutez une ligne dans PAGES.
   ========================================================= */

(function () {
  // [fichier, texte du lien, identifiant de la page (attribut data-page de <body>)]
  const PAGES = [
    ['index.html', 'Accueil', 'accueil'],
    ['parcours.html', 'Parcours', 'parcours'],
    ['competences.html', 'Compétences', 'competences'],
    ['projets.html', 'Projets', 'projets'],
    ['veille.html', 'Veille', 'veille'],
    ['synthese.html', 'Synthèse BTS', 'synthese'],
    ['contact.html', 'Contact', 'contact'],
  ];
  const pageActuelle = document.body.dataset.page;

  // Lien de la page actuelle mis en évidence
  const liens = PAGES.map(([fichier, texte, id]) => {
    const actif = id === pageActuelle;
    return `<li><a href="${fichier}" class="nav__link${actif ? ' active' : ''}"${actif ? ' aria-current="page"' : ''}>${texte}</a></li>`;
  }).join('');

  const entete = `
    <div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>
    <header class="header" id="header">
      <nav class="nav container" aria-label="Navigation principale">
        <a href="index.html" class="logo" aria-label="Retour à l'accueil">NT<span>.</span></a>
        <ul class="nav__menu" id="nav-menu">${liens}</ul>
        <div class="nav__actions">
          <a class="icon-btn" id="lien-admin" href="admin/" aria-label="Administration du portfolio (connexion)" title="Administration" hidden><i class="fa-solid fa-user-lock"></i></a>
          <button class="icon-btn" id="theme-toggle" type="button" aria-label="Changer de thème"><i class="fa-solid fa-sun"></i></button>
          <button class="icon-btn nav__burger" id="nav-burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav-menu"><i class="fa-solid fa-bars"></i></button>
        </div>
      </nav>
    </header>`;

  // Liens personnels : GitHub, LinkedIn, contact
  const pied = `
    <footer class="footer">
      <div class="container footer__inner">
        <a href="index.html" class="logo">NT<span>.</span></a>
        <p>© ${new Date().getFullYear()} Nathan THIBAULT · BTS SIO option SLAM · Réalisé en HTML, CSS et JavaScript · <a href="https://github.com/zixow/Projet_Portfolio" target="_blank" rel="noopener">voir le code</a></p>
        <ul class="socials socials--small">
          <li><a href="https://github.com/zixow" target="_blank" rel="noopener" aria-label="GitHub"><i class="fa-brands fa-github"></i></a></li>
          <li><a href="https://www.linkedin.com/in/nathan-thibault-416ba0407" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a></li>
          <li><a href="contact.html" aria-label="Me contacter"><i class="fa-solid fa-envelope"></i></a></li>
        </ul>
      </div>
    </footer>
    <button class="back-to-top" id="back-to-top" type="button" aria-label="Retour en haut de la page"><i class="fa-solid fa-arrow-up"></i></button>`;

  document.getElementById('entete-site').outerHTML = entete;
  document.getElementById('pied-site').outerHTML = pied;
})();
