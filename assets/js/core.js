/* ============================================================
   SQ MARKET — ЯДРО
   Маленькие помощники, физика пружины, тема, курсор,
   прелоадер, прогресс скролла, поведение шапки.
   ============================================================ */

window.SQCore = (function () {
  /* ---------- Помощники ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* Граница «телефон / всё остальное». Держим её в одном месте:
     это же значение стоит в CSS (@media max-width: 860px). */
  const mqMobile = window.matchMedia("(max-width: 860px)");
  const isMobile = () => mqMobile.matches;

  /* Вызовет cb, когда сайт переходит с телефона на десктоп и обратно */
  function onBreak(cb) {
    if (mqMobile.addEventListener) mqMobile.addEventListener("change", cb);
    else mqMobile.addListener(cb);
  }

  /* ---------- Экранирование текста из data.js ---------- */
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* ============================================================
     ПРУЖИНА
     Даёт «живое» движение с лёгким перелётом — им двигается
     «капля» в навигации и магнитные кнопки.
     stiffness — жёсткость, damping — затухание.
     ============================================================ */
  class Spring {
    constructor(value = 0, stiffness = 210, damping = 20) {
      this.value = value;
      this.target = value;
      this.velocity = 0;
      this.k = stiffness;
      this.d = damping;
    }
    set(v) { this.target = v; }
    jump(v) { this.value = this.target = v; this.velocity = 0; }
    step(dt) {
      // ограничиваем шаг, чтобы после переключения вкладки не «выстреливало»
      const h = Math.min(dt, 1 / 30);
      const force = -this.k * (this.value - this.target);
      const damper = -this.d * this.velocity;
      this.velocity += (force + damper) * h;
      this.value += this.velocity * h;
      return this.value;
    }
    get settled() {
      return Math.abs(this.velocity) < 0.05 && Math.abs(this.value - this.target) < 0.05;
    }
  }

  /* ---------- Единый кадровый цикл ---------- */
  const tasks = new Set();
  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    tasks.forEach((fn) => fn(dt, now));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const addTask = (fn) => tasks.add(fn);
  const removeTask = (fn) => tasks.delete(fn);

  /* ============================================================
     ТЕМА (светлая / тёмная)
     ============================================================ */
  function initTheme() {
    const KEY = "sq-theme";
    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* приватный режим */ }

    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    apply(saved || system);

    function apply(mode) {
      root.setAttribute("data-theme", mode);
      $$("[data-theme-toggle]").forEach((b) => {
        b.setAttribute("aria-label", mode === "dark" ? "Светлая тема" : "Тёмная тема");
        b.innerHTML = window.SQIcons.get(mode === "dark" ? "sun" : "moon");
      });
    }

    $$("[data-theme-toggle]").forEach((btn) =>
      on(btn, "click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* игнорируем */ }
      })
    );
  }

  /* ============================================================
     ПРЕЛОАДЕР
     ============================================================ */
  function initPreloader() {
    const el = document.getElementById("preloader");
    if (!el) return;
    const bar = $(".preloader__bar i", el);
    let p = 0;

    const tick = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 92);
      if (bar) bar.style.setProperty("--pl", p + "%");
    }, 160);

    const finish = () => {
      clearInterval(tick);
      if (bar) bar.style.setProperty("--pl", "100%");
      setTimeout(() => {
        el.classList.add("is-done");
        document.body.classList.add("is-loaded");
      }, 320);
    };

    if (document.readyState === "complete") setTimeout(finish, 350);
    else on(window, "load", () => setTimeout(finish, 250));

    // Страховка: не держим посетителя дольше 3.5 секунд
    setTimeout(finish, 3500);
  }

  /* ============================================================
     ПРОГРЕСС СКРОЛЛА, ШАПКА, КНОПКА «НАВЕРХ»
     ============================================================ */
  function initScrollUI() {
    const prog = $(".scroll-progress");
    const header = $(".site-header");
    const toTop = $(".to-top");
    let prev = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.setProperty("--p", max > 0 ? clamp(y / max, 0, 1) : 0);

      if (header) {
        header.classList.toggle("is-stuck", y > 40);
        // прячем шапку при скролле вниз и возвращаем при движении вверх
        const goingDown = y > prev && y > 320 && !document.body.classList.contains("nav-open");
        header.classList.toggle("is-hidden", goingDown);
      }
      if (toTop) toTop.classList.toggle("is-shown", y > window.innerHeight * 0.8);
      prev = y;
    };

    on(window, "scroll", update, { passive: true });
    update();

    on(toTop, "click", () =>
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
    );
  }

  /* ---------- Плавная прокрутка к якорю с учётом шапки ---------- */
  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const header = $(".site-header");
    const offset = (header ? header.offsetHeight : 0) + 12;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }

  function initAnchors() {
    on(document, "click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href").slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      document.body.classList.remove("nav-open");
      scrollToId(id);
      history.replaceState(null, "", "#" + id);
    });
  }

  return {
    $, $$, on, clamp, lerp, esc, reduced, isTouch, isMobile, onBreak,
    Spring, addTask, removeTask, scrollToId,
    init() {
      initTheme();
      initPreloader();
      initScrollUI();
      initAnchors();
    },
  };
})();
