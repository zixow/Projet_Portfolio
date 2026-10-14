/* =========================================================
   Page Compétences : barres de niveau animées et filtres
   ========================================================= */

(function () {
  const { $, $$, activerFiltres } = window.Portfolio;

  // Les barres se remplissent quand elles apparaissent à l'écran
  const observateur = new IntersectionObserver((entrees, obs) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      const barre = $('.progress__bar', entree.target);
      barre.style.width = `${barre.dataset.level}%`;
      obs.unobserve(entree.target);
    });
  }, { threshold: 0.5 });

  $$('.progress').forEach((piste) => {
    const barre = $('.progress__bar', piste);
    const nom = $('h3', piste.closest('.skill-card'))?.textContent || 'Compétence';
    // Accessibilité : la barre est annoncée comme une jauge par les lecteurs d'écran
    piste.setAttribute('role', 'progressbar');
    piste.setAttribute('aria-label', `Niveau en ${nom}`);
    piste.setAttribute('aria-valuemin', '0');
    piste.setAttribute('aria-valuemax', '100');
    piste.setAttribute('aria-valuenow', barre.dataset.level);
    observateur.observe(piste);
  });

  activerFiltres('#skills-filters', '.skill-card');
})();
