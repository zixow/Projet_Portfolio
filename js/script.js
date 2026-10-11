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

  /* ---------- Fond animé de l'accueil : dinosaures en pixel art ---------- */
  const canvas = $('#dinos');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = $('#accueil');
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
      sprite([...REX_BODY, '    XXX  XXX', '    XX    X', '    X     X', '    XX    XX']), // en saut
    ];
    const PTERO = [
      sprite(['      X', '      XX', '      XXX', '   X  XXXX', '  XX  XXXXX', ' XXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', '      XXXXXXXXXX', '        XXXXX']),
      sprite(['', '', '', '   X', '  XX', ' XXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', '      XXXXXXXXXX', '      XXXXX', '      XXXX', '      XXX', '      XX']),
    ];
    const CACTUS = sprite(['   XX', '   XX', 'X  XX', 'X  XX X', 'X  XX X', 'XXXXX X', '   XXXX', '   XX', '   XX', '   XX', '   XX']);
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

    // Couleurs reprises du thème (mises à jour quand on change de thème)
    let colors = {};
    const readColors = () => {
      const styles = getComputedStyle(root);
      const v = (name) => styles.getPropertyValue(name).trim();
      colors = {
        rex: v('--primary'),
        ptero: v('--secondary'),
        cactus: v('--success'),
        bronto: v('--secondary'),
        ground: v('--text-muted'),
        meteor: v('--accent'),
        star: root.getAttribute('data-theme') === 'light' ? '#6366f1' : '#ffffff',
      };
    };
    readColors();

    let W = 0;
    let H = 0;
    let ground = 0;
    let scale = 3;
    let speed = 260;
    let gravity = 2400;
    let jumpSpeed = 760;
    let distance = 0;
    let time = 0;
    let stars = [];
    let cacti = [];
    let pteros = [];
    let brontos = [];
    let meteor = null;
    let nextMeteor = 4;
    const rex = { x: 0, y: 0, vy: 0, jumping: false };

    const jump = () => {
      if (rex.jumping) return;
      rex.jumping = true;
      rex.vy = -jumpSpeed;
    };

    const addCactus = (x) => {
      const s = scale + (Math.random() < 0.35 ? 1 : 0);
      cacti.push({ x, s, w: CACTUS.w * s });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const small = W < 600;
      scale = small ? 2 : 3;
      ground = H - (small ? 30 : 42);
      speed = small ? 190 : 260;
      gravity = 800 * scale;
      jumpSpeed = 253 * scale;
      rex.x = Math.max(16, W * 0.05);

      stars = Array.from({ length: Math.min(Math.floor((W * H) / 14000), 90) }, () => ({
        x: rand(0, W), y: rand(0, ground * 0.8), r: rand(0.3, 1.4), phase: rand(0, Math.PI * 2),
      }));
      cacti = [];
      addCactus(W * 0.6);
      pteros = Array.from({ length: small ? 1 : 3 }, () => ({ x: rand(0, W), y: rand(H * 0.1, ground - 200), v: rand(40, 90) }));
      brontos = [{ x: W * 0.45 }, { x: W * 1.3 }];
    };

    const update = (dt) => {
      time += dt;
      distance += speed * dt;

      // T-Rex : saute tout seul juste avant chaque cactus
      const rexW = REX[0].w * scale;
      if (rex.jumping) {
        rex.vy += gravity * dt;
        rex.y += rex.vy * dt;
        if (rex.y >= 0) { rex.y = 0; rex.vy = 0; rex.jumping = false; }
      } else {
        const next = cacti.find((c) => c.x + c.w > rex.x);
        if (next) {
          const airTime = (2 * jumpSpeed) / gravity;
          const lead = speed * (airTime / 2 - (rexW + next.w) / speed / 2);
          if (next.x - (rex.x + rexW) <= lead) jump();
        }
      }

      // Cactus
      cacti.forEach((c) => { c.x -= speed * dt; });
      cacti = cacti.filter((c) => c.x + c.w > -20);
      const minGap = speed * ((2 * jumpSpeed) / gravity) + 140;
      while (!cacti.length || cacti[cacti.length - 1].x < W + 100) {
        const last = cacti.length ? cacti[cacti.length - 1].x : W;
        addCactus(last + rand(minGap, minGap + 450));
      }

      // Ptérodactyles
      pteros.forEach((p) => {
        p.x -= (speed * 0.45 + p.v) * dt;
        if (p.x < -80) { p.x = W + rand(40, 400); p.y = rand(H * 0.1, ground - 200); p.v = rand(40, 90); }
      });

      // Brontosaures au loin (défilent plus lentement : parallaxe)
      brontos.forEach((b) => {
        b.x -= speed * 0.3 * dt;
        if (b.x < -BRONTO[0].w * (scale + 1)) b.x = W + rand(100, W);
      });

      // Météorite de temps en temps (clin d'œil à l'extinction des dinosaures)
      nextMeteor -= dt;
      if (!meteor && nextMeteor <= 0) {
        meteor = { x: rand(W * 0.4, W * 1.1), y: -30, life: 0 };
        nextMeteor = rand(7, 13);
      }
      if (meteor) {
        meteor.life += dt;
        meteor.x -= 520 * dt;
        meteor.y += 300 * dt;
        if (meteor.life > 1.8) meteor = null;
      }
    };

    const drawSprite = (sp, x, y, s, color, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      sp.pixels.forEach(([px, py]) => ctx.rect(Math.round(x + px * s), Math.round(y + py * s), s, s));
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Étoiles qui scintillent
      ctx.fillStyle = colors.star;
      stars.forEach((s) => {
        ctx.globalAlpha = 0.15 + 0.45 * Math.abs(Math.sin(time * 1.5 + s.phase));
        ctx.fillRect(s.x, s.y, s.r * 1.6, s.r * 1.6);
      });

      // Météorite
      if (meteor) {
        const tail = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x + 130, meteor.y - 75);
        tail.addColorStop(0, colors.meteor);
        tail.addColorStop(1, 'transparent');
        ctx.globalAlpha = Math.max(0, 0.8 - meteor.life * 0.4);
        ctx.strokeStyle = tail;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x + 130, meteor.y - 75);
        ctx.stroke();
        ctx.fillStyle = colors.meteor;
        ctx.fillRect(meteor.x - 3, meteor.y - 3, 6, 6);
      }

      // Brontosaures au loin
      const bs = scale + 1;
      brontos.forEach((b) => {
        const frame = BRONTO[Math.floor(time / 0.35) % 2];
        drawSprite(frame, b.x, ground - frame.h * bs, bs, colors.bronto, 0.12);
      });

      // Ptérodactyles
      pteros.forEach((p, i) => {
        drawSprite(PTERO[Math.floor(time / 0.2 + i) % 2], p.x, p.y, scale, colors.ptero, 0.4);
      });

      // Sol qui défile + petits cailloux
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = colors.ground;
      ctx.fillRect(0, ground, W, Math.max(1, scale - 1));
      const step = 34;
      const offset = distance % step;
      const first = Math.floor(distance / step);
      for (let i = 0; i <= W / step + 1; i++) {
        const n = first + i;
        ctx.fillRect(i * step - offset + (n * 7) % 13, ground + 5 + (n % 3) * 4, scale - 1 || 1, scale - 1 || 1);
      }

      // Cactus
      cacti.forEach((c) => drawSprite(CACTUS, c.x, ground - CACTUS.h * c.s, c.s, colors.cactus, 0.45));

      // T-Rex
      const rexFrame = rex.jumping ? REX[2] : REX[Math.floor(time / 0.1) % 2];
      drawSprite(rexFrame, rex.x, ground - rexFrame.h * scale + rex.y + scale, scale, colors.rex, 0.6);

      ctx.globalAlpha = 1;
    };

    let frameId = null;
    let last = 0;
    const loop = (now) => {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      update(dt);
      draw();
      frameId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reducedMotion || frameId) return;
      last = performance.now();
      frameId = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = null;
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); if (reducedMotion) draw(); }, 150);
    });

    // Un clic sur l'accueil fait sauter le T-Rex
    hero.addEventListener('click', (e) => {
      if (!e.target.closest('a, button')) jump();
    });

    // L'animation tourne seulement quand l'accueil est visible
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }).observe(hero);

    // Changement de thème : nouvelles couleurs
    new MutationObserver(() => {
      readColors();
      if (!frameId) draw();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    draw(); // image fixe si les animations sont désactivées
  }

  /* ---------- Année du pied de page ---------- */
  $('#year').textContent = new Date().getFullYear();
});
