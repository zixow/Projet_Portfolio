/* =========================================================
   Accueil : mon bureau en 2D (version de secours sans WebGL)
   ---------------------------------------------------------
   Même décor que la version 3D, vu de face et dessiné à plat :
   mur crème, tasseaux de chêne, bureaux, étagère et figurines,
   écran avec du code qui s'écrit, console, PC RGB et ventilateur.
   Les mesures sont en mètres, comme dans la scène 3D.
   ========================================================= */

window.demarrerSetup2D = function ({ canvas, hero, toggle, root, reducedMotion }) {
  const c = canvas.getContext('2d');
  if (!c) return false;

  const COULEURS = {
    light: {
      mur: '#eee4d3', plafond: '#f4ede2', latte: '#c99459', joint: '#2b2725', sol: '#a88c70', plateau: '#d6bd96',
      metal: '#3c3c40', ombre: 'rgba(60, 40, 20, 0.18)', led: () => 'rgba(255, 215, 163, 0.35)', rideau: '#77738a',
    },
    dark: {
      mur: '#2c2236', plafond: '#251d2e', latte: '#6e4c38', joint: '#120e16', sol: '#2a2030', plateau: '#6a5a48',
      metal: '#1e1c22', ombre: 'rgba(0, 0, 0, 0.35)', led: (t) => `hsla(${(t * 15) % 360}, 90%, 60%, 0.55)`, rideau: '#3e3a52',
    },
  };
  let teintes = root.getAttribute('data-theme') === 'dark' ? COULEURS.dark : COULEURS.light;

  // Figurines de l'étagère : position x (m), hauteur (m), couleurs (haut, jupe, cheveux)
  const FIGURINES = [
    [1.33, 1.37, 0.25, '#1c1b22', '#e9e6ef', '#17151c'], [1.52, 1.37, 0.21, '#d9dbe6', '#1f2233', '#e8e9f2'],
    [1.84, 1.37, 0.24, '#fbeef3', '#ffffff', '#f6a6c4'], [2.06, 1.37, 0.23, '#c3222f', '#16161a', '#141318'],
    [2.33, 1.37, 0.24, '#26222e', '#1c1a22', '#100f14'], [1.3, 1.06, 0.13, '#3e6b45', '#2f3a52', '#5a3b26'],
    [1.52, 1.06, 0.13, '#1f4a4a', '#d8c9a4', '#1b1a1f'], [1.73, 1.06, 0.11, '#ffffff', '#fbe4ee', '#f5a3c7'],
    [1.86, 1.06, 0.16, '#f1f1ef', '#f1f1ef', '#1b1b20'], [2.0, 1.06, 0.15, '#1d1c24', '#2a2836', '#a9c8ec'],
    [2.24, 1.06, 0.15, '#f3f0f2', '#d23a4e', '#c8283a'], [2.39, 1.06, 0.14, '#1a1a1e', '#f2b3c9', '#1a1a1e'],
  ];
  // Lignes de code (indentation, longueur, couleur) affichées à l'écran
  const LIGNES = [[0, 30, '#569cd6'], [1, 44, '#9cdcfe'], [0, 0], [1, 34, '#6a9955'], [1, 18, '#4ec9b0'], [0, 0], [1, 9, '#dcdcaa'],
    [1, 14, '#569cd6'], [2, 24, '#9cdcfe'], [2, 14, '#569cd6'], [1, 1, '#d4d4d4'], [0, 0], [1, 20, '#dcdcaa'], [2, 22, '#9cdcfe'],
    [2, 28, '#ce9178'], [1, 1, '#d4d4d4'], [0, 0], [1, 9, '#dcdcaa'], [1, 30, '#4ec9b0'], [2, 34, '#9cdcfe'], [2, 14, '#c586c0']];

  let W = 0;
  let H = 0;
  let echelle = 1; // pixels par mètre
  let origine = { x: 0, y: 0 }; // position à l'écran du point (1,3 m ; 0,86 m)
  const X = (m) => origine.x + (m - 1.3) * echelle;
  const Y = (m) => origine.y - (m - 0.86) * echelle;

  const cadrer = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    const boiteHero = hero.getBoundingClientRect();
    const texte = hero.querySelector('.hero__content');
    const boiteTexte = texte ? texte.getBoundingClientRect() : null;
    const large = W >= 900 && W > H * 1.05;
    let zone;
    if (large) {
      const gauche = Math.min(W * 0.6, Math.max(W * 0.36, (boiteTexte ? boiteTexte.right - boiteHero.left : W * 0.45) - 80));
      zone = { x: gauche, y: 120, l: W - gauche - 10, h: H - 130 };
    } else {
      const haut = boiteTexte ? boiteTexte.bottom - boiteHero.top + 10 : H * 0.55;
      zone = { x: 0, y: haut, l: W, h: Math.max(150, H - haut) };
    }
    echelle = Math.min(zone.l / (large ? 2.95 : 2.3), zone.h / (large ? 1.7 : 1.25));
    origine = { x: zone.x + zone.l / 2 + (large ? -0.05 : 0.15) * echelle, y: zone.y + zone.h / 2 + (large ? 0 : 0.14) * echelle };
    return true;
  };

  const rect = (x0, y0, x1, y1, teinte) => { // coordonnées en mètres
    c.fillStyle = teinte;
    c.fillRect(X(x0), Y(y1), (x1 - x0) * echelle, (y1 - y0) * echelle);
  };

  const dessiner = (t) => {
    // Mur, plafond et sol
    c.fillStyle = teintes.mur;
    c.fillRect(0, 0, W, H);
    c.fillStyle = teintes.plafond;
    c.fillRect(0, 0, W, Math.max(0, Y(2.5)));
    c.fillStyle = teintes.sol;
    c.fillRect(0, Y(0), W, H - Y(0));
    // Fenêtre sur le lagon (ciel, mer, soleil ou lune) et ses deux rideaux
    const nuit = teintes === COULEURS.dark;
    const ciel = c.createLinearGradient(0, Y(2.12), 0, Y(1.5));
    ciel.addColorStop(0, nuit ? '#0b1030' : '#5aa7e0');
    ciel.addColorStop(1, nuit ? '#41356e' : '#ffb27f');
    c.fillStyle = ciel;
    c.fillRect(X(-3.25), Y(2.12), 1.1 * echelle, 0.62 * echelle);
    rect(-3.25, 0.95, -2.15, 1.5, nuit ? '#141a45' : '#2f9fb3');
    c.fillStyle = nuit ? '#f4f1e2' : '#fff2cc';
    c.beginPath();
    c.arc(X(nuit ? -2.45 : -2.62), Y(nuit ? 1.95 : 1.55), 0.05 * echelle, 0, Math.PI * 2);
    c.fill();
    [[-3.3, -3.25, 0.9, 2.17], [-2.15, -2.1, 0.9, 2.17], [-3.3, -2.1, 2.12, 2.17], [-3.3, -2.1, 0.9, 0.95], [-2.718, -2.682, 0.95, 2.12]]
      .forEach(([x0, x1, y0, y1]) => rect(x0, y0, x1, y1, '#f5f3ef'));
    [[-3.71, -3.27], [-2.13, -1.69]].forEach(([x0, x1]) => {
      for (let x = x0; x < x1; x += 0.055) rect(x, 0.08, x + 0.05, 2.3, teintes.rideau);
    });
    // Cadres : CV, Caillou Tour, PixelStar et affiche VR, puis l'horloge
    [[-1.42, 1.76, 0.3, 0.424, '#e9efe9'], [-0.86, 1.92, 0.46, 0.2, '#1a8a96'], [-0.9, 1.56, 0.4, 0.152, '#14141a'], [-0.4, 1.52, 0.2, 0.28, '#7b2cbf']]
      .forEach(([x, y, l, h, teinte]) => {
        rect(x - l / 2 - 0.057, y - h / 2 - 0.057, x + l / 2 + 0.057, y + h / 2 + 0.057, '#1d1b1f');
        rect(x - l / 2 - 0.035, y - h / 2 - 0.035, x + l / 2 + 0.035, y + h / 2 + 0.035, '#f7f4ee');
        rect(x - l / 2, y - h / 2, x + l / 2, y + h / 2, teinte);
      });
    c.fillStyle = '#fbfaf7';
    c.strokeStyle = '#1f1f22';
    c.lineWidth = Math.max(1.5, 0.012 * echelle);
    c.beginPath();
    c.arc(X(-0.36), Y(2.05), 0.13 * echelle, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    const maintenant = new Date();
    [[(maintenant.getHours() % 12) / 12 + maintenant.getMinutes() / 720, 0.07], [maintenant.getMinutes() / 60, 0.1]].forEach(([tour, longueur]) => {
      c.beginPath();
      c.moveTo(X(-0.36), Y(2.05));
      c.lineTo(X(-0.36 + Math.sin(tour * Math.PI * 2) * longueur), Y(2.05 + Math.cos(tour * Math.PI * 2) * longueur));
      c.stroke();
    });
    // Guirlande lumineuse
    for (let x = -3.75; x <= -0.25; x += 0.1) {
      const k = ((x + 3.75) % 1.15) / 1.15;
      c.fillStyle = nuit ? 'rgba(255, 210, 122, 0.95)' : 'rgba(255, 196, 110, 0.75)';
      c.beginPath();
      c.arc(X(x), Y(2.38 - Math.sin(k * Math.PI) * 0.13), Math.max(1.5, 0.014 * echelle), 0, Math.PI * 2);
      c.fill();
    }
    // Tasseaux de chêne sur feutre noir
    rect(0.05, 0, 3.5, 2.28, teintes.joint);
    for (let x = 0.063; x < 3.49; x += 0.04) rect(x, 0, x + 0.027, 2.28, teintes.latte);
    // Lueur des LED derrière l'écran et sous l'étagère
    const lueur = (x, y, r) => {
      const g = c.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * echelle);
      g.addColorStop(0, teintes.led(t));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(X(x - r), Y(y + r), 2 * r * echelle, 2 * r * echelle);
    };
    lueur(0.6, 1.1, 0.6);
    lueur(1.85, 1.2, 0.7);
    // Bureaux
    rect(-0.25, 0.725, 2.6, 0.75, teintes.plateau);
    [-0.21, 1.11, 1.19, 2.56].forEach((x) => rect(x - 0.02, 0, x + 0.02, 0.725, teintes.metal));
    rect(-0.21, 0.66, 2.56, 0.7, teintes.metal);
    // Étagère : montants, tablettes, fonds gris et figurines
    [1.22, 2.495].forEach((x) => rect(x, 0.75, x + 0.025, 1.47, teintes.metal));
    rect(1.24, 1.064, 2.5, 1.234, '#47474b');
    [1.06, 1.37].forEach((y) => rect(1.22, y - 0.018, 2.52, y, teintes.plateau));
    FIGURINES.forEach(([x, y, h, haut, jupe, cheveux]) => {
      rect(x - 0.04, y, x + 0.04, y + 0.008, '#0e0e10');
      c.fillStyle = jupe;
      c.beginPath();
      c.moveTo(X(x - h * 0.16), Y(y + h * 0.42));
      c.lineTo(X(x + h * 0.16), Y(y + h * 0.42));
      c.lineTo(X(x + h * 0.06), Y(y + h * 0.66));
      c.lineTo(X(x - h * 0.06), Y(y + h * 0.66));
      c.fill();
      rect(x - h * 0.05, y + h * 0.62, x + h * 0.05, y + h * 0.84, haut);
      rect(x - h * 0.03, y, x + h * 0.03, y + h * 0.42, '#f1d9c6');
      c.fillStyle = cheveux;
      c.beginPath();
      c.arc(X(x), Y(y + h * 0.9), h * 0.085 * echelle, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f6dcc8';
      c.beginPath();
      c.arc(X(x), Y(y + h * 0.89), h * 0.06 * echelle, 0, Math.PI * 2);
      c.fill();
    });
    rect(1.25, 1.345, 2.49, 1.352, teintes.led(t).replace(/[\d.]+\)$/, '1)'));
    // Écran et code qui s'écrit
    rect(0.55, 0.75, 0.65, 0.92, '#141416');
    rect(0.47, 0.75, 0.73, 0.762, '#141416');
    rect(0.286, 0.919, 0.914, 1.291, '#141416');
    rect(0.295, 0.93, 0.905, 1.28, '#1f1f1f');
    rect(0.295, 1.268, 0.905, 1.28, '#181818');
    rect(0.295, 0.93, 0.33, 1.268, '#181818');
    const nbVisibles = reducedMotion ? LIGNES.length : Math.floor((t * 2.5) % (LIGNES.length + 6));
    LIGNES.slice(0, Math.min(nbVisibles, LIGNES.length)).forEach(([retrait, longueur, teinte], i) => {
      if (!longueur) return;
      rect(0.345 + retrait * 0.016, 1.255 - i * 0.0145, 0.345 + retrait * 0.016 + longueur * 0.0068, 1.255 - i * 0.0145 + 0.007, teinte);
    });
    rect(0.295, 0.93, 0.905, 0.94, '#0078d4');
    // Console blanche
    c.fillStyle = '#f3f3f1';
    c.beginPath();
    c.moveTo(X(-0.12), Y(0.75));
    c.lineTo(X(0.1), Y(0.75));
    c.quadraticCurveTo(X(0.14), Y(0.95), X(0.15), Y(1.14));
    c.lineTo(X(-0.15), Y(1.14));
    c.quadraticCurveTo(X(-0.14), Y(0.95), X(-0.12), Y(0.75));
    c.fill();
    rect(-0.03, 0.76, 0.03, 1.12, '#18181b');
    // Clavier, souris et manettes
    rect(0.43, 0.75, 0.73, 0.772, '#e9e6df');
    rect(0.93, 0.75, 0.99, 0.768, '#f6f5f2');
    rect(1.35, 0.75, 1.47, 0.78, '#1b1b1e');
    rect(1.57, 0.75, 1.69, 0.78, '#c41e3a');
    // PC sous le bureau : boîtier blanc, ventilateurs RGB
    rect(0.64, 0, 1.08, 0.46, '#f1f1ef');
    rect(0.66, 0.02, 1.06, 0.44, '#24262a');
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = `hsl(${(t * 30 + i * 40) % 360}, 90%, 60%)`;
      c.lineWidth = Math.max(1.5, 0.008 * echelle);
      c.beginPath();
      c.arc(X(0.98), Y(0.09 + i * 0.13), 0.052 * echelle, 0, Math.PI * 2);
      c.stroke();
    }
    // Ventilateur sur pied qui tourne
    rect(2.84, 0, 3.16, 0.035, '#f5f5f3');
    rect(2.985, 0.03, 3.015, 0.82, '#f5f5f3');
    c.save();
    c.translate(X(3.0), Y(0.88));
    c.fillStyle = 'rgba(245,245,243,0.9)';
    for (let i = 0; i < 5; i++) {
      c.rotate((Math.PI * 2) / 5);
      c.beginPath();
      c.ellipse(0.075 * echelle, 0, 0.07 * echelle, 0.03 * echelle, t * (reducedMotion ? 0 : 6), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    c.strokeStyle = '#f5f5f3';
    c.lineWidth = Math.max(1, 0.008 * echelle);
    c.beginPath();
    c.arc(X(3.0), Y(0.88), 0.17 * echelle, 0, Math.PI * 2);
    c.stroke();
    // Ombre douce sous le bureau
    c.fillStyle = teintes.ombre;
    c.fillRect(X(-0.25), Y(0.72), 2.85 * echelle, 0.06 * echelle);
  };

  /* ---------- Animation, pause, thème ---------- */
  let idAnimation = null;
  let enPause = reducedMotion;
  let heroVisible = true;
  const debut = performance.now();
  const boucle = (maintenant) => {
    dessiner((maintenant - debut) / 1000);
    idAnimation = requestAnimationFrame(boucle);
  };
  const demarrer = () => {
    if (enPause || !heroVisible || idAnimation || !cadrer()) return;
    idAnimation = requestAnimationFrame(boucle);
  };
  const arreter = () => {
    if (idAnimation) cancelAnimationFrame(idAnimation);
    idAnimation = null;
  };
  const imageFixe = () => { if (cadrer()) dessiner(0); };
  const majBouton = () => {
    toggle.innerHTML = enPause
      ? '<i class="fa-solid fa-play"></i> <span>Animer</span>'
      : '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
    toggle.setAttribute('aria-label', enPause ? 'Lancer l’animation du bureau' : 'Mettre en pause l’animation du bureau');
  };
  toggle.addEventListener('click', () => {
    enPause = !enPause;
    majBouton();
    if (enPause) arreter(); else demarrer();
  });
  majBouton();

  window.addEventListener('resize', () => { if (!idAnimation) imageFixe(); else cadrer(); });
  new MutationObserver(() => {
    teintes = root.getAttribute('data-theme') === 'dark' ? COULEURS.dark : COULEURS.light;
    if (!idAnimation) imageFixe();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new IntersectionObserver(([entree]) => {
    heroVisible = entree.isIntersecting;
    if (heroVisible) demarrer(); else arreter();
  }).observe(hero);

  imageFixe();
  return true;
};
