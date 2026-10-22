/* =========================================================
   Page Compétences : cartes créées d'après la base de données
   (compétences, catégories, certifications), extraits de code
   colorés avec Prism et filtres
   ========================================================= */

(function () {
  const { $, $$, activerFiltres, reveler, echapper, texteRiche } = window.Portfolio;
  const filtres = $('#skills-filters');
  const grille = $('#liste-competences');
  const listeCertifications = $('#liste-certifications');

  /** Seuls les liens http(s) sont acceptés (jamais de lien « javascript: » venant de la base). */
  const lienSur = (url) => (/^https?:\/\//i.test(url || '') ? url : '');

  /** Langages colorés par Prism (chargé dans competences.html) et nom affiché au-dessus du code. */
  const LANGAGES = {
    html: 'HTML', css: 'CSS', javascript: 'JavaScript', typescript: 'TypeScript',
    php: 'PHP', java: 'Java', dart: 'Dart', sql: 'SQL',
  };

  const carteCompetence = (c) => {
    const categorie = echapper(c.categorie_libelle) + (c.complement ? ` · ${echapper(c.complement)}` : '');
    const langage = Object.hasOwn(LANGAGES, c.langage) ? c.langage : 'none'; // « none » : code sans couleurs
    return `
      <article class="card card--hover skill-card reveal" data-category="${echapper(c.categorie)}">
        <div class="skill-card__head">
          <span class="skill-card__icon"><i class="${echapper(c.icone)}" aria-hidden="true"></i></span>
          <div><h3>${echapper(c.nom)}</h3><span class="skill-card__cat">${categorie}</span></div>
        </div>
        <p class="skill-card__desc">${echapper(c.description)}</p>
        <figure class="code">
          <figcaption class="code__barre">
            <span class="code__source">${echapper(c.source)}</span>
            <span class="code__langage">${LANGAGES[langage] || 'Code'}</span>
          </figcaption>
          <pre class="code__bloc"><code class="language-${langage}">${echapper(c.code)}</code></pre>
        </figure>
        <p class="skill-card__explication">
          <i class="fa-regular fa-lightbulb" aria-hidden="true"></i>
          <span><strong>Ce que fait ce code :</strong> ${texteRiche(c.explication)}</span>
        </p>
      </article>`;
  };

  const STATUTS = { obtenue: ['done', 'Obtenue'], en_cours: ['soon', 'En cours'] };
  const carteCertification = (c) => {
    const [classe, libelle] = STATUTS[c.statut] || STATUTS.obtenue;
    const infos = [c.annee, c.detail].filter(Boolean).map(echapper).join(' · ');
    const icone = c.annee ? 'fa-regular fa-calendar' : 'fa-solid fa-award';
    const lien = lienSur(c.lien)
      ? `<a href="${echapper(c.lien)}" target="_blank" rel="noopener">Voir <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : '';
    return `
      <article class="card card--hover certif-card reveal">
        <div class="certif-card__top">
          <span class="certif-card__icon certif-card__icon--${echapper(c.style)}"><i class="${echapper(c.icone)}" aria-hidden="true"></i></span>
          <span class="status status--${classe}">${libelle}</span>
        </div>
        <h3>${echapper(c.nom)}</h3>
        <p class="certif-card__org">${echapper(c.organisme)}</p>
        <p>${echapper(c.description)}</p>
        <div class="certif-card__footer">
          <span>${infos ? `<i class="${icone}"></i> ${infos}` : ''}</span>
          ${lien}
        </div>
      </article>`;
  };

  // Accessibilité : un bloc de code plus large que la carte défile, il doit alors pouvoir
  // recevoir le focus pour être parcouru au clavier (flèches gauche / droite)
  const ajusterDefilement = () => $$('.code__bloc', grille).forEach((bloc) => {
    if (bloc.scrollWidth > bloc.clientWidth) bloc.tabIndex = 0;
    else bloc.removeAttribute('tabindex');
  });

  window.Portfolio.donnees.then((donnees) => {
    filtres.innerHTML = '<button class="filter-btn active" type="button" data-filter="all" aria-pressed="true">Toutes</button>'
      + donnees.categories.map((c) => (
        `<button class="filter-btn" type="button" data-filter="${echapper(c.code)}" aria-pressed="false">${echapper(c.libelle)}</button>`
      )).join('');
    grille.innerHTML = donnees.competences.map(carteCompetence).join('');
    listeCertifications.innerHTML = donnees.certifications.map(carteCertification).join('');

    // Coloration du code : sans Prism (CDN injoignable), le code reste affiché en clair
    if (window.Prism) window.Prism.highlightAllUnder(grille);
    ajusterDefilement();
    window.addEventListener('resize', ajusterDefilement);
    filtres.addEventListener('click', () => requestAnimationFrame(ajusterDefilement));

    reveler(grille);
    reveler(listeCertifications);
    activerFiltres('#skills-filters', '.skill-card');
  });
})();
