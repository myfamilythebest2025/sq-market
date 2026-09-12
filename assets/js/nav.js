/* ============================================================
   SQ MARKET — НАВИГАЦИЯ
   «Жидкая» капсула: цветная капля перетекает между пунктами и
   растягивается в движении (две пружины с разной жёсткостью —
   передний край обгоняет задний). Плюс мобильное меню и
   подсветка активной секции при скролле.
   ============================================================ */

window.SQNav = (function () {
  const { $, $$, on, Spring, addTask, reduced } = window.SQCore;

  let items = [];
  let blob, navEl;
  let sLeft, sRight;
  let current = null;   // пункт, подсвеченный скроллом
  let hovered = null;   // пункт под курсором
  let visible = false;

  /* ---------- Сборка разметки ---------- */
  function build() {
    navEl = $(".pill-nav");
    const mobile = $(".mobile-nav__links");
    if (!navEl) return;

    // window.SQ_NAV — меню отдельной страницы («Инвесторам»).
    // Если у пункта есть href, он ведёт на другую страницу, а не на якорь.
    const links = window.SQ_NAV || window.SQ.nav;
    const href = (l) => l.href || "#" + l.id;

    navEl.innerHTML =
      '<span class="pill-nav__blob" aria-hidden="true"></span>' +
      links
        .map(
          (l) => `
        <a class="pill-nav__item" href="${href(l)}" data-nav="${l.id || ""}" style="--item-color:${l.color}">
          <i class="pn-dot" aria-hidden="true"></i>
          <span class="pn-slot">
            <span>${l.label}</span>
            <span aria-hidden="true">${l.label}</span>
          </span>
        </a>`
        )
        .join("");

    if (mobile) {
      mobile.innerHTML = links
        .map((l, i) => `<a href="${href(l)}" style="--d:${120 + i * 55}ms">${l.label}</a>`)
        .join("");
    }

    blob = $(".pill-nav__blob", navEl);
    items = $$(".pill-nav__item", navEl);

    sLeft = new Spring(0, 210, 20);
    sRight = new Spring(0, 210, 20);

    items.forEach((el) => {
      on(el, "pointerenter", () => { hovered = el; sync(); });
      on(el, "focus", () => { hovered = el; sync(); });
    });

    on(navEl, "pointerleave", () => { hovered = null; sync(); });
    on(window, "resize", () => sync(true));
  }

  /* ---------- Куда должна встать капля ---------- */
  function sync(instant = false) {
    if (!navEl || !items.length) return;
    const active = hovered || current;

    if (!active) {
      visible = false;
      blob.style.setProperty("--blob-o", "0");
      return;
    }

    const navBox = navEl.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    const left = box.left - navBox.left;
    const right = left + box.width;

    blob.style.setProperty("--blob-color", getComputedStyle(active).getPropertyValue("--item-color"));
    blob.style.setProperty("--blob-o", "1");

    if (!visible || instant || reduced) {
      // первое появление — без «прилёта» через всю панель
      sLeft.jump(left);
      sRight.jump(right);
      visible = true;
      paint();
      return;
    }

    // передний край движется жёстче заднего — отсюда эффект растягивания
    const goingRight = right > sRight.value;
    sLeft.k = goingRight ? 150 : 300;
    sRight.k = goingRight ? 300 : 150;

    sLeft.set(left);
    sRight.set(right);
  }

  function paint() {
    if (!blob) return;
    const l = sLeft.value;
    const w = Math.max(0, sRight.value - l);
    blob.style.setProperty("--blob-x", l.toFixed(2) + "px");
    blob.style.setProperty("--blob-w", w.toFixed(2) + "px");
  }

  /* ---------- Подсветка активной секции ---------- */
  function watchSections() {
    const ids = (window.SQ_NAV || window.SQ.nav).map((n) => n.id).filter(Boolean);
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = items.find((i) => i.dataset.nav === e.target.id);
          if (!el || el === current) return;
          items.forEach((i) => i.classList.remove("is-active"));
          el.classList.add("is-active");
          current = el;
          if (!hovered) sync();
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Мобильное меню ---------- */
  function initMobile() {
    const burger = $(".burger");
    on(burger, "click", () => {
      const open = document.body.classList.toggle("nav-open");
      document.body.classList.toggle("is-locked", open);
      burger.setAttribute("aria-expanded", String(open));
    });

    on(document, "click", (e) => {
      if (e.target.closest(".mobile-nav a")) {
        document.body.classList.remove("nav-open", "is-locked");
        if (burger) burger.setAttribute("aria-expanded", "false");
      }
    });

    on(document, "keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open", "is-locked");
      }
    });
  }

  return {
    init() {
      build();
      if (!navEl) return;
      watchSections();
      initMobile();
      addTask((dt) => {
        if (!visible) return;
        if (sLeft.settled && sRight.settled) return;
        sLeft.step(dt);
        sRight.step(dt);
        paint();
      });
    },
  };
})();
