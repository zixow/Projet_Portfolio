/* =========================================================
   Page Projets : filtres et fenêtre de détails (modale)
   ========================================================= */

(function () {
  const { $, $$, activerFiltres } = window.Portfolio;

  activerFiltres('#projects-filters', '.project-card');

  /* ---------- Fenêtre modale ---------- */
  const modale = $('#project-modal');
  const contenu = $('#modal-content');
  const fermer = $('.modal__close', modale);
  let dernierFocus = null;

  // Le détail de chaque projet est rangé dans un <template> à l'intérieur de sa carte
  const ouvrir = (modele) => {
    dernierFocus = document.activeElement;
    contenu.replaceChildren(modele.content.cloneNode(true));
    modale.classList.add('open');
    modale.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    fermer.focus();
  };

  const refermer = () => {
    modale.classList.remove('open');
    modale.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    // On retire l'ancre de l'adresse : recharger la page ne rouvre pas la fenêtre
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (dernierFocus) dernierFocus.focus();
  };

  $$('[data-open-project]').forEach((bouton) => bouton.addEventListener('click', () => {
    const modele = $('template', bouton.closest('.project-card'));
    if (modele) ouvrir(modele);
  }));

  modale.addEventListener('click', (e) => {
    if (e.target === modale || e.target.closest('.modal__close')) refermer();
  });

  // Garde le focus clavier dans la modale
  modale.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const elements = $$('button, a[href], [tabindex]:not([tabindex="-1"])', modale);
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modale.classList.contains('open')) refermer();
  });

  /* ---------- Lien direct vers un projet : projets.html#pixelstar ouvre ses détails ---------- */
  // Utilisé par les cadres du mur de l'accueil et par le tableau de synthèse
  const ouvrirDepuisAdresse = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const carte = id && document.getElementById(id);
    if (!carte || !carte.classList.contains('project-card')) return;
    const modele = $('template', carte);
    if (!modele) return;
    carte.scrollIntoView({ block: 'center' });
    ouvrir(modele);
    dernierFocus = $('[data-open-project]', carte); // à la fermeture, le focus revient sur « Détails »
  };
  window.addEventListener('hashchange', ouvrirDepuisAdresse);
  ouvrirDepuisAdresse();
})();
