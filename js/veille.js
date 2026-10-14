/* =========================================================
   Page Veille technologique : onglets, filtre des actualités
   et bouton « Copier » du bloc de code
   ========================================================= */

(function () {
  const { $, $$, reducedMotion, activerFiltres } = window.Portfolio;

  /* ---------- Onglets (accessibles au clavier : flèches, Début, Fin) ---------- */
  const onglets = $$('.tab-btn');
  const panneaux = $$('.tab-panel');

  const activer = (onglet, focus = false) => {
    onglets.forEach((o) => {
      const choisi = o === onglet;
      o.setAttribute('aria-selected', String(choisi));
      o.tabIndex = choisi ? 0 : -1;
    });
    panneaux.forEach((panneau) => {
      panneau.classList.toggle('active', panneau.id === onglet.getAttribute('aria-controls'));
    });
    if (focus) onglet.focus();
    onglet.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  onglets.forEach((onglet, i) => {
    onglet.addEventListener('click', () => activer(onglet));
    onglet.addEventListener('keydown', (e) => {
      const touches = {
        ArrowRight: (i + 1) % onglets.length,
        ArrowLeft: (i - 1 + onglets.length) % onglets.length,
        Home: 0,
        End: onglets.length - 1,
      };
      if (e.key in touches) {
        e.preventDefault();
        activer(onglets[touches[e.key]], true);
      }
    });
  });

  /* ---------- Filtre des actualités (VR, AR, réalité mixte) ---------- */
  activerFiltres('#news-filters', '.news-item');

  /* ---------- Bouton « Copier » du bloc de code ---------- */
  $$('[data-copy]').forEach((bouton) => bouton.addEventListener('click', async () => {
    const code = $('code', bouton.closest('.code')).innerText;
    try {
      await navigator.clipboard.writeText(code);
      bouton.innerHTML = '<i class="fa-solid fa-check"></i> Copié !';
    } catch (e) {
      bouton.textContent = 'Copie impossible';
    }
    setTimeout(() => { bouton.innerHTML = '<i class="fa-regular fa-copy"></i> Copier'; }, 1800);
  }));
})();
