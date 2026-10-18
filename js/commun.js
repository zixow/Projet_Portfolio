/* =========================================================
   Fonctions communes à toutes les pages
   ---------------------------------------------------------
   Thème clair / sombre, menu mobile, en-tête, retour en haut,
   apparition au défilement, effet 3D au survol, filtres et
   outils pour afficher le contenu venant de la base de données.
   Les autres scripts utilisent window.Portfolio ($, $$, …).
   ========================================================= */

window.Portfolio = (function () {
  const $ = (selecteur, contexte = document) => contexte.querySelector(selecteur);
  const $$ = (selecteur, contexte = document) => [...contexte.querySelectorAll(selecteur)];
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Thème clair / sombre ---------- */
  const boutonTheme = $('#theme-toggle');

  const majBoutonTheme = () => {
    const sombre = root.getAttribute('data-theme') !== 'light';
    boutonTheme.innerHTML = sombre ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    boutonTheme.setAttribute('aria-label', sombre ? 'Activer le thème clair' : 'Activer le thème sombre');
  };

  boutonTheme.addEventListener('click', () => {
    const suivant = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', suivant);
    try { localStorage.setItem('theme', suivant); } catch (e) { /* stockage indisponible */ }
    majBoutonTheme();
  });
  majBoutonTheme();

  /* ---------- Menu mobile ---------- */
  const burger = $('#nav-burger');
  const menu = $('#nav-menu');

  const basculerMenu = (ouvert) => {
    menu.classList.toggle('open', ouvert);
    burger.setAttribute('aria-expanded', String(ouvert));
    burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    burger.innerHTML = ouvert ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  };

  burger.addEventListener('click', () => basculerMenu(!menu.classList.contains('open')));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !e.target.closest('.nav')) basculerMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) basculerMenu(false);
  });

  /* ---------- En-tête, barre de progression, retour en haut ---------- */
  const entete = $('#header');
  const progression = $('#scroll-progress');
  const retourHaut = $('#back-to-top');

  const auDefilement = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    entete.classList.toggle('scrolled', y > 20);
    progression.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    retourHaut.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', auDefilement, { passive: true });
  auDefilement();

  retourHaut.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Apparition des éléments au défilement ---------- */
  // reveler() est aussi appelée pour le contenu ajouté plus tard (données de la base)
  const dejaObserves = new WeakSet();
  const observateurApparition = reducedMotion ? null : new IntersectionObserver((entrees, obs) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      entree.target.classList.add('visible');
      obs.unobserve(entree.target);
    });
  }, { threshold: 0.12 });

  const reveler = (racine = document) => {
    $$('.reveal', racine).forEach((el) => {
      if (dejaObserves.has(el)) return;
      dejaObserves.add(el);
      if (reducedMotion) {
        el.classList.add('visible');
        return;
      }
      // Décalage progressif entre éléments frères (effet cascade)
      const freres = [...el.parentElement.children].filter((enfant) => enfant.classList.contains('reveal'));
      el.style.animationDelay = `${Math.min(freres.indexOf(el), 5) * 90}ms`;
      observateurApparition.observe(el);
    });
  };
  reveler();

  /* ---------- Effet 3D (inclinaison) au survol ---------- */
  const peutIncliner = !reducedMotion && window.matchMedia('(hover: hover)').matches;
  const dejaInclines = new WeakSet();
  const activerTilt = (racine = document) => {
    if (!peutIncliner) return;
    $$('.tilt', racine).forEach((el) => {
      if (dejaInclines.has(el)) return;
      dejaInclines.add(el);
      const soulevement = el.classList.contains('project-card') ? ' translateY(-6px)' : '';
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)${soulevement}`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  };
  activerTilt();

  /* ---------- Texte venant de la base de données ---------- */
  /** Échappe un texte avant de l'insérer dans du HTML (protection contre l'injection de code). */
  const echapper = (texte) => String(texte ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /** Comme echapper(), et `texte entre accents graves` devient du code. */
  const texteRiche = (texte) => echapper(texte).replace(/`([^`]+)`/g, '<code>$1</code>');

  /* ---------- Filtres (compétences, projets, actualités) ---------- */
  /** Boutons de filtre (data-filter) qui masquent les éléments dont data-category ne correspond pas. */
  const activerFiltres = (groupe, selecteurElements) => {
    const boutons = $$(`${groupe} .filter-btn`);
    const elements = $$(selecteurElements);

    boutons.forEach((bouton) => bouton.addEventListener('click', () => {
      const filtre = bouton.dataset.filter;
      boutons.forEach((b) => {
        b.classList.toggle('active', b === bouton);
        b.setAttribute('aria-pressed', String(b === bouton));
      });
      elements.forEach((element) => {
        const correspond = filtre === 'all' || element.dataset.category === filtre;
        element.classList.toggle('is-hidden', !correspond);
        if (correspond) {
          element.classList.remove('pop');
          void element.offsetWidth; // relance l'animation
          element.classList.add('pop');
        }
      });
    }));
  };

  return { $, $$, root, reducedMotion, activerFiltres, reveler, activerTilt, echapper, texteRiche };
})();
