(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = document.getElementById('desktop');
  const appWindow = document.getElementById('fominWindow');
  const appContent = document.getElementById('appContent');
  const bootScreen = document.getElementById('bootScreen');
  const toast = document.getElementById('toast');

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  };

  window.addEventListener('load', () => {
    window.setTimeout(() => bootScreen?.classList.add('hidden'), reduceMotion ? 0 : 720);
  });

  /* ---------------- System clock ---------------- */
  const clock = document.getElementById('clock');
  const updateClock = () => {
    if (!clock) return;
    const locale = document.documentElement.lang === 'uk' ? 'uk-UA' : document.documentElement.lang === 'en' ? 'en-GB' : 'ru-RU';
    clock.textContent = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  /* ---------------- Window controls ---------------- */
  const openApp = () => {
    appWindow?.classList.remove('window-min');
    appWindow?.setAttribute('aria-hidden', 'false');
    showToast('Fomin app opened');
  };
  const closeApp = () => {
    appWindow?.classList.add('window-min');
    appWindow?.setAttribute('aria-hidden', 'true');
    showToast('Fomin app minimized');
  };
  document.querySelectorAll('[data-open-app]').forEach((button) => button.addEventListener('click', openApp));
  document.getElementById('closeApp')?.addEventListener('click', closeApp);
  document.getElementById('powerButton')?.addEventListener('click', closeApp);
  document.getElementById('minimizeApp')?.addEventListener('click', closeApp);
  document.getElementById('maximizeApp')?.addEventListener('click', () => {
    appWindow?.classList.toggle('window-max');
    showToast(appWindow?.classList.contains('window-max') ? 'Fomin app maximized' : 'Fomin app restored');
  });
  document.getElementById('systemMenu')?.addEventListener('click', openApp);
  document.getElementById('windowMenu')?.addEventListener('click', () => showToast('Fomin / personal creative workspace'));

  /* ---------------- App views ---------------- */
  const viewButtons = document.querySelectorAll('[data-view]');
  const viewPanels = document.querySelectorAll('[data-view-panel]');
  const switchView = (view) => {
    if (!document.querySelector(`[data-view-panel="${view}"]`)) return;
    openApp();
    viewPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === view));
    viewButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    if (appContent) appContent.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  viewButtons.forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));

  /* ---------------- Desktop parallax ---------------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches && desktop) {
    desktop.addEventListener('pointermove', (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      desktop.style.setProperty('--pointer-x', `${x * 10}px`);
      desktop.style.setProperty('--pointer-y', `${y * 8}px`);
    }, { passive: true });
  }

  /* ---------------- Portfolio case modal ---------------- */
  const modal = document.getElementById('caseModal');
  const modalImage = document.getElementById('modalImage');
  const modalType = document.getElementById('modalType');
  const modalTitle = document.getElementById('modalTitle');
  const modalKicker = document.getElementById('modalKicker');
  const modalDescription = document.getElementById('modalDescription');
  const modalHighlight = document.getElementById('modalHighlight');
  const modalFeatures = document.getElementById('modalFeatures');
  const modalResult = document.getElementById('modalResult');
  const caseData = {
    floressa: { image: 'assets/floressa-4.webp', type: 'case_floressa_badge', title: 'case_floressa_title', kicker: 'case_floressa_kicker', description: 'case_floressa_desc', highlight: 'case_floressa_highlight', result: 'case_floressa_result', features: [1,2,3,4,5].map((n) => `case_floressa_feature${n}`) },
    wave: { image: 'assets/wave_beer-960.webp', type: 'case_wave_badge', title: 'case_wave_title', kicker: 'case_wave_kicker', description: 'case_wave_desc', highlight: 'case_wave_highlight', result: 'case_wave_result', features: [1,2,3,4,5,6].map((n) => `case_wave_feature${n}`) },
    module: { image: 'assets/module-house-hero-960.webp', type: 'case_modulehouse_badge', title: 'case_modulehouse_title', kicker: 'case_modulehouse_kicker', description: 'case_modulehouse_desc', highlight: 'case_modulehouse_highlight', result: 'case_modulehouse_result', features: [1,2,3,4,5,6].map((n) => `case_modulehouse_feature${n}`) }
  };
  let currentDictionary = null;
  const textFor = (key) => (currentDictionary && currentDictionary[key]) || key;
  const renderCase = (name) => {
    const data = caseData[name];
    if (!data || !modal) return;
    modalImage.src = data.image;
    modalImage.alt = textFor(data.title);
    modalType.textContent = textFor(data.type);
    modalTitle.textContent = textFor(data.title);
    modalKicker.textContent = textFor(data.kicker);
    modalDescription.textContent = textFor(data.description);
    modalHighlight.textContent = textFor(data.highlight);
    modalResult.textContent = textFor(data.result);
    modalFeatures.innerHTML = data.features.map((key) => `<li>${textFor(key)}</li>`).join('');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };
  const openCase = async (name) => {
    if (!currentDictionary) {
      const fallbackLanguage = document.documentElement.lang || 'ru';
      await setLanguage(fallbackLanguage);
    }
    renderCase(name);
  };
  const closeCase = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('[data-project]').forEach((card) => card.addEventListener('click', () => openCase(card.dataset.project)));
  document.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeCase));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCase();
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

  /* ---------------- Keyboard shortcuts ---------------- */
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const shortcuts = { '1': 'home', '2': 'about', '3': 'work', '4': 'services', '5': 'pricing', '6': 'source', '7': 'contact' };
    if (shortcuts[event.key]) switchView(shortcuts[event.key]);
  });

  /* ---------------- Service worker ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {}));
  }
})();
