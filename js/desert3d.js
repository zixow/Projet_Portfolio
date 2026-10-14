/* =========================================================
   Accueil : désert et dinosaures en 3D (Three.js r128)
   ---------------------------------------------------------
   Les dinosaures sont construits avec des formes simples
   (sphères, cylindres, cônes…) en style « low-poly ».
   Si Three.js ou WebGL ne sont pas disponibles, cette
   fonction renvoie false et script.js affiche à la place
   la version 2D en pixel art.
   ========================================================= */

window.demarrerDesert3D = function ({ canvas, hero, toggle, root, reducedMotion }) {
  if (!window.THREE) return false;
  const T = window.THREE;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch (erreur) {
    return false; // WebGL indisponible : on garde la version 2D
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const rand = (min, max) => min + Math.random() * (max - min);

  /* ---------- Couleurs : désert de jour (thème clair) ou de nuit (thème sombre) ---------- */
  const PALETTES = {
    light: {
      ciel: ['#fff4dc', '#ffd9a0', '#ffb877'], astre: '#ffe066', halo: 'rgba(255, 196, 61, 0.55)', etoiles: false,
      sable: '#f3d7a7', dune: '#f2c58c', plateau1: '#f2ad7c', plateau2: '#e48e5c', cactus: '#2f9e44', rocher: '#c98a55',
      nuage: '#ffffff', nuageOpacite: 0.95,
      rex: '#16a34a', tricera: '#8b5cf6', collerette: '#f59e0b', bronto: '#0e7490', ptero: '#c2410c', corne: '#fef3c7',
      lumiereCiel: '#fff1d6', lumiereSol: '#d9a066', forceCiel: 0.5, lumiereAstre: '#fff0d0', forceAstre: 0.75,
    },
    dark: {
      ciel: ['#14112e', '#35195a', '#7a2e63'], astre: '#fef3c7', halo: 'rgba(254, 243, 199, 0.25)', etoiles: true,
      sable: '#3a2650', dune: '#4a2d63', plateau1: '#3d2459', plateau2: '#4c2a63', cactus: '#34d399', rocher: '#5b3d70',
      nuage: '#a78bfa', nuageOpacite: 0.18,
      rex: '#4ade80', tricera: '#e879f9', collerette: '#facc15', bronto: '#22d3ee', ptero: '#fb923c', corne: '#fef3c7',
      lumiereCiel: '#8b7bd8', lumiereSol: '#2a1838', forceCiel: 0.6, lumiereAstre: '#c4b5fd', forceAstre: 0.6,
    },
  };
  let pal = root.getAttribute('data-theme') === 'dark' ? PALETTES.dark : PALETTES.light;

  // Un matériau par « rôle » (rex, cactus…) : il suffit de changer sa couleur pour changer de thème
  const materiaux = {};
  const mat = (role, options = {}) => {
    if (!materiaux[role]) {
      materiaux[role] = new T.MeshStandardMaterial({ color: pal[role], flatShading: true, roughness: 0.9, metalness: 0, ...options });
    }
    return materiaux[role];
  };
  const noir = new T.MeshBasicMaterial({ color: '#111111' });

  const maille = (geometrie, materiau, x = 0, y = 0, z = 0) => {
    const m = new T.Mesh(geometrie, materiau);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  /* ---------- Scène, caméra, lumières ---------- */
  const scene = new T.Scene();
  const CAMERA_HAUTEUR = 2.2;
  const CAMERA_Z = 24;
  const camera = new T.PerspectiveCamera(50, 1, 0.5, 400);
  camera.position.set(0, CAMERA_HAUTEUR, CAMERA_Z); // la caméra regarde droit devant (vers -z)

  const cielCanvas = document.createElement('canvas');
  const cielTexture = new T.CanvasTexture(cielCanvas);
  scene.background = cielTexture;
  scene.fog = new T.Fog(pal.ciel[2], 60, 230); // le lointain se fond dans le ciel

  const lumiereCiel = new T.HemisphereLight(pal.lumiereCiel, pal.lumiereSol, pal.forceCiel);
  scene.add(lumiereCiel);
  const astre = new T.DirectionalLight(pal.lumiereAstre, pal.forceAstre);
  astre.position.set(-30, 40, 30);
  astre.castShadow = true;
  astre.shadow.mapSize.set(1024, 1024);
  Object.assign(astre.shadow.camera, { left: -60, right: 60, top: 40, bottom: -40, near: 1, far: 150 });
  astre.shadow.bias = -0.0008;
  scene.add(astre);

  /* ---------- Sol : sable plat près des dinosaures, dunes au loin ---------- */
  const solGeo = new T.PlaneGeometry(420, 260, 130, 70);
  solGeo.rotateX(-Math.PI / 2);
  solGeo.translate(0, 0, -100);
  const position = solGeo.attributes.position;
  const lointain = new Float32Array(position.count); // 0 = près, 1 = loin
  const grain = new Float32Array(position.count);     // petite variation de couleur (grain du sable)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const loin = T.MathUtils.smoothstep(-z, 16, 45);
    const hauteur = loin * (Math.sin(x * 0.045 + z * 0.02) * 2.2 + Math.sin(x * 0.11 - z * 0.07) * 1.1 + 1.2)
      + (1 - loin) * Math.sin(x * 0.3 + z * 0.5) * 0.06;
    position.setY(i, hauteur);
    lointain[i] = loin;
    grain[i] = rand(0.93, 1.04);
  }
  solGeo.computeVertexNormals();
  solGeo.setAttribute('color', new T.BufferAttribute(new Float32Array(position.count * 3), 3));
  const colorerSol = () => {
    const couleurs = solGeo.attributes.color;
    const sable = new T.Color(pal.sable);
    const dune = new T.Color(pal.dune);
    const c = new T.Color();
    for (let i = 0; i < position.count; i++) {
      c.copy(sable).lerp(dune, lointain[i]).multiplyScalar(grain[i]);
      couleurs.setXYZ(i, c.r, c.g, c.b);
    }
    couleurs.needsUpdate = true;
  };
  colorerSol();
  const sol = new T.Mesh(solGeo, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  sol.receiveShadow = true;
  scene.add(sol);

  /* ---------- Plateaux rocheux à l'horizon ---------- */
  for (let i = 0; i < 10; i++) {
    const rayon = rand(6, 16);
    const hauteur = rand(8, 20);
    const plateau = maille(
      new T.CylinderGeometry(rayon * 0.72, rayon, hauteur, 6 + (i % 3), 1),
      mat(i % 2 ? 'plateau1' : 'plateau2'),
      -170 + i * 38 + rand(-8, 8), hauteur / 2 - 3, rand(-170, -110)
    );
    plateau.rotation.y = rand(0, Math.PI);
    scene.add(plateau);
  }

  /* ---------- Cactus et rochers ---------- */
  const creerCactus = (taille) => {
    const cactus = new T.Group();
    const m = mat('cactus');
    cactus.add(maille(new T.CylinderGeometry(0.35, 0.42, 3.2, 7), m, 0, 1.6, 0));
    cactus.add(maille(new T.SphereGeometry(0.35, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 3.2, 0));
    [[1, 1.3, 1.1], [-1, 1.8, 0.8]].forEach(([cote, hauteur, longueur]) => {
      const coude = maille(new T.CylinderGeometry(0.22, 0.22, 0.8, 6), m, cote * 0.6, hauteur, 0);
      coude.rotation.z = Math.PI / 2;
      cactus.add(coude);
      cactus.add(maille(new T.CylinderGeometry(0.22, 0.24, longueur + 0.2, 6), m, cote * 1.0, hauteur + longueur / 2, 0));
      cactus.add(maille(new T.SphereGeometry(0.22, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), m, cote * 1.0, hauteur + longueur + 0.1, 0));
    });
    cactus.scale.setScalar(taille);
    cactus.rotation.y = rand(-0.6, 0.6);
    return cactus;
  };
  [[-30, -14], [-12, -18], [9, -15], [26, -12], [-22, 6], [17, 8], [38, -1], [-40, -1]].forEach(([x, z]) => {
    const cactus = creerCactus(rand(0.8, 1.25));
    cactus.position.set(x + rand(-3, 3), 0, z);
    scene.add(cactus);
  });
  for (let i = 0; i < 14; i++) {
    const zRocher = Math.random() < 0.5 ? rand(-20, -12) : rand(3, 12); // hors du chemin des dinosaures
    const rocher = maille(new T.DodecahedronGeometry(rand(0.3, 0.9), 0), mat('rocher'), rand(-50, 50), 0.1, zRocher);
    rocher.scale.y = 0.6;
    scene.add(rocher);
  }

  /* ---------- Nuages low-poly ---------- */
  const materiauNuage = new T.MeshStandardMaterial({
    color: pal.nuage, emissive: pal.nuage, emissiveIntensity: 0.7, flatShading: true,
    transparent: true, opacity: pal.nuageOpacite, fog: false, // les nuages restent blancs malgré la brume
  });
  const nuages = Array.from({ length: 5 }, () => {
    const nuage = new T.Group();
    for (let i = 0; i < 5; i++) {
      const boule = new T.Mesh(new T.IcosahedronGeometry(rand(2.2, 3.6), 1), materiauNuage);
      boule.scale.y = 0.7;
      boule.position.set(i * 2.8 - 5.6, Math.sin(i) * 0.8, rand(-1, 1));
      nuage.add(boule);
    }
    nuage.userData = { vitesse: rand(0.6, 1.4), hauteurEcran: rand(0.04, 0.26) };
    scene.add(nuage);
    return nuage;
  });

  /* ---------- Dinosaures ---------- */

  // Patte articulée à la hanche : on la fait pivoter pour marcher
  const creerPatte = (materiau, longueur, epaisseur) => {
    const hanche = new T.Group();
    const piedHauteur = epaisseur * 0.45;
    hanche.add(maille(new T.CylinderGeometry(epaisseur, epaisseur * 0.7, longueur - piedHauteur, 7), materiau, 0, -(longueur - piedHauteur) / 2, 0));
    hanche.add(maille(new T.BoxGeometry(epaisseur * 2.2, piedHauteur, epaisseur * 1.6), materiau, epaisseur * 0.5, -longueur + piedHauteur / 2, 0));
    return hanche;
  };
  const ajouterPattes = (dino, materiau, positions, longueur, epaisseur) => positions.map(([x, z]) => {
    const patte = creerPatte(materiau, longueur, epaisseur);
    patte.position.set(x, longueur, z);
    dino.add(patte);
    return patte;
  });
  const ajouterYeux = (dino, x, y, ecart, taille = 0.14) => {
    [-1, 1].forEach((cote) => dino.add(maille(new T.BoxGeometry(taille, taille, taille), noir, x, y, cote * ecart)));
  };

  const creerRex = () => {
    const rex = new T.Group();
    const m = mat('rex');
    const corps = maille(new T.SphereGeometry(1, 9, 7), m, 0, 3.0, 0);
    corps.scale.set(1.7, 1.05, 0.95);
    corps.rotation.z = 0.3;
    const cou = maille(new T.SphereGeometry(0.75, 8, 6), m, 1.35, 3.85, 0);
    cou.scale.set(1, 1.2, 0.85);
    const machoire = maille(new T.BoxGeometry(1.2, 0.3, 0.75), m, 2.15, 3.98, 0);
    machoire.rotation.z = -0.12;
    const queue = maille(new T.ConeGeometry(0.75, 3.4, 8), m, -2.3, 2.6, 0);
    queue.rotation.z = Math.PI / 2 + 0.25;
    rex.add(corps, cou, maille(new T.BoxGeometry(1.5, 0.85, 0.85), m, 2.2, 4.55, 0), machoire, queue);
    [-1, 1].forEach((cote) => {
      const bras = maille(new T.BoxGeometry(0.55, 0.15, 0.15), m, 1.65, 3.2, cote * 0.45);
      bras.rotation.z = -0.8;
      rex.add(bras);
    });
    ajouterYeux(rex, 2.55, 4.75, 0.43);
    const pattes = ajouterPattes(rex, m, [[0.2, 0.55], [0.2, -0.55]], 2.6, 0.45);
    return { groupe: rex, pattes, phases: [0, Math.PI], amplitude: 0.55, foulee: 2.6 };
  };

  const creerBronto = (taille) => {
    const bronto = new T.Group();
    const m = mat('bronto');
    const corps = maille(new T.SphereGeometry(1, 10, 8), m, 0, 3.3, 0);
    corps.scale.set(2.5, 1.35, 1.25);
    const courbeCou = new T.CatmullRomCurve3([
      new T.Vector3(1.9, 3.8, 0), new T.Vector3(3.0, 4.9, 0), new T.Vector3(3.6, 6.2, 0), new T.Vector3(3.85, 7.2, 0),
    ]);
    const tete = maille(new T.SphereGeometry(0.5, 8, 6), m, 4.2, 7.35, 0);
    tete.scale.set(1.5, 0.8, 0.8);
    const queue = maille(new T.ConeGeometry(0.8, 5, 8), m, -4.4, 2.6, 0);
    queue.rotation.z = Math.PI / 2 + 0.3;
    bronto.add(corps, maille(new T.TubeGeometry(courbeCou, 12, 0.42, 7, false), m), tete, queue);
    ajouterYeux(bronto, 4.55, 7.5, 0.3, 0.12);
    const pattes = ajouterPattes(bronto, m, [[1.4, 0.7], [1.4, -0.7], [-1.4, 0.7], [-1.4, -0.7]], 2.4, 0.5);
    bronto.scale.setScalar(taille);
    return { groupe: bronto, pattes, phases: [0, Math.PI, Math.PI, 0], amplitude: 0.35, foulee: 3.2 * taille };
  };

  const creerTricera = (taille) => {
    const tricera = new T.Group();
    const m = mat('tricera');
    const corps = maille(new T.SphereGeometry(1, 9, 7), m, 0, 2.0, 0);
    corps.scale.set(1.9, 1.1, 1.15);
    const tete = maille(new T.BoxGeometry(1.3, 0.95, 0.95), m, 2.0, 2.05, 0);
    tete.rotation.z = -0.15;
    const bec = maille(new T.ConeGeometry(0.3, 0.6, 6), m, 2.85, 1.85, 0);
    bec.rotation.z = -Math.PI / 2;
    const queue = maille(new T.ConeGeometry(0.55, 2.2, 7), m, -2.4, 1.8, 0);
    queue.rotation.z = Math.PI / 2 + 0.2;
    // Collerette : demi-disque derrière la tête
    const collerette = new T.Group();
    const disque = maille(new T.CircleGeometry(1.25, 10, 0, Math.PI), mat('collerette', { side: T.DoubleSide }));
    disque.rotation.y = Math.PI / 2;
    collerette.add(disque);
    collerette.position.set(1.45, 2.4, 0);
    collerette.rotation.z = 0.35;
    tricera.add(corps, tete, bec, queue, collerette);
    // Trois cornes
    [-1, 1].forEach((cote) => {
      const corne = maille(new T.ConeGeometry(0.13, 1.0, 6), mat('corne'), 2.25, 2.75, cote * 0.3);
      corne.rotation.z = -0.9;
      tricera.add(corne);
    });
    const petiteCorne = maille(new T.ConeGeometry(0.1, 0.45, 5), mat('corne'), 2.6, 2.45, 0);
    petiteCorne.rotation.z = -0.6;
    tricera.add(petiteCorne);
    ajouterYeux(tricera, 2.35, 2.3, 0.48, 0.12);
    const pattes = ajouterPattes(tricera, m, [[1.0, 0.65], [1.0, -0.65], [-1.0, 0.65], [-1.0, -0.65]], 1.4, 0.38);
    tricera.scale.setScalar(taille);
    return { groupe: tricera, pattes, phases: [0, Math.PI, Math.PI, 0], amplitude: 0.45, foulee: 1.9 * taille };
  };

  const creerPtero = () => {
    const ptero = new T.Group();
    const m = mat('ptero');
    const corps = maille(new T.SphereGeometry(1, 7, 5), m);
    corps.scale.set(1.1, 0.35, 0.35);
    const bec = maille(new T.ConeGeometry(0.18, 1.3, 5), m, -1.5, 0.15, 0);
    bec.rotation.z = Math.PI / 2;
    const crete = maille(new T.ConeGeometry(0.12, 0.9, 4), m, -0.8, 0.5, 0);
    crete.rotation.z = -1.9;
    ptero.add(corps, bec, crete);
    // Ailes : triangles qui pivotent le long du corps
    const ailes = [-1, 1].map((cote) => {
      const geometrie = new T.BufferGeometry();
      // Aile en forme de voile : deux triangles (bord avant → pointe → bord arrière)
      geometrie.setAttribute('position', new T.BufferAttribute(new Float32Array([
        0.9, 0, 0, -0.1, 0, cote * 2.8, -1.0, 0, 0,
        -1.0, 0, 0, -0.1, 0, cote * 2.8, -0.9, 0, cote * 1.0,
      ]), 3));
      geometrie.computeVertexNormals();
      const aile = new T.Mesh(geometrie, mat('ptero-aile', { color: pal.ptero, emissive: pal.ptero, emissiveIntensity: 0.25, side: T.DoubleSide }));
      aile.castShadow = true;
      ptero.add(aile);
      return { aile, cote };
    });
    ptero.scale.setScalar(1.1);
    ptero.rotation.y = 0.6; // vu de trois quarts : on voit les ailes déployées
    return { groupe: ptero, ailes };
  };

  // Les dinosaures marchent vers la droite, chacun dans sa « voie » (profondeur z)
  const bronto = { ...creerBronto(0.8), z: -10, vitesse: 1.6 };
  const dinos = [
    bronto,
    { ...creerBronto(0.36), z: -8.2, vitesse: 1.6, suit: bronto, ecart: 6.5 }, // le bébé suit sa mère
    { ...creerTricera(1.3), z: -4, vitesse: 2.4 },
    { ...creerRex(), z: 1, vitesse: 3.2 },
  ];
  dinos.forEach((dino) => {
    dino.groupe.position.z = dino.z;
    scene.add(dino.groupe);
  });
  const pteros = Array.from({ length: 3 }, () => {
    const ptero = { ...creerPtero(), vitesse: rand(5, 8), battement: rand(0, 6) };
    scene.add(ptero.groupe);
    return ptero;
  });

  /* ---------- Cadrage : l'horizon et les dinosaures restent en bas de l'accueil ---------- */
  let W = 0;
  let H = 0;
  let pixelsParRadian = 1;
  let yHorizon = 0;

  /** Demi-largeur visible (en unités 3D) à une profondeur donnée. */
  const demiLargeur = (z) => ((W / 2) / pixelsParRadian) * (CAMERA_Z - z) + 10;
  /** Hauteur 3D pour qu'un objet à la profondeur z apparaisse à la hauteur yEcran (en px depuis le haut). */
  const hauteurPourEcran = (yEcran, z) => CAMERA_HAUTEUR + ((yHorizon - yEcran) / pixelsParRadian) * (CAMERA_Z - z);

  const placerPtero = (ptero, depuisLaDroite) => {
    const z = rand(-30, -14);
    ptero.groupe.position.set(depuisLaDroite ? demiLargeur(z) : rand(-demiLargeur(z), demiLargeur(z)), hauteurPourEcran(H * rand(0.08, 0.2), z), z);
  };
  const placerNuage = (nuage, depuisLaDroite) => {
    const z = rand(-100, -70);
    nuage.position.set(depuisLaDroite ? demiLargeur(z) + 15 : rand(-demiLargeur(z), demiLargeur(z)), hauteurPourEcran(H * nuage.userData.hauteurEcran, z), z);
  };

  // Ciel dessiné dans une texture : dégradé, soleil (ou lune) et étoiles
  const peindreCiel = () => {
    const echelle = Math.min(1, 900 / Math.max(W, 1));
    cielCanvas.width = Math.max(2, Math.round(W * echelle));
    cielCanvas.height = Math.max(2, Math.round(H * echelle));
    const c = cielCanvas.getContext('2d');
    const w = cielCanvas.width;
    const h = cielCanvas.height;
    const horizon = Math.min(1, yHorizon / H);
    const degrade = c.createLinearGradient(0, 0, 0, h);
    degrade.addColorStop(0, pal.ciel[0]);
    degrade.addColorStop(horizon * 0.6, pal.ciel[1]);
    degrade.addColorStop(horizon, pal.ciel[2]);
    degrade.addColorStop(1, pal.ciel[2]);
    c.fillStyle = degrade;
    c.fillRect(0, 0, w, h);

    if (pal.etoiles) {
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 140; i++) {
        c.globalAlpha = rand(0.25, 0.9);
        c.fillRect(rand(0, w), rand(0, h * horizon * 0.9), rand(0.6, 1.6), rand(0.6, 1.6));
      }
      c.globalAlpha = 1;
    }

    const petit = W < 600;
    const sx = w * (petit ? 0.86 : 0.47);
    const sy = h * (petit ? 0.12 : 0.15);
    const r = Math.max(26, Math.min(W, H) * 0.06) * echelle;
    const halo = c.createRadialGradient(sx, sy, r * 0.8, sx, sy, r * 3.2);
    halo.addColorStop(0, pal.halo);
    halo.addColorStop(1, pal.halo.replace(/[\d.]+\)$/, '0)'));
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h);
    c.fillStyle = pal.astre;
    c.beginPath();
    c.arc(sx, sy, r, 0, Math.PI * 2);
    c.fill();
    if (pal.etoiles) { // cratères de la lune
      c.fillStyle = 'rgba(180, 160, 120, 0.35)';
      [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.4, 0.12]].forEach(([dx, dy, rr]) => {
        c.beginPath();
        c.arc(sx + dx * r, sy + dy * r, rr * r, 0, Math.PI * 2);
        c.fill();
      });
    }
    cielTexture.needsUpdate = true;
  };

  const cadrer = () => {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    renderer.setSize(W, H, false);

    // Taille voulue du T-Rex à l'écran, puis position de l'horizon pour que ses pieds touchent le bas
    const petit = W < 600;
    const tailleRex = Math.min(165, Math.max(80, W * 0.105));
    const distanceRex = CAMERA_Z - dinos[3].z;
    pixelsParRadian = tailleRex / (4.9 / distanceRex);
    yHorizon = Math.max(H * 0.45, H - (petit ? 26 : 44) - pixelsParRadian * (CAMERA_HAUTEUR / distanceRex));

    // « Décentrement » de l'objectif : l'horizon est placé bas sans incliner la caméra
    const pleineHauteur = 2 * yHorizon;
    camera.fov = T.MathUtils.radToDeg(2 * Math.atan(yHorizon / pixelsParRadian));
    camera.aspect = W / pleineHauteur;
    camera.setViewOffset(W, pleineHauteur, 0, 0, W, H);
    camera.updateProjectionMatrix();

    peindreCiel();
    return true;
  };

  /* ---------- Animation ---------- */
  const souris = { x: 0, y: 0 };
  let temps = 0;

  const animer = (dt) => {
    temps += dt;

    dinos.forEach((dino) => {
      if (dino.suit) {
        dino.groupe.position.x = dino.suit.groupe.position.x - dino.ecart;
      } else {
        dino.groupe.position.x += dino.vitesse * dt;
        const limite = demiLargeur(dino.z);
        if (dino.groupe.position.x > limite + 8) dino.groupe.position.x = -limite - rand(0, 15);
      }
      // Les pattes suivent la distance parcourue : les pieds ne « glissent » pas
      const pas = (dino.groupe.position.x / dino.foulee) * Math.PI * 2;
      dino.pattes.forEach((patte, i) => { patte.rotation.z = Math.sin(pas + dino.phases[i]) * dino.amplitude; });
      dino.groupe.position.y = Math.abs(Math.sin(pas)) * 0.08;
    });

    pteros.forEach((ptero) => {
      ptero.groupe.position.x -= ptero.vitesse * dt;
      if (ptero.groupe.position.x < -demiLargeur(ptero.groupe.position.z)) placerPtero(ptero, true);
      const angle = 0.1 + Math.sin(temps * 6 + ptero.battement) * 0.4;
      ptero.ailes.forEach(({ aile, cote }) => { aile.rotation.x = -cote * angle; });
      ptero.groupe.rotation.x = Math.sin(temps * 1.5 + ptero.battement) * 0.08;
    });

    nuages.forEach((nuage) => {
      nuage.position.x -= nuage.userData.vitesse * dt;
      if (nuage.position.x < -demiLargeur(nuage.position.z) - 15) placerNuage(nuage, true);
    });

    // Léger effet de profondeur quand la souris bouge
    camera.position.x += (souris.x * 1.6 - camera.position.x) * 0.05;
    camera.position.y += (CAMERA_HAUTEUR + souris.y * 0.35 - camera.position.y) * 0.05;
  };

  const rendre = () => renderer.render(scene, camera);

  /* ---------- Démarrage, pause, thème, redimensionnement ---------- */
  let idAnimation = null;
  let dernier = 0;
  let heroVisible = true;
  let pret = false;
  let enPause = reducedMotion; // animations désactivées dans Windows → on démarre en pause

  const preparer = () => {
    if (pret || !cadrer()) return pret;
    dinos.forEach((dino) => {
      if (!dino.suit) { const limite = demiLargeur(dino.z); dino.groupe.position.x = rand(-limite * 0.7, limite * 0.7); }
    });
    pteros.forEach((ptero) => placerPtero(ptero, false));
    nuages.forEach((nuage) => placerNuage(nuage, false));
    animer(0);
    pret = true;
    return true;
  };

  const boucle = (maintenant) => {
    const dt = Math.min(Math.max((maintenant - dernier) / 1000, 0), 0.05);
    dernier = maintenant;
    animer(dt);
    rendre();
    idAnimation = requestAnimationFrame(boucle);
  };
  const demarrer = () => {
    if (enPause || !heroVisible || idAnimation || !preparer()) return;
    dernier = performance.now();
    idAnimation = requestAnimationFrame(boucle);
  };
  const arreter = () => {
    if (idAnimation) cancelAnimationFrame(idAnimation);
    idAnimation = null;
  };

  const majBouton = () => {
    toggle.innerHTML = enPause
      ? '<i class="fa-solid fa-play"></i> <span>Animer</span>'
      : '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
    toggle.setAttribute('aria-label', enPause ? 'Lancer l’animation des dinosaures' : 'Mettre en pause l’animation des dinosaures');
  };
  toggle.addEventListener('click', () => {
    enPause = !enPause;
    majBouton();
    if (enPause) arreter(); else demarrer();
  });
  majBouton();

  window.addEventListener('mousemove', (e) => {
    souris.x = e.clientX / window.innerWidth - 0.5;
    souris.y = 0.5 - e.clientY / window.innerHeight;
  }, { passive: true });

  let delai;
  window.addEventListener('resize', () => {
    clearTimeout(delai);
    delai = setTimeout(() => { if (cadrer() && pret) rendre(); }, 150);
  });

  new MutationObserver(() => {
    pal = root.getAttribute('data-theme') === 'dark' ? PALETTES.dark : PALETTES.light;
    Object.keys(materiaux).forEach((role) => materiaux[role].color.set(pal[role] || pal.ptero));
    if (materiaux['ptero-aile']) materiaux['ptero-aile'].emissive.set(pal.ptero);
    materiauNuage.color.set(pal.nuage);
    materiauNuage.emissive.set(pal.nuage);
    materiauNuage.opacity = pal.nuageOpacite;
    lumiereCiel.color.set(pal.lumiereCiel);
    lumiereCiel.groundColor.set(pal.lumiereSol);
    lumiereCiel.intensity = pal.forceCiel;
    astre.color.set(pal.lumiereAstre);
    astre.intensity = pal.forceAstre;
    scene.fog.color.set(pal.ciel[2]);
    colorerSol();
    if (W && H) peindreCiel();
    if (pret && !idAnimation) rendre();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // L'animation tourne seulement quand l'accueil est visible
  new IntersectionObserver(([entree]) => {
    heroVisible = entree.isIntersecting;
    if (heroVisible && preparer() && !idAnimation) rendre();
    if (heroVisible) demarrer(); else arreter();
  }).observe(hero);

  if (preparer()) rendre(); // image fixe tout de suite (même en pause)
  return true;
};
