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

  /* ---------- Fond étoilé animé (accueil) ---------- */
  const canvas = $('#stars');
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    const hero = $('#accueil');
    let stars = [];
    let width = 0;
    let height = 0;
    let frame = null;
    const mouse = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor((width * height) / 9000), 150);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2, // profondeur : effet de parallaxe
        r: Math.random() * 1.3 + 0.3,
      }));
    };

    const draw = () => {
      const rgb = root.getAttribute('data-theme') === 'light' ? '99, 102, 241' : '255, 255, 255';
      ctx.clearRect(0, 0, width, height);

      const points = stars.map((s) => {
        s.y -= s.z * 0.15;
        if (s.y < 0) { s.y = height; s.x = Math.random() * width; }
        return { x: s.x + mouse.x * 25 * s.z, y: s.y + mouse.y * 25 * s.z, s };
      });

      // Liaisons entre étoiles proches (effet « constellation »)
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = dx * dx + dy * dy;
          if (dist < 10000) {
            ctx.strokeStyle = `rgba(${rgb}, ${0.12 * (1 - dist / 10000)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      points.forEach(({ x, y, s }) => {
        ctx.fillStyle = `rgba(${rgb}, ${0.35 + s.z * 0.55})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      frame = requestAnimationFrame(draw);
    };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    // L'animation tourne seulement quand l'accueil est visible
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) frame = requestAnimationFrame(draw);
      if (!entry.isIntersecting && frame) { cancelAnimationFrame(frame); frame = null; }
    }).observe(hero);

    resize();
  }

  /* ---------- Année du pied de page ---------- */
  $('#year').textContent = new Date().getFullYear();
});
