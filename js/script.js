/* =========================================================
   Portfolio — Nathan THIBAULT · BTS SIO option SLAM
   Scripts : thème, navigation, animations, filtres,
   modale, onglets de la veille et formulaire de contact
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Thème clair / sombre ---------- */
  const themeBtn = $('#theme-toggle');

  const updateThemeButton = () => {
    const isDark = root.getAttribute('data-theme') !== 'light';
    themeBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    themeBtn.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
  };

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* stockage indisponible */ }
    updateThemeButton();
  });
  updateThemeButton();

  /* ---------- Menu mobile ---------- */
  const burger = $('#nav-burger');
  const menu = $('#nav-menu');

  const toggleMenu = (open) => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    burger.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  };

  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  $$('.nav__link').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !e.target.closest('.nav')) toggleMenu(false);
  });

  /* ---------- En-tête, barre de progression, retour en haut ---------- */
  const header = $('#header');
  const progress = $('#scroll-progress');
  const backToTop = $('#back-to-top');

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 20);
    progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    backToTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Lien actif selon la section visible ---------- */
  const navLinks = $$('.nav__link');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach((section) => spy.observe(section));

  /* ---------- Effet « machine à écrire » ---------- */
  const typed = $('#typed');
  const roles = [
    'Développeur web & mobile',
    'Étudiant en BTS SIO SLAM',
    'Passionné de VR & AR',
    'Futur développeur full-stack',
  ];

  if (!reducedMotion) {
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const type = () => {
      const role = roles[roleIndex];
      typed.textContent = role.slice(0, charIndex);

      if (!deleting && charIndex < role.length) {
        charIndex++;
        setTimeout(type, 70);
      } else if (!deleting) {
        deleting = true;
        setTimeout(type, 1800);
      } else if (charIndex > 0) {
        charIndex--;
        setTimeout(type, 35);
      } else {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(type, 300);
      }
    };
    type();
  }

  /* ---------- Apparition des éléments au défilement ---------- */
  const revealItems = $$('.reveal');
  if (reducedMotion) {
    revealItems.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((el) => {
      // Décalage progressif entre éléments frères (effet cascade)
      const siblings = [...el.parentElement.children].filter((child) => child.classList.contains('reveal'));
      el.style.animationDelay = `${Math.min(siblings.indexOf(el), 5) * 90}ms`;
      revealObserver.observe(el);
    });
  }

  /* ---------- Compteurs animés ---------- */
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.textContent, 10) || 0;
      const duration = 1400;
      const start = performance.now();

      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      if (!reducedMotion) requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counterObserver.observe(el));

  /* ---------- Barres de compétences ---------- */
  const barObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const bar = $('.progress__bar', entry.target);
      bar.style.width = `${bar.dataset.level}%`;
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  $$('.progress').forEach((track) => {
    const bar = $('.progress__bar', track);
    const name = $('h3', track.closest('.skill-card'))?.textContent || 'Compétence';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', `Niveau en ${name}`);
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', bar.dataset.level);
    barObserver.observe(track);
  });

  /* ---------- Filtres (compétences, projets, actualités) ---------- */
  const setupFilter = (groupSelector, itemSelector) => {
    const buttons = $$(`${groupSelector} .filter-btn`);
    const items = $$(itemSelector);

    buttons.forEach((btn) => btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      items.forEach((item) => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('is-hidden', !match);
        if (match) {
          item.classList.remove('pop');
          void item.offsetWidth; // relance l'animation
          item.classList.add('pop');
        }
      });
    }));
  };
  setupFilter('#skills-filters', '.skill-card');
  setupFilter('#projects-filters', '.project-card');
  setupFilter('#news-filters', '.news-item');

  /* ---------- Fenêtre modale des projets ---------- */
  const modal = $('#project-modal');
  const modalContent = $('#modal-content');
  const modalClose = $('.modal__close', modal);
  let lastFocused = null;

  const openModal = (template) => {
    lastFocused = document.activeElement;
    modalContent.replaceChildren(template.content.cloneNode(true));
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    modalClose.focus();
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocused) lastFocused.focus();
  };

  $$('[data-open-project]').forEach((btn) => btn.addEventListener('click', () => {
    const template = $('template', btn.closest('.project-card'));
    if (template) openModal(template);
  }));

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close')) closeModal();
  });

  // Garde le focus clavier dans la modale
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$('button, a[href], [tabindex]:not([tabindex="-1"])', modal);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('open')) closeModal();
    if (menu.classList.contains('open')) toggleMenu(false);
  });

  /* ---------- Onglets de la veille technologique ---------- */
  const tabs = $$('.tab-btn');
  const panels = $$('.tab-panel');

  const activateTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === tab.getAttribute('aria-controls'));
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      const keys = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (e.key in keys) {
        e.preventDefault();
        activateTab(tabs[keys[e.key]], true);
      }
    });
  });

  /* ---------- Bouton « Copier » du bloc de code ---------- */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const code = $('code', btn.closest('.code')).innerText;
    try {
      await navigator.clipboard.writeText(code);
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copié !';
    } catch (e) {
      btn.textContent = 'Copie impossible';
    }
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copier'; }, 1800);
  }));

  /* ---------- Formulaire de contact ---------- */
  const form = $('#contact-form');
  const formStatus = $('#form-status');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    name: (v) => v.trim().length >= 2 || 'Merci d’indiquer votre nom (2 caractères minimum).',
    email: (v) => emailPattern.test(v.trim()) || 'Merci d’indiquer une adresse e-mail valide.',
    subject: (v) => v.trim().length >= 3 || 'Merci de préciser l’objet du message.',
    message: (v) => v.trim().length >= 10 || 'Votre message doit contenir au moins 10 caractères.',
  };

  const validateField = (field) => {
    const result = rules[field.name](field.value);
    const ok = result === true;
    const group = field.closest('.form-group');
    const error = $('.error', group);
    group.classList.toggle('invalid', !ok);
    error.textContent = ok ? '' : result;
    field.setAttribute('aria-invalid', String(!ok));
    field.setAttribute('aria-describedby', error.id);
    return ok;
  };

  const fields = $$('input, textarea', form);
  fields.forEach((field) => {
    field.addEventListener('blur', () => { if (field.value) validateField(field); });
    field.addEventListener('input', () => {
      if (field.closest('.form-group').classList.contains('invalid')) validateField(field);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = fields.map(validateField);
    if (results.includes(false)) {
      formStatus.textContent = '';
      fields[results.indexOf(false)].focus();
      return;
    }

    // Pas de serveur : on ouvre la messagerie du visiteur avec le message pré-rempli
    const data = Object.fromEntries(new FormData(form));
    const body = `${data.message}\n\n— ${data.name} (${data.email})`;
    window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;

    formStatus.textContent = 'Merci ! Votre messagerie va s’ouvrir pour envoyer le message.';
    form.reset();
  });

  /* ---------- Effet 3D (inclinaison) sur l'avatar et les projets ---------- */
  if (!reducedMotion && window.matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach((el) => {
      const lift = el.classList.contains('project-card') ? ' translateY(-6px)' : '';
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)${lift}`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Fond animé de l'accueil : désert et dinosaures en pixel art ---------- */
  const canvas = $('#dinos');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = $('#accueil');
    const toggle = $('#dino-toggle');
    const rand = (min, max) => min + Math.random() * (max - min);

    // Chaque « X » d'un sprite est un pixel dessiné
    const sprite = (rows) => ({
      w: Math.max(...rows.map((r) => r.length)),
      h: rows.length,
      pixels: rows.flatMap((row, y) => [...row].flatMap((c, x) => (c === 'X' ? [[x, y]] : []))),
    });

    const REX_BODY = [
      '          XXXXXXXX',
      '         XX XXXXXXX',
      '         XXXXXXXXXX',
      '         XXXXXXXXXX',
      '         XXXXX',
      '         XXXXXXXX',
      'X       XXXXX',
      'X      XXXXXX',
      'XX    XXXXXXXXXX',
      'XXX  XXXXXXXX  X',
      'XXXXXXXXXXXX',
      'XXXXXXXXXXXX',
      ' XXXXXXXXXXX',
      '  XXXXXXXXX',
      '   XXXXXXXX',
      '    XXXXXXX',
    ];
    const REX = [
      sprite([...REX_BODY, '    XXX  XXX', '    XX    XX', '    X', '    XX']),
      sprite([...REX_BODY, '    XXX  XXX', '     XX   X', '          X', '          XX']),
    ];
    const BRONTO_BODY = [
      ' XXX',
      'XXXXX',
      '   XXX',
      '    XXX',
      '     XXX',
      '      XXX',
      '       XXX',
      '        XXXXXXXXXXX',
      '        XXXXXXXXXXXXXX',
      '        XXXXXXXXXXXXXXXXX',
      '        XXXXXXXXXXXXXXXXXXXXX',
      '         XXXXXXXXXXXXXX    XXXXX',
    ];
    const BRONTO = [
      sprite([...BRONTO_BODY, '          XX  XX   XX  XX', '          XX  XX   XX  XX', '          XX  XX   XX  XX']),
      sprite([...BRONTO_BODY, '          XX  XX   XX  XX', '         XX    XX XX    XX', '         XX    XX XX    XX']),
    ];
    const TRICERA_BODY = [
      '                   XX',
      '                  XXXX  X',
      '      XXXXXXXX   XXXXX XX',
      '    XXXXXXXXXXXX XXXXXXXX',
      '   XXXXXXXXXXXXXXXXXXXXXXX',
      '  XXXXXXXXXXXXXXXXXXXX XXX',
      ' XXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'X  XXXXXXXXXXXXXXXXXXX',
      '   XXXXXXXXXXXXXXXXX',
    ];
    const TRICERA = [
      sprite([...TRICERA_BODY, '    XX   XX    XX   XX', '    XX   XX    XX   XX', '    XXX  XXX   XXX  XXX']),
      sprite([...TRICERA_BODY, '    XX   XX    XX   XX', '     XX XX      XX XX', '     XXXX       XXXX']),
    ];
    const PTERO = [
      sprite(['      X', '      XX', '      XXX', '   X  XXXX', '  XX  XXXXX', ' XXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', '      XXXXXXXXXX', '        XXXXX']),
      sprite(['', '', '', '   X', '  XX', ' XXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', '      XXXXXXXXXX', '      XXXXX', '      XXXX', '      XXX', '      XX']),
    ];
    const CACTUS = sprite(['   XX', '   XX', 'X  XX', 'X  XX X', 'X  XX X', 'XXXXX X', '   XXXX', '   XX', '   XX', '   XX', '   XX']);
    const CLOUD = sprite(['    XXXX', '  XXXXXXXX  XXX', ' XXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXXX']);

    // Couleurs : désert en plein jour (thème clair) ou désert la nuit (thème sombre)
    const PALETTES = {
      light: {
        sky: ['#fff4dc', '#ffd9a0', '#ffb877'], sun: '#ffe066', sunGlow: 'rgba(255, 196, 61, 0.55)', sunFade: 'rgba(255, 196, 61, 0)',
        cloud: '#ffffff', cloudAlpha: 0.85, mesaFar: '#f6b582', mesaNear: '#ee9a62', dune: '#f7cf95',
        sand: '#f3d7a7', sandEdge: '#d9a960', pebble: '#c08a4a', cactus: '#2f9e44',
        rex: '#15803d', tricera: '#7c3aed', bronto: '#0e7490', ptero: '#b45309', star: null,
      },
      dark: {
        sky: ['#14112e', '#35195a', '#7a2e63'], sun: '#fef3c7', sunGlow: 'rgba(254, 243, 199, 0.25)', sunFade: 'rgba(254, 243, 199, 0)',
        cloud: '#c4b5fd', cloudAlpha: 0.1, mesaFar: '#3d2459', mesaNear: '#4c2a63', dune: '#5a306b',
        sand: '#241730', sandEdge: '#4b3060', pebble: '#6a4a80', cactus: '#34d399',
        rex: '#4ade80', tricera: '#e879f9', bronto: '#22d3ee', ptero: '#fb923c', star: '#ffffff',
      },
    };
    let pal = PALETTES.light;
    const readPalette = () => { pal = root.getAttribute('data-theme') === 'dark' ? PALETTES.dark : PALETTES.light; };
    readPalette();

    const background = document.createElement('canvas'); // décor fixe, redessiné seulement si besoin
    const bg = background.getContext('2d');
    let W = 0;
    let H = 0;
    let dpr = 1;
    let scale = 3;
    let ground = 0;
    let time = 0;
    let scenery = {};
    let dinos = [];
    let pteros = [];
    let clouds = [];
    let stars = [];

    const drawSprite = (c, sp, x, y, s, color, alpha = 1, flip = false) => {
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.beginPath();
      sp.pixels.forEach(([px, py]) => {
        const col = flip ? sp.w - 1 - px : px;
        c.rect(Math.round(x + col * s), Math.round(y + py * s), s, s);
      });
      c.fill();
      c.globalAlpha = 1;
    };

    // Formes du décor, tirées au hasard à chaque redimensionnement
    const buildScenery = () => {
      const horizon = ground - (W < 600 ? 70 : 110);
      const mesas = (count, minH, maxH) => Array.from({ length: count }, () => {
        const w = rand(110, 260);
        return { x: rand(-60, W), w, h: rand(minH, maxH) };
      });
      const cactusCount = Math.max(3, Math.round(W / 300));
      scenery = {
        horizon,
        far: mesas(Math.ceil(W / 260), 40, 95),
        near: mesas(Math.ceil(W / 380), 25, 60),
        phase: rand(0, Math.PI * 2),
        cacti: Array.from({ length: cactusCount }, (_, i) => ({
          x: (W / cactusCount) * (i + rand(0.15, 0.85)),
          s: scale + (Math.random() < 0.4 ? 1 : 0),
        })),
        pebbles: Array.from({ length: Math.round(W / 22) }, () => ({ x: rand(0, W), y: rand(ground + 6, H - 4) })),
        sun: { x: W * (W < 600 ? 0.86 : 0.47), y: H * (W < 600 ? 0.12 : 0.15), r: Math.max(26, Math.min(W, H) * 0.06) },
      };
    };

    // Dessine le décor fixe (ciel, soleil ou lune, plateaux rocheux, dunes, sable, cactus)
    const paintBackground = () => {
      if (!W || !H) return; // accueil pas encore affiché (onglet en arrière-plan…)
      background.width = W * dpr;
      background.height = H * dpr;
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { horizon, sun } = scenery;

      const sky = bg.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, pal.sky[0]);
      sky.addColorStop(0.6, pal.sky[1]);
      sky.addColorStop(1, pal.sky[2]);
      bg.fillStyle = sky;
      bg.fillRect(0, 0, W, ground);

      const glow = bg.createRadialGradient(sun.x, sun.y, sun.r * 0.8, sun.x, sun.y, sun.r * 3.2);
      glow.addColorStop(0, pal.sunGlow);
      glow.addColorStop(1, pal.sunFade);
      bg.fillStyle = glow;
      bg.fillRect(0, 0, W, ground);
      bg.fillStyle = pal.sun;
      bg.beginPath();
      bg.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
      bg.fill();
      if (pal === PALETTES.dark) { // cratères de la lune
        bg.fillStyle = 'rgba(180, 160, 120, 0.35)';
        [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.4, 0.12]].forEach(([dx, dy, rr]) => {
          bg.beginPath();
          bg.arc(sun.x + dx * sun.r, sun.y + dy * sun.r, rr * sun.r, 0, Math.PI * 2);
          bg.fill();
        });
      }

      const drawMesas = (list, color, base) => {
        bg.fillStyle = color;
        list.forEach((m) => {
          bg.beginPath();
          bg.moveTo(m.x, base);
          bg.lineTo(m.x + m.w * 0.12, base - m.h);
          bg.lineTo(m.x + m.w * 0.88, base - m.h);
          bg.lineTo(m.x + m.w, base);
          bg.fill();
        });
      };
      drawMesas(scenery.far, pal.mesaFar, horizon + 6);
      drawMesas(scenery.near, pal.mesaNear, horizon + 22);

      // Dunes
      bg.fillStyle = pal.dune;
      bg.beginPath();
      bg.moveTo(0, ground);
      for (let x = 0; x <= W; x += 8) {
        bg.lineTo(x, horizon + 30 + Math.sin(x / 170 + scenery.phase) * 12 + Math.sin(x / 63) * 4);
      }
      bg.lineTo(W, ground);
      bg.fill();

      // Sable
      bg.fillStyle = pal.sand;
      bg.fillRect(0, ground, W, H - ground);
      bg.fillStyle = pal.sandEdge;
      bg.fillRect(0, ground, W, Math.max(2, scale - 1));
      bg.fillStyle = pal.pebble;
      scenery.pebbles.forEach((p) => bg.fillRect(Math.round(p.x), Math.round(p.y), scale - 1 || 1, scale - 1 || 1));

      // Cactus
      scenery.cacti.forEach((c) => drawSprite(bg, CACTUS, c.x, ground + 2 - CACTUS.h * c.s, c.s, pal.cactus));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const small = W < 600;
      scale = small ? 2 : 3;
      ground = H - (small ? 46 : 62);
      buildScenery();

      // Dinosaures qui marchent vers la droite, chacun sur sa « rangée » (profondeur)
      const bronto = { sp: BRONTO, s: scale + 1, x: W * 0.12, v: 20, foot: ground + 6, color: 'bronto', flip: true };
      dinos = [
        bronto,
        { sp: BRONTO, s: scale - 1, leader: bronto, gap: 20 * scale, x: 0, v: 20, foot: ground + 8, color: 'bronto', flip: true }, // le bébé suit sa mère
        { sp: TRICERA, s: scale, x: W * 0.62, v: 28, foot: ground + (small ? 18 : 24), color: 'tricera' },
        { sp: REX, s: scale, x: W * 0.36, v: 36, foot: ground + (small ? 30 : 42), color: 'rex' },
      ];
      pteros = Array.from({ length: small ? 1 : 3 }, () => ({ x: rand(0, W), y: rand(H * 0.08, H * 0.2), v: rand(45, 85) }));
      clouds = Array.from({ length: small ? 2 : 4 }, () => ({ x: rand(0, W), y: rand(H * 0.04, H * 0.3), s: Math.round(rand(4, 7)), v: rand(6, 14) }));
      stars = Array.from({ length: Math.min(Math.floor((W * H) / 12000), 100) }, () => ({ x: rand(0, W), y: rand(0, scenery.horizon), r: rand(0.6, 1.8), phase: rand(0, 6.3) }));

      paintBackground();
    };

    const update = (dt) => {
      time += dt;
      dinos.forEach((d) => {
        if (d.leader) {
          d.x = d.leader.x - d.gap;
        } else {
          d.x += d.v * dt;
          if (d.x > W + 150) d.x = -d.sp[0].w * d.s - rand(60, 260);
        }
      });
      pteros.forEach((p) => {
        p.x -= p.v * dt;
        if (p.x < -70) { p.x = W + rand(40, 400); p.y = rand(H * 0.08, H * 0.2); p.v = rand(45, 85); }
      });
      clouds.forEach((c) => {
        c.x -= c.v * dt;
        if (c.x < -CLOUD.w * c.s) c.x = W + rand(20, 200);
      });
    };

    const draw = () => {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(background, 0, 0, W, H);

      if (pal.star) { // étoiles qui scintillent la nuit
        ctx.fillStyle = pal.star;
        stars.forEach((s) => {
          ctx.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin(time * 1.4 + s.phase));
          ctx.fillRect(s.x, s.y, s.r, s.r);
        });
        ctx.globalAlpha = 1;
      }

      clouds.forEach((c) => drawSprite(ctx, CLOUD, c.x, c.y, c.s, pal.cloud, pal.cloudAlpha));
      pteros.forEach((p, i) => drawSprite(ctx, PTERO[Math.floor(time / 0.22 + i) % 2], p.x, p.y, scale, pal.ptero));

      // Les pattes changent tous les quelques pas : elles suivent la distance parcourue
      dinos.forEach((d) => {
        const step = Math.floor(d.x / (5 * d.s)) % 2;
        const frame = d.sp[Math.abs(step)];
        const bob = step ? 0 : d.s;
        drawSprite(ctx, frame, d.x, d.foot - frame.h * d.s - bob + d.s, d.s, pal[d.color], 1, d.flip);
      });
    };

    let frameId = null;
    let last = 0;
    let heroVisible = true;
    let paused = reducedMotion; // si l'utilisateur a désactivé les animations, on démarre en pause

    const loop = (now) => {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      update(dt);
      draw();
      frameId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (paused || !heroVisible || frameId) return;
      if (!W || !H) resize(); // la taille n'était pas connue au chargement
      last = performance.now();
      frameId = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = null;
    };

    // Bouton pause / lecture
    const updateToggle = () => {
      toggle.innerHTML = paused
        ? '<i class="fa-solid fa-play"></i> <span>Animer</span>'
        : '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
      toggle.setAttribute('aria-label', paused ? 'Lancer l’animation des dinosaures' : 'Mettre en pause l’animation des dinosaures');
    };
    toggle.addEventListener('click', () => {
      paused = !paused;
      updateToggle();
      if (paused) stop(); else start();
    });
    updateToggle();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); draw(); }, 150);
    });

    // Changement de thème : jour ↔ nuit
    new MutationObserver(() => {
      readPalette();
      paintBackground();
      draw();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // L'animation tourne seulement quand l'accueil est visible
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible && (!W || !H)) { resize(); draw(); } // l'accueil vient d'apparaître
      if (heroVisible) start(); else stop();
    }).observe(hero);

    resize();
    draw();
  }

  /* ---------- Année du pied de page ---------- */
  $('#year').textContent = new Date().getFullYear();
});
