(() => {
  const STORAGE_KEY = "elena-practice-cms-v3";
  const defaults = () => structuredClone(window.SITE_CONTENT || {});
  let content = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults(), ...JSON.parse(raw) };
    } catch (_) {}
    return defaults();
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    content = data;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindScalars() {
    document.querySelectorAll("[data-bind]").forEach((el) => {
      const key = el.getAttribute("data-bind");
      if (content[key] != null) el.textContent = content[key];
    });
    document.querySelectorAll("[data-bind-href]").forEach((el) => {
      const key = el.getAttribute("data-bind-href");
      if (content[key]) el.setAttribute("href", content[key]);
    });
    if (content.metaTitle) document.title = content.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && content.metaDescription) meta.setAttribute("content", content.metaDescription);
  }

  function renderPortrait() {
    const img = document.getElementById("portrait-img");
    const ph = document.getElementById("portrait-ph");
    const grid = document.getElementById("about-grid");
    const heroPhoto = document.getElementById("hero-photo");
    const heroFallback = document.getElementById("hero-photo-fallback");
    const url = (content.photoUrl || "").trim();
    const alt = content.photoCaption || content.brand || "Психолог";

    const apply = (el) => {
      if (!el) return;
      el.src = url;
      el.alt = alt;
      el.hidden = false;
    };

    if (url) {
      grid?.classList.remove("no-photo");
      apply(img);
      apply(heroPhoto);
      if (img) {
        img.onerror = () => {
          img.hidden = true;
          grid?.classList.add("no-photo");
        };
      }
      if (heroPhoto) {
        heroPhoto.onerror = () => {
          heroPhoto.hidden = true;
          if (heroFallback) heroFallback.hidden = false;
        };
        if (heroFallback) heroFallback.hidden = true;
      }
      if (ph) ph.hidden = true;
    } else {
      grid?.classList.add("no-photo");
      if (img) {
        img.removeAttribute("src");
        img.hidden = true;
      }
      if (heroPhoto) {
        heroPhoto.removeAttribute("src");
        heroPhoto.hidden = true;
      }
      if (heroFallback) heroFallback.hidden = false;
      if (ph) ph.hidden = true;
    }
  }

  function renderPrinciples() {
    const root = document.getElementById("principles");
    if (!root) return;
    root.innerHTML = (content.principles || [])
      .map(
        (p, i) => `
      <div class="principle reveal d${Math.min(i + 1, 3)}">
        <div class="principle-icon" aria-hidden="true">0${i + 1}</div>
        <div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.text)}</p>
        </div>
      </div>`
      )
      .join("");
  }

  function renderRequests() {
    const root = document.getElementById("requests-list");
    if (!root) return;
    root.innerHTML = (content.requests || [])
      .map(
        (r, i) => `
      <article class="request reveal d${i % 3}">
        <span class="request-num">0${i + 1}</span>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.text)}</p>
      </article>`
      )
      .join("");
  }

  function renderProcess() {
    const root = document.getElementById("process-list");
    if (!root) return;
    root.innerHTML = (content.process || [])
      .map(
        (s, i) => `
      <div class="step reveal d${Math.min(i, 3)}">
        <div class="step-num">0${i + 1}</div>
        <div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
        </div>
      </div>`
      )
      .join("");
  }

  function renderPricingRules() {
    const root = document.getElementById("pricing-rules");
    if (!root) return;
    root.innerHTML = (content.pricingRules || [])
      .map(
        (r) => `
      <div>
        <h4>${esc(r.title)}</h4>
        <p>${esc(r.text)}</p>
      </div>`
      )
      .join("");
  }

  function renderReviews() {
    const root = document.getElementById("reviews-list");
    if (!root) return;
    root.innerHTML = (content.reviews || [])
      .map(
        (r, i) => `
      <figure class="review${i === 0 ? " featured" : ""} reveal d${i}">
        <blockquote>«${esc(r.text)}»</blockquote>
        <cite>— ${esc(r.author)}${r.tag ? ` <span class="review-tag">${esc(r.tag)}</span>` : ""}</cite>
      </figure>`
      )
      .join("");
  }

  function renderFaq() {
    const root = document.getElementById("faq-list");
    if (!root) return;
    root.innerHTML = (content.faq || [])
      .map(
        (item, i) => `
      <div class="faq-item reveal d${Math.min(i % 3, 2)}">
        <button class="faq-toggle" type="button" aria-expanded="false" aria-controls="faq-ans-${i}">
          <span class="q">${esc(item.q)}</span>
          <span class="faq-plus" aria-hidden="true"></span>
        </button>
        <div class="faq-ans" id="faq-ans-${i}"><div><p>${esc(item.a)}</p></div></div>
      </div>`
      )
      .join("");

    root.querySelectorAll(".faq-item").forEach((item) => {
      const btn = item.querySelector(".faq-toggle");
      btn?.addEventListener("click", () => {
        const open = item.classList.contains("active");
        root.querySelectorAll(".faq-item").forEach((o) => {
          o.classList.remove("active");
          o.querySelector(".faq-toggle")?.setAttribute("aria-expanded", "false");
        });
        if (!open) {
          item.classList.add("active");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function observeReveals() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = document.querySelectorAll(".reveal");
    if (reduce) {
      nodes.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    nodes.forEach((el) => io.observe(el));
  }

  function renderAll() {
    bindScalars();
    renderPortrait();
    renderPrinciples();
    renderRequests();
    renderProcess();
    renderPricingRules();
    renderReviews();
    renderFaq();
    observeReveals();
  }

  /* ——— Chrome ——— */
  const header = document.getElementById("site-header");
  const hero = document.getElementById("hero");
  const menuBtn = document.getElementById("menu-btn");
  const navScreen = document.getElementById("nav-screen");
  const sticky = document.getElementById("sticky-cta");
  const contact = document.getElementById("contact");
  const heroCta = document.querySelector(".hero-actions .cta");

  requestAnimationFrame(() => hero?.classList.add("is-ready"));

  const onScroll = () => header?.classList.toggle("is-scrolled", scrollY > 36);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    navScreen?.classList.toggle("is-open", open);
    navScreen?.setAttribute("aria-hidden", String(!open));
    menuBtn?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  menuBtn?.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  navScreen?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* Sticky mobile CTA */
  if (sticky && heroCta && matchMedia("(max-width: 899px)").matches) {
    let heroOut = false;
    let contactIn = false;
    const syncSticky = () => {
      const show = heroOut && !contactIn;
      sticky.classList.toggle("is-visible", show);
      document.body.classList.toggle("has-sticky", show);
    };
    new IntersectionObserver(([e]) => {
      heroOut = !e.isIntersecting;
      syncSticky();
    }, { threshold: 0 }).observe(heroCta);
    if (contact) {
      new IntersectionObserver(([e]) => {
        contactIn = e.isIntersecting;
        syncSticky();
      }, { threshold: 0.15 }).observe(contact);
    }
  }

  /* Editor mode */
  const isEditor = /(?:\?|&)edit(?:&|=|$)/.test(location.search) || location.hash === "#edit";
  if (isEditor) {
    document.body.classList.add("is-editor");
    const fab = document.getElementById("cms-open");
    if (fab) fab.hidden = false;
  }

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setMenu(false);
      closeCms();
    }
  });

  /* ——— CMS ——— */
  const drawer = document.getElementById("cms-drawer");
  const fieldsRoot = document.getElementById("cms-fields");

  const fieldDefs = [
    { section: "Основное" },
    { key: "brand", label: "Имя / бренд", type: "text" },
    { key: "photoUrl", label: "Фото (URL или photo.jpg)", type: "text" },
    { key: "photoCaption", label: "Подпись к фото", type: "text" },
    { key: "telegramUrl", label: "Telegram URL", type: "text" },
    { key: "telegramHandle", label: "Telegram @handle", type: "text" },
    { key: "price", label: "Стоимость", type: "text" },
    { key: "duration", label: "Длительность", type: "text" },
    { section: "Первый экран" },
    { key: "heroLabel", label: "Метка над заголовком", type: "text" },
    { key: "heroTitle", label: "Заголовок (строка 1)", type: "text" },
    { key: "heroTitleAccent", label: "Заголовок (строка 2)", type: "text" },
    { key: "heroSub", label: "Подзаголовок", type: "textarea" },
    { key: "heroNote", label: "Подсказка под кнопкой", type: "text" },
    { key: "navCta", label: "Кнопка в шапке", type: "text" },
    { key: "heroCta", label: "Кнопка hero", type: "text" },
    { key: "heroSecondary", label: "Вторичная ссылка hero", type: "text" },
    { key: "stickyCta", label: "Мобильная sticky-кнопка", type: "text" },
    { section: "О подходе" },
    { key: "aboutTitle", label: "Заголовок", type: "text" },
    { key: "aboutP1", label: "Абзац 1", type: "textarea" },
    { key: "aboutP2", label: "Абзац 2", type: "textarea" },
    { key: "education", label: "Образование", type: "text" },
    { key: "method", label: "Метод", type: "text" },
    { key: "experience", label: "Опыт", type: "text" },
    { key: "membership", label: "Членство", type: "text" },
    { section: "CTA и финал" },
    { key: "requestsCta", label: "CTA после запросов", type: "text" },
    { key: "processCta", label: "CTA в процессе", type: "text" },
    { key: "pricingTitle", label: "Заголовок цены", type: "text" },
    { key: "pricingDesc", label: "Описание тарифа", type: "text" },
    { key: "pricingCta", label: "Кнопка цены", type: "text" },
    { key: "finaleTitle", label: "Финальный заголовок", type: "text" },
    { key: "finaleSub", label: "Финальный текст", type: "textarea" },
    { key: "finaleCta", label: "Финальная кнопка", type: "text" },
    { key: "finaleMeta", label: "Мета под финалом", type: "text" },
    { section: "Подвал" },
    { key: "footerAbout", label: "О практике", type: "textarea" },
    { key: "footerHours", label: "Часы работы", type: "text" },
    { key: "footerEthics", label: "Этика", type: "textarea" },
    { key: "copyright", label: "Копирайт", type: "text" }
  ];

  function buildCmsFields() {
    if (!fieldsRoot) return;
    fieldsRoot.innerHTML = `
      <p class="cms-hint">Списки запросов, отзывов и FAQ удобнее править в <strong>content.js</strong>. Редактор: добавьте <code>?edit</code> к адресу страницы.</p>
    `;
    fieldDefs.forEach((f) => {
      if (f.section) {
        const h = document.createElement("div");
        h.className = "cms-section-title";
        h.textContent = f.section;
        fieldsRoot.appendChild(h);
        return;
      }
      const wrap = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = f.label;
      label.setAttribute("for", `cms-${f.key}`);
      const input = f.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
      if (f.type === "textarea") input.rows = 3;
      else input.type = "text";
      input.id = `cms-${f.key}`;
      input.dataset.key = f.key;
      input.value = content[f.key] ?? "";
      wrap.append(label, input);
      fieldsRoot.appendChild(wrap);
    });
  }

  function collectCms() {
    const next = { ...content };
    fieldsRoot?.querySelectorAll("[data-key]").forEach((el) => {
      next[el.dataset.key] = el.value;
    });
    return next;
  }

  function openCms() {
    buildCmsFields();
    drawer?.classList.add("open");
    document.body.classList.add("cms-open");
  }
  function closeCms() {
    drawer?.classList.remove("open");
    document.body.classList.remove("cms-open");
  }

  document.getElementById("cms-open")?.addEventListener("click", openCms);
  document.getElementById("cms-close")?.addEventListener("click", closeCms);
  document.getElementById("cms-backdrop")?.addEventListener("click", closeCms);

  document.getElementById("cms-save")?.addEventListener("click", () => {
    save(collectCms());
    renderAll();
    const btn = document.getElementById("cms-save");
    if (btn) {
      const t = btn.textContent;
      btn.textContent = "Сохранено";
      setTimeout(() => {
        btn.textContent = t;
        closeCms();
      }, 700);
    }
  });

  document.getElementById("cms-reset")?.addEventListener("click", () => {
    if (!confirm("Сбросить правки в браузере к значениям из content.js?")) return;
    localStorage.removeItem(STORAGE_KEY);
    content = defaults();
    renderAll();
    buildCmsFields();
  });

  document.getElementById("cms-export")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(collectCms(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site-content.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  renderAll();
})();
