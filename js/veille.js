/* =========================================================
   Page Veille technologique : actualités lues dans la base de
   données (table actualite), filtre VR / AR / réalité mixte et
   bouton « Voir les actualités plus anciennes »
   ========================================================= */

(function () {
  const { $, $$, activerFiltres, reveler, echapper } = window.Portfolio;
  const liste = $('#liste-actualites');
  const boutonPlus = $('#news-plus');
  const NB_VISIBLES = 5; // les plus récentes ; les autres s'affichent avec le bouton
  const MOIS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  const CATEGORIES = { vr: 'VR', ar: 'AR', mr: 'MR' };
  /** Seuls les liens http(s) sont acceptés (jamais de lien « javascript: » venant de la base). */
  const lienSur = (url) => (/^https?:\/\//i.test(url || '') ? url : '');

  const actualite = (a, rang) => {
    const [annee, mois] = String(a.date).split('-').map(Number);
    const categorie = CATEGORIES[a.categorie] ? a.categorie : 'vr';
    const ancienne = rang >= NB_VISIBLES;
    const source = lienSur(a.source_url)
      ? `<a href="${echapper(a.source_url)}" target="_blank" rel="noopener">${echapper(a.source_nom)}</a>`
      : echapper(a.source_nom);
    return `
      <article class="card news-item reveal${ancienne ? ' news-item--ancienne' : ''}" data-category="${categorie}"${ancienne ? ' hidden' : ''}>
        <div class="news-item__date">${MOIS[mois - 1] || ''} <small>${annee || ''}</small></div>
        <div>
          <span class="pill pill--${categorie}">${CATEGORIES[categorie]}</span>
          <h4>${echapper(a.titre)}</h4>
          <p>${echapper(a.resume)}</p>
          <p class="news-item__avis"><strong>Mon avis :</strong> ${echapper(a.avis)}</p>
          <p class="news-item__source">Source : ${source}</p>
        </div>
      </article>`;
  };

  window.Portfolio.donnees.then((donnees) => {
    liste.innerHTML = donnees.actualites.map(actualite).join('');
    reveler(liste);
    activerFiltres('#news-filters', '.news-item');

    const anciennes = $$('.news-item--ancienne', liste);
    boutonPlus.hidden = anciennes.length === 0;
    boutonPlus.addEventListener('click', () => {
      anciennes.forEach((article) => { article.hidden = false; });
      boutonPlus.hidden = true;
      // Le clavier et les lecteurs d'écran arrivent sur la première actualité affichée
      anciennes[0].tabIndex = -1;
      anciennes[0].focus();
    });
  });
})();
