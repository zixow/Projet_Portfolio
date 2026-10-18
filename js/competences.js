/* =========================================================
   Page Compétences : cartes créées d'après la base de données
   (compétences, catégories, certifications), barres de niveau
   animées et filtres
   ========================================================= */

(function () {
  const { $, $$, activerFiltres, reveler, echapper } = window.Portfolio;
  const filtres = $('#skills-filters');
  const grille = $('#liste-competences');
  const listeCertifications = $('#liste-certifications');

  /** Seuls les liens http(s) sont acceptés (jamais de lien « javascript: » venant de la base). */
  const lienSur = (url) => (/^https?:\/\//i.test(url || '') ? url : '');

  const carteCompetence = (c) => {
    const niveau = Math.min(100, Math.max(0, Number(c.niveau) || 0));
    const categorie = echapper(c.categorie_libelle) + (c.complement ? ` · ${echapper(c.complement)}` : '');
    // Accessibilité : la barre est annoncée comme une jauge par les lecteurs d'écran
    return `
      <article class="card card--hover skill-card reveal" data-category="${echapper(c.categorie)}">
        <div class="skill-card__head">
          <span class="skill-card__icon"><i class="${echapper(c.icone)}" aria-hidden="true"></i></span>
          <div><h3>${echapper(c.nom)}</h3><span class="skill-card__cat">${categorie}</span></div>
          <span class="skill-card__percent">${niveau}%</span>
        </div>
        <div class="progress" role="progressbar" aria-label="Niveau en ${echapper(c.nom)}"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="${niveau}"><div class="progress__bar" data-level="${niveau}"></div></div>
        <p>${echapper(c.description)}</p>
      </article>`;
  };

  const STATUTS = { obtenue: ['done', 'Obtenue'], en_cours: ['soon', 'En cours'] };
  const carteCertification = (c) => {
    const [classe, libelle] = STATUTS[c.statut] || STATUTS.obtenue;
    const date = [c.annee, c.detail].filter(Boolean).map(echapper).join(' · ');
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
          <span><i class="fa-regular fa-calendar"></i> ${date}</span>
          ${lien}
        </div>
      </article>`;
  };

  // Les barres se remplissent quand elles apparaissent à l'écran
  const observateur = new IntersectionObserver((entrees, obs) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      const barre = $('.progress__bar', entree.target);
      barre.style.width = `${barre.dataset.level}%`;
      obs.unobserve(entree.target);
    });
  }, { threshold: 0.5 });

  window.Portfolio.donnees.then((donnees) => {
    filtres.innerHTML = '<button class="filter-btn active" type="button" data-filter="all" aria-pressed="true">Toutes</button>'
      + donnees.categories.map((c) => (
        `<button class="filter-btn" type="button" data-filter="${echapper(c.code)}" aria-pressed="false">${echapper(c.libelle)}</button>`
      )).join('');
    grille.innerHTML = donnees.competences.map(carteCompetence).join('');
    listeCertifications.innerHTML = donnees.certifications.map(carteCertification).join('');

    reveler(grille);
    reveler(listeCertifications);
    $$('.progress', grille).forEach((piste) => observateur.observe(piste));
    activerFiltres('#skills-filters', '.skill-card');
  });
})();
