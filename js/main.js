(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const languageAliases = { ua: 'uk' };
  const supportedLanguages = new Set(['ru', 'en', 'uk']);

  const preloader = document.getElementById('preloader');
  if (preloader) preloader.classList.add('done');

  /* ---------------- Decorative particle field ---------------- */
  const canvas = document.getElementById('particleCanvas');
  const canAnimateParticles = canvas && !reduceMotion && supportsFinePointer && !saveData;

  if (canAnimateParticles) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 24;
    const connectionDistance = 105;
    let frameId = null;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function makeParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.22,
        speedY: (Math.random() - 0.5) * 0.22,
        opacity: Math.random() * 0.35 + 0.1
      };
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
          Object.assign(particle, makeParticle());
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 162, 75, ${particle.opacity})`;
        ctx.fill();

        for (let next = index + 1; next < particles.length; next += 1) {
          const other = particles[next];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(201, 162, 75, ${0.07 * (1 - distance / connectionDistance)})`;
            ctx.stroke();
          }
        }
      });
    }

    function animateParticles() {
      drawParticles();
      frameId = requestAnimationFrame(animateParticles);
    }

    function startParticles() {
      if (frameId === null && !document.hidden) animateParticles();
    }

    function stopParticles() {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    }

    resizeCanvas();
    for (let index = 0; index < particleCount; index += 1) particles.push(makeParticle());
    window.addEventListener('resize', resizeCanvas, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopParticles();
      else startParticles();
    });
    startParticles();
  } else if (canvas) {
    canvas.remove();
  }

  /* ---------------- Pointer-only enhancements ---------------- */
  if (supportsFinePointer && !reduceMotion && !saveData) {
    document.querySelectorAll('.btn, .nav-cta, .mobile-cta').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });
  }

  /* ---------------- Nav appearance ---------------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const updateNav = () => nav.classList.toggle('nav-scrolled', window.scrollY > 40);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  /* ---------------- Mobile menu ---------------- */
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  let lastFocusedElement = null;

  function setMenuState(open) {
    if (!burger || !mobileMenu) return;
    mobileMenu.classList.toggle('open', open);
    burger.classList.toggle('active', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? burger.dataset.menuCloseLabel || 'Close menu' : burger.dataset.menuOpenLabel || 'Open menu');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);

    if (open) {
      lastFocusedElement = document.activeElement;
      const firstFocusable = mobileMenu.querySelector('a');
      if (firstFocusable) firstFocusable.focus();
    } else if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => setMenuState(!mobileMenu.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));

    document.addEventListener('keydown', (event) => {
      if (!mobileMenu.classList.contains('open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuState(false);
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = Array.from(mobileMenu.querySelectorAll('a:not([tabindex="-1"])'));
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        if (!firstFocusable || !lastFocusable) return;

        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  /* ---------------- i18n and document metadata ---------------- */
  const langButtons = document.querySelectorAll('.lang-btn');
  const i18nCache = {};
  const structuredData = document.getElementById('structuredData');

  function setMeta(selector, value) {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute('content', value);
  }

  async function loadTranslations(language) {
    if (i18nCache[language]) return i18nCache[language];
    const response = await fetch(`i18n/${language}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Unable to load i18n/${language}.json`);
    const data = await response.json();
    i18nCache[language] = data;
    return data;
  }

  function updateStructuredData(data) {
    if (!structuredData || !data.meta_schema_description || !data.meta_job_title) return;

    try {
      const schema = JSON.parse(structuredData.textContent);
      schema.description = data.meta_schema_description;
      schema.jobTitle = data.meta_job_title;
      structuredData.textContent = JSON.stringify(schema);
    } catch (error) {
      console.warn('Structured data could not be updated.', error);
    }
  }

  function applyTranslations(language, data) {
    const activeButton = document.querySelector(`.lang-btn[data-lang="${language}"]`);
    if (!activeButton) return;

    langButtons.forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (data) {
      document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (key && data[key]) element.innerHTML = data[key];
      });

      document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        const key = element.getAttribute('data-i18n-aria-label');
        if (key && data[key]) element.setAttribute('aria-label', data[key]);
      });

      document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
        const key = element.getAttribute('data-i18n-alt');
        if (key && data[key]) element.setAttribute('alt', data[key]);
      });

      document.title = data.meta_title || document.title;
      if (burger) {
        burger.dataset.menuOpenLabel = data.nav_menu_label || 'Open menu';
        burger.dataset.menuCloseLabel = data.nav_menu_close_label || 'Close menu';
        if (!mobileMenu || !mobileMenu.classList.contains('open')) burger.setAttribute('aria-label', burger.dataset.menuOpenLabel);
      }
      setMeta('meta[name="description"]', data.meta_description);
      setMeta('meta[property="og:title"]', data.meta_title);
      setMeta('meta[property="og:description"]', data.meta_description);
      setMeta('meta[property="og:locale"]', data.meta_og_locale);
      setMeta('meta[name="twitter:title"]', data.meta_title);
      setMeta('meta[name="twitter:description"]', data.meta_description);
      updateStructuredData(data);
    }

    document.documentElement.lang = language;
  }

  async function setLanguage(requestedLanguage) {
    const language = languageAliases[requestedLanguage] || requestedLanguage;
    if (!supportedLanguages.has(language)) return;

    try {
      const data = await loadTranslations(language);
      applyTranslations(language, data);
      localStorage.setItem('siteLanguage', language);
    } catch (error) {
      console.warn('Language switch failed.', error);
    }
  }

  const savedLanguage = languageAliases[localStorage.getItem('siteLanguage')] || localStorage.getItem('siteLanguage') || 'ru';
  setLanguage(savedLanguage);
  langButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));

  /* ---------------- Reveal-on-scroll, with an immediately visible hero ---------------- */
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-scale');
  document.querySelectorAll('.hero .reveal-up, .hero .reveal-scale').forEach((element) => element.classList.add('is-visible'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

    revealElements.forEach((element) => {
      if (!element.classList.contains('is-visible')) revealObserver.observe(element);
    });
  }

  /* ---------------- Accessible galleries ---------------- */
  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const controls = document.querySelectorAll(`[data-gallery-control="${gallery.id}"]`);
    const getStep = () => Math.max(gallery.clientWidth * 0.75, 240);

    controls.forEach((control) => {
      control.addEventListener('click', () => {
        const direction = control.dataset.direction === 'previous' ? -1 : 1;
        gallery.scrollBy({ left: direction * getStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    gallery.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();

      if (event.key === 'Home') gallery.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (event.key === 'End') gallery.scrollTo({ left: gallery.scrollWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (event.key === 'ArrowLeft') gallery.scrollBy({ left: -getStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
      if (event.key === 'ArrowRight') gallery.scrollBy({ left: getStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------------- Smooth anchor navigation ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || selector.length <= 1) return;

      const target = document.querySelector(selector);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', selector);
    });
  });

  /* ---------------- Terminal signature ---------------- */
  const codeElement = document.getElementById('typeCode');
  if (codeElement) {
    codeElement.textContent = [
      '// floressa_bot.js',
      'bot.on("new_order", async (order) => {',
      '  await catalog.publish(order.item);',
      '  await channel.post(order.item, {',
      '    caption: formatCaption(order),',
      '    button: buyLink(order.id)',
      '  });',
      '});',
      '',
      '✓ Production ready'
    ].join('\n');
  }

  /* ---------------- Back to top ---------------- */
  const toTop = document.getElementById('toTop');
  if (toTop) {
    const updateToTop = () => toTop.classList.toggle('visible', window.scrollY > 600);
    updateToTop();
    window.addEventListener('scroll', updateToTop, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------------- Active nav item ---------------- */
  const navLinks = document.querySelectorAll('.nav-links a[data-nav]');
  const navSections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (navSections.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (!activeLink) return;
        navLinks.forEach((link) => link.classList.toggle('active', link === activeLink));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    navSections.forEach((section) => navObserver.observe(section));
  }

  /* ---------------- Service worker ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }
})();
