/* =========================================================
   Page d'accueil : texte qui s'écrit, compteurs animés
   et choix du fond animé (désert en 3D, ou en 2D en secours)
   ========================================================= */

(function () {
  const { $, $$, root, reducedMotion } = window.Portfolio;

  /* ---------- Effet « machine à écrire » ---------- */
  const zoneTexte = $('#typed');
  const roles = [
    'Développeur web & mobile',
    'Étudiant en BTS SIO SLAM',
    'Passionné de VR & AR',
    'Futur développeur full-stack',
  ];

  if (zoneTexte && !reducedMotion) {
    let role = 0;
    let lettre = 0;
    let efface = false;

    const ecrire = () => {
      const texte = roles[role];
      zoneTexte.textContent = texte.slice(0, lettre);

      if (!efface && lettre < texte.length) {
        lettre++;
        setTimeout(ecrire, 70);
      } else if (!efface) {
        efface = true;
        setTimeout(ecrire, 1800);
      } else if (lettre > 0) {
        lettre--;
        setTimeout(ecrire, 35);
      } else {
        efface = false;
        role = (role + 1) % roles.length;
        setTimeout(ecrire, 300);
      }
    };
    ecrire();
  }

  /* ---------- Compteurs animés (0 → valeur) ---------- */
  const observateur = new IntersectionObserver((entrees, obs) => {
    entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      const el = entree.target;
      const cible = parseInt(el.textContent, 10) || 0;
      const debut = performance.now();
      const etape = (maintenant) => {
        const p = Math.min((maintenant - debut) / 1400, 1);
        el.textContent = Math.round(cible * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(etape);
      };
      if (!reducedMotion) requestAnimationFrame(etape);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => observateur.observe(el));

  /* ---------- Fond animé : désert et dinosaures ---------- */
  const canvas = $('#dinos');
  if (canvas) {
    const options = { canvas, hero: $('#accueil'), toggle: $('#dino-toggle'), root, reducedMotion };
    const choisirDesert = () => {
      // 3D si Three.js et WebGL sont disponibles, sinon pixel art 2D
      const desert3D = typeof window.demarrerDesert3D === 'function' && window.demarrerDesert3D(options);
      if (!desert3D) window.demarrerDesert2D(options);
    };
    // Si la page n'est pas encore affichée (fenêtre de taille nulle), on attend qu'elle le soit
    if (window.innerWidth > 0) choisirDesert();
    else window.addEventListener('resize', choisirDesert, { once: true });
  }
})();
