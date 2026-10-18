/* =========================================================
   Page Projets : cartes et fenêtres de détails créées d'après
   la base de données, filtres et fenêtre de détails (modale)
   ========================================================= */

(function () {
  const { $, $$, activerFiltres, reveler, activerTilt, echapper, texteRiche } = window.Portfolio;
  const grille = $('#liste-projets');

  /* ---------- Cartes et détails des projets ---------- */
  const STATUTS = { en_cours: 'En cours', termine: 'Terminé' };
  const DOMAINES = { web: 'Web', mobile: 'Mobile' };
  /** Seuls les liens http(s) sont acceptés (jamais de lien « javascript: » venant de la base). */
  const lienSur = (url) => (/^https?:\/\//i.test(url || '') ? url : '');
  /** Nom du dépôt GitHub : la fin de l'adresse. */
  const nomDepot = (url) => url.replace(/\/+$/, '').split('/').pop();
  const lienExterne = (url, texte) => `<a href="${echapper(url)}" target="_blank" rel="noopener">${texte}</a>`;

  /** Fiche du projet : contexte, période, équipe, dépôts GitHub, lien vers la synthèse. */
  const fiche = (p) => {
    const lignes = [
      ['fa-solid fa-school', 'Contexte', echapper(p.contexte)],
      ['fa-regular fa-calendar', 'Période', echapper(p.periode)],
      [/individuel/i.test(p.equipe) ? 'fa-solid fa-user' : 'fa-solid fa-user-group', 'Équipe', echapper(p.equipe)],
    ];
    if (lienSur(p.lien_code)) lignes.push(['fa-brands fa-github', 'Code', lienExterne(p.lien_code, echapper(nomDepot(p.lien_code)))]);
    if (lienSur(p.lien_conception)) {
      lignes.push(['fa-solid fa-diagram-project', 'Conception UML', lienExterne(p.lien_conception, echapper(nomDepot(p.lien_conception)))]);
    }
    lignes.push(['fa-solid fa-table-cells', 'Compétences BTS', '<a href="synthese.html">Tableau de synthèse</a>']);
    return `<dl class="fiche">${lignes.map(([icone, titre, valeur]) => (
      `<div><dt><i class="${icone}"></i> ${titre}</dt><dd>${valeur}</dd></div>`
    )).join('')}</dl>`;
  };

  /** Galeries d'images : les images qui se suivent avec le même format sont regroupées. */
  const galeries = (images) => {
    const groupes = [];
    images.forEach((image) => {
      const dernier = groupes[groupes.length - 1];
      if (dernier && dernier.format === image.format) dernier.images.push(image);
      else groupes.push({ format: image.format, images: [image] });
    });
    return groupes.map(({ format, images: liste }) => {
      const classe = format === 'telephone' ? ' modal__gallery--telephones' : (liste.length === 1 ? ' modal__gallery--single' : '');
      return `<div class="modal__gallery${classe}">${liste.map((i) => `
        <figure>
          <a href="${echapper(i.chemin)}" target="_blank" rel="noopener"><img src="${echapper(i.chemin)}" alt="${echapper(i.alt)}" loading="lazy"></a>
          <figcaption>${echapper(i.legende)}</figcaption>
        </figure>`).join('')}</div>`;
    }).join('');
  };

  /** Contenu de la fenêtre de détails (rangé dans un <template> dans la carte). */
  const details = (p) => {
    const imagesApres = (n) => galeries(p.images.filter((i) => i.apres_rubrique === n));
    const rubriques = p.rubriques.map((r, i) => `
      <h4>${echapper(r.titre)}</h4>
      <ul>${r.points.map((point) => `<li>${texteRiche(point)}</li>`).join('')}</ul>
      ${imagesApres(i + 1)}`).join('');
    return `
      <span class="modal__tag">${echapper(p.type)} · ${DOMAINES[p.domaine] || ''} · ${STATUTS[p.statut] || ''}</span>
      <h3>${echapper(p.titre_complet)}</h3>
      <p>${echapper(p.description)}</p>
      ${fiche(p)}
      ${imagesApres(0)}
      ${rubriques}
      <div class="tags">${p.technologies.map((t) => `<span>${echapper(t.nom)}</span>`).join('')}</div>`;
  };

  const carte = (p) => {
    const titre = echapper(p.titre);
    const code = lienSur(p.lien_code)
      ? `<a href="${echapper(p.lien_code)}" class="btn btn--small btn--ghost" target="_blank" rel="noopener" aria-label="Code de ${titre} sur GitHub"><i class="fa-brands fa-github"></i> Code</a>`
      : '';
    const uml = lienSur(p.lien_conception)
      ? `<a href="${echapper(p.lien_conception)}" class="btn btn--small btn--ghost" target="_blank" rel="noopener" aria-label="Conception UML de ${titre} sur GitHub"><i class="fa-solid fa-diagram-project"></i> UML</a>`
      : '';
    return `
      <article class="card card--hover project-card tilt reveal" id="${echapper(p.slug)}" data-category="${echapper(p.domaine)}">
        <div class="project-card__media project-card__media--photo">
          <img src="${echapper(p.image)}" alt="" loading="lazy">
          <span class="project-card__type">${echapper(p.type)} · ${STATUTS[p.statut] || ''}</span>
        </div>
        <div class="project-card__body">
          <h3>${titre}</h3>
          <p>${echapper(p.resume)}</p>
          <ul class="tech-list">${p.technologies.filter((t) => t.sur_carte).map((t) => `<li>${echapper(t.nom)}</li>`).join('')}</ul>
          <div class="project-card__actions">
            <button class="btn btn--small btn--primary" type="button" data-open-project>Détails</button>
            ${code}${uml}
          </div>
        </div>
        <template>${details(p)}</template>
      </article>`;
  };

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

  // Un seul écouteur pour tous les boutons « Détails », même ceux ajoutés plus tard
  grille.addEventListener('click', (e) => {
    const bouton = e.target.closest('[data-open-project]');
    if (!bouton) return;
    const modele = $('template', bouton.closest('.project-card'));
    if (modele) ouvrir(modele);
  });

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
    const carteProjet = id && document.getElementById(id);
    if (!carteProjet || !carteProjet.classList.contains('project-card')) return;
    const modele = $('template', carteProjet);
    if (!modele) return;
    carteProjet.scrollIntoView({ block: 'center' });
    ouvrir(modele);
    dernierFocus = $('[data-open-project]', carteProjet); // à la fermeture, le focus revient sur « Détails »
  };
  window.addEventListener('hashchange', ouvrirDepuisAdresse);

  /* ---------- Affichage des projets ---------- */
  window.Portfolio.donnees.then((donnees) => {
    grille.innerHTML = donnees.projets.map(carte).join('');
    reveler(grille);
    activerTilt(grille);
    activerFiltres('#projects-filters', '.project-card');
    ouvrirDepuisAdresse();
  });
})();
