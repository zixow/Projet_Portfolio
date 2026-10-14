/* =========================================================
   Accueil : désert et dinosaures en 3D réaliste (Three.js r128)
   ---------------------------------------------------------
   - Ciel physique (modèle de Preetham, module Sky de Three.js)
   - Dinosaures « organiques » : un tube lisse qui suit une colonne
     vertébrale et dont l'épaisseur varie, pattes articulées
   - Textures (sable, peau, roche) générées par le code : pas d'image
   Si Three.js ou WebGL ne sont pas disponibles, la fonction renvoie
   false et script.js affiche la version 2D en pixel art.
   ========================================================= */

window.demarrerDesert3D = function ({ canvas, hero, toggle, root, reducedMotion }) {
  if (!window.THREE || !window.THREE.Sky) return false;
  const T = window.THREE;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true });
  } catch (erreur) {
    return false; // WebGL indisponible : on garde la version 2D
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = T.sRGBEncoding;           // couleurs correctes à l'écran
  renderer.toneMapping = T.ACESFilmicToneMapping;     // rendu « cinéma » des lumières fortes
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;       // ombres douces

  const rand = (min, max) => min + Math.random() * (max - min);
  const lisse = (x, a, b) => T.MathUtils.smoothstep(x, a, b);
  /** Couleur CSS → couleur « linéaire » utilisée par les calculs de lumière. */
  const couleur = (hex) => new T.Color(hex).convertSRGBToLinear();

  /* ---------- Ambiances : journée (thème clair) ou nuit (thème sombre) ---------- */
  const AMBIANCES = {
    light: {
      nuit: false, exposition: 0.5, brouillard: '#e6dccb',
      sable: '#e7bd86', roche: '#ffffff', talus: '#f0cfa4', cactus: '#4e7a3c', rocher: '#a87452', buisson: '#8a7650',
      nuageOpacite: 0.6, poussiere: 0.5,
      soleil: '#ffd29a', forceSoleil: 2.6, cielLumiere: '#a9c8ff', solLumiere: '#d9a46a', forceCiel: 0.45,
    },
    dark: {
      nuit: true, exposition: 1.0, brouillard: '#2b1c3d',
      sable: '#6b5a86', roche: '#5b4a78', talus: '#6e5e8e', cactus: '#3b6a55', rocher: '#5e4c74', buisson: '#4e4466',
      nuageOpacite: 0.12, poussiere: 0.15,
      soleil: '#a8b8ff', forceSoleil: 0.9, cielLumiere: '#4b4f8f', solLumiere: '#1d1428', forceCiel: 0.7,
    },
  };
  let amb = root.getAttribute('data-theme') === 'dark' ? AMBIANCES.dark : AMBIANCES.light;

  /* ---------- Textures générées par le code ---------- */

  /** Bruit « répétable » : une grille de valeurs aléatoires lissée, dont les bords se raccordent. */
  const creerBruit = (grille) => {
    const valeurs = Array.from({ length: grille * grille }, () => Math.random());
    const v = (x, y) => valeurs[((y % grille + grille) % grille) * grille + ((x % grille + grille) % grille)];
    return (u, w) => {
      const x = u * grille;
      const y = w * grille;
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = (x - x0) * (x - x0) * (3 - 2 * (x - x0));
      const fy = (y - y0) * (y - y0) * (3 - 2 * (y - y0));
      const haut = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * fx;
      const bas = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * fx;
      return haut + (bas - haut) * fy;
    };
  };

  /** Dessine une texture pixel par pixel : peindre(u, v) renvoie [r, g, b] entre 0 et 255. */
  const creerTexture = (taille, peindre, couleurs = true) => {
    const toile = document.createElement('canvas');
    toile.width = toile.height = taille;
    const ctx = toile.getContext('2d');
    const image = ctx.createImageData(taille, taille);
    for (let y = 0; y < taille; y++) {
      for (let x = 0; x < taille; x++) {
        const [r, g, b] = peindre(x / taille, y / taille);
        const i = (y * taille + x) * 4;
        image.data[i] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new T.CanvasTexture(toile);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    if (couleurs) texture.encoding = T.sRGBEncoding;
    texture.anisotropy = 4;
    return texture;
  };

  /** « Normal map » : simule un relief fin (rides, écailles) à partir d'une fonction de hauteur. */
  const creerRelief = (taille, hauteur, force) => {
    const h = new Float32Array(taille * taille);
    for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) h[y * taille + x] = hauteur(x / taille, y / taille);
    const lire = (x, y) => h[((y + taille) % taille) * taille + ((x + taille) % taille)];
    return creerTexture(taille, (u, v) => {
      const x = Math.round(u * taille);
      const y = Math.round(v * taille);
      const nx = (lire(x - 1, y) - lire(x + 1, y)) * force;
      const ny = (lire(x, y - 1) - lire(x, y + 1)) * force;
      const longueur = Math.hypot(nx, ny, 1);
      return [(nx / longueur * 0.5 + 0.5) * 255, (ny / longueur * 0.5 + 0.5) * 255, (1 / longueur * 0.5 + 0.5) * 255];
    }, false);
  };

  const bruitLarge = creerBruit(4);
  const bruitMoyen = creerBruit(16);
  const bruitFin = creerBruit(64);

  // Sable : grain clair / foncé + rides laissées par le vent
  const sableCouleur = creerTexture(256, (u, v) => {
    const g = 0.88 + bruitFin(u, v) * 0.12 + bruitMoyen(u, v) * 0.05;
    return [255 * g, 255 * g, 255 * g];
  });
  const sableRelief = creerRelief(256, (u, v) => Math.sin(Math.PI * 2 * (u * 9 + bruitLarge(u, v) * 0.8 + v * 0.5)) * 0.6 + bruitFin(u, v) * 0.5, 3);

  // Peau : petites écailles irrégulières
  const peauRelief = creerRelief(256, (u, v) => {
    const cellules = Math.abs(Math.sin(u * Math.PI * 2 * 24 + bruitMoyen(u, v) * 3) * Math.sin(v * Math.PI * 2 * 12 + bruitMoyen(v, u) * 3));
    return cellules * 0.8 + bruitFin(u, v) * 0.4;
  }, 2.2);

  // Roche des plateaux : couches horizontales de couleurs (strates)
  const strates = ['#c4683e', '#d98a55', '#b5532f', '#e2a36b', '#a9472a', '#cf7a48'].map((c) => new T.Color(c));
  const rocheCouleur = creerTexture(256, (u, v) => {
    const position = (v * 7 + bruitMoyen(u, v) * 0.6) % 1;
    const c = strates[Math.floor(position * strates.length)].clone().multiplyScalar(0.85 + bruitFin(u, v) * 0.25);
    return [c.r * 255, c.g * 255, c.b * 255];
  });
  const rocheRelief = creerRelief(256, (u, v) => Math.sin(v * Math.PI * 2 * 14 + bruitMoyen(u, v) * 4) * 0.5 + bruitFin(u, v), 2.5);

  /* ---------- Scène, caméra, lumières ---------- */
  const scene = new T.Scene();
  const CAMERA_HAUTEUR = 2.2;
  const CAMERA_Z = 24;
  const camera = new T.PerspectiveCamera(50, 1, 0.5, 2000);
  camera.position.set(0, CAMERA_HAUTEUR, CAMERA_Z); // la caméra regarde droit devant (vers -z)

  // Ciel physique : la couleur dépend de la position du soleil et de la « pollution » de l'air
  const ciel = new T.Sky();
  ciel.scale.setScalar(1500);
  const uniformes = ciel.material.uniforms;
  uniformes.turbidity.value = 4;          // air sec du désert : ciel clair
  uniformes.rayleigh.value = 1.1;
  uniformes.mieCoefficient.value = 0.006;
  uniformes.mieDirectionalG.value = 0.82;
  const directionSoleil = new T.Vector3().setFromSphericalCoords(1, T.MathUtils.degToRad(90 - 24), T.MathUtils.degToRad(118));
  uniformes.sunPosition.value.copy(directionSoleil);
  scene.add(ciel);

  // Éclairage par l'environnement : le ciel éclaire les objets et s'y reflète (comme dans la réalité)
  const pmrem = new T.PMREMGenerator(renderer);
  let environnement = null;
  const majEnvironnement = () => {
    if (environnement) environnement.dispose();
    environnement = amb.nuit ? null : pmrem.fromScene(ciel);
    scene.environment = environnement ? environnement.texture : null;
    // Le ciel ne doit pas « délaver » les couleurs : il s'ajoute doucement aux autres lumières
    scene.traverse((objet) => {
      if (objet.material && objet.material.isMeshStandardMaterial) objet.material.envMapIntensity = 0.45;
    });
  };

  scene.fog = new T.Fog(couleur(amb.brouillard), 90, 520); // le lointain se fond dans la brume

  const lumiereCiel = new T.HemisphereLight(couleur(amb.cielLumiere), couleur(amb.solLumiere), amb.forceCiel);
  scene.add(lumiereCiel);

  const soleil = new T.DirectionalLight(couleur(amb.soleil), amb.forceSoleil);
  soleil.castShadow = true;
  soleil.shadow.mapSize.set(2048, 2048);
  Object.assign(soleil.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 400 });
  soleil.shadow.bias = -0.0004;
  soleil.shadow.normalBias = 0.03;
  scene.add(soleil, soleil.target);
  const placerSoleil = () => {
    const direction = amb.nuit ? new T.Vector3(-0.5, 0.75, 0.45).normalize() : directionSoleil;
    soleil.position.copy(direction).multiplyScalar(150);
  };
  placerSoleil();

  const lumiereAppoint = new T.DirectionalLight(couleur('#ffe7c4'), 0.35); // éclaire un peu la face visible des dinosaures
  lumiereAppoint.position.set(-20, 15, 40);
  scene.add(lumiereAppoint);

  // Nuit : dégradé, étoiles et lune dessinés dans une texture d'arrière-plan
  const nuitCanvas = document.createElement('canvas');
  const nuitTexture = new T.CanvasTexture(nuitCanvas);
  nuitTexture.encoding = T.sRGBEncoding;

  /* ---------- Sol : dunes à crêtes au loin, sable plat près des dinosaures ---------- */
  const solGeo = new T.PlaneGeometry(700, 380, 220, 120);
  solGeo.rotateX(-Math.PI / 2);
  solGeo.translate(0, 0, -160);
  /** Hauteur du sol en (x, z) : sert au terrain et pour poser cailloux et buissons. */
  const hauteurSol = (x, z) => {
    const loin = lisse(-z, 14, 55);
    const vague = Math.sin(x * 0.035 + z * 0.012 + Math.sin(z * 0.02) * 1.5);
    const dunes = Math.pow(1 - Math.abs(vague), 2.2) * 9 + Math.sin(x * 0.011 - z * 0.017) * 3; // crêtes nettes
    return loin * dunes + (1 - loin) * Math.sin(x * 0.3 + z * 0.5) * 0.05;
  };
  const pos = solGeo.attributes.position;
  const nuancesSable = creerBruit(8);
  const couleursSol = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, hauteurSol(x, z));
    // Nuances du sable : zones plus claires ou plus foncées et traînées laissées par le vent
    const n = nuancesSable(((x / 700) % 1 + 1) % 1, ((z / 380) % 1 + 1) % 1);
    const trainee = 0.5 + 0.5 * Math.sin(x * 0.05 + z * 0.15 + n * 4);
    const f = 0.86 + n * 0.16 + trainee * 0.05;
    couleursSol.set([f, f * 0.985, f * 0.96], i * 3);
  }
  solGeo.setAttribute('color', new T.BufferAttribute(couleursSol, 3));
  solGeo.computeVertexNormals();
  sableCouleur.repeat.set(140, 76);
  sableRelief.repeat.set(140, 76);
  const materiauSable = new T.MeshStandardMaterial({
    color: couleur(amb.sable), map: sableCouleur, normalMap: sableRelief, vertexColors: true,
    normalScale: new T.Vector2(0.7, 0.7), roughness: 0.95, metalness: 0,
  });
  const sol = new T.Mesh(solGeo, materiauSable);
  sol.receiveShadow = true;
  scene.add(sol);

  /* ---------- Plateaux rocheux (mesas) à l'horizon ---------- */
  rocheCouleur.repeat.set(3, 1);
  rocheRelief.repeat.set(3, 1);
  const materiauRoche = new T.MeshStandardMaterial({
    color: couleur(amb.roche), map: rocheCouleur, normalMap: rocheRelief, roughness: 1, metalness: 0,
  });
  const materiauTalus = materiauRoche.clone(); // éboulis au pied des falaises : même roche, plus sableuse
  materiauTalus.color = couleur(amb.talus);
  for (let i = 0; i < 8; i++) {
    const rayon = rand(16, 32);
    const hauteur = rand(20, 44);
    const geo = new T.CylinderGeometry(rayon * 0.8, rayon * 1.05, hauteur, 32, 12);
    const p = geo.attributes.position;
    const irregularite = creerBruit(8);
    for (let k = 0; k < p.count; k++) {
      const angle = Math.atan2(p.getZ(k), p.getX(k));
      const y = p.getY(k) / hauteur + 0.5;
      const facteur = 1 + (irregularite((angle / (Math.PI * 2) + 1) % 1, y) - 0.5) * 0.35;
      p.setX(k, p.getX(k) * facteur);
      p.setZ(k, p.getZ(k) * facteur);
    }
    geo.computeVertexNormals();
    const mesa = new T.Mesh(geo, materiauRoche);
    mesa.position.set(-300 + i * 85 + rand(-20, 20), hauteur / 2 - 5, rand(-310, -210));
    mesa.rotation.y = rand(0, Math.PI);
    mesa.receiveShadow = true;
    const talus = new T.Mesh(new T.CylinderGeometry(rayon * 1.0, rayon * 1.75, hauteur * 0.3, 32, 2), materiauTalus);
    talus.position.set(mesa.position.x, -5 + hauteur * 0.15, mesa.position.z);
    scene.add(mesa, talus);
  }

  /* ---------- Cactus (saguaros côtelés) et rochers ---------- */
  const materiauCactus = new T.MeshStandardMaterial({ color: couleur(amb.cactus), roughness: 0.75 });
  const cotes = (geo, nombre, profondeur) => {
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const angle = Math.atan2(p.getZ(k), p.getX(k));
      const f = 1 + Math.cos(angle * nombre) * profondeur;
      p.setX(k, p.getX(k) * f);
      p.setZ(k, p.getZ(k) * f);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const ombre = (objet) => objet.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const creerCactus = (taille) => {
    const cactus = new T.Group();
    const tronc = new T.Mesh(cotes(new T.CylinderGeometry(0.42, 0.46, 4.2, 24, 8), 12, 0.07), materiauCactus);
    tronc.position.y = 2.1;
    const sommet = new T.Mesh(cotes(new T.SphereGeometry(0.42, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), 12, 0.07), materiauCactus);
    sommet.position.y = 4.2;
    cactus.add(tronc, sommet);
    [[1, 1.6, 1.3], [-1, 2.3, 0.9]].forEach(([cote, hauteur, longueur]) => {
      const courbe = new T.CatmullRomCurve3([
        new T.Vector3(0, hauteur, 0), new T.Vector3(cote * 0.75, hauteur + 0.05, 0),
        new T.Vector3(cote * 0.95, hauteur + 0.5, 0), new T.Vector3(cote * 0.97, hauteur + 0.5 + longueur, 0),
      ]);
      const bras = new T.Mesh(new T.TubeGeometry(courbe, 20, 0.28, 14, false), materiauCactus);
      const bout = new T.Mesh(new T.SphereGeometry(0.28, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), materiauCactus);
      bout.position.set(cote * 0.97, hauteur + 0.5 + longueur, 0);
      cactus.add(bras, bout);
    });
    cactus.scale.setScalar(taille);
    cactus.rotation.y = rand(-0.6, 0.6);
    ombre(cactus);
    return cactus;
  };
  [[-30, -14], [-12, -19], [9, -16], [27, -12], [-22, 6], [17, 8], [38, -1], [-40, -1], [-60, -30], [55, -35]].forEach(([x, z]) => {
    const cactus = creerCactus(rand(0.75, 1.1));
    cactus.position.set(x + rand(-3, 3), 0, z);
    scene.add(cactus);
  });

  const materiauRocher = new T.MeshStandardMaterial({ color: couleur(amb.rocher), roughness: 0.95 });
  const bruitRocher = creerBruit(6);
  for (let i = 0; i < 16; i++) {
    const geo = new T.IcosahedronGeometry(1, 2);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const f = 0.75 + bruitRocher((p.getX(k) + 1) / 2, (p.getY(k) + p.getZ(k) + 2) / 4) * 0.5;
      p.setXYZ(k, p.getX(k) * f, p.getY(k) * f, p.getZ(k) * f);
    }
    geo.computeVertexNormals();
    const rocher = new T.Mesh(geo, materiauRocher);
    const zRocher = Math.random() < 0.5 ? rand(-22, -12) : rand(3, 12); // hors du chemin des dinosaures
    rocher.position.set(rand(-55, 55), 0.1, zRocher);
    rocher.scale.set(rand(0.4, 1.1), rand(0.25, 0.6), rand(0.4, 1.0));
    rocher.rotation.y = rand(0, Math.PI);
    ombre(rocher);
    scene.add(rocher);
  }

  /* ---------- Petits détails du désert : cailloux, buissons secs, virevoltant, poussière ---------- */
  // Hors du chemin des dinosaures (voies z ≈ -10 à 1)
  const zHorsChemin = () => (Math.random() < 0.5 ? rand(-30, -12) : rand(3, 14));

  // 450 cailloux dessinés en une seule fois (InstancedMesh : rapide à afficher)
  const cailloux = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), materiauRocher, 450);
  const matrice = new T.Matrix4();
  const rotation = new T.Quaternion();
  const echelle = new T.Vector3();
  const position = new T.Vector3();
  for (let i = 0; i < 450; i++) {
    const taille = Math.pow(Math.random(), 2) * 0.22 + 0.04;
    const x = rand(-75, 75);
    const z = rand(-30, 15);
    position.set(x, hauteurSol(x, z) + taille * 0.2, z);
    rotation.setFromEuler(new T.Euler(rand(0, 3), rand(0, 3), rand(0, 3)));
    echelle.set(taille * rand(0.8, 1.4), taille * rand(0.4, 0.8), taille * rand(0.8, 1.3));
    matrice.compose(position, rotation, echelle);
    cailloux.setMatrixAt(i, matrice);
  }
  cailloux.receiveShadow = true;
  scene.add(cailloux);

  const materiauBuisson = new T.MeshStandardMaterial({ color: couleur(amb.buisson), roughness: 1 });
  const creerBuisson = (taille) => {
    const buisson = new T.Group();
    for (let i = 0; i < 16; i++) {
      const longueur = rand(0.5, 1.1);
      const brindille = new T.Group();
      const tige = new T.Mesh(new T.CylinderGeometry(0.015, 0.035, longueur, 4), materiauBuisson);
      tige.position.y = longueur / 2;
      brindille.add(tige);
      if (Math.random() < 0.6) { // petite touffe de feuilles sèches au bout
        const touffe = new T.Mesh(new T.IcosahedronGeometry(rand(0.07, 0.14), 0), materiauBuisson);
        touffe.position.y = longueur;
        brindille.add(touffe);
      }
      brindille.rotation.set(rand(-1.1, 1.1), rand(0, Math.PI * 2), rand(-1.1, 1.1));
      buisson.add(brindille);
    }
    buisson.scale.setScalar(taille);
    ombre(buisson);
    return buisson;
  };
  for (let i = 0; i < 20; i++) {
    const buisson = creerBuisson(rand(0.6, 1.3));
    const x = rand(-60, 60);
    const z = zHorsChemin();
    buisson.position.set(x, hauteurSol(x, z), z);
    scene.add(buisson);
  }

  // Virevoltant : boule de branches sèches qui roule avec le vent
  const virevoltant = new T.Group();
  for (let i = 0; i < 9; i++) {
    const points = Array.from({ length: 6 }, () => {
      const v = new T.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
      return v.multiplyScalar(rand(0.45, 0.72));
    });
    virevoltant.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points, true), 40, 0.025, 4, true), materiauBuisson));
  }
  ombre(virevoltant);
  scene.add(virevoltant);
  const roulade = { z: 5, rayon: 0.7, vitesse: 4.5, x: 0 };

  // Poussière en suspension qui brille dans la lumière
  const nbGrains = 260;
  const grains = new Float32Array(nbGrains * 3);
  for (let i = 0; i < nbGrains; i++) grains.set([rand(-60, 60), rand(0.2, 7), rand(-25, 16)], i * 3);
  const geoPoussiere = new T.BufferGeometry();
  geoPoussiere.setAttribute('position', new T.BufferAttribute(grains, 3));
  const textureGrain = (() => {
    const toile = document.createElement('canvas');
    toile.width = toile.height = 32;
    const c = toile.getContext('2d');
    const degrade = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    degrade.addColorStop(0, 'rgba(255,255,255,1)');
    degrade.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = degrade;
    c.fillRect(0, 0, 32, 32);
    return new T.CanvasTexture(toile);
  })();
  const materiauPoussiere = new T.PointsMaterial({
    color: couleur('#fff1d6'), map: textureGrain, size: 0.09, transparent: true, opacity: amb.poussiere, depthWrite: false,
  });
  const poussiere = new T.Points(geoPoussiere, materiauPoussiere);
  scene.add(poussiere);

  /* ---------- Nuages : taches douces et transparentes au loin ---------- */
  const nuageTexture = (() => {
    const toile = document.createElement('canvas');
    toile.width = 256;
    toile.height = 128;
    const c = toile.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const x = rand(40, 216);
      const y = rand(50, 90) - Math.sin((x - 40) / 176 * Math.PI) * 20;
      const r = rand(14, 34);
      const degrade = c.createRadialGradient(x, y, 0, x, y, r);
      degrade.addColorStop(0, 'rgba(255,255,255,0.55)');
      degrade.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = degrade;
      c.fillRect(0, 0, 256, 128);
    }
    const texture = new T.CanvasTexture(toile);
    texture.encoding = T.sRGBEncoding;
    return texture;
  })();
  const materiauNuage = new T.SpriteMaterial({
    map: nuageTexture, transparent: true, opacity: amb.nuageOpacite, depthWrite: false, fog: false,
    toneMapped: false, // les nuages restent bien blancs
  });
  const nuages = Array.from({ length: 6 }, () => {
    const nuage = new T.Sprite(materiauNuage);
    nuage.userData = { vitesse: rand(1.5, 3), hauteurEcran: rand(0.04, 0.3), largeur: rand(70, 130) };
    nuage.scale.set(nuage.userData.largeur, nuage.userData.largeur / 2, 1);
    scene.add(nuage);
    return nuage;
  });

  /* ---------- Dinosaures « organiques » ---------- */

  // Texture de peau partagée : relief d'écailles ; la couleur vient de chaque sommet (dos foncé, ventre clair)
  peauRelief.repeat.set(6, 2);
  const materiauPeau = new T.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0, normalMap: peauRelief, normalScale: new T.Vector2(0.55, 0.55),
  });

  /** Interpolation douce entre des valeurs clés [[t, a, b], ...] (t de 0 à 1). */
  const profil = (cles) => (t) => {
    let k = 0;
    while (k < cles.length - 2 && t > cles[k + 1][0]) k++;
    const [t0, a0, b0] = cles[k];
    const [t1, a1, b1] = cles[k + 1];
    const s = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const f = (1 - Math.cos(Math.PI * s)) / 2;
    return [a0 + (a1 - a0) * f, (b0 ?? a0) + ((b1 ?? a1) - (b0 ?? a0)) * f];
  };

  /**
   * Corps organique : un tube qui suit une « colonne vertébrale » (points dans le plan de profil)
   * et dont la hauteur et la largeur varient selon les valeurs clés.
   * Couleurs : dos foncé, ventre clair et rayures facultatives sur le dos.
   */
  const creerCorps = (points, cles, teintes, { segments = 80, tours = 22, rayures = 0, frequence = 8, z = 0 } = {}) => {
    const courbe = new T.CatmullRomCurve3(points.map(([x, y]) => new T.Vector3(x, y, z)));
    const rayon = profil(cles);
    const dos = couleur(teintes.dos);
    const ventre = couleur(teintes.ventre);
    const rayure = couleur(teintes.rayure || teintes.dos);
    const pointe = teintes.pointe ? couleur(teintes.pointe) : null; // ex. bec plus foncé
    const positions = [];
    const parametres = []; // position de chaque sommet le long du corps (0 = bout de la queue, 1 = museau)
    const uvs = [];
    const couleurs = [];
    const indices = [];
    const cote = new T.Vector3(0, 0, 1);
    const haut = new T.Vector3();
    const c = new T.Color();

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = courbe.getPointAt(t);
      haut.crossVectors(cote, courbe.getTangentAt(t)).normalize();
      const [ry, rz] = rayon(t);
      for (let j = 0; j <= tours; j++) {
        const a = Math.PI + (j / tours) * Math.PI * 2; // la couture est sous le ventre (invisible)
        const ca = Math.cos(a);
        positions.push(p.x + haut.x * ca * ry, p.y + haut.y * ca * ry, z + Math.sin(a) * rz);
        parametres.push(t);
        uvs.push(t * 4, j / tours);
        c.copy(ventre).lerp(dos, lisse(ca, -0.35, 0.55));
        if (rayures && ca > 0) c.lerp(rayure, Math.pow(Math.max(0, Math.sin(t * frequence * Math.PI * 2)), 4) * ca * rayures);
        if (pointe) c.lerp(pointe, lisse(t, 0.9, 0.96));
        c.multiplyScalar(0.92 + bruitFin(t * 3 % 1, j / tours) * 0.16); // petites taches irrégulières
        couleurs.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < tours; j++) {
        const a = i * (tours + 1) + j;
        const b = a + tours + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color', new T.Float32BufferAttribute(couleurs, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const maille = new T.Mesh(geo, materiauPeau);
    maille.castShadow = true;
    maille.receiveShadow = true;
    maille.userData.base = Float32Array.from(positions); // forme de repos, pour l'ondulation
    maille.userData.t = Float32Array.from(parametres);
    return maille;
  };

  /**
   * Donne vie à un corps : la queue ondule de gauche à droite, le cou se balance,
   * la tête monte et descend à chaque pas (on déplace les sommets à partir de la forme de repos).
   */
  const onduler = (maille, temps, onde, bobTete) => {
    const p = maille.geometry.attributes.position;
    const base = maille.userData.base;
    const ts = maille.userData.t;
    const balancementCou = Math.sin(temps * onde.frequence * 0.6 + 1) * onde.cou;
    for (let k = 0; k < p.count; k++) {
      const t = ts[k];
      const poidsQueue = (1 - lisse(t, 0, 0.42)) ** 2;
      const dz = Math.sin(temps * onde.frequence - t * 6) * onde.queue * poidsQueue + balancementCou * lisse(t, 0.62, 1);
      const dy = bobTete * lisse(t, 0.68, 0.8);
      p.setXYZ(k, base[k * 3], base[k * 3 + 1] + dy, base[k * 3 + 2] + dz);
    }
    p.needsUpdate = true;
    maille.geometry.computeVertexNormals();
    return balancementCou;
  };

  // Matériau uni (pour les petits éléments sans couleurs par sommet : arcades, griffes…)
  const materiauUni = (teinte, rugosite = 0.7) => new T.MeshStandardMaterial({
    color: couleur(teinte), roughness: rugosite, normalMap: peauRelief, normalScale: new T.Vector2(0.4, 0.4),
  });
  const materiauGriffe = new T.MeshStandardMaterial({ color: couleur('#2b2420'), roughness: 0.4 });
  /** Griffes au bout d'une patte : petits cônes pointés vers l'avant. */
  const ajouterGriffes = (parent, x, y, ecart, nombre, longueur) => {
    for (let k = 0; k < nombre; k++) {
      const griffe = new T.Mesh(new T.ConeGeometry(longueur * 0.25, longueur, 6), materiauGriffe);
      griffe.rotation.z = -Math.PI / 2 - 0.25;
      griffe.position.set(x, y, (k - (nombre - 1) / 2) * ecart);
      griffe.castShadow = true;
      parent.add(griffe);
    }
  };

  // Ombre de contact : tache sombre et floue sous le corps, pour que le dinosaure « pèse » sur le sable
  const textureOmbre = (() => {
    const toile = document.createElement('canvas');
    toile.width = toile.height = 64;
    const c = toile.getContext('2d');
    const degrade = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    degrade.addColorStop(0, 'rgba(40, 25, 10, 0.6)');
    degrade.addColorStop(1, 'rgba(40, 25, 10, 0)');
    c.fillStyle = degrade;
    c.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(toile);
  })();
  const materiauOmbre = new T.MeshBasicMaterial({
    map: textureOmbre, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  const ajouterOmbreContact = (dino, x, longueur, largeur) => {
    const tache = new T.Mesh(new T.PlaneGeometry(longueur, largeur), materiauOmbre);
    tache.rotation.x = -Math.PI / 2;
    tache.position.set(x, 0.03, 0);
    dino.add(tache);
  };

  const creerOeil = (x, y, z, taille = 0.09) => {
    const oeil = new T.Mesh(new T.SphereGeometry(taille, 12, 8), new T.MeshStandardMaterial({ color: couleur('#1b120a'), roughness: 0.15 }));
    oeil.position.set(x, y, z);
    return oeil;
  };

  /**
   * Patte articulée : hanche → cuisse → genou → bas de la patte + pied.
   * On fait pivoter la hanche et le genou pour marcher.
   */
  const creerPatte = (dino, x, y, z, haut, basPatte, teintes) => {
    const hanche = new T.Group();
    hanche.position.set(x, y, z);
    hanche.add(creerCorps(haut.points, haut.cles, teintes, { segments: 18, tours: 14 }));
    const genou = new T.Group();
    const [gx, gy] = haut.points[haut.points.length - 1];
    genou.position.set(gx, gy, 0);
    genou.add(creerCorps(basPatte.points, basPatte.cles, teintes, { segments: 24, tours: 14 }));
    hanche.add(genou);
    dino.add(hanche);
    return { hanche, genou };
  };

  const creerRex = () => {
    const rex = new T.Group();
    const teintes = { dos: '#4f5a2a', ventre: '#c2b48a', rayure: '#2f3818' };
    const corps = creerCorps(
      [[-5.4, 2.3], [-4.0, 2.75], [-2.4, 3.15], [-0.9, 3.35], [0.2, 3.35], [1.3, 3.45], [2.05, 3.85], [2.45, 4.35], [2.8, 4.6], [3.4, 4.6], [4.0, 4.45], [4.45, 4.3]],
      [[0, 0.03, 0.03], [0.12, 0.22, 0.18], [0.3, 0.55, 0.45], [0.45, 0.95, 0.72], [0.55, 1.05, 0.82], [0.64, 0.85, 0.66], [0.7, 0.56, 0.48],
        [0.76, 0.6, 0.5], [0.84, 0.62, 0.46], [0.93, 0.45, 0.36], [0.985, 0.3, 0.27], [1, 0.05, 0.05]],
      teintes, { rayures: 0.7, frequence: 9 }
    );
    rex.add(corps);

    // Tête : tout ce qui doit suivre le balancement de la tête
    const tete = new T.Group();
    rex.add(tete);
    // Mâchoire inférieure entrouverte, intérieur de la bouche et dents
    tete.add(creerCorps([[2.9, 3.93], [3.5, 3.74], [4.15, 3.64]], [[0, 0.22, 0.28], [0.6, 0.15, 0.22], [1, 0.05, 0.08]],
      { dos: '#b9ab80', ventre: '#d7cba4' }, { segments: 20, tours: 14 }));
    const bouche = new T.Mesh(new T.SphereGeometry(1, 16, 8), new T.MeshStandardMaterial({ color: couleur('#5e2222'), roughness: 0.5 }));
    bouche.scale.set(0.62, 0.1, 0.24);
    bouche.position.set(3.5, 3.88, 0);
    tete.add(bouche);
    const materiauDent = new T.MeshStandardMaterial({ color: couleur('#eee3c6'), roughness: 0.35 });
    [-1, 1].forEach((cote) => {
      for (let k = 0; k < 9; k++) {
        const dent = new T.Mesh(new T.ConeGeometry(0.035, 0.15, 5), materiauDent);
        dent.rotation.x = Math.PI; // pointe vers le bas
        dent.position.set(3.0 + k * 0.14, 3.92 - k * 0.006, cote * (0.3 - k * 0.014));
        tete.add(dent);
      }
      tete.add(creerOeil(3.3, 4.78, cote * 0.38));
      const arcade = new T.Mesh(new T.SphereGeometry(1, 12, 8), materiauUni('#46502a'));
      arcade.scale.set(0.24, 0.07, 0.1);
      arcade.position.set(3.28, 4.92, cote * 0.37);
      tete.add(arcade);
      const narine = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), materiauGriffe);
      narine.position.set(4.36, 4.43, cote * 0.12);
      tete.add(narine);
      rex.add(creerCorps([[1.7, 3.35], [1.95, 3.05], [2.15, 2.95]], [[0, 0.13], [1, 0.06]], teintes, { segments: 10, tours: 10, z: cote * 0.62 })); // petit bras
    });

    const teintesPattes = { dos: '#47512a', ventre: '#a99c74' };
    const pattes = [-1, 1].map((cote) => creerPatte(rex, 0.25, 2.62, cote * 0.62,
      { points: [[0, 0.35], [0.12, -0.45], [0.28, -1.15]], cles: [[0, 0.55], [0.5, 0.48], [1, 0.3]] },
      { points: [[0, 0], [-0.25, -0.6], [-0.32, -1.05], [-0.05, -1.32], [0.45, -1.38]], cles: [[0, 0.28], [0.6, 0.17], [0.78, 0.15], [1, 0.07]] },
      teintesPattes));
    pattes.forEach(({ genou }) => ajouterGriffes(genou, 0.52, -1.4, 0.09, 3, 0.2));
    ajouterOmbreContact(rex, -0.2, 7, 2.2);
    return {
      groupe: rex, pattes, phases: [0, Math.PI], amplitudeHanche: 0.48, amplitudeGenou: 0.7, foulee: 3.4,
      corps, tete, onde: { queue: 0.35, cou: 0, frequence: 2.2, bob: 0.08 },
    };
  };

  const creerBronto = (taille) => {
    const bronto = new T.Group();
    const teintes = { dos: '#5d6450', ventre: '#b9b59c', rayure: '#474c3c' };
    const corps = creerCorps(
      [[-10, 1.4], [-8, 2.1], [-5.6, 3.3], [-3.2, 4.3], [-1.4, 4.75], [0.6, 4.9], [2.4, 4.6], [3.6, 5.2], [4.5, 6.6], [5.1, 8.0], [5.5, 9.0], [6.0, 9.3], [6.7, 9.1]],
      [[0, 0.03], [0.1, 0.18, 0.16], [0.25, 0.5, 0.45], [0.38, 1.25, 1.05], [0.48, 1.75, 1.45], [0.56, 1.55, 1.3], [0.63, 0.9, 0.8],
        [0.72, 0.55, 0.5], [0.85, 0.42, 0.4], [0.92, 0.4, 0.36], [0.95, 0.47, 0.42], [0.985, 0.3, 0.26], [1, 0.04, 0.04]],
      teintes, { segments: 110, rayures: 0.35, frequence: 14 }
    );
    bronto.add(corps);
    const tete = new T.Group();
    bronto.add(tete);
    [-1, 1].forEach((cote) => {
      tete.add(creerOeil(6.25, 9.4, cote * 0.33, 0.08));
      const narine = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), materiauGriffe);
      narine.position.set(6.62, 9.22, cote * 0.1);
      tete.add(narine);
    });
    const pattes = [[-1.3, 1], [-1.3, -1], [2.3, 1], [2.3, -1]].map(([x, cote]) => creerPatte(bronto, x, 3.78, cote * 0.95,
      { points: [[0, 0.4], [0.05, -0.9], [0.1, -1.7]], cles: [[0, 0.62], [1, 0.5]] },
      { points: [[0, 0], [0.05, -1.0], [0.12, -1.66]], cles: [[0, 0.48], [0.85, 0.42], [1, 0.4]] },
      { dos: '#565c49', ventre: '#8f8c78' }));
    pattes.forEach(({ genou }) => ajouterGriffes(genou, 0.5, -1.92, 0.2, 3, 0.18));
    ajouterOmbreContact(bronto, -1, 15, 4);
    bronto.scale.setScalar(taille);
    return {
      groupe: bronto, pattes, phases: [0, Math.PI, Math.PI, 0], amplitudeHanche: 0.28, amplitudeGenou: 0.3, foulee: 5.2 * taille,
      corps, tete, onde: { queue: 0.7, cou: 0.35, frequence: 1.4, bob: 0.06 },
    };
  };

  const creerTricera = (taille) => {
    const tricera = new T.Group();
    const corps = new T.Group(); // le corps est un peu abaissé : pattes plus courtes et trapues
    corps.position.y = -0.3;
    tricera.add(corps);
    const teintes = { dos: '#7a4f33', ventre: '#d0b08a', rayure: '#5a3722', pointe: '#2e2620' }; // bec foncé
    const corpsMaille = creerCorps(
      [[-4.6, 1.2], [-3.4, 1.65], [-2.0, 2.15], [-0.6, 2.45], [0.6, 2.5], [1.5, 2.25], [2.2, 2.05], [2.8, 1.95], [3.4, 1.75], [3.95, 1.4]],
      [[0, 0.03], [0.15, 0.25, 0.22], [0.32, 0.6, 0.55], [0.45, 1.05, 1.05], [0.58, 1.15, 1.15], [0.7, 0.95, 0.9], [0.78, 0.7, 0.62],
        [0.86, 0.62, 0.5], [0.95, 0.36, 0.28], [1, 0.05, 0.05]],
      teintes, { rayures: 0.45, frequence: 7 }
    );
    corps.add(corpsMaille);
    // Collerette : demi-disque creusé vers l'arrière, avec des pointes sur le bord
    const teinteCollerette = couleur('#b8742f');
    const bord = couleur('#5a3020');
    const positions = [];
    const couleursCollerette = [];
    const indices = [];
    const anneaux = 8;
    const rayons = 18;
    for (let r = 0; r <= anneaux; r++) {
      for (let k = 0; k <= rayons; k++) {
        const rr = (r / anneaux) * 1.4;
        const angle = (k / rayons) * Math.PI;
        positions.push(-0.35 * (rr / 1.4) ** 2, Math.sin(angle) * rr, Math.cos(angle) * rr);
        const c = teinteCollerette.clone().lerp(bord, lisse(r / anneaux, 0.75, 1));
        couleursCollerette.push(c.r, c.g, c.b);
      }
    }
    for (let r = 0; r < anneaux; r++) {
      for (let k = 0; k < rayons; k++) {
        const a = r * (rayons + 1) + k;
        const b = a + rayons + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geoCollerette = new T.BufferGeometry();
    geoCollerette.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geoCollerette.setAttribute('color', new T.Float32BufferAttribute(couleursCollerette, 3));
    geoCollerette.setIndex(indices);
    geoCollerette.computeVertexNormals();
    const collerette = new T.Group();
    const disque = new T.Mesh(geoCollerette, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: T.DoubleSide }));
    disque.castShadow = true;
    collerette.add(disque);
    const materiauCorne = new T.MeshStandardMaterial({ color: couleur('#e6d9b8'), roughness: 0.45 });
    for (let k = 1; k < 10; k++) {
      const angle = (k / 10) * Math.PI;
      const pointe = new T.Mesh(new T.ConeGeometry(0.08, 0.3, 8), materiauCorne);
      pointe.position.set(-0.35, Math.sin(angle) * 1.45, Math.cos(angle) * 1.45);
      pointe.rotation.x = -(angle - Math.PI / 2);
      collerette.add(pointe);
    }
    collerette.position.set(2.45, 2.25, 0);
    collerette.rotation.z = 0.55;
    corps.add(collerette);
    // Trois cornes : deux longues au-dessus des yeux, une petite sur le nez
    const creerCorne = (points, epaisseur, z) => {
      const corne = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(([x, y]) => new T.Vector3(x, y, z))), 16, 1, 10), materiauCorne);
      // le tube s'affine de la base à la pointe
      const p = corne.geometry.attributes.position;
      const centres = corne.geometry.parameters.path.getSpacedPoints(16);
      for (let k = 0; k < p.count; k++) {
        const anneau = Math.floor(k / 11);
        const centre = centres[Math.min(anneau, 16)];
        const f = epaisseur * (1 - anneau / 16) + 0.005;
        p.setXYZ(k, centre.x + (p.getX(k) - centre.x) * f, centre.y + (p.getY(k) - centre.y) * f, centre.z + (p.getZ(k) - centre.z) * f);
      }
      corne.geometry.computeVertexNormals();
      corne.castShadow = true;
      return corne;
    };
    [-1, 1].forEach((cote) => {
      corps.add(creerCorne([[2.95, 2.3], [3.3, 2.75], [3.85, 3.0]], 0.14, cote * 0.33));
      corps.add(creerOeil(3.0, 2.15, cote * 0.46, 0.08));
    });
    corps.add(creerCorne([[3.55, 1.95], [3.68, 2.22], [3.85, 2.33]], 0.09, 0));
    const pattes = [[-0.6, 1], [-0.6, -1], [1.5, 1], [1.5, -1]].map(([x, cote]) => creerPatte(tricera, x, 1.52, cote * 0.85,
      { points: [[0, 0.3], [0.08, -0.55]], cles: [[0, 0.56], [1, 0.44]] },
      { points: [[0, 0], [0.05, -0.5], [0.2, -0.68]], cles: [[0, 0.42], [0.75, 0.34], [1, 0.32]] },
      { dos: '#6e472e', ventre: '#a88a68' }));
    pattes.forEach(({ genou }) => ajouterGriffes(genou, 0.42, -0.86, 0.14, 3, 0.14));
    ajouterOmbreContact(tricera, -0.3, 8.5, 3);
    tricera.scale.setScalar(taille);
    return {
      groupe: tricera, pattes, phases: [0, Math.PI, Math.PI, 0], amplitudeHanche: 0.38, amplitudeGenou: 0.4, foulee: 2.6 * taille,
      corps: corpsMaille, onde: { queue: 0.3, cou: 0, frequence: 1.8, bob: 0 },
    };
  };

  const creerPtero = () => {
    const ptero = new T.Group();
    const teintes = { dos: '#6e3b2a', ventre: '#c79a78' };
    ptero.add(creerCorps([[-0.9, 0], [-0.2, 0.05], [0.4, 0.1], [0.8, 0.2], [1.1, 0.25], [2.0, 0.1]],
      [[0, 0.05], [0.25, 0.22], [0.45, 0.24], [0.6, 0.12], [0.7, 0.15], [1, 0.01]], teintes, { segments: 30, tours: 12 }));
    ptero.add(creerCorps([[1.0, 0.3], [0.5, 0.55], [0.1, 0.7]], [[0, 0.1], [1, 0.02]], teintes, { segments: 10, tours: 8 })); // crête
    const membrane = new T.MeshStandardMaterial({ color: couleur('#7a4532'), roughness: 0.8, side: T.DoubleSide, emissive: couleur('#3a1a10'), emissiveIntensity: 0.4 });
    const ailes = [-1, 1].map((cote) => {
      const forme = new T.Shape();
      forme.moveTo(0.5, 0);
      forme.quadraticCurveTo(0.9, 1.2, 0.4, 2.2);
      forme.lineTo(-0.3, 3.8);
      forme.quadraticCurveTo(-0.6, 2.0, -0.9, 0.2);
      forme.lineTo(0.5, 0);
      const geo = new T.ShapeGeometry(forme, 12);
      if (cote < 0) geo.scale(1, -1, 1);
      geo.rotateX(Math.PI / 2); // l'aile s'étend sur les côtés (axe z)
      const aile = new T.Mesh(geo, membrane);
      aile.castShadow = true;
      ptero.add(aile);
      return { aile, cote };
    });
    ptero.rotation.y = Math.PI + 0.55; // vole vers la gauche, tête tournée vers nous (trois quarts)
    const conteneur = new T.Group();
    conteneur.add(ptero);
    return { groupe: conteneur, ailes };
  };

  // Les dinosaures marchent vers la droite, chacun dans sa « voie » (profondeur z)
  const bronto = { ...creerBronto(0.62), z: -10, vitesse: 1.3 };
  const dinos = [
    bronto,
    { ...creerBronto(0.28), z: -7.8, vitesse: 1.3, suit: bronto, ecart: 7.5 }, // le bébé suit sa mère
    { ...creerTricera(1.15), z: -4, vitesse: 1.9 },
    { ...creerRex(), z: 1, vitesse: 2.7 },
  ];
  dinos.forEach((dino) => {
    dino.groupe.position.z = dino.z;
    scene.add(dino.groupe);
  });
  const pteros = Array.from({ length: 2 }, () => {
    const ptero = { ...creerPtero(), vitesse: rand(5, 7), battement: rand(0, 6) };
    scene.add(ptero.groupe);
    return ptero;
  });

  /* ---------- Cadrage : l'horizon et les dinosaures restent en bas de l'accueil ---------- */
  let W = 0;
  let H = 0;
  let pixelsParRadian = 1;
  let yHorizon = 0;

  /** Demi-largeur visible (en unités 3D) à une profondeur donnée. */
  const demiLargeur = (z) => ((W / 2) / pixelsParRadian) * (CAMERA_Z - z) + 12;
  /** Hauteur 3D pour qu'un objet à la profondeur z apparaisse à la hauteur yEcran (px depuis le haut). */
  const hauteurPourEcran = (yEcran, z) => CAMERA_HAUTEUR + ((yHorizon - yEcran) / pixelsParRadian) * (CAMERA_Z - z);

  const placerPtero = (ptero, depuisLaDroite) => {
    const z = rand(-34, -18);
    const x = depuisLaDroite ? demiLargeur(z) : rand(-demiLargeur(z), demiLargeur(z));
    ptero.groupe.position.set(x, hauteurPourEcran(H * rand(0.1, 0.22), z), z);
  };
  const placerNuage = (nuage, depuisLaDroite) => {
    const z = rand(-420, -300);
    const x = depuisLaDroite ? demiLargeur(z) + nuage.userData.largeur : rand(-demiLargeur(z), demiLargeur(z));
    nuage.position.set(x, hauteurPourEcran(H * nuage.userData.hauteurEcran, z), z);
  };

  const peindreNuit = () => {
    // Mêmes proportions que l'écran : la lune reste bien ronde
    const w = 1024;
    const h = Math.min(2048, Math.max(256, Math.round(w * H / W)));
    nuitCanvas.width = w;
    nuitCanvas.height = h;
    const c = nuitCanvas.getContext('2d');
    const horizon = Math.min(1, yHorizon / H);
    const degrade = c.createLinearGradient(0, 0, 0, h);
    degrade.addColorStop(0, '#0d0b24');
    degrade.addColorStop(horizon * 0.65, '#2a1850');
    degrade.addColorStop(horizon, '#5a2a5e');
    degrade.addColorStop(1, '#5a2a5e');
    c.fillStyle = degrade;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 320; i++) {
      c.globalAlpha = rand(0.2, 0.9);
      c.fillStyle = '#ffffff';
      const taille = rand(0.8, 2.2);
      c.fillRect(rand(0, w), rand(0, h * horizon * 0.92), taille, taille);
    }
    c.globalAlpha = 1;
    const petit = W < 600;
    const lx = w * (petit ? 0.82 : 0.47);
    const ly = h * (petit ? 0.1 : 0.14);
    const r = w * (petit ? 0.06 : 0.025);
    const halo = c.createRadialGradient(lx, ly, r * 0.6, lx, ly, r * 4.5);
    halo.addColorStop(0, 'rgba(254, 243, 199, 0.35)');
    halo.addColorStop(1, 'rgba(254, 243, 199, 0)');
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#fef3c7';
    c.beginPath();
    c.arc(lx, ly, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(180, 160, 120, 0.3)'; // cratères
    [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.4, 0.12]].forEach(([dx, dy, rr]) => {
      c.beginPath();
      c.arc(lx + dx * r, ly + dy * r, rr * r, 0, Math.PI * 2);
      c.fill();
    });
    nuitTexture.needsUpdate = true;
  };

  const appliquerAmbiance = () => {
    renderer.toneMappingExposure = amb.exposition;
    ciel.visible = !amb.nuit;
    scene.background = amb.nuit ? nuitTexture : null;
    scene.fog.color.copy(couleur(amb.brouillard));
    materiauSable.color.copy(couleur(amb.sable));
    materiauRoche.color.copy(couleur(amb.roche));
    materiauCactus.color.copy(couleur(amb.cactus));
    materiauRocher.color.copy(couleur(amb.rocher));
    materiauTalus.color.copy(couleur(amb.talus));
    materiauBuisson.color.copy(couleur(amb.buisson));
    materiauPoussiere.opacity = amb.poussiere;
    materiauNuage.opacity = amb.nuageOpacite;
    majEnvironnement();
    lumiereCiel.color.copy(couleur(amb.cielLumiere));
    lumiereCiel.groundColor.copy(couleur(amb.solLumiere));
    lumiereCiel.intensity = amb.forceCiel;
    soleil.color.copy(couleur(amb.soleil));
    soleil.intensity = amb.forceSoleil;
    lumiereAppoint.intensity = amb.nuit ? 0.15 : 0.35;
    placerSoleil();
    if (amb.nuit && W) peindreNuit();
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

    if (amb.nuit) peindreNuit();
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
        if (dino.groupe.position.x > limite + 10) dino.groupe.position.x = -limite - rand(0, 15);
      }
      // Cycle de marche calé sur la distance parcourue : la hanche balance, le genou plie quand la patte avance
      const pas = (dino.groupe.position.x / dino.foulee) * Math.PI * 2;
      dino.pattes.forEach(({ hanche, genou }, i) => {
        const phase = pas + dino.phases[i];
        hanche.rotation.z = Math.sin(phase) * dino.amplitudeHanche;
        genou.rotation.z = -Math.max(0, Math.cos(phase)) * dino.amplitudeGenou;
      });
      dino.groupe.position.y = Math.abs(Math.cos(pas)) * 0.06;
      dino.groupe.rotation.z = Math.sin(pas * 2) * 0.012; // léger balancement du corps
      // Queue et cou qui ondulent, tête qui balance (décalés d'un dinosaure à l'autre)
      if (dino.corps) {
        const bobTete = Math.sin(pas * 2) * dino.onde.bob;
        const balancementCou = onduler(dino.corps, temps + dino.z, dino.onde, bobTete);
        if (dino.tete) dino.tete.position.set(0, bobTete, balancementCou);
      }
    });

    // Virevoltant : roule, rebondit, puis réapparaît plus tard de l'autre côté
    roulade.x += roulade.vitesse * dt;
    const limiteRoulade = demiLargeur(roulade.z);
    if (roulade.x > limiteRoulade + 5) roulade.x = -limiteRoulade - rand(30, 120);
    virevoltant.position.set(roulade.x, hauteurSol(roulade.x, roulade.z) + roulade.rayon + Math.abs(Math.sin(temps * 2.6)) * 0.35, roulade.z);
    virevoltant.rotation.z -= (roulade.vitesse / roulade.rayon) * dt;

    // Poussière poussée par le vent
    const grainsPos = poussiere.geometry.attributes.position;
    for (let i = 0; i < nbGrains; i++) {
      let x = grainsPos.getX(i) + (0.8 + (i % 5) * 0.15) * dt;
      if (x > 60) x = -60;
      grainsPos.setX(i, x);
      grainsPos.setY(i, grainsPos.getY(i) + Math.sin(temps * 0.8 + i) * 0.002);
    }
    grainsPos.needsUpdate = true;

    pteros.forEach((ptero) => {
      ptero.groupe.position.x -= ptero.vitesse * dt;
      if (ptero.groupe.position.x < -demiLargeur(ptero.groupe.position.z)) placerPtero(ptero, true);
      const angle = 0.1 + Math.sin(temps * 5 + ptero.battement) * 0.45;
      ptero.ailes.forEach(({ aile, cote }) => { aile.rotation.x = -cote * angle; });
      ptero.groupe.position.y += Math.sin(temps * 5 + ptero.battement) * 0.01;
    });

    nuages.forEach((nuage) => {
      nuage.position.x -= nuage.userData.vitesse * dt;
      if (nuage.position.x < -demiLargeur(nuage.position.z) - nuage.userData.largeur) placerNuage(nuage, true);
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
      if (!dino.suit) { const limite = demiLargeur(dino.z) - 12; dino.groupe.position.x = rand(-limite * 0.7, limite * 0.7); }
    });
    pteros.forEach((ptero) => placerPtero(ptero, false));
    nuages.forEach((nuage) => placerNuage(nuage, false));
    appliquerAmbiance();
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
