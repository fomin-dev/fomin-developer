(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toast = document.getElementById('toast');

  const showToast = (message) => {
    if (!toast || !message) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  };

  /* ---------------- Boot ---------------- */
  const boot = document.getElementById('boot');
  window.addEventListener('load', () => {
    window.setTimeout(() => boot?.classList.add('hidden'), reduceMotion ? 0 : 620);
  });

  /* ---------------- Scroll progress + nav state ---------------- */
  const progressBar = document.querySelector('.progress i');
  const nav = document.getElementById('siteNav');
  let ticking = false;

  /* ---------------- Work gallery: pinned full-bleed scroll steps ---------------- */
  const workScroller = document.getElementById('workScroller');
  const workPin = document.getElementById('workPin');
  const workRailNum = document.getElementById('workRailNum');
  const workPanels = document.querySelectorAll('[data-work-panel]');
  const workDots = document.querySelectorAll('[data-work-dot]');
  const workNextButtons = document.querySelectorAll('[data-work-next]');
  const workProjectOrder = Array.from(workPanels).map((panel) => panel.dataset.workProject);
  const updateWorkScroller = () => {
    if (!workScroller || !workPanels.length) return;
    const rect = workScroller.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const progress = Math.min(Math.max(-rect.top / total, 0), 1);
    const index = Math.min(workPanels.length - 1, Math.floor(progress * workPanels.length));
    const project = workProjectOrder[index];
    workPanels.forEach((panel, i) => panel.classList.toggle('active', i === index));
    workDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    if (workPin && workPin.dataset.workTheme !== project) workPin.dataset.workTheme = project;
    if (workRailNum) workRailNum.textContent = String(index + 1).padStart(2, '0');
  };

  const jumpToWorkProject = (name) => {
    const index = workProjectOrder.indexOf(name);
    if (index < 0 || !workScroller) return;
    const total = workScroller.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const targetProgress = (index + 0.5) / workPanels.length;
    const targetTop = workScroller.offsetTop + targetProgress * total;
    window.scrollTo({ top: targetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  workNextButtons.forEach((btn) => btn.addEventListener('click', () => jumpToWorkProject(btn.dataset.workNext)));

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = (doc.scrollHeight - doc.clientHeight) || 1;
    if (progressBar) progressBar.style.transform = `scaleX(${Math.min(scrollTop / height, 1)})`;
    nav?.classList.toggle('scrolled', scrollTop > 8);
    updateWorkScroller();
    ticking = false;
  };
  document.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------------- Mobile nav ---------------- */
  const navBurger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  const closeNav = () => {
    nav?.classList.remove('open');
    navBurger?.setAttribute('aria-expanded', 'false');
  };
  navBurger?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    navBurger.setAttribute('aria-expanded', String(!!open));
  });
  navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  /* ---------------- Scrollspy (nav links + side rail) ---------------- */
  const navAnchors = document.querySelectorAll('[data-nav]');
  const railDots = document.querySelectorAll('[data-rail]');
  const spySections = [...navAnchors].map((a) => document.getElementById(a.dataset.nav)).filter(Boolean);
  if (spySections.length && 'IntersectionObserver' in window) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle('active', a.dataset.nav === entry.target.id));
        railDots.forEach((dot) => dot.classList.toggle('active', dot.dataset.rail === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spySections.forEach((section) => spyObserver.observe(section));
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------- Availability status (10:00–20:00 Kyiv) ---------------- */
  const navStatus = document.getElementById('navStatus');
  const navStatusText = document.getElementById('navStatusText');
  const contactStatus = document.getElementById('contactStatus');
  const contactStatusText = document.getElementById('contactStatusText');
  const contactClock = document.getElementById('contactClock');
  const kyivHour = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hour: '2-digit', hour12: false }).formatToParts(new Date());
      return Number(parts.find((part) => part.type === 'hour')?.value);
    } catch (error) {
      return new Date().getHours();
    }
  };
  const updateAvailability = () => {
    const hour = kyivHour();
    const online = Number.isFinite(hour) && hour >= 10 && hour < 20;
    const label = textFor(online ? 'status_online' : 'status_offline');
    [[navStatus, navStatusText], [contactStatus, contactStatusText]].forEach(([pill, text]) => {
      if (!pill || !text) return;
      pill.classList.toggle('is-online', online);
      pill.classList.toggle('is-offline', !online);
      pill.classList.add('ready');
      text.textContent = label;
    });
    if (contactClock) {
      try {
        contactClock.textContent = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit' }).format(new Date());
      } catch (error) {
        contactClock.textContent = '';
      }
    }
  };
  window.setInterval(updateAvailability, 60000);

  /* ---------------- Case modal ---------------- */
  const modal = document.getElementById('caseModal');
  const modalImage = document.getElementById('modalImage');
  const modalCounter = document.getElementById('modalCounter');
  const modalCaption = document.getElementById('modalCaption');
  const modalThumbs = document.getElementById('modalThumbs');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const modalType = document.getElementById('modalType');
  const modalTitle = document.getElementById('modalTitle');
  const modalKicker = document.getElementById('modalKicker');
  const modalDescription = document.getElementById('modalDescription');
  const modalHighlight = document.getElementById('modalHighlight');
  const modalFeatures = document.getElementById('modalFeatures');
  const modalTestimonial = document.getElementById('modalTestimonial');
  const modalTestimonialText = document.getElementById('modalTestimonialText');
  const modalTestimonialSource = document.getElementById('modalTestimonialSource');
  const modalResult = document.getElementById('modalResult');

  const caseData = {
    floressa: {
      type: 'case_floressa_badge', title: 'case_floressa_title', kicker: 'case_floressa_kicker',
      description: 'case_floressa_desc', highlight: 'case_floressa_highlight', result: 'case_floressa_result',
      testimonial: 'case_floressa_testimonial', source: 'case_floressa_source',
      features: [1, 2, 3, 4, 5].map((n) => `case_floressa_feature${n}`),
      gallery: [
        { src: 'assets/floressa-4', widths: [320, 640], altKey: 'alt_floressa_hero', capKey: null },
        { src: 'assets/floressa-1', widths: [320, 640], altKey: 'alt_floressa_1', capKey: 'case_floressa_figcaption1' },
        { src: 'assets/floressa-2', widths: [320, 640], altKey: 'alt_floressa_2', capKey: 'case_floressa_figcaption2' },
        { src: 'assets/floressa-3', widths: [320, 640], altKey: 'alt_floressa_3', capKey: 'case_floressa_figcaption3' },
        { src: 'assets/floressa-5', widths: [320, 640], altKey: 'alt_floressa_4', capKey: 'case_floressa_figcaption4' }
      ]
    },
    wave: {
      type: 'case_wave_badge', title: 'case_wave_title', kicker: 'case_wave_kicker',
      description: 'case_wave_desc', highlight: 'case_wave_highlight', result: 'case_wave_result',
      features: [1, 2, 3, 4, 5, 6].map((n) => `case_wave_feature${n}`),
      gallery: [
        { src: 'assets/wave_beer', widths: [480, 960, 1554], altKey: 'alt_wave_hero', capKey: 'case_wave_figcaption1' },
        { src: 'assets/photo_2026-07-09_16-56-30', widths: [480, 960, 1554], altKey: 'alt_wave_2', capKey: 'case_wave_figcaption2' },
        { src: 'assets/photo_2026-07-11_12-08-47', widths: [480, 960, 1554], altKey: 'alt_wave_3', capKey: 'case_wave_figcaption3' },
        { src: 'assets/photo_2026-07-09_16-56-20', widths: [480, 960, 1554], altKey: 'alt_wave_4', capKey: 'case_wave_figcaption4' },
        { src: 'assets/photo_2026-07-11_12-08-44', widths: [480, 960, 1554], altKey: 'alt_wave_5', capKey: 'case_wave_figcaption5' },
        { src: 'assets/photo_2026-07-09_16-56-27', widths: [480, 960, 1554], altKey: 'alt_wave_6', capKey: 'case_wave_figcaption6' }
      ]
    },
    module: {
      type: 'case_modulehouse_badge', title: 'case_modulehouse_title', kicker: 'case_modulehouse_kicker',
      description: 'case_modulehouse_desc', highlight: 'case_modulehouse_highlight', result: 'case_modulehouse_result',
      features: [1, 2, 3, 4, 5, 6].map((n) => `case_modulehouse_feature${n}`),
      gallery: [
        { src: 'assets/module-house-hero', widths: [480, 960, 1519], altKey: 'alt_modulehouse_hero', capKey: null },
        { src: 'assets/module-house-catalog', widths: [480, 960, 1519], altKey: 'alt_modulehouse_1', capKey: 'case_modulehouse_figcaption1' },
        { src: 'assets/module-house-gallery', widths: [480, 960, 1519], altKey: 'alt_modulehouse_2', capKey: 'case_modulehouse_figcaption2' },
        { src: 'assets/module-house-features', widths: [480, 960, 1519], altKey: 'alt_modulehouse_3', capKey: 'case_modulehouse_figcaption3' },
        { src: 'assets/module-house-about', widths: [480, 960, 1519], altKey: 'alt_modulehouse_4', capKey: 'case_modulehouse_figcaption4' },
        { src: 'assets/module-house-delivery', widths: [480, 960, 1519], altKey: 'alt_modulehouse_5', capKey: 'case_modulehouse_figcaption5' },
        { src: 'assets/module-house-contact', widths: [480, 960, 1519], altKey: 'alt_modulehouse_6', capKey: 'case_modulehouse_figcaption6' }
      ]
    }
  };

  let currentDictionary = null;
  const textFor = (key) => (currentDictionary && currentDictionary[key]) || '';
  const srcset = (item) => item.widths.map((w, i) => {
    const isFull = i === item.widths.length - 1;
    return `${isFull ? `${item.src}.webp` : `${item.src}-${w}.webp`} ${w}w`;
  }).join(', ');

  let activeProject = null;
  let activeIndex = 0;
  let lastFocused = null;

  const captionFor = (data, item) => (item.capKey ? textFor(item.capKey) : textFor(data.type));

  const renderSlide = () => {
    const data = caseData[activeProject];
    if (!data) return;
    const item = data.gallery[activeIndex];
    modalImage.src = `${item.src}.webp`;
    modalImage.srcset = srcset(item);
    modalImage.alt = textFor(item.altKey);
    modalCaption.textContent = captionFor(data, item);
    modalCounter.textContent = `${activeIndex + 1} / ${data.gallery.length}`;
    modalThumbs?.querySelectorAll('button').forEach((thumb, i) => thumb.classList.toggle('active', i === activeIndex));
  };

  const renderCase = (name) => {
    const data = caseData[name];
    if (!data || !modal) return;
    activeProject = name;
    activeIndex = 0;
    modal.dataset.project = name;
    modalType.textContent = textFor(data.type);
    modalTitle.textContent = textFor(data.title);
    modalKicker.textContent = textFor(data.kicker);
    modalDescription.textContent = textFor(data.description);
    modalHighlight.textContent = textFor(data.highlight);
    modalResult.textContent = textFor(data.result);
    modalFeatures.innerHTML = data.features.map((key) => `<li>${textFor(key)}</li>`).join('');
    if (data.testimonial) {
      modalTestimonial.hidden = false;
      modalTestimonialText.textContent = `«${textFor(data.testimonial)}»`;
      modalTestimonialSource.textContent = textFor(data.source);
    } else {
      modalTestimonial.hidden = true;
    }
    modalThumbs.innerHTML = data.gallery.map((item, i) => `<button type="button" data-index="${i}" aria-label="${captionFor(data, item)}"><img src="${item.src}-${item.widths[0]}.webp" alt="" loading="lazy"></button>`).join('');
    modalThumbs.querySelectorAll('button').forEach((thumb) => thumb.addEventListener('click', () => {
      activeIndex = Number(thumb.dataset.index);
      renderSlide();
    }));
    renderSlide();
  };

  const focusableSelector = 'button, a[href]';
  const openCase = async (name, trigger) => {
    if (!currentDictionary) {
      await setLanguage(document.documentElement.lang || 'ru');
    }
    lastFocused = trigger || document.activeElement;
    renderCase(name);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => document.getElementById('modalClose')?.focus(), 30);
  };
  const closeCase = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeProject = null;
    lastFocused?.focus();
  };
  document.querySelectorAll('[data-project]').forEach((card) => card.addEventListener('click', () => openCase(card.dataset.project, card)));
  document.querySelectorAll('[data-close-modal]').forEach((el) => el.addEventListener('click', closeCase));
  modalPrev?.addEventListener('click', () => {
    if (!activeProject) return;
    const total = caseData[activeProject].gallery.length;
    activeIndex = (activeIndex - 1 + total) % total;
    renderSlide();
  });
  modalNext?.addEventListener('click', () => {
    if (!activeProject) return;
    const total = caseData[activeProject].gallery.length;
    activeIndex = (activeIndex + 1) % total;
    renderSlide();
  });
  document.addEventListener('keydown', (event) => {
    if (!modal?.classList.contains('open')) return;
    if (event.key === 'Escape') { closeCase(); return; }
    if (event.key === 'ArrowLeft') { modalPrev?.click(); return; }
    if (event.key === 'ArrowRight') { modalNext?.click(); return; }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll(focusableSelector)].filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- Localisation ---------------- */
  const languageAliases = { ua: 'uk' };
  const supportedLanguages = new Set(['ru', 'en', 'uk']);
  const langButtons = document.querySelectorAll('[data-lang]');
  const translations = {};
  const structuredData = document.getElementById('structuredData');

  const updateMeta = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute('content', value);
  };
  const updateSchema = (data) => {
    if (!structuredData) return;
    try {
      const schema = JSON.parse(structuredData.textContent);
      schema.description = data.meta_schema_description || schema.description;
      schema.jobTitle = data.meta_job_title || schema.jobTitle;
      structuredData.textContent = JSON.stringify(schema);
    } catch (error) {
      console.warn('Structured data could not be updated.', error);
    }
  };
  const applyTranslations = (language, data) => {
    currentDictionary = data;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (data[key]) element.innerHTML = data[key];
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
      const key = element.dataset.i18nAlt;
      if (data[key]) element.alt = data[key];
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const key = element.dataset.i18nAriaLabel;
      if (data[key]) element.setAttribute('aria-label', data[key]);
    });
    langButtons.forEach((button) => {
      const isActive = languageAliases[button.dataset.lang] === language || button.dataset.lang === language;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    document.title = data.meta_title || document.title;
    updateMeta('meta[name="description"]', data.meta_description);
    updateMeta('meta[property="og:title"]', data.meta_title);
    updateMeta('meta[property="og:description"]', data.meta_description);
    updateMeta('meta[property="og:locale"]', data.meta_og_locale);
    updateMeta('meta[name="twitter:title"]', data.meta_title);
    updateMeta('meta[name="twitter:description"]', data.meta_description);
    updateSchema(data);
    updateAvailability();
    if (activeProject) renderCase(activeProject);
  };
  const setLanguage = async (requestedLanguage) => {
    const language = languageAliases[requestedLanguage] || requestedLanguage;
    if (!supportedLanguages.has(language)) return;
    try {
      if (!translations[language]) {
        const response = await fetch(`i18n/${language}.json`, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`Unable to load i18n/${language}.json`);
        translations[language] = await response.json();
      }
      applyTranslations(language, translations[language]);
      try { localStorage.setItem('siteLanguage', language); } catch (error) { /* private mode */ }
    } catch (error) {
      console.warn('Language switch failed.', error);
    }
  };
  let savedLanguage = 'ru';
  try { savedLanguage = languageAliases[localStorage.getItem('siteLanguage')] || localStorage.getItem('siteLanguage') || 'ru'; } catch (error) { /* private mode */ }
  setLanguage(savedLanguage);
  langButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));

  /* ---------------- Copy to clipboard ---------------- */
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy || '';
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const temp = document.createElement('textarea');
          temp.value = value;
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
        }
        showToast(textFor('contact_copied') || 'Copied');
        button.classList.add('copied');
        window.setTimeout(() => button.classList.remove('copied'), 1600);
      } catch (error) {
        console.warn('Copy failed.', error);
      }
    });
  });

  /* ---------------- Floating CTA + back to top ---------------- */
  const floatCta = document.getElementById('floatCta');
  const toTop = document.getElementById('toTop');
  const heroEl = document.getElementById('top');
  const contactEl = document.getElementById('contact');
  if ('IntersectionObserver' in window && (floatCta || toTop)) {
    let pastHero = false;
    let inContact = false;
    const refreshFloat = () => {
      const show = pastHero && !inContact;
      floatCta?.classList.toggle('show', show);
      toTop?.classList.toggle('show', pastHero);
    };
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => { pastHero = !entry.isIntersecting; });
      refreshFloat();
    }, { threshold: 0 }).observe(heroEl || document.body);
    if (contactEl) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { inContact = entry.isIntersecting; });
        refreshFloat();
      }, { threshold: 0.2 }).observe(contactEl);
    }
  }
  floatCta?.addEventListener('click', () => window.open('https://t.me/fomin_developer', '_blank', 'noopener'));
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------------- Keyboard shortcut: T = Telegram ---------------- */
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (modal?.classList.contains('open')) return;
    if (event.key === 't' || event.key === 'T') window.open('https://t.me/fomin_developer', '_blank', 'noopener');
  });

  /* ---------------- Service worker ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {}));
  }
})();
