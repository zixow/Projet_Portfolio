/* =========================================================
   Accueil : mon bureau en 3D (Three.js r128)
   ---------------------------------------------------------
   Inspiré de ma chambre : mur en tasseaux de chêne (panneau
   acoustique) à côté d'un mur crème, deux bureaux en chêne clair
   et métal gris, étagère avec ma collection de figurines, écran
   qui affiche le code de mon application Caillou Tour, console,
   manettes, PC aux ventilateurs RGB et ventilateur sur pied.
   Sur le mur crème : fenêtre sur le lagon, cadres cliquables (mon CV,
   mes projets, ma veille), horloge à l'heure, meuble bas et guirlande.
   - Textures (bois, feutre, plâtre, parquet, écran) dessinées par le code
   - Thème clair : lumière du jour ; thème sombre : la chambre la nuit,
     éclairée par l'écran et les rubans LED
   Si Three.js ou WebGL ne sont pas disponibles, la fonction renvoie
   false et accueil.js affiche la version 2D (setup2d.js).
   ========================================================= */

window.demarrerSetup3D = function ({ canvas, hero, toggle, root, reducedMotion }) {
  if (!window.THREE) return false;
  const T = window.THREE;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true });
  } catch (erreur) {
    return false; // WebGL indisponible : on garde la version 2D
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = T.sRGBEncoding;           // couleurs correctes à l'écran
  renderer.toneMapping = T.ACESFilmicToneMapping;     // rendu « photo » des lumières
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;       // ombres douces

  // Hasard « reproductible » : la pièce est la même à chaque visite
  let graine = 2026;
  const hasard = () => {
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = (min, max) => min + hasard() * (max - min);
  /** Couleur CSS → couleur « linéaire » utilisée par les calculs de lumière. */
  const couleur = (hex) => new T.Color(hex).convertSRGBToLinear();

  /* ---------- Ambiances : journée (thème clair) ou nuit (thème sombre) ---------- */
  const AMBIANCES = {
    light: {
      nuit: false, exposition: 0.9,
      ciel: '#dfe6ff', sol: '#a48a70', forceCiel: 0.42,       // lumière diffuse, un peu fraîche dans l'ombre
      fenetre: '#ffc68a', forceFenetre: 5.2,                   // soleil doré de fin d'après-midi par la fenêtre
      plafonnier: '#ffe2bd', forcePlafonnier: 0.2,
      forceLed: 0.35, forceEcran: 0.25, lueur: 0.22, poussiere: 0.85, neon: 0.6, forceNeon: 0,
      guirlande: 0.3, forceGuirlande: 0, forceSpot: 1.3, vue: '#ffd9b0', forceVue: 0.55,
    },
    dark: {
      nuit: true, exposition: 1.15,
      ciel: '#3b2f66', sol: '#120c18', forceCiel: 0.22,
      fenetre: '#8fa2ff', forceFenetre: 0.55,                  // clair de lune par la même fenêtre
      plafonnier: '#ffb27a', forcePlafonnier: 0,
      forceLed: 1.6, forceEcran: 0.9, lueur: 0.85, poussiere: 0, neon: 1, forceNeon: 0.9,
      guirlande: 0.95, forceGuirlande: 0.5, forceSpot: 0.55, vue: '#8fa2ff', forceVue: 0.2,
    },
  };
  let amb = root.getAttribute('data-theme') === 'dark' ? AMBIANCES.dark : AMBIANCES.light;

  /* ---------- Textures dessinées par le code ---------- */
  const creerToile = (largeur, hauteur) => {
    const toile = document.createElement('canvas');
    toile.width = largeur;
    toile.height = hauteur;
    return [toile, toile.getContext('2d')];
  };
  const versTexture = (toile, { repetition = true, couleurs = true } = {}) => {
    const t = new T.CanvasTexture(toile);
    if (couleurs) t.encoding = T.sRGBEncoding;
    if (repetition) t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  };
  /** Ajoute un grain fin (plâtre, feutre, bois) : chaque pixel est un peu plus clair ou plus foncé. */
  const grainer = (c, largeur, hauteur, force) => {
    const image = c.getImageData(0, 0, largeur, hauteur);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = (hasard() - 0.5) * force;
      image.data[i] += n;
      image.data[i + 1] += n;
      image.data[i + 2] += n;
    }
    c.putImageData(image, 0, 0);
  };

  /**
   * Bois de chêne : fond doré et veines fines qui ondulent dans le sens du fil.
   * vertical = true pour les tasseaux (fil vertical), false pour les plateaux.
   * Les ondulations font un nombre entier de vagues : la texture se répète sans raccord visible.
   */
  const dessinerBois = (largeur, hauteur, teintes, vertical, nbVeines) => {
    const [toile, c] = creerToile(largeur, hauteur);
    c.fillStyle = teintes.fond;
    c.fillRect(0, 0, largeur, hauteur);
    const long = vertical ? hauteur : largeur;
    const travers = vertical ? largeur : hauteur;
    for (let i = 0; i < nbVeines; i++) {
      const position = rand(0, travers);
      const amplitude = rand(0.5, travers / 14);
      const vagues = Math.ceil(rand(1, 4));
      const phase = rand(0, Math.PI * 2);
      c.strokeStyle = hasard() < 0.65 ? teintes.veine : teintes.clair;
      c.globalAlpha = rand(0.07, 0.32);
      c.lineWidth = rand(0.4, 2.4);
      c.beginPath();
      for (let s = 0; s <= long; s += 6) {
        const d = position + Math.sin((s / long) * Math.PI * 2 * vagues + phase) * amplitude;
        if (vertical) c.lineTo(d, s); else c.lineTo(s, d);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
    grainer(c, largeur, hauteur, 12);
    return toile;
  };

  const boisLatte = versTexture(dessinerBois(64, 1024, { fond: '#c99459', veine: '#7d4f27', clair: '#e9bd84' }, true, 16));
  const boisBureau = versTexture(dessinerBois(1024, 256, { fond: '#cdae80', veine: '#9a7748', clair: '#e6cfa9' }, false, 90));
  const boisEtagere = versTexture(dessinerBois(1024, 128, { fond: '#cfb184', veine: '#9a7748', clair: '#e6cfa9' }, false, 50));

  const feutre = (() => {
    const [toile, c] = creerToile(128, 128);
    c.fillStyle = '#2b2725';
    c.fillRect(0, 0, 128, 128);
    grainer(c, 128, 128, 16);
    return versTexture(toile);
  })();

  // Plâtre du mur et du plafond : crème avec de légères nuances
  const platre = (() => {
    const [toile, c] = creerToile(256, 256);
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 140; i++) {
      c.fillStyle = `rgba(${hasard() < 0.5 ? '120,100,80' : '255,255,255'},${rand(0.01, 0.035)})`;
      c.beginPath();
      c.arc(rand(0, 256), rand(0, 256), rand(8, 40), 0, Math.PI * 2);
      c.fill();
    }
    grainer(c, 256, 256, 7);
    return versTexture(toile);
  })();

  // Parquet : lames de chêne grisé, joints sombres
  const parquet = (() => {
    const [toile, c] = creerToile(1024, 1024);
    const lames = 8;
    for (let i = 0; i < lames; i++) {
      const x = (i * 1024) / lames;
      let y = rand(-400, 0);
      while (y < 1024) {
        const longueur = rand(380, 700);
        const ton = rand(-14, 14);
        c.fillStyle = `rgb(${168 + ton},${140 + ton},${112 + ton})`;
        c.fillRect(x, y, 1024 / lames, longueur);
        c.strokeStyle = 'rgba(70,50,35,0.18)';
        for (let v = 0; v < 9; v++) {
          c.lineWidth = rand(0.5, 1.6);
          c.beginPath();
          const px = x + rand(4, 1024 / lames - 4);
          c.moveTo(px, y);
          c.bezierCurveTo(px + rand(-6, 6), y + longueur / 3, px + rand(-6, 6), y + (2 * longueur) / 3, px + rand(-3, 3), y + longueur);
          c.stroke();
        }
        c.fillStyle = 'rgba(50,35,25,0.55)';
        c.fillRect(x, y + longueur - 2, 1024 / lames, 2);
        y += longueur;
      }
      c.fillStyle = 'rgba(50,35,25,0.55)';
      c.fillRect(x, 0, 2, 1024);
    }
    grainer(c, 1024, 1024, 10);
    const t = versTexture(toile);
    t.repeat.set(12, 6);
    return t;
  })();

  // Lueur douce (rubans LED, ventilateurs RGB, écran)
  const textureLueur = (() => {
    const [toile, c] = creerToile(64, 64);
    const degrade = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    degrade.addColorStop(0, 'rgba(255,255,255,1)');
    degrade.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    degrade.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = degrade;
    c.fillRect(0, 0, 64, 64);
    return versTexture(toile, { repetition: false });
  })();

  /* ---------- Scène, caméra, lumières ---------- */
  const scene = new T.Scene();
  scene.background = couleur('#2a2230');
  const camera = new T.PerspectiveCamera(40, 1, 0.05, 60);

  // Reflets doux sur les plastiques et le métal : une petite pièce lumineuse sert d'environnement
  const pmrem = new T.PMREMGenerator(renderer);
  const creerEnvironnement = (nuit) => {
    const piece = new T.Scene();
    piece.add(new T.Mesh(new T.BoxGeometry(10, 5, 10), new T.MeshBasicMaterial({ color: nuit ? 0x120d18 : 0xbdb2a2, side: T.BackSide })));
    const panneau = (largeur, hauteur, position, rotationY, teinte, force) => {
      const p = new T.Mesh(new T.PlaneGeometry(largeur, hauteur), new T.MeshBasicMaterial({ color: new T.Color(teinte).multiplyScalar(force), side: T.DoubleSide }));
      p.position.copy(position);
      p.rotation.y = rotationY;
      piece.add(p);
    };
    if (nuit) {
      panneau(4, 0.3, new T.Vector3(0, 1.2, -4.9), 0, 0xa855f7, 3);
      panneau(3, 0.3, new T.Vector3(-4.9, 1.6, 0), Math.PI / 2, 0x22d3ee, 2);
    } else {
      panneau(3, 2.2, new T.Vector3(-4.9, 1.6, 0.5), Math.PI / 2, 0xfff1dc, 5); // la fenêtre
      panneau(2.5, 2.5, new T.Vector3(0, 2.45, 0), 0, 0xffffff, 1.5);
    }
    const resultat = pmrem.fromScene(piece, 0.03);
    piece.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    return resultat.texture;
  };
  const environnements = { jour: creerEnvironnement(false), nuit: creerEnvironnement(true) };

  const lumiereAmbiante = new T.HemisphereLight(couleur(amb.ciel), couleur(amb.sol), amb.forceCiel);
  scene.add(lumiereAmbiante);

  // Lumière de la fenêtre (à gauche, hors du cadre) : elle projette les ombres de l'étagère sur les tasseaux
  const fenetre = new T.DirectionalLight(couleur(amb.fenetre), amb.forceFenetre);
  fenetre.position.set(-2.6, 3.1, 3.4);
  fenetre.target.position.set(1.3, 0.9, 0.1);
  fenetre.castShadow = true;
  fenetre.shadow.mapSize.set(2048, 2048);
  Object.assign(fenetre.shadow.camera, { left: -4.2, right: 4.2, top: 3, bottom: -3, near: 0.3, far: 14 });
  fenetre.shadow.bias = -0.0005;
  fenetre.shadow.normalBias = 0.02;
  fenetre.shadow.camera.updateProjectionMatrix();
  scene.add(fenetre, fenetre.target);

  // Repère « vu depuis le soleil » : direction des rayons, et deux axes perpendiculaires (droite, haut)
  const rayon = new T.Vector3().subVectors(fenetre.target.position, fenetre.position).normalize();
  const axeDroite = new T.Vector3().crossVectors(rayon, new T.Vector3(0, 1, 0)).normalize();
  const axeHaut = new T.Vector3().crossVectors(axeDroite, rayon);

  /*
   * Fenêtre : le soleil entre par une fenêtre à deux battants, à gauche, hors du cadre.
   * Un écran invisible percé de quatre carreaux est placé devant la lumière : seule la forme
   * de la fenêtre passe, et elle se dessine en lumière dorée sur les tasseaux, le bureau et le sol.
   */
  (() => {
    const forme = new T.Shape();
    forme.moveTo(-9, -9);
    forme.lineTo(9, -9);
    forme.lineTo(9, 9);
    forme.lineTo(-9, 9);
    forme.lineTo(-9, -9);
    const carreau = (d0, d1, h0, h1) => {
      const trou = new T.Path();
      trou.moveTo(d0, h0);
      trou.lineTo(d0, h1);
      trou.lineTo(d1, h1);
      trou.lineTo(d1, h0);
      trou.lineTo(d0, h0);
      forme.holes.push(trou);
    };
    const F = { gauche: -0.95, droite: 1.05, bas: -1.5, haut: 1.15, montant: 0.05, traverse: 0.35, demi: 0.035 };
    carreau(F.gauche, F.montant - F.demi, F.traverse + F.demi, F.haut);
    carreau(F.montant + F.demi, F.droite, F.traverse + F.demi, F.haut);
    carreau(F.gauche, F.montant - F.demi, F.bas, F.traverse - F.demi);
    carreau(F.montant + F.demi, F.droite, F.bas, F.traverse - F.demi);
    // Invisible à l'écran (n'écrit ni couleur ni profondeur) mais il projette bien son ombre
    const ecran = new T.Mesh(new T.ShapeGeometry(forme), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: T.DoubleSide }));
    ecran.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(axeDroite, axeHaut, rayon.clone().negate()));
    ecran.position.copy(fenetre.target.position).addScaledVector(rayon, -4.3);
    ecran.castShadow = true;
    scene.add(ecran);
  })();

  const plafonnier = new T.PointLight(couleur(amb.plafonnier), amb.forcePlafonnier, 9, 2);
  plafonnier.position.set(1.3, 2.4, 2.2);
  scene.add(plafonnier);

  /* ---------- Matériaux ---------- */
  const materiauMur = new T.MeshStandardMaterial({ color: couleur('#eee4d3'), map: platre, roughness: 0.95 });
  const materiauPlafond = new T.MeshStandardMaterial({ color: couleur('#f3ece1'), map: platre, roughness: 1 });
  const materiauParquet = new T.MeshStandardMaterial({ map: parquet, roughness: 0.62 });
  const materiauLatte = new T.MeshStandardMaterial({ map: boisLatte, roughness: 0.58 });
  // Chaque tasseau montre un autre morceau de bois : on décale la texture selon sa position
  materiauLatte.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
      #ifdef USE_INSTANCING
        vUv.y += instanceMatrix[3][0] * 2.37;
      #endif`);
  };
  const materiauFeutre = new T.MeshStandardMaterial({ map: feutre, roughness: 1 });
  const materiauBureau = new T.MeshStandardMaterial({ map: boisBureau, roughness: 0.5 });
  const materiauEtagere = new T.MeshStandardMaterial({ map: boisEtagere, roughness: 0.55 });
  const materiauMetal = new T.MeshStandardMaterial({ color: couleur('#3c3c40'), roughness: 0.42, metalness: 0.6 });
  const materiauPanneauGris = new T.MeshStandardMaterial({ color: couleur('#47474b'), roughness: 0.7 });
  const plastique = (teinte, rugosite = 0.38) => new T.MeshStandardMaterial({ color: couleur(teinte), roughness: rugosite });
  const plastiqueNoir = plastique('#141416', 0.32);
  const plastiqueBlanc = plastique('#f3f3f1', 0.3);
  const socleNoir = plastique('#0e0e10', 0.18);

  /** Boîte qui projette et reçoit les ombres. */
  const boite = (l, h, p, materiau) => {
    const m = new T.Mesh(new T.BoxGeometry(l, h, p), materiau);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const ombre = (objet) => objet.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  /* ---------- La pièce : murs crème, plafond, parquet ---------- */
  const PLAFOND = 2.5;
  const murFond = new T.Mesh(new T.PlaneGeometry(20, PLAFOND), materiauMur);
  murFond.position.set(0.5, PLAFOND / 2, 0);
  const murGauche = new T.Mesh(new T.PlaneGeometry(10, PLAFOND), materiauMur);
  murGauche.rotation.y = Math.PI / 2;
  murGauche.position.set(-8, PLAFOND / 2, 5);
  const murDroit = new T.Mesh(new T.PlaneGeometry(10, PLAFOND), materiauMur);
  murDroit.rotation.y = -Math.PI / 2;
  murDroit.position.set(4.4, PLAFOND / 2, 5);
  const plafond = new T.Mesh(new T.PlaneGeometry(20, 10), materiauPlafond);
  plafond.rotation.x = Math.PI / 2;
  plafond.position.set(0.5, PLAFOND, 5);
  const sol = new T.Mesh(new T.PlaneGeometry(20, 10), materiauParquet);
  sol.rotation.x = -Math.PI / 2;
  sol.position.set(0.5, 0, 5);
  [murFond, murGauche, murDroit, plafond, sol].forEach((m) => { m.receiveShadow = true; scene.add(m); });
  platre.repeat.set(5, 1);

  // Plinthes blanches au bas des murs (sauf derrière le panneau de tasseaux)
  const materiauPlinthe = plastique('#f6f1e8', 0.6);
  [[-9.5, 0.03], [3.52, 4.4]].forEach(([x0, x1]) => {
    const plinthe = boite(x1 - x0, 0.08, 0.012, materiauPlinthe);
    plinthe.position.set((x0 + x1) / 2, 0.04, 0.006);
    scene.add(plinthe);
  });

  /* ---------- Mur en tasseaux de chêne sur feutre noir (panneau acoustique) ---------- */
  const PANNEAU = { x0: 0.05, x1: 3.5, haut: 2.28 };
  const LATTE = { largeur: 0.027, ecart: 0.013, epaisseur: 0.021 };
  const pas = LATTE.largeur + LATTE.ecart;
  const nbLattes = Math.floor((PANNEAU.x1 - PANNEAU.x0) / pas);
  const fondFeutre = new T.Mesh(new T.PlaneGeometry(PANNEAU.x1 - PANNEAU.x0, PANNEAU.haut), materiauFeutre);
  fondFeutre.position.set((PANNEAU.x0 + PANNEAU.x1) / 2, PANNEAU.haut / 2, 0.003);
  fondFeutre.receiveShadow = true;
  scene.add(fondFeutre);
  feutre.repeat.set(30, 18);
  const lattes = new T.InstancedMesh(new T.BoxGeometry(LATTE.largeur, PANNEAU.haut, LATTE.epaisseur), materiauLatte, nbLattes);
  const matrice = new T.Matrix4();
  const nuance = new T.Color();
  for (let i = 0; i < nbLattes; i++) {
    matrice.makeTranslation(PANNEAU.x0 + LATTE.ecart + LATTE.largeur / 2 + i * pas, PANNEAU.haut / 2, 0.004 + LATTE.epaisseur / 2);
    lattes.setMatrixAt(i, matrice);
    lattes.setColorAt(i, nuance.setScalar(rand(0.9, 1.06))); // chaque tasseau a sa nuance
  }
  lattes.castShadow = true;
  lattes.receiveShadow = true;
  scene.add(lattes);

  /* ---------- Deux bureaux : plateau en chêne clair, structure en métal gris ---------- */
  const HAUTEUR_BUREAU = 0.75;
  const creerBureau = (x0, x1, profondeur) => {
    const largeur = x1 - x0;
    const plateau = boite(largeur, 0.025, profondeur, materiauBureau);
    plateau.position.set((x0 + x1) / 2, HAUTEUR_BUREAU - 0.0125, 0.02 + profondeur / 2);
    scene.add(plateau);
    const yPied = (HAUTEUR_BUREAU - 0.025) / 2;
    [[x0 + 0.04, 0.06], [x1 - 0.04, 0.06], [x0 + 0.04, profondeur - 0.02], [x1 - 0.04, profondeur - 0.02]].forEach(([x, z]) => {
      const pied = boite(0.04, HAUTEUR_BUREAU - 0.025, 0.04, materiauMetal);
      pied.position.set(x, yPied, z);
      scene.add(pied);
    });
    // Ceinture sous le plateau et barre basse à l'arrière
    const avant = boite(largeur - 0.08, 0.05, 0.02, materiauMetal);
    avant.position.set((x0 + x1) / 2, HAUTEUR_BUREAU - 0.05, profondeur - 0.02);
    const arriere = boite(largeur - 0.08, 0.04, 0.02, materiauMetal);
    arriere.position.set((x0 + x1) / 2, 0.2, 0.06);
    scene.add(avant, arriere);
    [x0 + 0.04, x1 - 0.04].forEach((x) => {
      const cote = boite(0.02, 0.04, profondeur - 0.08, materiauMetal);
      cote.position.set(x, 0.12, 0.02 + profondeur / 2);
      scene.add(cote);
    });
  };
  creerBureau(-0.25, 1.15, 0.64);
  creerBureau(1.15, 2.6, 0.64);

  // Ombre douce sur le parquet sous les bureaux (la lumière y arrive moins)
  (() => {
    const [toile, c] = creerToile(128, 64);
    const degrade = c.createRadialGradient(64, 32, 4, 64, 32, 64);
    degrade.addColorStop(0, 'rgba(30, 20, 12, 0.55)');
    degrade.addColorStop(1, 'rgba(30, 20, 12, 0)');
    c.fillStyle = degrade;
    c.fillRect(0, 0, 128, 64);
    const tache = new T.Mesh(new T.PlaneGeometry(3.4, 1.1), new T.MeshBasicMaterial({ map: versTexture(toile, { repetition: false }), transparent: true, depthWrite: false }));
    tache.rotation.x = -Math.PI / 2;
    tache.position.set(1.17, 0.002, 0.36);
    scene.add(tache);
  })();

  /* ---------- Étagère posée sur le bureau de droite ---------- */
  const ETAGERE = { x0: 1.22, x1: 2.52, z0: 0.03, z1: 0.29, n1: 1.06, n2: 1.37 };
  (() => {
    const largeur = ETAGERE.x1 - ETAGERE.x0;
    const profondeur = ETAGERE.z1 - ETAGERE.z0;
    [ETAGERE.n1, ETAGERE.n2].forEach((y) => {
      const tablette = boite(largeur, 0.018, profondeur, materiauEtagere);
      tablette.position.set((ETAGERE.x0 + ETAGERE.x1) / 2, y - 0.009, (ETAGERE.z0 + ETAGERE.z1) / 2);
      scene.add(tablette);
    });
    // Montants en métal aux quatre coins
    [ETAGERE.x0 + 0.012, ETAGERE.x1 - 0.012].forEach((x) => [ETAGERE.z0 + 0.012, ETAGERE.z1 - 0.012].forEach((z) => {
      const montant = boite(0.025, 0.72, 0.025, materiauMetal);
      montant.position.set(x, HAUTEUR_BUREAU + 0.36, z);
      scene.add(montant);
    }));
    // Panneaux gris au fond de chaque niveau
    [[ETAGERE.n1 + 0.004, 0.17], [ETAGERE.n2 + 0.004, 0.09]].forEach(([y, h]) => {
      const fond = boite(largeur - 0.04, h, 0.01, materiauPanneauGris);
      fond.position.set((ETAGERE.x0 + ETAGERE.x1) / 2, y + h / 2, ETAGERE.z0 + 0.012);
      scene.add(fond);
    });
    // Petites séparations en bois
    [[1.62, ETAGERE.n1, 0.15], [2.13, ETAGERE.n1, 0.15], [1.66, ETAGERE.n2, 0.13]].forEach(([x, y, h]) => {
      const separation = boite(0.016, h, profondeur - 0.04, materiauEtagere);
      separation.position.set(x, y + h / 2, (ETAGERE.z0 + ETAGERE.z1) / 2 - 0.01);
      scene.add(separation);
    });
  })();

  /* ---------- Figurines de collection (formes génériques) ---------- */
  /**
   * f = { h: hauteur (m), peau, haut, jupe, jambes, cheveux, longs: 0 à 1, couettes, ailes, ruban, large }
   * Socle noir, jambes, jupe évasée, buste, bras, tête et cheveux : assez pour reconnaître une figurine.
   */
  const creerFigurine = (f) => {
    const g = new T.Group();
    const k = f.h / 0.24;
    const mPeau = plastique(f.peau || '#f6dcc8', 0.5);
    const mHaut = plastique(f.haut, 0.45);
    const mJupe = plastique(f.jupe || f.haut, 0.45);
    const mJambes = plastique(f.jambes || f.peau || '#f6dcc8', 0.45);
    const mCheveux = plastique(f.cheveux, 0.35);
    const ajouter = (geo, materiau, x, y, z) => {
      const m = new T.Mesh(geo, materiau);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    ajouter(new T.CylinderGeometry(0.044 * k, 0.047 * k, 0.008, 28), socleNoir, 0, 0.004, 0);
    [-1, 1].forEach((cote) => ajouter(new T.CylinderGeometry(0.0055 * k, 0.0045 * k, 0.1 * k, 8), mJambes, cote * 0.009 * k, 0.008 + 0.05 * k, 0));
    const jupe = ajouter(new T.CylinderGeometry(0.014 * k, (f.large ? 0.05 : 0.032) * k, 0.06 * k, 20, 1, true), mJupe, 0, 0.008 + 0.125 * k, 0);
    jupe.material.side = T.DoubleSide;
    ajouter(new T.CylinderGeometry(0.012 * k, 0.015 * k, 0.05 * k, 14), mHaut, 0, 0.008 + 0.175 * k, 0);
    [-1, 1].forEach((cote) => {
      const bras = ajouter(new T.CylinderGeometry(0.0038 * k, 0.0032 * k, 0.055 * k, 6), mPeau, cote * 0.02 * k, 0.008 + 0.17 * k, 0.004 * k);
      bras.rotation.z = cote * rand(0.25, 0.9);
      bras.rotation.x = rand(-0.5, 0.3);
    });
    const yTete = 0.008 + 0.222 * k;
    ajouter(new T.SphereGeometry(0.017 * k, 16, 12), mPeau, 0, yTete, 0);
    const calotte = ajouter(new T.SphereGeometry(0.0195 * k, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), mCheveux, 0, yTete + 0.002 * k, -0.002 * k);
    calotte.rotation.x = -0.25;
    if (f.longs) { // longue chevelure dans le dos
      const longueur = f.longs * 0.17 * k;
      ajouter(new T.CylinderGeometry(0.017 * k, 0.026 * k, longueur, 14, 1, true), mCheveux, 0, yTete - longueur / 2, -0.008 * k).material.side = T.DoubleSide;
    }
    if (f.couettes) {
      [-1, 1].forEach((cote) => {
        const couette = ajouter(new T.CylinderGeometry(0.008 * k, 0.003 * k, 0.11 * k, 8), mCheveux, cote * 0.028 * k, yTete - 0.045 * k, -0.004 * k);
        couette.rotation.z = cote * 0.25;
      });
    }
    if (f.ruban) {
      const ruban = ajouter(new T.TorusGeometry(0.008 * k, 0.003 * k, 6, 12), plastique(f.ruban, 0.4), 0, yTete + 0.02 * k, -0.004 * k);
      ruban.scale.set(1.6, 1, 1);
    }
    if (f.ailes) {
      const forme = new T.Shape();
      forme.moveTo(0, 0);
      forme.quadraticCurveTo(0.05, 0.03, 0.09, 0.08);
      forme.lineTo(0.07, 0.03);
      forme.lineTo(0.085, 0.01);
      forme.lineTo(0.06, -0.01);
      forme.quadraticCurveTo(0.03, -0.02, 0, 0);
      const mAile = plastique(f.ailes, 0.5);
      mAile.side = T.DoubleSide;
      [-1, 1].forEach((cote) => {
        const aile = ajouter(new T.ShapeGeometry(forme, 6), mAile, 0, 0.008 + 0.19 * k, -0.012 * k);
        aile.scale.set(cote * k, k, k);
        aile.rotation.y = cote * 0.5;
      });
    }
    g.rotation.y = rand(-0.35, 0.35);
    return g;
  };

  const FIGURINES = [
    // Niveau du haut
    { x: 1.33, y: ETAGERE.n2, h: 0.25, haut: '#1c1b22', jupe: '#e9e6ef', cheveux: '#17151c', longs: 0.9, ailes: '#141217', large: true },
    { x: 1.52, y: ETAGERE.n2, h: 0.21, haut: '#d9dbe6', jupe: '#1f2233', cheveux: '#e8e9f2', longs: 0.6, large: true },
    { x: 1.84, y: ETAGERE.n2, h: 0.24, haut: '#fbeef3', jupe: '#ffffff', cheveux: '#f6a6c4', couettes: true, ruban: '#e5487a', large: true },
    { x: 2.06, y: ETAGERE.n2, h: 0.23, haut: '#c3222f', jupe: '#16161a', jambes: '#16161a', cheveux: '#141318', couettes: true, ruban: '#d22a3a' },
    { x: 2.33, y: ETAGERE.n2, h: 0.24, haut: '#26222e', jupe: '#1c1a22', jambes: '#5b4a7d', cheveux: '#100f14', longs: 1 },
    // Niveau du bas
    { x: 1.3, y: ETAGERE.n1, h: 0.13, haut: '#3e6b45', jupe: '#2f3a52', cheveux: '#5a3b26' },
    { x: 1.43, y: ETAGERE.n1, h: 0.075, haut: '#f2c94c', cheveux: '#f2d070' },
    { x: 1.52, y: ETAGERE.n1, h: 0.13, haut: '#1f4a4a', jupe: '#d8c9a4', cheveux: '#1b1a1f', longs: 0.5 },
    { x: 1.73, y: ETAGERE.n1, h: 0.11, haut: '#ffffff', jupe: '#fbe4ee', cheveux: '#f5a3c7', longs: 0.7, large: true },
    { x: 1.86, y: ETAGERE.n1, h: 0.16, haut: '#f1f1ef', jupe: '#f1f1ef', jambes: '#1a1a1d', cheveux: '#1b1b20', large: true },
    { x: 2.0, y: ETAGERE.n1, h: 0.15, haut: '#1d1c24', jupe: '#2a2836', cheveux: '#a9c8ec', longs: 0.8, large: true },
    { x: 2.24, y: ETAGERE.n1, h: 0.15, haut: '#f3f0f2', jupe: '#d23a4e', cheveux: '#c8283a', longs: 0.6 },
    { x: 2.39, y: ETAGERE.n1, h: 0.14, haut: '#1a1a1e', jupe: '#f2b3c9', cheveux: '#1a1a1e', couettes: true },
    // Posée sur le bureau
    { x: 2.36, y: HAUTEUR_BUREAU, h: 0.17, haut: '#24242a', jupe: '#3a3a44', cheveux: '#c9a777', longs: 0.7, z: 0.36 },
  ];
  FIGURINES.forEach((f) => {
    const figurine = creerFigurine(f);
    figurine.position.set(f.x, f.y, f.z || (ETAGERE.z0 + ETAGERE.z1) / 2 + 0.02);
    scene.add(figurine);
  });

  /* ---------- Écran : il affiche le code de Caillou Tour (VS Code) ---------- */
  const CODE = [
    'class _PageAccueilState extends State<PageAccueil> {',
    '  final TextEditingController _rechercheController = TextEditingController();',
    '',
    '  /// Texte actuellement saisi dans la barre de recherche.',
    "  String _recherche = '';",
    '',
    '  @override',
    '  void dispose() {',
    '    _rechercheController.dispose();',
    '    super.dispose();',
    '  }',
    '',
    '  void _effacerRecherche() {',
    '    _rechercheController.clear();',
    "    setState(() => _recherche = '');",
    '  }',
    '',
    '  @override',
    '  Widget build(BuildContext context) {',
    '    final rechercheEnCours = _recherche.trim().isNotEmpty;',
    '    return ListView(',
    '      padding: const EdgeInsets.only(bottom: 24),',
    '      children: [',
    '        _EnTete(',
    '          controleur: _rechercheController,',
  ];
  const TOTAL_CARACTERES = CODE.reduce((n, ligne) => n + ligne.length + 1, 0);
  const MOTS_CLES = new Set(['class', 'extends', 'final', 'void', 'const', 'super', 'required', 'this', 'new', 'String', 'bool', 'int']);
  const COULEURS_CODE = {
    motCle: '#569cd6', controle: '#c586c0', type: '#4ec9b0', chaine: '#ce9178', commentaire: '#6a9955',
    nombre: '#b5cea8', fonction: '#dcdcaa', variable: '#9cdcfe', texte: '#d4d4d4', annotation: '#dcdcaa',
  };
  /** Découpe une ligne de Dart en morceaux colorés (coloration syntaxique simplifiée). */
  const colorer = (ligne) => {
    const morceaux = [];
    const motif = /(\/\/.*$)|('(?:[^'\\]|\\.)*')|(@\w+)|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
    let m;
    while ((m = motif.exec(ligne))) {
      const [texte, commentaire, chaine, annotation, nombre, mot] = m;
      let type = 'texte';
      if (commentaire) type = 'commentaire';
      else if (chaine) type = 'chaine';
      else if (annotation) type = 'annotation';
      else if (nombre) type = 'nombre';
      else if (mot) {
        const suivant = ligne.slice(m.index + mot.length).trimStart()[0];
        if (mot === 'return') type = 'controle';
        else if (MOTS_CLES.has(mot)) type = 'motCle';
        else if (/^_?[A-Z]/.test(mot)) type = 'type';
        else if (suivant === '(') type = 'fonction';
        else type = 'variable';
      }
      morceaux.push([texte, COULEURS_CODE[type]]);
    }
    return morceaux;
  };
  const CODE_COLORE = CODE.map(colorer);

  const [toileEcran, ce] = creerToile(1024, 590);
  const textureEcran = versTexture(toileEcran, { repetition: false });
  const POLICE = '"Cascadia Code", Consolas, "Courier New", monospace';
  const ARBRE = [
    [0, 'v PROJET APPLICATION MOBILE', true], [1, '> android'], [1, '> assets'], [1, 'v lib'], [2, '> data'], [2, '> models'],
    [2, 'v pages'], [3, 'navigation.dart'], [3, 'page_accueil.dart', false, true], [3, 'page_agenda.dart'], [3, 'page_connexion.dart'],
    [3, 'page_detail_lieu.dart'], [3, 'page_explorer.dart'], [2, '> services'], [2, '> widgets'], [2, 'main.dart'], [2, 'theme.dart'],
    [1, '> test'], [1, 'pubspec.yaml'], [1, 'README.md'],
  ];
  const COMMANDE = 'flutter test';
  const etatEcran = { caracteres: TOTAL_CARACTERES, commande: COMMANDE.length, resultat: true, curseur: true };

  /** Dessine l'éditeur de code : barre de titre, explorateur, onglets, code, mini-carte, terminal et barre d'état. */
  const dessinerEcran = () => {
    const L = 1024;
    const H = 590;
    ce.fillStyle = '#1f1f1f';
    ce.fillRect(0, 0, L, H);
    // Barre de titre
    ce.fillStyle = '#181818';
    ce.fillRect(0, 0, L, 26);
    ce.font = `12px ${POLICE}`;
    ce.fillStyle = '#9d9d9d';
    ce.textAlign = 'center';
    ce.fillText('page_accueil.dart — projet application mobile — Visual Studio Code', L / 2, 17);
    ce.textAlign = 'left';
    ['#ff5f57', '#febc2e', '#28c840'].forEach((teinte, i) => { ce.fillStyle = teinte; ce.beginPath(); ce.arc(L - 60 + i * 18, 13, 5, 0, Math.PI * 2); ce.fill(); });
    // Barre d'activités et explorateur
    ce.fillStyle = '#181818';
    ce.fillRect(0, 26, 44, H - 48);
    ce.fillStyle = '#868686';
    for (let i = 0; i < 5; i++) ce.fillRect(13, 44 + i * 44, 18, 18);
    ce.fillStyle = '#d7d7d7';
    ce.fillRect(0, 40, 2, 30);
    ce.fillStyle = '#181818';
    ce.fillRect(44, 26, 200, H - 48);
    ce.fillStyle = '#cccccc';
    ce.font = `bold 11px ${POLICE}`;
    ce.fillText('EXPLORATEUR', 58, 46);
    ce.font = `12px ${POLICE}`;
    ARBRE.forEach(([niveau, nom, gras, actif], i) => {
      const y = 70 + i * 19;
      if (actif) { ce.fillStyle = '#37373d'; ce.fillRect(44, y - 13, 200, 19); }
      ce.fillStyle = gras ? '#cccccc' : nom.endsWith('.dart') ? '#7fd1e8' : nom.startsWith('>') || nom.startsWith('v') ? '#c5c5c5' : '#d9b56a';
      ce.fillText(nom, 54 + niveau * 12, y);
    });
    // Onglets
    ce.fillStyle = '#181818';
    ce.fillRect(244, 26, L - 244, 30);
    ce.fillStyle = '#1f1f1f';
    ce.fillRect(244, 26, 170, 30);
    ce.fillStyle = '#0078d4';
    ce.fillRect(244, 26, 170, 2);
    ce.fillStyle = '#ffffff';
    ce.fillText('page_accueil.dart', 262, 46);
    ce.fillStyle = '#8b8b8b';
    ce.fillText('main.dart', 436, 46);
    ce.fillText('theme.dart', 540, 46);
    // Code tapé petit à petit
    const yCode = 76;
    const hauteurLigne = 15.4;
    ce.font = `12.5px ${POLICE}`;
    let reste = etatEcran.caracteres;
    let curseur = null;
    CODE_COLORE.forEach((morceaux, i) => {
      const y = yCode + i * hauteurLigne;
      if (reste <= 0 && curseur) return; // ligne pas encore écrite
      ce.fillStyle = '#6e7681';
      ce.textAlign = 'right';
      ce.fillText(String(i + 36), 284, y);
      ce.textAlign = 'left';
      let x = 300;
      for (const [texte, teinte] of morceaux) {
        if (reste <= 0) break;
        const visible = texte.slice(0, reste);
        ce.fillStyle = teinte;
        ce.fillText(visible, x, y);
        x += ce.measureText(visible).width;
        reste -= visible.length;
      }
      if (reste > 0) reste -= 1; // retour à la ligne
      else if (!curseur) curseur = [x, y];
    });
    if (!curseur) curseur = [300, yCode + (CODE.length - 1) * hauteurLigne];
    // Mini-carte du code, à droite
    CODE.forEach((ligne, i) => {
      ce.fillStyle = 'rgba(160,190,220,0.35)';
      ce.fillRect(L - 70 + (ligne.length - ligne.trimStart().length) * 0.8, 62 + i * 4, Math.min(56, ligne.trim().length * 0.8), 2);
    });
    // Terminal
    const yTerminal = 470;
    ce.fillStyle = '#181818';
    ce.fillRect(244, yTerminal, L - 244, H - 22 - yTerminal);
    ce.fillStyle = '#2b2b2b';
    ce.fillRect(244, yTerminal, L - 244, 1);
    ce.font = `bold 11px ${POLICE}`;
    ce.fillStyle = '#e7e7e7';
    ce.fillText('TERMINAL', 262, yTerminal + 20);
    ce.fillStyle = '#0078d4';
    ce.fillRect(262, yTerminal + 25, 60, 2);
    ce.font = `12.5px ${POLICE}`;
    const invite = 'PS C:\\COURS\\SLAM\\JAVA\\projet application mobile> ';
    ce.fillStyle = '#cccccc';
    ce.fillText(invite + COMMANDE.slice(0, etatEcran.commande), 262, yTerminal + 48);
    if (etatEcran.resultat) {
      ce.fillStyle = '#4ec97a';
      ce.fillText('00:04 +29: All tests passed!', 262, yTerminal + 67);
      ce.fillStyle = '#cccccc';
      ce.fillText(invite, 262, yTerminal + 86);
    }
    // Curseur clignotant
    if (etatEcran.curseur) {
      ce.fillStyle = '#aeafad';
      const enCode = etatEcran.caracteres < TOTAL_CARACTERES;
      if (enCode) ce.fillRect(curseur[0] + 1, curseur[1] - 11, 2, 14);
      else {
        const ligne = etatEcran.resultat ? invite : invite + COMMANDE.slice(0, etatEcran.commande);
        ce.fillRect(262 + ce.measureText(ligne).width + 1, yTerminal + (etatEcran.resultat ? 86 : 48) - 11, 7, 14);
      }
    }
    // Barre d'état
    ce.fillStyle = '#0078d4';
    ce.fillRect(0, H - 22, L, 22);
    ce.font = `12px ${POLICE}`;
    ce.fillStyle = '#ffffff';
    ce.fillText('⎇ main   ⊗ 0  ⚠ 0', 12, H - 7);
    ce.textAlign = 'right';
    ce.fillText('Ln 60, Col 35   UTF-8   Dart   Flutter: 3.47', L - 14, H - 7);
    ce.textAlign = 'left';
    textureEcran.needsUpdate = true;
  };

  const materiauEcran = new T.MeshBasicMaterial({ map: textureEcran, toneMapped: false });
  const ECRAN = { x: 0.6, y: 1.105, z: 0.27 };
  const groupeEcran = new T.Group();
  (() => {
    const cadre = boite(0.628, 0.372, 0.02, plastiqueNoir);
    const dalle = new T.Mesh(new T.PlaneGeometry(0.61, 0.351), materiauEcran);
    dalle.position.set(0, 0.006, 0.0101);
    const dos = boite(0.46, 0.26, 0.035, plastiqueNoir);
    dos.position.set(0, 0.0, -0.026);
    const colonne = boite(0.06, 0.26, 0.026, plastiqueNoir);
    colonne.position.set(0, -0.2, -0.06);
    const base = boite(0.26, 0.012, 0.19, plastiqueNoir);
    base.position.set(0, -(ECRAN.y - HAUTEUR_BUREAU) + 0.006, -0.05);
    groupeEcran.add(cadre, dalle, dos, colonne, base);
  })();
  groupeEcran.position.set(ECRAN.x, ECRAN.y, ECRAN.z);
  scene.add(groupeEcran);
  const lumiereEcran = new T.PointLight(couleur('#9fc6ff'), amb.forceEcran, 2.2, 2);
  lumiereEcran.position.set(ECRAN.x, ECRAN.y, ECRAN.z + 0.4);
  scene.add(lumiereEcran);

  /* ---------- Tapis de bureau, clavier et souris ---------- */
  const tapis = boite(0.86, 0.003, 0.32, new T.MeshStandardMaterial({ color: couleur('#1d2a24'), roughness: 0.95 }));
  tapis.position.set(0.66, HAUTEUR_BUREAU + 0.0015, 0.48);
  scene.add(tapis);
  const CLAVIER = { x: 0.58, z: 0.47, u: 0.0192 };
  (() => {
    const base = boite(CLAVIER.u * 15.6, 0.022, CLAVIER.u * 6.4, plastique('#e9e6df', 0.4));
    base.position.set(CLAVIER.x, HAUTEUR_BUREAU + 0.014, CLAVIER.z);
    base.rotation.x = 0.06;
    scene.add(base);
    // Touches : une seule géométrie (touche légèrement évasée) dessinée en série
    const geo = new T.BoxGeometry(1, 1, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * 0.82); p.setZ(i, p.getZ(i) * 0.8); }
    geo.computeVertexNormals();
    const RANGEES = [
      [1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
      [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
      [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
      [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
    ];
    const touches = [];
    RANGEES.forEach((rangee, r) => {
      let x = -7.5;
      rangee.forEach((largeur, i) => {
        if (r === 0 && largeur === 0.5) { x += 0.5; return; } // espaces entre les groupes de touches F
        touches.push({ x: x + largeur / 2, z: r - 2.5, largeur, accent: (r === 0 && i === 0) || (r === 3 && i === rangee.length - 1) });
        x += largeur;
      });
    });
    const clavier = new T.InstancedMesh(geo, plastique('#f7f5f0', 0.5), touches.length);
    touches.forEach((t, i) => {
      matrice.compose(
        new T.Vector3(CLAVIER.x + t.x * CLAVIER.u, HAUTEUR_BUREAU + 0.03 + (2.5 - t.z) * 0.0012, CLAVIER.z + t.z * CLAVIER.u),
        new T.Quaternion().setFromEuler(new T.Euler(0.06, 0, 0)),
        new T.Vector3(t.largeur * CLAVIER.u - 0.003, 0.009, CLAVIER.u - 0.003)
      );
      clavier.setMatrixAt(i, matrice);
      clavier.setColorAt(i, t.accent ? couleur('#ea580c') : couleur('#ffffff'));
    });
    clavier.castShadow = true;
    clavier.receiveShadow = true;
    scene.add(clavier);
    const sourisPC = new T.Mesh(new T.SphereGeometry(1, 24, 14), plastique('#f6f5f2', 0.32));
    sourisPC.scale.set(0.031, 0.018, 0.055);
    sourisPC.position.set(0.96, HAUTEUR_BUREAU + 0.006, 0.5);
    sourisPC.castShadow = true;
    scene.add(sourisPC);
  })();

  /* ---------- Console de salon blanche (générique) ---------- */
  (() => {
    const consoleJeu = new T.Group();
    const coeur = boite(0.07, 0.37, 0.24, plastique('#18181b', 0.25));
    coeur.position.y = 0.2;
    consoleJeu.add(coeur);
    // Coques blanches bombées de chaque côté, plus larges en haut
    const profil = new T.Shape();
    profil.moveTo(-0.12, 0);
    profil.lineTo(0.1, 0);
    profil.quadraticCurveTo(0.135, 0.2, 0.15, 0.39);
    profil.lineTo(-0.15, 0.39);
    profil.quadraticCurveTo(-0.135, 0.2, -0.12, 0);
    const geoCoque = new T.ExtrudeGeometry(profil, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 3, curveSegments: 18 });
    [-1, 1].forEach((cote) => {
      const coque = new T.Mesh(geoCoque, plastiqueBlanc);
      coque.rotation.y = Math.PI / 2;
      coque.position.set(cote * 0.044 - 0.006, 0.01, 0);
      coque.castShadow = true;
      coque.receiveShadow = true;
      consoleJeu.add(coque);
    });
    const voyant = new T.Mesh(new T.BoxGeometry(0.004, 0.24, 0.004), new T.MeshBasicMaterial({ color: 0x4f8cff }));
    voyant.position.set(0, 0.2, 0.121);
    consoleJeu.add(voyant);
    const socle = new T.Mesh(new T.CylinderGeometry(0.06, 0.065, 0.01, 24), plastiqueNoir);
    socle.position.y = 0.005;
    consoleJeu.add(socle);
    consoleJeu.position.set(0.0, HAUTEUR_BUREAU, 0.3);
    consoleJeu.rotation.y = 0.55;
    scene.add(consoleJeu);
  })();

  /* ---------- Manettes (noire et rouge) ---------- */
  const creerManette = (teinteCorps, teinteCentre) => {
    const g = new T.Group();
    const corps = plastique(teinteCorps, 0.4);
    const centre = new T.Mesh(new T.SphereGeometry(1, 24, 14), corps);
    centre.scale.set(0.072, 0.02, 0.042);
    g.add(centre);
    [-1, 1].forEach((cote) => {
      const poignee = new T.Mesh(new T.SphereGeometry(1, 18, 12), corps);
      poignee.scale.set(0.026, 0.024, 0.05);
      poignee.position.set(cote * 0.052, -0.004, 0.03);
      poignee.rotation.y = -cote * 0.45;
      g.add(poignee);
      const stick = new T.Mesh(new T.CylinderGeometry(0.009, 0.01, 0.014, 14), plastique('#222226', 0.6));
      stick.position.set(cote * 0.021, 0.02, 0.018);
      g.add(stick);
    });
    const pave = new T.Mesh(new T.BoxGeometry(0.05, 0.006, 0.028), plastique(teinteCentre, 0.35));
    pave.position.set(0, 0.017, -0.012);
    g.add(pave);
    [[0.045, -0.006], [0.058, 0.006], [0.045, 0.018], [0.032, 0.006]].forEach(([x, z]) => {
      const bouton = new T.Mesh(new T.SphereGeometry(0.0045, 10, 8), plastique('#2a2a2e', 0.5));
      bouton.position.set(x, 0.018, z);
      g.add(bouton);
    });
    ombre(g);
    return g;
  };
  const manetteNoire = creerManette('#1b1b1e', '#111113');
  manetteNoire.position.set(1.4, HAUTEUR_BUREAU + 0.022, 0.5);
  manetteNoire.rotation.y = 0.35;
  const manetteRouge = creerManette('#c41e3a', '#151517');
  manetteRouge.position.set(1.62, HAUTEUR_BUREAU + 0.022, 0.45);
  manetteRouge.rotation.y = -0.25;
  scene.add(manetteNoire, manetteRouge);

  /* ---------- PC sous le bureau : vitre et ventilateurs RGB ---------- */
  const anneauxRGB = [];
  const lueurs = [];
  const creerLueur = (taille, teinte) => {
    const lueur = new T.Sprite(new T.SpriteMaterial({ map: textureLueur, color: teinte, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    lueur.scale.setScalar(taille);
    lueurs.push(lueur);
    return lueur;
  };
  const creerHelice = (rayon, materiau, nbPales = 7) => {
    const helice = new T.Group();
    const forme = new T.Shape();
    forme.moveTo(0, rayon * 0.25);
    forme.quadraticCurveTo(rayon * 0.35, rayon * 0.6, rayon * 0.2, rayon * 0.95);
    forme.lineTo(-rayon * 0.12, rayon * 0.92);
    forme.quadraticCurveTo(-rayon * 0.05, rayon * 0.55, -rayon * 0.12, rayon * 0.25);
    const geo = new T.ShapeGeometry(forme, 6);
    for (let i = 0; i < nbPales; i++) {
      const pale = new T.Mesh(geo, materiau);
      pale.rotation.z = (i / nbPales) * Math.PI * 2;
      helice.add(pale);
    }
    const moyeu = new T.Mesh(new T.CircleGeometry(rayon * 0.27, 20), materiau);
    moyeu.position.z = 0.001;
    helice.add(moyeu);
    return helice;
  };
  const helicesPC = [];
  (() => {
    const pc = new T.Group();
    const L = 0.44; // longueur (profondeur du boîtier, vue de côté)
    const Hc = 0.46;
    const E = 0.22; // épaisseur
    const blanc = plastique('#f1f1ef', 0.35);
    [[L, 0.012, E, 0, Hc - 0.006, 0], [L, 0.012, E, 0, 0.006, 0], [0.012, Hc, E, -L / 2 + 0.006, Hc / 2, 0], [L, Hc, 0.008, 0, Hc / 2, -E / 2 + 0.004]]
      .forEach(([l, h, p, x, y, z]) => { const paroi = boite(l, h, p, blanc); paroi.position.set(x, y, z); pc.add(paroi); });
    // Carte mère, carte graphique, mémoire et refroidissement du processeur
    const carteMere = boite(0.3, 0.3, 0.004, plastique('#26282c', 0.6));
    carteMere.position.set(-0.04, 0.27, -E / 2 + 0.012);
    const carteGraphique = boite(0.28, 0.05, 0.11, plastique('#2c2d31', 0.4));
    carteGraphique.position.set(-0.03, 0.17, -E / 2 + 0.07);
    const ventirad = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.03, 28), plastique('#1d1e22', 0.3));
    ventirad.rotation.x = Math.PI / 2;
    ventirad.position.set(-0.02, 0.33, -E / 2 + 0.03);
    pc.add(carteMere, carteGraphique, ventirad);
    for (let i = 0; i < 4; i++) {
      const barrette = boite(0.006, 0.11, 0.03, plastique('#1d1e22', 0.4));
      barrette.position.set(0.06 + i * 0.012, 0.33, -E / 2 + 0.03);
      pc.add(barrette);
    }
    // Éléments lumineux : anneau du processeur, bande de la carte graphique, sommet des barrettes
    const ajouterRGB = (mesh, decalage) => { anneauxRGB.push({ materiau: mesh.material, decalage }); pc.add(mesh); return mesh; };
    ajouterRGB(new T.Mesh(new T.TorusGeometry(0.03, 0.0035, 8, 32), new T.MeshBasicMaterial({ toneMapped: false })), 0.1)
      .position.set(-0.02, 0.33, -E / 2 + 0.047);
    ajouterRGB(new T.Mesh(new T.BoxGeometry(0.26, 0.006, 0.004), new T.MeshBasicMaterial({ toneMapped: false })), 0.3)
      .position.set(-0.03, 0.17, -E / 2 + 0.127);
    for (let i = 0; i < 4; i++) {
      ajouterRGB(new T.Mesh(new T.BoxGeometry(0.0065, 0.008, 0.03), new T.MeshBasicMaterial({ toneMapped: false })), 0.45 + i * 0.05)
        .position.set(0.06 + i * 0.012, 0.39, -E / 2 + 0.03);
    }
    // Trois ventilateurs à l'avant (vus de côté à travers la vitre)
    for (let i = 0; i < 3; i++) {
      const y = 0.09 + i * 0.13;
      const anneau = ajouterRGB(new T.Mesh(new T.TorusGeometry(0.055, 0.005, 8, 40), new T.MeshBasicMaterial({ toneMapped: false })), 0.6 + i * 0.12);
      anneau.position.set(L / 2 - 0.035, y, 0.0);
      anneau.rotation.y = Math.PI / 2;
      const helice = creerHelice(0.052, plastique('#e9e9ec', 0.5));
      helice.position.set(L / 2 - 0.04, y, 0);
      helice.rotation.y = -Math.PI / 2;
      pc.add(helice);
      helicesPC.push(helice);
      const lueur = creerLueur(0.22, 0xffffff);
      lueur.position.set(L / 2 - 0.05, y, 0.03);
      pc.add(lueur);
    }
    // Vitre teintée (on voit l'intérieur, avec un léger reflet)
    const vitre = new T.Mesh(new T.PlaneGeometry(L - 0.02, Hc - 0.02), new T.MeshStandardMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false }));
    vitre.position.set(0, Hc / 2, E / 2);
    pc.add(vitre);
    pc.position.set(0.86, 0, 0.33);
    pc.rotation.y = -0.85; // de trois quarts : on voit la vitre et les ventilateurs de face
    scene.add(pc);
    ombre(pc);
  })();

  /* ---------- Rubans LED : sous l'étagère et derrière l'écran ---------- */
  const materiauRuban = new T.MeshBasicMaterial({ toneMapped: false });
  const ruban = new T.Mesh(new T.BoxGeometry(ETAGERE.x1 - ETAGERE.x0 - 0.06, 0.006, 0.01), materiauRuban);
  ruban.position.set((ETAGERE.x0 + ETAGERE.x1) / 2, ETAGERE.n2 - 0.021, ETAGERE.z1 - 0.03);
  scene.add(ruban);
  const lumieresLed = [1.55, 2.2].map((x) => {
    const l = new T.PointLight(0xffffff, 0, 1.1, 2);
    l.position.set(x, ETAGERE.n2 - 0.06, ETAGERE.z1 - 0.02);
    scene.add(l);
    return l;
  });
  const lumiereDos = new T.PointLight(0xffffff, 0, 1.4, 2); // éclairage derrière l'écran, sur les tasseaux
  lumiereDos.position.set(ECRAN.x, ECRAN.y, 0.12);
  scene.add(lumiereDos);
  const lueurDos = creerLueur(1.1, 0xffffff);
  lueurDos.position.set(ECRAN.x, ECRAN.y, 0.06);
  scene.add(lueurDos);
  const lueurRuban = creerLueur(1.4, 0xffffff);
  lueurRuban.scale.set(1.5, 0.35, 1);
  lueurRuban.position.set((ETAGERE.x0 + ETAGERE.x1) / 2, ETAGERE.n2 - 0.04, ETAGERE.z1);
  scene.add(lueurRuban);

  /* ---------- Ventilateur sur pied (blanc), qui tourne et oscille ---------- */
  const ventilateur = { tete: new T.Group(), helice: null };
  (() => {
    const pied = new T.Group();
    const blanc = plastique('#f5f5f3', 0.35);
    const base = new T.Mesh(new T.CylinderGeometry(0.15, 0.165, 0.035, 36), blanc);
    base.position.y = 0.017;
    const mat = new T.Mesh(new T.CylinderGeometry(0.016, 0.02, 0.8, 16), blanc);
    mat.position.y = 0.43;
    pied.add(base, mat);
    const tete = ventilateur.tete;
    tete.position.y = 0.88;
    const moteur = new T.Mesh(new T.SphereGeometry(0.065, 24, 16), blanc);
    moteur.scale.set(1, 1, 1.3);
    moteur.position.z = -0.08;
    tete.add(moteur);
    // Grille : anneaux concentriques et rayons (texture découpée)
    const [toileGrille, cg] = creerToile(256, 256);
    cg.strokeStyle = '#ffffff';
    cg.lineWidth = 3;
    for (let r = 18; r < 126; r += 13) { cg.beginPath(); cg.arc(128, 128, r, 0, Math.PI * 2); cg.stroke(); }
    for (let a = 0; a < 24; a++) { cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128 + Math.cos((a / 24) * Math.PI * 2) * 128, 128 + Math.sin((a / 24) * Math.PI * 2) * 128); cg.stroke(); }
    cg.fillStyle = '#ffffff';
    cg.beginPath();
    cg.arc(128, 128, 22, 0, Math.PI * 2);
    cg.fill();
    const grille = new T.MeshStandardMaterial({ color: 0xf5f5f3, alphaMap: versTexture(toileGrille, { repetition: false, couleurs: false }), alphaTest: 0.5, side: T.DoubleSide, roughness: 0.4 });
    [0.035, -0.03].forEach((z) => {
      const disque = new T.Mesh(new T.CircleGeometry(0.17, 48), grille);
      disque.position.z = z;
      tete.add(disque);
    });
    const cercle = new T.Mesh(new T.TorusGeometry(0.17, 0.008, 8, 48), blanc);
    tete.add(cercle);
    ventilateur.helice = creerHelice(0.15, new T.MeshStandardMaterial({ color: 0xf8f8f8, transparent: true, opacity: 0.85, side: T.DoubleSide, roughness: 0.3 }), 5);
    tete.add(ventilateur.helice);
    pied.add(tete);
    pied.position.set(2.95, 0, 1.1);
    pied.rotation.y = -0.75;
    ombre(pied);
    scene.add(pied);
  })();

  /* ---------- Néon « NT. » sur les tasseaux, au-dessus de l'écran ---------- */
  const [toileNeon, cn] = creerToile(1024, 384);
  const textureNeon = versTexture(toileNeon, { repetition: false });
  const dessinerNeon = () => {
    cn.clearRect(0, 0, 1024, 384);
    cn.font = '700 250px "Space Grotesk", "Segoe UI", Arial, sans-serif';
    cn.textBaseline = 'middle';
    cn.lineJoin = 'round';
    const largeur = cn.measureText('NT').width;
    const x0 = (1024 - largeur - 80) / 2;
    /** Un tube de néon : halo coloré flou, puis cœur presque blanc. */
    const tube = (tracer, teinte) => {
      [[38, 0.5], [16, 0.9]].forEach(([flou, alpha]) => {
        cn.save();
        cn.shadowColor = teinte;
        cn.shadowBlur = flou;
        cn.globalAlpha = alpha;
        cn.strokeStyle = teinte;
        cn.lineWidth = 15;
        tracer();
        cn.restore();
      });
      cn.save();
      cn.strokeStyle = '#fff4f8';
      cn.lineWidth = 5;
      tracer();
      cn.restore();
    };
    tube(() => cn.strokeText('NT', x0, 196), '#ff4f9e');
    tube(() => { cn.beginPath(); cn.arc(x0 + largeur + 48, 270, 20, 0, Math.PI * 2); cn.stroke(); }, '#ff9a3c');
    textureNeon.needsUpdate = true;
  };
  dessinerNeon();
  // La police du site arrive un peu après : on redessine alors le néon avec elle
  if (document.fonts) {
    document.fonts.load('700 100px "Space Grotesk"').then(() => {
      dessinerNeon();
      if (pret && !idAnimation) rendre();
    }).catch(() => {});
  }
  const materiauNeon = new T.MeshBasicMaterial({ map: textureNeon, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
  const neon = new T.Mesh(new T.PlaneGeometry(0.78, 0.29), materiauNeon);
  neon.position.set(ECRAN.x + 0.02, 1.76, 0.045);
  scene.add(neon);
  const lumiereNeon = new T.PointLight(couleur('#ff4f9e'), 0, 1.6, 2);
  lumiereNeon.position.set(ECRAN.x, 1.74, 0.3);
  scene.add(lumiereNeon);

  /* ---------- Tapis en laine sous les bureaux ---------- */
  (() => {
    const [toile, c] = creerToile(512, 320);
    c.fillStyle = '#cbb9a0';
    c.fillRect(0, 0, 512, 320);
    for (let i = 0; i < 2600; i++) { // petites boucles de laine
      c.fillStyle = `rgba(${hasard() < 0.5 ? '120,105,85' : '255,255,250'},${rand(0.05, 0.16)})`;
      c.fillRect(rand(0, 512), rand(0, 320), rand(1, 3), rand(1, 3));
    }
    c.strokeStyle = '#8c7660';
    c.lineWidth = 16;
    c.strokeRect(18, 18, 476, 284);
    c.strokeStyle = '#e9ddcb';
    c.lineWidth = 3;
    c.strokeRect(38, 38, 436, 244);
    c.setLineDash([6, 6]); // petits points tissés dans la bordure
    c.strokeStyle = '#d8c7ae';
    c.lineWidth = 3;
    c.strokeRect(18, 18, 476, 284);
    c.setLineDash([]);
    grainer(c, 512, 320, 14);
    const tapisSol = new T.Mesh(new T.PlaneGeometry(2.4, 1.3), new T.MeshStandardMaterial({ map: versTexture(toile, { repetition: false }), roughness: 1 }));
    tapisSol.rotation.x = -Math.PI / 2;
    tapisSol.position.set(1.12, 0.004, 1.0);
    tapisSol.receiveShadow = true;
    scene.add(tapisSol);
  })();

  /* ---------- Pothos (plante retombante) en haut de l'étagère ---------- */
  (() => {
    const plante = new T.Group();
    const pot = new T.Mesh(new T.CylinderGeometry(0.048, 0.036, 0.085, 28), plastique('#ece5da', 0.55));
    pot.position.y = 0.0425;
    const terre = new T.Mesh(new T.CircleGeometry(0.044, 20), plastique('#3a2a1e', 1));
    terre.rotation.x = -Math.PI / 2;
    terre.position.y = 0.08;
    plante.add(pot, terre);
    // Feuille en forme de cœur, pointe vers le haut ; quatre verts différents
    const forme = new T.Shape();
    forme.moveTo(0, 0);
    forme.bezierCurveTo(0.55, 0.12, 0.62, 0.78, 0, 1.2);
    forme.bezierCurveTo(-0.62, 0.78, -0.55, 0.12, 0, 0);
    const geoFeuille = new T.ShapeGeometry(forme, 8);
    const verts = ['#3c7a34', '#4f9140', '#6aa84f', '#8fbf5a'].map((teinte) => {
      const m = plastique(teinte, 0.55);
      m.side = T.DoubleSide;
      return m;
    });
    const materiauTige = plastique('#5d7a3a', 0.7);
    const ajouterFeuille = (parent, position, taille, angleY, inclinaison) => {
      const feuille = new T.Mesh(geoFeuille, verts[Math.floor(hasard() * verts.length)]);
      feuille.position.copy(position);
      feuille.scale.setScalar(taille);
      feuille.rotation.set(inclinaison, angleY, rand(-0.5, 0.5));
      feuille.castShadow = true;
      parent.add(feuille);
    };
    // Touffe au-dessus du pot
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      ajouterFeuille(plante, new T.Vector3(Math.cos(angle) * 0.03, 0.085, Math.sin(angle) * 0.03), rand(0.04, 0.055), -angle + Math.PI / 2, rand(-0.9, -0.3));
    }
    // Trois tiges qui débordent de l'étagère et retombent le long du montant
    [[0.06, 0.1, 0.42], [0.075, 0.16, 0.3], [0.02, 0.2, 0.5]].forEach(([decalage, profondeur, longueur]) => {
      const courbe = new T.CatmullRomCurve3([
        new T.Vector3(0.02, 0.08, 0.02), new T.Vector3(decalage, 0.07, profondeur * 0.6),
        new T.Vector3(decalage + 0.03, -longueur * 0.35, profondeur), new T.Vector3(decalage + 0.02, -longueur, profondeur + 0.02),
      ]);
      plante.add(new T.Mesh(new T.TubeGeometry(courbe, 24, 0.003, 5, false), materiauTige));
      const nbFeuilles = Math.round(longueur / 0.055);
      for (let k = 1; k <= nbFeuilles; k++) {
        const point = courbe.getPointAt(k / (nbFeuilles + 0.5));
        ajouterFeuille(plante, point, rand(0.03, 0.045) * (1 - k / (nbFeuilles * 2.5)), rand(-0.6, 0.6), Math.PI + rand(-0.5, 0.5));
      }
    });
    plante.position.set(2.46, ETAGERE.n2, 0.15);
    scene.add(plante);
  })();

  /* ---------- Poussière qui brille dans le rayon de soleil ---------- */
  const nbPoussieres = 170;
  const basePoussieres = [];
  const positionsPoussieres = new Float32Array(nbPoussieres * 3);
  const couleursPoussieres = new Float32Array(nbPoussieres * 3);
  for (let i = 0; i < nbPoussieres; i++) {
    let p;
    do { // dans le faisceau, près du mur et du bureau (pas devant le texte)
      p = fenetre.target.position.clone()
        .addScaledVector(axeDroite, rand(-0.85, 1.0))
        .addScaledVector(axeHaut, rand(-1.3, 1.05))
        .addScaledVector(rayon, -rand(0.1, 1.3));
    } while (p.x < 0.1 || p.y < 0.15 || p.y > 2.2 || p.z < 0.05);
    basePoussieres.push([p.x, p.y, p.z, rand(0, Math.PI * 2), rand(0.5, 1.2)]);
    const eclat = rand(0.35, 1);
    couleursPoussieres.set([eclat, eclat * 0.92, eclat * 0.78], i * 3);
  }
  const geoPoussieres = new T.BufferGeometry();
  geoPoussieres.setAttribute('position', new T.BufferAttribute(positionsPoussieres, 3));
  geoPoussieres.setAttribute('color', new T.BufferAttribute(couleursPoussieres, 3));
  const materiauPoussieres = new T.PointsMaterial({
    map: textureLueur, size: 3.2, sizeAttenuation: false, vertexColors: true, transparent: true,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  scene.add(new T.Points(geoPoussieres, materiauPoussieres));
  const bougerPoussieres = (t) => {
    basePoussieres.forEach(([x, y, z, phase, vitesse], i) => {
      positionsPoussieres[i * 3] = x + Math.sin(t * 0.21 * vitesse + phase) * 0.05;
      positionsPoussieres[i * 3 + 1] = y + Math.sin(t * 0.13 * vitesse + phase * 2) * 0.07;
      positionsPoussieres[i * 3 + 2] = z + Math.cos(t * 0.17 * vitesse + phase) * 0.04;
    });
    geoPoussieres.attributes.position.needsUpdate = true;
  };
  bougerPoussieres(0);

  /* ---------- Le mur crème : fenêtre sur le lagon, cadres, horloge, meuble bas et guirlande ---------- */

  // Vue par la fenêtre : coucher de soleil sur le lagon, îlot et phare, palmiers (la nuit : lune et étoiles)
  const FENETRE = { x0: -3.25, x1: -2.15, y0: 0.95, y1: 2.12 };
  const [toileVue, cv] = creerToile(512, 544);
  const textureVue = versTexture(toileVue, { repetition: false });
  const dessinerVue = () => {
    const L = 512;
    const H = 544;
    const horizon = 330;
    const nuit = amb.nuit;
    let graineVue = 7; // même dessin à chaque fois
    const alea = (min, max) => {
      graineVue = (graineVue * 16807) % 2147483647;
      return min + ((graineVue - 1) / 2147483646) * (max - min);
    };
    const ciel = cv.createLinearGradient(0, 0, 0, horizon);
    (nuit ? [[0, '#070b24'], [0.6, '#1d2457'], [1, '#463a73']] : [[0, '#4f9fdc'], [0.48, '#a8c9e8'], [0.8, '#f7c79a'], [1, '#ff9d6c']])
      .forEach(([t, teinte]) => ciel.addColorStop(t, teinte));
    cv.fillStyle = ciel;
    cv.fillRect(0, 0, L, horizon);
    if (nuit) {
      for (let i = 0; i < 110; i++) {
        cv.globalAlpha = alea(0.3, 1);
        cv.fillStyle = '#ffffff';
        const taille = alea(1, 2.4);
        cv.fillRect(alea(0, L), alea(0, horizon * 0.85), taille, taille);
      }
      cv.globalAlpha = 1;
    } else {
      cv.fillStyle = 'rgba(255, 214, 196, 0.55)'; // nuages roses
      [[110, 120, 70, 9], [190, 108, 50, 7], [400, 160, 80, 10], [450, 150, 40, 6]].forEach(([x, y, rx, ry]) => {
        cv.beginPath();
        cv.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        cv.fill();
      });
    }
    const [sx, sy, sr] = nuit ? [380, 92, 22] : [300, horizon - 26, 34];
    const halo = cv.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 5);
    halo.addColorStop(0, nuit ? 'rgba(230, 235, 255, 0.35)' : 'rgba(255, 236, 190, 0.85)');
    halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cv.fillStyle = halo;
    cv.fillRect(0, 0, L, horizon);
    cv.fillStyle = nuit ? '#f4f1e2' : '#fff2cc';
    cv.beginPath();
    cv.arc(sx, sy, sr, 0, Math.PI * 2);
    cv.fill();
    // Montagnes de la Grande Terre au loin
    cv.fillStyle = nuit ? '#1b1a3c' : '#8c7aa6';
    cv.beginPath();
    cv.moveTo(0, horizon);
    for (let x = 0; x <= L; x += 8) cv.lineTo(x, horizon - 26 - Math.sin(x * 0.012 + 0.4) * 16 - Math.sin(x * 0.041 + 1) * 6);
    cv.lineTo(L, horizon);
    cv.fill();
    // Le lagon et le reflet du soleil (ou de la lune)
    const mer = cv.createLinearGradient(0, horizon, 0, H);
    (nuit ? [[0, '#262b62'], [1, '#0a0f2e']] : [[0, '#f2a07a'], [0.1, '#47bcc6'], [1, '#0b7d95']]).forEach(([t, teinte]) => mer.addColorStop(t, teinte));
    cv.fillStyle = mer;
    cv.fillRect(0, horizon, L, H - horizon);
    cv.fillStyle = nuit ? 'rgba(230, 235, 255, 0.45)' : 'rgba(255, 232, 180, 0.75)';
    for (let y = horizon + 3; y < H; y += 6) {
      const longueur = (1 - (y - horizon) / (H - horizon)) * 70 + 6;
      cv.fillRect(sx - longueur / 2 + alea(-8, 8), y, longueur, 2);
    }
    // Îlot et son phare (comme le phare Amédée)
    cv.fillStyle = nuit ? '#0e1130' : '#33503f';
    cv.beginPath();
    cv.ellipse(118, horizon + 3, 72, 10, 0, Math.PI, 0);
    cv.fill();
    cv.fillStyle = nuit ? '#1a1d40' : '#f3efe6';
    cv.fillRect(114, horizon - 54, 9, 52);
    cv.beginPath();
    cv.moveTo(110, horizon - 54);
    cv.lineTo(127, horizon - 54);
    cv.lineTo(118.5, horizon - 66);
    cv.fill();
    if (nuit) { // le phare éclaire la nuit
      const faisceau = cv.createRadialGradient(118, horizon - 58, 1, 118, horizon - 58, 26);
      faisceau.addColorStop(0, 'rgba(255, 230, 150, 0.95)');
      faisceau.addColorStop(1, 'rgba(255, 230, 150, 0)');
      cv.fillStyle = faisceau;
      cv.fillRect(80, horizon - 90, 80, 60);
    }
    // Palmiers en silhouette au premier plan
    const palmier = (x, hauteur, penche) => {
      cv.strokeStyle = nuit ? '#05061a' : '#2a2a33';
      cv.fillStyle = cv.strokeStyle;
      cv.lineWidth = 9;
      cv.lineCap = 'round';
      const hx = x + penche * hauteur;
      const hy = H - hauteur;
      cv.beginPath();
      cv.moveTo(x, H);
      cv.quadraticCurveTo(x + penche * hauteur * 0.2, H - hauteur * 0.6, hx, hy);
      cv.stroke();
      for (let k = 0; k < 8; k++) {
        const angle = (k / 8) * Math.PI * 2 + 0.3;
        const longueur = alea(70, 105);
        const bx = hx + Math.cos(angle) * longueur;
        const by = hy + Math.sin(angle) * longueur * 0.55 + longueur * 0.25;
        cv.lineWidth = 6;
        cv.beginPath();
        cv.moveTo(hx, hy);
        cv.quadraticCurveTo((hx + bx) / 2, hy - 30, bx, by);
        cv.stroke();
        for (let f = 0.25; f < 1; f += 0.12) { // folioles
          const px = hx + (bx - hx) * f;
          const py = hy + (by - hy) * f - Math.sin(f * Math.PI) * 28;
          cv.lineWidth = 2;
          cv.beginPath();
          cv.moveTo(px, py);
          cv.lineTo(px + Math.cos(angle + 1.2) * 16, py + 14);
          cv.moveTo(px, py);
          cv.lineTo(px + Math.cos(angle - 1.2) * 16, py + 14);
          cv.stroke();
        }
      }
    };
    palmier(40, 330, 0.18);
    palmier(478, 250, -0.22);
    textureVue.needsUpdate = true;
  };
  dessinerVue();

  (() => {
    const largeur = FENETRE.x1 - FENETRE.x0;
    const hauteur = FENETRE.y1 - FENETRE.y0;
    const cx = (FENETRE.x0 + FENETRE.x1) / 2;
    const cy = (FENETRE.y0 + FENETRE.y1) / 2;
    const vue = new T.Mesh(new T.PlaneGeometry(largeur, hauteur), new T.MeshBasicMaterial({ map: textureVue, toneMapped: false }));
    vue.position.set(cx, cy, 0.003);
    scene.add(vue);
    // Reflet léger sur la vitre
    const vitre = new T.Mesh(new T.PlaneGeometry(largeur, hauteur), new T.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.9, depthWrite: false,
    }));
    vitre.position.set(cx, cy, 0.03);
    scene.add(vitre);
    // Cadre blanc, montant central et tablette
    const blanc = plastique('#f5f3ef', 0.5);
    const e = 0.055;
    [[largeur + 2 * e, e, cx, FENETRE.y1 + e / 2], [largeur + 2 * e, e, cx, FENETRE.y0 - e / 2], [e, hauteur, FENETRE.x0 - e / 2, cy], [e, hauteur, FENETRE.x1 + e / 2, cy], [0.035, hauteur, cx, cy]]
      .forEach(([l, h, x, y]) => {
        const montant = boite(l, h, 0.06, blanc);
        montant.position.set(x, y, 0.03);
        scene.add(montant);
      });
    const tablette = boite(largeur + 0.24, 0.035, 0.16, blanc);
    tablette.position.set(cx, FENETRE.y0 - e - 0.0175, 0.08);
    scene.add(tablette);
    // Deux rideaux gris (comme dans ma chambre) et leur tringle aux embouts en bois
    const geoRideau = new T.PlaneGeometry(0.44, 2.22, 44, 1);
    const p = geoRideau.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 52) * 0.028 + Math.sin(p.getX(i) * 17) * 0.012);
    geoRideau.computeVertexNormals();
    const tissu = new T.MeshStandardMaterial({ color: couleur('#77738a'), roughness: 0.95, side: T.DoubleSide });
    [FENETRE.x0 - 0.24, FENETRE.x1 + 0.24].forEach((x) => {
      const rideau = new T.Mesh(geoRideau, tissu);
      rideau.position.set(x, 1.19, 0.15);
      rideau.castShadow = true;
      rideau.receiveShadow = true;
      scene.add(rideau);
    });
    const tringle = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, largeur + 0.95, 12), materiauMetal);
    tringle.rotation.z = Math.PI / 2;
    tringle.position.set(cx, 2.32, 0.13);
    scene.add(tringle);
    const bois = new T.MeshStandardMaterial({ color: couleur('#d8c3a2'), roughness: 0.6 });
    [-1, 1].forEach((cote) => {
      const embout = new T.Mesh(new T.SphereGeometry(0.03, 16, 12), bois);
      embout.position.set(cx + cote * (largeur / 2 + 0.49), 2.32, 0.13);
      scene.add(embout);
    });
  })();
  // La fenêtre éclaire un peu le mur autour d'elle
  const lumiereVue = new T.PointLight(couleur(amb.vue), amb.forceVue, 3.2, 2);
  lumiereVue.position.set((FENETRE.x0 + FENETRE.x1) / 2, 1.5, 0.7);
  scene.add(lumiereVue);

  /* Cadres : mon CV, mes deux projets et une affiche sur la VR (on peut cliquer dessus) */
  const chargeur = new T.TextureLoader();
  const cliquables = [];
  const creerCadre = ({ largeur, hauteur, image, texture, x, y, lien, nouvelOnglet = false, marge = 0.035, teinte = '#1d1b1f' }) => {
    const cadre = new T.Group();
    const L = largeur + 2 * marge;
    const Ht = hauteur + 2 * marge;
    const ep = 0.022; // largeur de la baguette
    const materiauBaguette = new T.MeshStandardMaterial({ color: couleur(teinte), roughness: 0.45 });
    [[L + 2 * ep, ep, 0, Ht / 2 + ep / 2], [L + 2 * ep, ep, 0, -Ht / 2 - ep / 2], [ep, Ht, -L / 2 - ep / 2, 0], [ep, Ht, L / 2 + ep / 2, 0]]
      .forEach(([l, h, px, py]) => {
        const baguette = boite(l, h, 0.03, materiauBaguette);
        baguette.position.set(px, py, 0.015);
        cadre.add(baguette);
      });
    const passePartout = new T.Mesh(new T.PlaneGeometry(L, Ht), plastique('#f7f4ee', 0.9));
    passePartout.position.z = 0.008;
    passePartout.receiveShadow = true;
    const materiauImage = new T.MeshStandardMaterial({ roughness: 0.6, map: texture || null });
    if (image) {
      chargeur.load(image, (t) => {
        t.encoding = T.sRGBEncoding;
        t.anisotropy = 4;
        materiauImage.map = t;
        materiauImage.needsUpdate = true;
        if (pret && !idAnimation) rendre();
      });
    }
    const photo = new T.Mesh(new T.PlaneGeometry(largeur, hauteur), materiauImage);
    photo.position.z = 0.01;
    photo.receiveShadow = true;
    cadre.add(passePartout, photo);
    cadre.position.set(x, y, 0.002);
    scene.add(cadre);
    if (lien) cliquables.push({ objet: cadre, lien, nouvelOnglet });
    return cadre;
  };

  // Affiche « VR · AR » dessinée par le code (casque de réalité virtuelle)
  const afficheVR = (() => {
    const [toile, c] = creerToile(256, 358);
    const fond = c.createLinearGradient(0, 0, 256, 358);
    fond.addColorStop(0, '#2b1055');
    fond.addColorStop(0.55, '#7b2cbf');
    fond.addColorStop(1, '#ff4f9e');
    c.fillStyle = fond;
    c.fillRect(0, 0, 256, 358);
    c.strokeStyle = 'rgba(255, 255, 255, 0.12)'; // grille « numérique »
    c.lineWidth = 1;
    for (let y = 230; y < 358; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    for (let x = -256; x < 512; x += 32) { c.beginPath(); c.moveTo(128, 200); c.lineTo(x, 358); c.stroke(); }
    c.fillStyle = '#f5f0ff'; // casque
    c.beginPath();
    c.roundRect ? c.roundRect(48, 118, 160, 84, 30) : c.rect(48, 118, 160, 84);
    c.fill();
    c.fillStyle = '#22d3ee';
    [92, 164].forEach((x) => { c.beginPath(); c.ellipse(x, 160, 26, 22, 0, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = '#2b1055';
    c.beginPath();
    c.moveTo(118, 202);
    c.quadraticCurveTo(128, 180, 138, 202);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '700 44px "Space Grotesk", Arial, sans-serif';
    c.textAlign = 'center';
    c.fillText('VR · AR', 128, 74);
    c.font = '600 15px Inter, Arial, sans-serif';
    c.fillText('VEILLE TECHNOLOGIQUE', 128, 304);
    return versTexture(toile, { repetition: false });
  })();

  creerCadre({ largeur: 0.3, hauteur: 0.424, image: 'assets/cv-apercu.jpg', x: -1.42, y: 1.76, lien: 'assets/CV_Nathan_THIBAULT.pdf', nouvelOnglet: true, teinte: '#3b2a1c' });
  creerCadre({ largeur: 0.46, hauteur: 0.2, image: 'assets/projets/caillou-tour-apercu.jpg', x: -0.86, y: 1.92, lien: 'projets.html#caillou-tour' });
  creerCadre({ largeur: 0.4, hauteur: 0.152, image: 'assets/projets/pixelstar-accueil.jpg', x: -0.9, y: 1.56, lien: 'projets.html#pixelstar' });
  creerCadre({ largeur: 0.2, hauteur: 0.28, texture: afficheVR, x: -0.4, y: 1.52, lien: 'veille.html', marge: 0.022 });

  // Petit spot au plafond qui éclaire les cadres
  const spot = new T.SpotLight(couleur('#ffe1b8'), amb.forceSpot, 4.5, 0.6, 0.75, 2);
  spot.position.set(-0.95, 2.45, 1.4);
  spot.target.position.set(-0.95, 1.67, 0);
  scene.add(spot, spot.target);

  // Horloge murale : elle donne la vraie heure
  const horloge = (() => {
    const groupe = new T.Group();
    const rayon = 0.13;
    const [toile, c] = creerToile(256, 256);
    c.fillStyle = '#fbfaf7';
    c.beginPath();
    c.arc(128, 128, 128, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2a2a2e';
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const long = i % 5 === 0 ? 18 : 8;
      c.lineWidth = i % 5 === 0 ? 5 : 2;
      c.beginPath();
      c.moveTo(128 + Math.sin(angle) * 118, 128 - Math.cos(angle) * 118);
      c.lineTo(128 + Math.sin(angle) * (118 - long), 128 - Math.cos(angle) * (118 - long));
      c.stroke();
    }
    c.fillStyle = '#2a2a2e';
    c.font = '700 26px "Space Grotesk", Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    [[12, 0], [3, 1], [6, 2], [9, 3]].forEach(([n, k]) => c.fillText(String(n), 128 + Math.sin(k * Math.PI / 2) * 80, 128 - Math.cos(k * Math.PI / 2) * 80));
    c.font = '700 16px "Space Grotesk", Arial, sans-serif';
    c.fillStyle = '#e11d48';
    c.fillText('NT.', 128, 170);
    const cadran = new T.Mesh(new T.CircleGeometry(rayon * 0.96, 48), new T.MeshStandardMaterial({ map: versTexture(toile, { repetition: false }), roughness: 0.4 }));
    cadran.position.z = 0.033;
    const boitier = new T.Mesh(new T.CylinderGeometry(rayon, rayon, 0.026, 48), plastiqueNoir);
    boitier.rotation.x = Math.PI / 2;
    boitier.position.z = 0.013; // le fond du boîtier reste derrière le cadran
    const bord = new T.Mesh(new T.TorusGeometry(rayon, 0.01, 10, 48), plastiqueNoir);
    bord.position.z = 0.03;
    groupe.add(boitier, cadran, bord);
    const aiguille = (longueur, epaisseur, teinte, z) => {
      const geo = new T.BoxGeometry(epaisseur, longueur, 0.003);
      geo.translate(0, longueur / 2 - 0.012, 0); // tourne autour du centre
      const m = new T.Mesh(geo, plastique(teinte, 0.4));
      m.position.z = z;
      groupe.add(m);
      return m;
    };
    const heures = aiguille(0.07, 0.009, '#1f1f22', 0.034);
    const minutes = aiguille(0.1, 0.006, '#1f1f22', 0.036);
    const secondes = aiguille(0.11, 0.0025, '#e11d48', 0.038);
    groupe.position.set(-0.36, 2.05, 0.002);
    groupe.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(groupe);
    return { heures, minutes, secondes };
  })();
  const mettreAHeure = () => {
    const d = new Date();
    const sec = d.getSeconds() + d.getMilliseconds() / 1000;
    const min = d.getMinutes() + sec / 60;
    const h = (d.getHours() % 12) + min / 60;
    horloge.secondes.rotation.z = -(sec / 60) * Math.PI * 2;
    horloge.minutes.rotation.z = -(min / 60) * Math.PI * 2;
    horloge.heures.rotation.z = -(h / 12) * Math.PI * 2;
  };
  mettreAHeure();

  // Meuble bas blanc à casiers : livres, panier, enceinte et petit cactus
  (() => {
    const meuble = new T.Group();
    const blanc = plastique('#f3f1ec', 0.55);
    const L = 1.14;
    const Hm = 0.58;
    const P = 0.34;
    const ep = 0.025;
    [[L, ep, P, 0, Hm - ep / 2], [L, ep, P, 0, ep / 2 + 0.05], [ep, Hm - 0.05, P, -L / 2 + ep / 2, (Hm + 0.05) / 2], [ep, Hm - 0.05, P, L / 2 - ep / 2, (Hm + 0.05) / 2],
      [ep, Hm - 0.1, P - 0.02, -L / 6, (Hm + 0.05) / 2], [ep, Hm - 0.1, P - 0.02, L / 6, (Hm + 0.05) / 2]]
      .forEach(([l, h, p, x, y]) => {
        const planche = boite(l, h, p, blanc);
        planche.position.set(x, y, 0);
        meuble.add(planche);
      });
    const fond = boite(L, Hm, 0.01, plastique('#e7e3db', 0.8));
    fond.position.set(0, Hm / 2, -P / 2 + 0.005);
    meuble.add(fond);
    // Livres dans les deux premiers casiers
    const teintesLivres = ['#1f4e79', '#b5452d', '#2f6b4f', '#d9a441', '#5b3a76', '#e9e2d0', '#20222a', '#8a2f3c', '#3c7a8c'];
    [[-L / 2 + ep, -L / 6 - ep / 2], [-L / 6 + ep / 2, L / 6 - ep / 2]].forEach(([x0, x1]) => {
      let x = x0 + 0.01;
      while (x < x1 - 0.03) {
        const epaisseur = rand(0.025, 0.05);
        const hauteurLivre = rand(0.2, 0.3);
        const livre = boite(epaisseur, hauteurLivre, rand(0.17, 0.22), plastique(teintesLivres[Math.floor(hasard() * teintesLivres.length)], 0.7));
        livre.position.set(x + epaisseur / 2, 0.065 + hauteurLivre / 2, 0.02);
        if (hasard() < 0.12 && x < x1 - 0.12) livre.rotation.z = -0.25; // un livre penché
        meuble.add(livre);
        x += epaisseur + 0.004;
      }
    });
    // Panier en osier dans le dernier casier
    const panier = new T.Mesh(new T.CylinderGeometry(0.15, 0.13, 0.24, 24, 1, true), new T.MeshStandardMaterial({ color: couleur('#b48a5a'), roughness: 0.9, side: T.DoubleSide }));
    panier.position.set(L / 3, 0.065 + 0.12, 0.01);
    meuble.add(panier);
    // Sur le dessus : enceinte, pile de livres et cactus
    const enceinte = boite(0.13, 0.22, 0.12, plastiqueNoir);
    enceinte.position.set(-0.4, Hm + 0.11, 0.0);
    const membrane = new T.Mesh(new T.CircleGeometry(0.045, 24), plastique('#2c2c31', 0.8));
    membrane.position.set(-0.4, Hm + 0.08, 0.061);
    meuble.add(enceinte, membrane);
    [[0.3, 0.05, '#c2412d'], [0.27, 0.04, '#1f4e79'], [0.24, 0.035, '#e9e2d0']].reduce((y, [l, h, teinte]) => {
      const livre = boite(l * 0.75, h, l, plastique(teinte, 0.7));
      livre.position.set(0.05, y + h / 2, 0.0);
      livre.rotation.y = rand(-0.15, 0.15);
      meuble.add(livre);
      return y + h;
    }, Hm);
    const pot = new T.Mesh(new T.CylinderGeometry(0.05, 0.04, 0.08, 20), plastique('#d9775a', 0.7));
    pot.position.set(0.38, Hm + 0.04, 0.02);
    const cactus = new T.Mesh(new T.SphereGeometry(0.045, 16, 12), plastique('#4e8a4a', 0.7));
    cactus.scale.set(1, 1.6, 1);
    cactus.position.set(0.38, Hm + 0.13, 0.02);
    meuble.add(pot, cactus);
    meuble.position.set(-1.05, 0, P / 2 + 0.01);
    ombre(meuble);
    scene.add(meuble);
  })();

  // Guirlande lumineuse en festons en haut du mur
  const ampoules = [];
  (() => {
    const crochets = [-3.75, -2.6, -1.45, -0.25];
    const points = [];
    for (let i = 0; i < crochets.length - 1; i++) {
      for (let k = 0; k <= 12; k++) {
        if (i > 0 && k === 0) continue;
        const t = k / 12;
        const x = crochets[i] + (crochets[i + 1] - crochets[i]) * t;
        points.push(new T.Vector3(x, 2.4 - Math.sin(t * Math.PI) * 0.13, 0.03 + Math.sin(t * Math.PI) * 0.03));
      }
    }
    const fil = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 160, 0.0025, 5, false), plastique('#2c3a2c', 0.6));
    scene.add(fil);
    const materiauAmpoule = new T.MeshBasicMaterial({ color: couleur('#ffd27a'), toneMapped: false });
    points.forEach((point, i) => {
      if (i % 2) return;
      const ampoule = new T.Mesh(new T.SphereGeometry(0.012, 10, 8), materiauAmpoule);
      ampoule.position.copy(point).add(new T.Vector3(0, -0.018, 0));
      scene.add(ampoule);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: textureLueur, color: 0xffc56b, transparent: true, opacity: amb.guirlande, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.setScalar(0.13);
      halo.position.copy(ampoule.position);
      scene.add(halo);
      ampoules.push({ halo, phase: rand(0, Math.PI * 2) });
    });
  })();
  const lumieresGuirlande = [-2.0].map((x) => {
    const l = new T.PointLight(couleur('#ffc56b'), amb.forceGuirlande, 3.2, 2);
    l.position.set(x, 2.2, 0.35);
    scene.add(l);
    return l;
  });
  const scintiller = (t) => {
    ampoules.forEach(({ halo, phase }) => {
      halo.material.opacity = amb.guirlande * (amb.nuit ? 0.8 + Math.sin(t * 2.2 + phase) * 0.2 : 1);
    });
  };

  /* ---------- Cadrage : le bureau occupe la place laissée libre par le texte ---------- */
  // Caméra assez loin, à hauteur d'yeux : peu de déformation, comme une photo prise avec un zoom
  const DIRECTION_CAMERA = new T.Vector3(0.12, 0.1, 1).normalize();
  const DISTANCE_CAMERA = 7;
  // Zones du décor à montrer : tout le bureau sur grand écran, le centre sur téléphone
  const CADRES = {
    large: { centre: new T.Vector3(1.35, 0.86, 0.3), largeur: 2.95, hauteur: 1.7 },
    etroit: { centre: new T.Vector3(1.15, 1.0, 0.3), largeur: 2.3, hauteur: 1.25 },
  };
  let W = 0;
  let H = 0;
  let cadre = CADRES.large;
  const visee = new T.Vector3();

  const cadrer = () => {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    renderer.setSize(W, H, false);
    const boiteHero = hero.getBoundingClientRect();
    const texte = hero.querySelector('.hero__content');
    const boiteTexte = texte ? texte.getBoundingClientRect() : null;
    const large = W >= 900 && W > H * 1.05;
    let zone;
    if (large) {
      // À droite du texte
      const gauche = Math.min(W * 0.6, Math.max(W * 0.36, (boiteTexte ? boiteTexte.right - boiteHero.left : W * 0.45) - 80));
      zone = { x: gauche, y: 120, l: W - gauche - 10, h: H - 130 };
    } else {
      // Sous le texte
      const haut = boiteTexte ? boiteTexte.bottom - boiteHero.top + 10 : H * 0.55;
      zone = { x: 0, y: haut, l: W, h: Math.max(150, H - haut) };
    }
    cadre = large ? CADRES.large : CADRES.etroit;
    const pixelsParMetre = Math.min(zone.l / cadre.largeur, zone.h / cadre.hauteur);
    const pixelsParRadian = pixelsParMetre * DISTANCE_CAMERA;
    const cx = zone.x + zone.l / 2;
    const cy = zone.y + zone.h / 2;
    // « Décentrement » de l'objectif : le bureau est placé dans la zone libre sans tourner la caméra
    const pleineLargeur = 2 * Math.max(cx, W - cx);
    const pleineHauteur = 2 * Math.max(cy, H - cy);
    camera.fov = T.MathUtils.radToDeg(2 * Math.atan(pleineHauteur / 2 / pixelsParRadian));
    camera.aspect = pleineLargeur / pleineHauteur;
    camera.setViewOffset(pleineLargeur, pleineHauteur, pleineLargeur / 2 - cx, pleineHauteur / 2 - cy, W, H);
    camera.updateProjectionMatrix();
    placerCamera();
    return true;
  };

  const souris = { x: 0, y: 0, lisseX: 0, lisseY: 0 };
  const placerCamera = () => {
    camera.position.copy(cadre.centre).addScaledVector(DIRECTION_CAMERA, DISTANCE_CAMERA);
    camera.position.x += souris.lisseX * 0.25;
    camera.position.y += souris.lisseY * 0.12;
    visee.copy(cadre.centre);
    camera.lookAt(visee);
  };

  /* ---------- Ambiance jour / nuit ---------- */
  const appliquerAmbiance = () => {
    renderer.toneMappingExposure = amb.exposition;
    scene.environment = amb.nuit ? environnements.nuit : environnements.jour;
    lumiereAmbiante.color.copy(couleur(amb.ciel));
    lumiereAmbiante.groundColor.copy(couleur(amb.sol));
    lumiereAmbiante.intensity = amb.forceCiel;
    fenetre.color.copy(couleur(amb.fenetre));
    fenetre.intensity = amb.forceFenetre;
    plafonnier.color.copy(couleur(amb.plafonnier));
    plafonnier.intensity = amb.forcePlafonnier;
    lumiereEcran.intensity = amb.forceEcran;
    materiauNeon.opacity = amb.neon;
    lumiereNeon.intensity = amb.forceNeon;
    materiauPoussieres.opacity = amb.poussiere;
    lumiereVue.color.copy(couleur(amb.vue));
    lumiereVue.intensity = amb.forceVue;
    spot.intensity = amb.forceSpot;
    lumieresGuirlande.forEach((l) => { l.intensity = amb.forceGuirlande; });
    scintiller(temps);
    dessinerVue();
    scene.traverse((o) => {
      if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = amb.nuit ? 0.6 : 0.55;
    });
    mettreAJourLumieres(temps);
  };

  /** Couleurs des LED : blanc chaud le jour, arc-en-ciel qui défile la nuit. Les ventilateurs du PC sont toujours RGB. */
  const teinteRGB = new T.Color();
  const mettreAJourLumieres = (t) => {
    const teinteLed = amb.nuit ? teinteRGB.setHSL((t * 0.04) % 1, 0.85, 0.55) : teinteRGB.set('#ffd7a3');
    materiauRuban.color.copy(teinteLed);
    lumieresLed.forEach((l) => { l.color.copy(teinteLed); l.intensity = amb.forceLed; });
    lumiereDos.color.copy(amb.nuit ? teinteLed : teinteRGB.set('#ffe6c4'));
    lumiereDos.intensity = amb.nuit ? 1.4 : 0.15;
    lueurDos.material.color.copy(lumiereDos.color);
    lueurDos.material.opacity = amb.nuit ? 0.5 : 0.06;
    lueurRuban.material.color.copy(materiauRuban.color);
    lueurRuban.material.opacity = amb.lueur * 0.6;
    anneauxRGB.forEach(({ materiau, decalage }) => materiau.color.setHSL((t * 0.08 + decalage) % 1, 0.9, amb.nuit ? 0.58 : 0.5));
    lueurs.forEach((l, i) => {
      if (l === lueurDos || l === lueurRuban) return;
      l.material.color.setHSL((t * 0.08 + 0.6 + i * 0.12) % 1, 0.9, 0.55);
      l.material.opacity = amb.lueur * 0.7;
    });
  };

  /* ---------- Animation ---------- */
  let temps = 0;
  let prochainDessin = 0;
  let phaseEcran = { etape: 'code', duree: 0 };
  const redemarrerEcran = () => {
    etatEcran.caracteres = 0;
    etatEcran.commande = 0;
    etatEcran.resultat = false;
    phaseEcran = { etape: 'code', duree: 0 };
  };

  /** Le code se tape tout seul, puis on lance les tests dans le terminal, et on recommence. */
  const animerEcran = (dt) => {
    phaseEcran.duree += dt;
    if (phaseEcran.etape === 'code') {
      etatEcran.caracteres = Math.min(TOTAL_CARACTERES, Math.floor(phaseEcran.duree * 34));
      if (etatEcran.caracteres >= TOTAL_CARACTERES) phaseEcran = { etape: 'commande', duree: 0 };
    } else if (phaseEcran.etape === 'commande') {
      etatEcran.commande = Math.min(COMMANDE.length, Math.floor(Math.max(0, phaseEcran.duree - 0.8) * 9));
      if (phaseEcran.duree > 3.2) { etatEcran.resultat = true; phaseEcran = { etape: 'pause', duree: 0 }; }
    } else if (phaseEcran.duree > 6) redemarrerEcran();
    etatEcran.curseur = Math.floor(temps * 2) % 2 === 0 || phaseEcran.etape === 'code';
    if (temps >= prochainDessin) { // 12 images par seconde suffisent pour l'écran
      dessinerEcran();
      prochainDessin = temps + 1 / 12;
    }
  };

  const animer = (dt) => {
    temps += dt;
    animerEcran(dt);
    mettreAJourLumieres(temps);
    helicesPC.forEach((helice, i) => { helice.rotation.z += dt * (14 + i); });
    if (amb.poussiere) bougerPoussieres(temps);
    mettreAHeure();
    scintiller(temps);
    ventilateur.helice.rotation.z -= dt * 22;
    ventilateur.tete.rotation.y = Math.sin(temps * 0.35) * 0.45; // le ventilateur oscille
    souris.lisseX += (souris.x - souris.lisseX) * 0.05;
    souris.lisseY += (souris.y - souris.lisseY) * 0.05;
    placerCamera();
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
    appliquerAmbiance();
    dessinerEcran(); // image fixe : tout le code est déjà écrit et les tests sont passés
    if (!enPause) redemarrerEcran();
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
    toggle.setAttribute('aria-label', enPause ? 'Lancer l’animation du bureau' : 'Mettre en pause l’animation du bureau');
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

  // Cadres du mur : un clic ouvre le CV, la page Projets ou la page Veille
  const lancer = new T.Raycaster();
  const pointeur = new T.Vector2();
  let survole = null;
  const cadreSousLaSouris = (e) => {
    if (!pret || e.target.closest('a, button, input, .hero__content')) return null;
    const r = canvas.getBoundingClientRect();
    pointeur.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    lancer.setFromCamera(pointeur, camera);
    const touche = lancer.intersectObjects(cliquables.map((c) => c.objet), true)[0];
    let objet = touche ? touche.object : null;
    while (objet && !cliquables.some((c) => c.objet === objet)) objet = objet.parent;
    return objet ? cliquables.find((c) => c.objet === objet) : null;
  };
  hero.addEventListener('mousemove', (e) => {
    const cible = cadreSousLaSouris(e);
    if (cible === survole) return;
    if (survole) survole.objet.scale.setScalar(1);
    survole = cible;
    if (survole) survole.objet.scale.setScalar(1.04); // le cadre « ressort » un peu
    hero.style.cursor = survole ? 'pointer' : '';
    if (!idAnimation) rendre();
  });
  hero.addEventListener('click', (e) => {
    const cible = cadreSousLaSouris(e);
    if (!cible) return;
    if (cible.nouvelOnglet) window.open(cible.lien, '_blank', 'noopener');
    else window.location.href = cible.lien;
  });

  let delai;
  window.addEventListener('resize', () => {
    clearTimeout(delai);
    delai = setTimeout(() => { if (cadrer() && pret) rendre(); }, 150);
  });

  new MutationObserver(() => {
    amb = root.getAttribute('data-theme') === 'dark' ? AMBIANCES.dark : AMBIANCES.light;
    appliquerAmbiance();
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
