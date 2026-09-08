/* ============================================================
   SQ MARKET — ДВИЖЕНИЕ И ИНТЕРАКТИВ
   Магнитные кнопки, появление при скролле, построчные заголовки,
   параллакс, счётчики, сменное слово, бегущая строка, табы,
   аккордеон.
   ============================================================ */

window.SQUI = (function () {
  const { $, $$, on, clamp, lerp, reduced, addTask } = window.SQCore;

  /* ============================================================
     1. МАГНИТНЫЕ КНОПКИ
     Кнопка слегка тянется к курсору и мягко возвращается назад.
     Разметка: <a class="btn" data-magnetic>…</a>
     ============================================================ */
  function initMagnetic() {
    if (reduced || window.SQCore.isTouch) return;

    $$("[data-magnetic]").forEach((el) => {
      const power = parseFloat(el.dataset.magnetic) || 0.3;

      on(el, "pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * power;
        const y = (e.clientY - r.top - r.height / 2) * power;
        el.classList.add("is-magnetic");
        el.style.setProperty("--mx", x.toFixed(2) + "px");
        el.style.setProperty("--my", y.toFixed(2) + "px");
      });

      on(el, "pointerleave", () => {
        el.classList.remove("is-magnetic");
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  }

  /* ============================================================
     2. ПОСТРОЧНОЕ ПОЯВЛЕНИЕ ЗАГОЛОВКОВ
     Разбиваем текст на слова, группируем по строкам и прячем
     каждую строку за «шторкой» с overflow:hidden.
     Разметка: <h2 data-split>…</h2>
     ============================================================ */
  const SPLIT_SRC = new WeakMap();

  function splitLines(el) {
    // запоминаем исходный текст, чтобы уметь пересобрать строки после
    // загрузки шрифтов и при изменении ширины окна
    if (!SPLIT_SRC.has(el)) SPLIT_SRC.set(el, el.innerHTML);
    else el.innerHTML = SPLIT_SRC.get(el);

    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part.trim()) return;
            const w = document.createElement("span");
            w.className = "sw";
            w.textContent = part;
            words.push(w);
          });
        } else if (child.nodeType === 1) {
          // вложенные элементы (например, сменное слово) не трогаем
          const w = document.createElement("span");
          w.className = "sw";
          w.appendChild(child.cloneNode(true));
          words.push(w);
        }
      });
    };
    walk(el);
    if (!words.length) return;

    el.textContent = "";
    words.forEach((w, i) => {
      el.appendChild(w);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });

    // группируем слова по вертикальной позиции — это и есть строки
    const lines = [];
    let top = null;
    words.forEach((w) => {
      const t = Math.round(w.offsetTop);
      if (top === null || Math.abs(t - top) > 4) {
        lines.push([]);
        top = t;
      }
      lines[lines.length - 1].push(w);
    });

    el.textContent = "";
    lines.forEach((line, i) => {
      const outer = document.createElement("span");
      outer.className = "split-line";
      const inner = document.createElement("span");
      inner.style.setProperty("--d", i * 90 + "ms");
      line.forEach((w, j) => {
        inner.appendChild(w);
        if (j < line.length - 1) inner.appendChild(document.createTextNode(" "));
      });
      outer.appendChild(inner);
      el.appendChild(outer);
    });
  }

  /* ============================================================
     2б. ПОДГОНКА КРУПНОГО ЗАГОЛОВКА ПОД ШИРИНУ
     Длинное слово («НЕОБХОДИМОЕ») не должно ни разрываться, ни
     вылезать за край. Меряем самое длинное слово и, если оно не
     влезает, уменьшаем кегль ровно настолько, насколько нужно.
     Разметка: <h1 data-fit>
     ============================================================ */
  const FIT_SRC = new WeakMap();

  function fitOne(el) {
    // Текст запоминаем один раз: после разбивки на строки textContent
    // склеивает слова соседних строк и мерить его уже нельзя.
    if (!FIT_SRC.has(el)) FIT_SRC.set(el, (el.textContent || "").trim());
    const source = FIT_SRC.get(el);

    el.style.fontSize = "";                       // возвращаем размер из CSS
    const natural = parseFloat(getComputedStyle(el).fontSize);
    const avail = el.clientWidth;
    if (!avail || !natural) return;

    // измеряем самое длинное слово теми же начертанием и трекингом
    const probe = document.createElement("span");
    const cs = getComputedStyle(el);
    probe.style.cssText =
      `position:absolute;left:-9999px;top:0;white-space:pre;` +
      `font:${cs.fontStyle} ${cs.fontWeight} ${natural}px/${cs.lineHeight} ${cs.fontFamily};` +
      `letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}`;
    document.body.appendChild(probe);

    let widest = 0;
    if (cs.whiteSpace === "nowrap" || cs.whiteSpace === "pre") {
      // строка не переносится — значит меряем её целиком
      probe.textContent = source;
      widest = probe.getBoundingClientRect().width;
    } else {
      source.split(/\s+/).forEach((w) => {
        if (!w) return;
        probe.textContent = w;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      });
    }
    probe.remove();

    if (widest > avail) el.style.fontSize = (natural * (avail / widest) * 0.99).toFixed(2) + "px";
  }

  /* Пересчёт заголовков: сперва подбираем кегль, потом режем на строки.
     Порядок важен — от кегля зависит, сколько получится строк. */
  function relayoutHeadings() {
    $$("[data-fit]").forEach(fitOne);
    $$("[data-split]").forEach(splitLines);
  }

  function initHeadings() {
    relayoutHeadings();

    // шрифты приезжают позже разметки — после их загрузки пересчитываем
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayoutHeadings);

    // и при изменении ширины окна (высота не важна — это адресная строка на телефоне)
    let w = window.innerWidth, t;
    on(window, "resize", () => {
      if (Math.abs(window.innerWidth - w) < 12) return;
      w = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(relayoutHeadings, 180);
    });
  }

  /* ============================================================
     2в. КАРУСЕЛЬ С ТОЧКАМИ (телефон: «Что внутри», «Интерьер»)
     Разметка: <div class="carousel" data-dots>…карточки…</div>
     Точки рисуются сами и подсвечивают текущую «страницу».
     ============================================================ */
  function initCarousels() {
    $$("[data-dots]").forEach((track) => {
      const holder = track.nextElementSibling;
      if (!holder || !holder.classList.contains("dots")) return;

      const build = () => {
        // на десктопе карусели нет — прокрутки нет, значит и точки не нужны
        const ox = getComputedStyle(track).overflowX;
        const scrolls = (ox === "auto" || ox === "scroll") &&
          track.scrollWidth - track.clientWidth > 24;
        const pages = scrolls ? track.children.length : 1;
        const bar = pages > 14;                       // слишком много точек — рисуем полосу
        const key = pages + (bar ? "b" : "d");
        if (holder.dataset.pages === key) return;
        holder.dataset.pages = key;
        holder.classList.toggle("dots--bar", bar);
        holder.innerHTML = bar
          ? '<i></i>'
          : Array.from({ length: pages },
              (_, i) => `<button type="button" aria-label="Показать ${i + 1}"></button>`).join("");
        holder.hidden = !scrolls;
        $$("button", holder).forEach((b, i) =>
          on(b, "click", () => {
            const card = track.children[i];
            if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
          })
        );
      };

      const mark = () => {
        const max = track.scrollWidth - track.clientWidth;
        const p = max > 0 ? track.scrollLeft / max : 0;
        if (holder.classList.contains("dots--bar")) {
          holder.style.setProperty("--p", p);
          return;
        }
        const n = track.children.length;
        const i = Math.round(p * (n - 1));
        $$("button", holder).forEach((b, k) => b.classList.toggle("is-on", k === i));
      };

      build(); mark();
      on(track, "scroll", mark, { passive: true });
      on(window, "resize", () => { build(); mark(); });
    });
  }

  /* ============================================================
     3. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ
     ============================================================ */
  let io;
  function initReveal() {
    const targets = $$("[data-reveal], [data-split], [data-in]").filter((el) => !el.dataset.revealBound);

    if (reduced) {
      targets.forEach((el) => { el.classList.add("is-in"); el.dataset.revealBound = "1"; });
      return;
    }

    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
      );
    }

    targets.forEach((el) => {
      el.dataset.revealBound = "1";
      // родитель-секция тоже получает is-in — от неё зависят полоски и подчёркивания
      io.observe(el);
    });
  }

  /* ============================================================
     4. ПАРАЛЛАКС
     Разметка: <div data-parallax="0.18">
     ============================================================ */
  function initParallax() {
    // на телефоне параллакс только мешает — картинки «плавают» при скролле
    if (reduced || window.SQCore.isMobile()) return;
    const els = $$("[data-parallax]");
    if (!els.length) return;

    const state = els.map((el) => ({ el, k: parseFloat(el.dataset.parallax) || 0.15, cur: 0 }));

    addTask(() => {
      const vh = window.innerHeight;
      state.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
        const target = -progress * s.k * 100;
        s.cur = lerp(s.cur, target, 0.09);
        s.el.style.setProperty("--py", s.cur.toFixed(2) + "px");
      });
    });
  }

  /* ============================================================
     5. СЧЁТЧИКИ
     Разметка: <b data-count="40" data-suffix="%">0</b>
     ============================================================ */
  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;

    const run = (el) => {
      const to = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1400;
      const t0 = performance.now();

      const step = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (reduced) {
      els.forEach((el) => (el.textContent = el.dataset.count + (el.dataset.suffix || "")));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          run(e.target);
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
  }

  /* ============================================================
     6. СМЕННОЕ СЛОВО В ЗАГОЛОВКЕ
     ============================================================ */
  function initRotator() {
    const box = $(".rotator");
    if (!box) return;
    const words = window.SQ.hero.rotator;

    box.innerHTML = words.map((w, i) => `<span${i === 0 ? ' class="is-in-word"' : ""}>${w}</span>`).join("");
    const spans = $$("span", box);
    if (reduced || spans.length < 2) return;

    let i = 0;
    setInterval(() => {
      spans[i].classList.remove("is-in-word");
      spans[i].classList.add("is-out");
      const prev = i;
      i = (i + 1) % spans.length;
      spans[i].classList.remove("is-out");
      spans[i].classList.add("is-in-word");
      setTimeout(() => spans[prev].classList.remove("is-out"), 800);
    }, 2600);
  }

  /* ============================================================
     7. БЕГУЩАЯ СТРОКА — дублируем содержимое для бесшовной петли
     ============================================================ */
  function initTicker() {
    $$(".ticker__track").forEach((track) => {
      if (track.dataset.cloned) return;
      track.innerHTML += track.innerHTML;
      track.dataset.cloned = "1";
    });
  }

  /* ============================================================
     8. ТАБЫ (используются в «Твой день» и «Ассортимент»)
     Разметка: контейнер [data-tabs] с кнопками [data-tab="id"]
     и панелями [data-panel="id"]
     ============================================================ */
  function initTabs() {
    $$("[data-tabs]").forEach((root) => {
      if (root.dataset.tabsBound) return;
      root.dataset.tabsBound = "1";

      const buttons = $$("[data-tab]", root);
      const panels = $$("[data-panel]", root);

      const activate = (id) => {
        buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === id));
        panels.forEach((p) => {
          const on = p.dataset.panel === id;
          p.classList.toggle("is-shown", on);
          if (p.tagName !== "IMG") p.hidden = !on;
        });
        const cb = root.dataset.tabsCallback;
        if (cb && typeof window[cb] === "function") window[cb](id);
      };

      buttons.forEach((b) => on(b, "click", () => activate(b.dataset.tab)));
      if (buttons[0]) activate(buttons[0].dataset.tab);
    });
  }

  /* ============================================================
     9. АККОРДЕОН
     ============================================================ */
  function initAccordion() {
    $$(".acc").forEach((acc) => {
      if (acc.dataset.accBound) return;
      acc.dataset.accBound = "1";

      $$(".acc__head", acc).forEach((head) =>
        on(head, "click", () => {
          const item = head.closest(".acc__item");
          const open = item.classList.contains("is-open");
          $$(".acc__item", acc).forEach((i) => {
            i.classList.remove("is-open");
            $(".acc__head", i).setAttribute("aria-expanded", "false");
          });
          if (!open) {
            item.classList.add("is-open");
            head.setAttribute("aria-expanded", "true");
          }
        })
      );
    });
  }

  return {
    /* Вызывается после того, как render.js вставил разметку */
    init() {
      initHeadings();
      initReveal();
      initMagnetic();
      initParallax();
      initCounters();
      initRotator();
      initTicker();
      initTabs();
      initAccordion();
      initCarousels();
    },
    refresh() {
      initReveal();
      initMagnetic();
      initTabs();
      initAccordion();
      initCarousels();
    },
    fit: relayoutHeadings,
  };
})();
