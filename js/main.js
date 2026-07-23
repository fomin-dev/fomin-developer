(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Preloader ---------------- */
  const preloader = document.getElementById("preloader");
  window.addEventListener("load", () => {
    setTimeout(() => preloader.classList.add("done"), 350);
  });
  // failsafe in case load event is delayed
  setTimeout(() => preloader.classList.add("done"), 2500);

  /* ---------------- Particle background animation ---------------- */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const PARTICLE_COUNT = 40;
  const CONNECTION_DIST = 120;
  const CELL_SIZE = CONNECTION_DIST;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function Particle() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.5 + 0.1;
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function buildGrid() {
    const grid = {};
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = (p.x / CELL_SIZE) | 0;
      const cy = (p.y / CELL_SIZE) | 0;
      const key = cx + cy * 10000;
      if (!grid[key]) grid[key] = [];
      grid[key].push(i);
    }
    return grid;
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,162,75,${p.opacity})`;
      ctx.fill();
    }

    const grid = buildGrid();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = (p.x / CELL_SIZE) | 0;
      const cy = (p.y / CELL_SIZE) | 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = (cx + dx) + (cy + dy) * 10000;
          const cell = grid[key];
          if (!cell) continue;
          for (let j = 0; j < cell.length; j++) {
            const k = cell[j];
            if (k <= i) continue;
            const q = particles[k];
            const ddx = p.x - q.x;
            const ddy = p.y - q.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < CONNECTION_DIST) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(201,162,75,${0.1 * (1 - dist / CONNECTION_DIST)})`;
              ctx.stroke();
            }
          }
        }
      }
    }

    requestAnimationFrame(animateParticles);
  }

  if (!reduceMotion) {
    animateParticles();
  }

  /* ---------------- Magnetic button effect ---------------- */
  const magneticElements = document.querySelectorAll('.btn, .nav-cta, .mobile-cta');
  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });

  /* ---------------- 3D tilt effect on service cards ---------------- */
  const serviceCards = document.querySelectorAll('.service');
  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  /* ---------------- Custom cursor ---------------- */
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  const isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (!isCoarse && !reduceMotion) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let dotX = 0, dotY = 0;
    let ticking = false;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dotX = mx;
      dotY = my;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
          ticking = false;
        });
      }
    }, { passive: true });

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.style.transform += " scale(1.6)");
      el.addEventListener("mouseleave", () => ring.style.transform = ring.style.transform.replace(" scale(1.6)", ""));
    });
  } else {
    dot.style.display = "none";
    ring.style.display = "none";
  }

  /* ---------------- Nav background on scroll ---------------- */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) nav.style.background = "rgba(27,5,9,0.92)";
    else nav.style.background = "linear-gradient(to bottom, rgba(27,5,9,.85), rgba(27,5,9,0))";
  }, { passive: true });

  /* ---------------- Mobile menu ---------------- */
  const burger = document.getElementById("navBurger");
  const mobileMenu = document.getElementById("mobileMenu");
  burger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    burger.classList.toggle("active", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      burger.classList.remove("active");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------------- Language switcher ---------------- */
  const langBtns = document.querySelectorAll(".lang-btn");
  const i18nCache = {};

  async function loadTranslations(lang) {
    if (i18nCache[lang]) return i18nCache[lang];
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) throw new Error(`Failed to load i18n/${lang}.json`);
    const data = await res.json();
    i18nCache[lang] = data;
    return data;
  }

  function applyTranslations(lang, data) {
    langBtns.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-pressed", "true");

    if (data) {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) el.innerHTML = data[key];
      });
    }

    document.documentElement.lang = lang;
  }

  async function setLanguage(lang, { skipFetch = false } = {}) {
    if (skipFetch) {
      applyTranslations(lang, null);
      return;
    }
    try {
      const data = await loadTranslations(lang);
      applyTranslations(lang, data);
    } catch (e) {
      applyTranslations(lang, null);
    }
  }

  // Load saved language or default to RU (markup is already RU, so skip the
  // network round-trip for the common case of a first-time RU visitor).
  const savedLang = localStorage.getItem('siteLanguage') || 'ru';
  setLanguage(savedLang, { skipFetch: savedLang === 'ru' });

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      localStorage.setItem('siteLanguage', lang);
    });
  });


  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll(".reveal-up, .reveal-scale");
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------------- GSAP enhancements ---------------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // hero glow subtle parallax
    gsap.to(".hero-glow", {
      yPercent: 30,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    
    // hero mark parallax
    gsap.to(".hero-mark", {
      yPercent: -20,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    
    // hero title parallax
    gsap.to(".hero-title", {
      yPercent: -15,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    
    // hero subtitle parallax
    gsap.to(".hero-sub", {
      yPercent: -10,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    // case gallery: gentle reveal-in as it enters view + slight parallax between frames
    gsap.utils.toArray(".frame").forEach((frame, i) => {
      gsap.fromTo(frame,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: frame, start: "top 92%", containerAnimation: null }
        }
      );
    });

    // contact flourish gentle drift
    gsap.to(".contact-flourish", {
      y: 30, ease: "none",
      scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  /* ---------------- Case galleries: drag to scroll on desktop ---------------- */
  document.querySelectorAll(".case-gallery").forEach((gallery) => {
    let isDown = false, startX, scrollLeft;
    gallery.addEventListener("mousedown", (e) => {
      isDown = true;
      gallery.style.cursor = "grabbing";
      startX = e.pageX - gallery.offsetLeft;
      scrollLeft = gallery.scrollLeft;
    });
    ["mouseleave", "mouseup"].forEach((evt) =>
      gallery.addEventListener(evt, () => { isDown = false; gallery.style.cursor = "grab"; })
    );
    gallery.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      gallery.scrollLeft = scrollLeft - (x - startX) * 1.2;
    });
    gallery.style.cursor = "grab";
  });

  /* ---------------- Smooth in-page nav links ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  /* ---------------- Terminal "typing code" signature animation ---------------- */
  const codeEl = document.getElementById("typeCode");
  if (codeEl) {
    const lines = [
      { t: "c", text: "// floressa_bot.js" },
      { t: "k", text: "bot", after: ".on(", literal: true },
      { t: "s", text: "\"new_order\"", inline: true },
      { t: "p", text: ", async (order) => {" },
      { t: "i", text: "  await catalog.publish(order.item);" },
      { t: "i", text: "  await channel.post(order.item, {" },
      { t: "i", text: "    caption: formatCaption(order)," },
      { t: "i", text: "    button: buyLink(order.id)," },
      { t: "i", text: "  });" },
      { t: "p", text: "});" },
      { t: "b", text: "" },
      { t: "ok", text: "✓ Production ready" }
    ];

    const fullText = lines.map(l => l.text).join("\n");
    let started = false;

    const typeIt = () => {
      if (started) return;
      started = true;
      let i = 0;
      codeEl.textContent = "";
      const speed = 18;
      const step = () => {
        if (i <= fullText.length) {
          codeEl.textContent = fullText.slice(0, i);
          i++;
          setTimeout(step, speed + (Math.random() * 14));
        } else {
          codeEl.innerHTML = fullText
            .replace(/^\/\/.*$/m, (m) => `<span class="tok-comment">${m}</span>`)
            .replace(/✓ Production ready/, '<span class="tok-ok">✓ Production ready</span>');
        }
      };
      step();
    };

    if (reduceMotion) {
      codeEl.textContent = fullText;
    } else {
      const termIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            typeIt();
            termIO.disconnect();
          }
        });
      }, { threshold: 0.4 });
      termIO.observe(codeEl.closest(".terminal"));
    }
  }

  /* ---------------- Back to top ---------------- */
  const toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", () => {
      toTop.classList.toggle("visible", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Active nav link on scroll ---------------- */
  const navLinks = document.querySelectorAll(".nav-links a[data-nav]");
  const navSections = Array.from(navLinks)
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (navSections.length) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (!link) return;
        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    navSections.forEach((s) => navIO.observe(s));
  }

  /* ---------------- Service worker (offline cache) ---------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
})();
