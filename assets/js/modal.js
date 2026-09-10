/* ============================================================
   SQ MARKET — ВСПЛЫВАЮЩИЕ ОКНА
   Одно универсальное окно для карточек и сообщений + отдельный
   лайтбокс для галереи (стрелки, клавиатура, свайп).
   ============================================================ */

window.SQModal = (function () {
  const { $, $$, on, esc } = window.SQCore;

  let modal, panel, lastFocused;

  function ensure() {
    if (modal) return;
    modal = $("#modal");
    panel = $(".modal__panel", modal);

    on($(".modal__backdrop", modal), "click", close);
    on($(".modal__close", modal), "click", close);
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
      if (e.key === "Tab" && modal.classList.contains("is-open")) trap(e);
    });
  }

  function trap(e) {
    const f = $$('a[href], button, input, textarea, [tabindex]:not([tabindex="-1"])', modal)
      .filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function show(html) {
    ensure();
    lastFocused = document.activeElement;
    $(".modal__content", modal).innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    setTimeout(() => $(".modal__close", modal).focus(), 60);
    window.SQUI.refresh();
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ---------- Карточка «Что внутри» ---------- */
  function openCard(item) {
    const facts = (item.facts || [])
      .map((f) => `<div class="modal__fact"><b>${esc(f.b)}</b><span>${esc(f.s)}</span></div>`)
      .join("");

    show(`
      ${item.image ? `<div class="modal__media"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div>` : ""}
      <div class="modal__body">
        ${item.tag ? `<p class="modal__kicker">${esc(item.tag)}</p>` : ""}
        <h3 class="modal__title">${esc(item.title)}</h3>
        <p class="lead">${esc(item.body || item.text || "")}</p>
        ${facts ? `<div class="modal__facts">${facts}</div>` : ""}
        <div class="row" style="margin-top:.6rem">
          <a class="btn btn--accent" href="#places" data-magnetic data-close>
            <span class="btn__fill"></span>
            <span class="btn__slot"><span>Где нас найти</span><span aria-hidden="true">Где нас найти</span></span>
            <span class="btn__ico">${window.SQIcons.get("arrow")}${window.SQIcons.get("arrow")}</span>
          </a>
        </div>
      </div>
    `);
  }

  /* ---------- Сценарий дня (открывается на телефоне) ---------- */
  function openDay(item) {
    show(`
      <div class="modal__media"><img src="${esc(item.image)}" alt="${esc(item.name)} в SQ Market"></div>
      <div class="modal__body">
        <p class="modal__kicker">${esc(item.time)} · ${esc(item.name)}</p>
        <h3 class="modal__title">${esc(item.short)}</h3>
        <p class="lead">${esc(item.text)}</p>
        <div class="modal__facts">
          <div class="modal__fact"><b>${esc(item.badge)}</b><span>что берут в это время</span></div>
        </div>
      </div>
    `);
  }

  /* ---------- Карточка филиала с картой (открывается на телефоне) ---------- */
  function openBranch(b, i) {
    const M = window.SQMap;
    show(`
      <div class="modal__map">
        <span class="modal__maploader">Загружаем карту 2ГИС…</span>
        <span class="modal__maptag">${esc(b.address)}</span>
      </div>
      <div class="modal__body">
        <p class="modal__kicker">${esc(b.district)}</p>
        <h3 class="modal__title">${esc(b.address)}</h3>
        <div class="modal__facts">
          <div class="modal__fact"><b>${esc(b.status)}</b><span>статус точки</span></div>
          <div class="modal__fact"><b>${esc(b.hours)}</b><span>режим работы</span></div>
        </div>
        <div class="row" style="margin-top:.4rem">
          <a class="btn btn--accent" href="${esc(M.routeUrl(b))}" data-route="${i}" target="_blank" rel="noopener">
            <span class="btn__fill"></span>
            <span class="btn__slot"><span>Построить маршрут</span><span aria-hidden="true">Построить маршрут</span></span>
          </a>
          <a class="btn btn--ghost" href="${esc(M.cardUrl(b))}" target="_blank" rel="noopener">
            <span class="btn__fill"></span>
            <span class="btn__slot"><span>Открыть в 2ГИС</span><span aria-hidden="true">Открыть в 2ГИС</span></span>
          </a>
        </div>
      </div>
    `);

    // Карту вставляем уже после того, как окно на экране: живую, если есть
    // ключ 2ГИС, иначе виджет. Ленивую загрузку не ставим — окно создаётся
    // за краем экрана, и браузер может так и не начать грузить кадр.
    const box = $(".modal__map", modal);
    const ready = () => box.classList.add("is-ready");

    // У точки ещё нет карточки в 2ГИС — карту показать нечем
    if (!M.hasKey() && !M.hasWidget(b)) {
      box.classList.add("is-ready", "is-soon");
      box.insertAdjacentHTML("beforeend",
        '<div class="map__soon"><b>Точка ещё не появилась на карте 2ГИС</b>' +
        "<span>Магазин готовится к открытию. Маршрут и адрес ниже уже работают.</span></div>");
      return;
    }

    if (M.hasKey()) {
      const live = document.createElement("div");
      live.className = "modal__live";
      box.appendChild(live);
      M.mountLive(live, i).then(ready).catch(() => { live.remove(); frame(); });
    } else {
      frame();
    }

    function frame() {
      const f = document.createElement("iframe");
      f.title = b.address + " на карте 2ГИС";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.addEventListener("load", ready);
      f.src = M.widgetSrc(b);
      box.appendChild(f);
    }
  }

  /* ---------- Позиция ассортимента ---------- */
  function openDish(item, category) {
    show(`
      <div class="modal__body">
        <p class="modal__kicker">${esc(category.title)}${category.tag ? " · " + esc(category.tag) : ""}</p>
        <h3 class="modal__title">${esc(item.name)}</h3>
        <p class="lead">${esc(item.desc || "")}</p>
        ${item.price ? `<p class="label label--green">${esc(item.price)}</p>` : ""}
        <div class="modal__facts">
          <div class="modal__fact"><b>${esc(category.note || "")}</b><span>${esc(category.title)}</span></div>
          <div class="modal__fact"><b>Круглосуточно</b><span>без выходных</span></div>
        </div>
      </div>
    `);
  }

  /* ---------- Простое сообщение (например, «заявка отправлена») ---------- */
  function message(title, text, kicker = "SQ Market") {
    show(`
      <div class="modal__body" style="text-align:center;justify-items:center">
        <div class="card__ico" style="background:var(--primary);color:#fff">${window.SQIcons.get("check")}</div>
        <p class="modal__kicker">${esc(kicker)}</p>
        <h3 class="modal__title">${esc(title)}</h3>
        <p class="lead" style="margin-inline:auto">${esc(text)}</p>
      </div>
    `);
  }

  /* Ссылки внутри окна с атрибутом data-close закрывают его */
  on(document, "click", (e) => {
    if (e.target.closest("[data-close]")) close();
  });

  return { openCard, openDish, openDay, openBranch, message, close };
})();

/* ============================================================
   ЛАЙТБОКС ГАЛЕРЕИ
   ============================================================ */
window.SQLightbox = (function () {
  const { $, on } = window.SQCore;

  let box, img, cap, count, list = [], index = 0;

  function ensure() {
    if (box) return;
    box = $("#lightbox");
    img = $(".lightbox__stage img", box);
    cap = $(".lightbox__caption", box);
    count = $(".lightbox__count", box);

    on($(".modal__backdrop", box), "click", close);
    on($("[data-lb-close]", box), "click", close);
    on($("[data-lb-prev]", box), "click", () => go(-1));
    on($("[data-lb-next]", box), "click", () => go(1));

    on(document, "keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });

    // свайп на телефоне
    let x0 = null;
    on(box, "touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    on(box, "touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  function render() {
    const item = list[index];
    if (!item) return;
    img.classList.remove("is-shown");
    const next = new Image();
    next.onload = () => {
      img.src = next.src;
      img.alt = item.cap || "";
      requestAnimationFrame(() => img.classList.add("is-shown"));
    };
    next.src = item.full;
    cap.textContent = item.cap || "";
    count.textContent = `${index + 1} / ${list.length}`;

    // подгружаем соседние кадры заранее
    [index + 1, index - 1].forEach((i) => {
      const n = list[(i + list.length) % list.length];
      if (n) new Image().src = n.full;
    });
  }

  function go(step) {
    index = (index + step + list.length) % list.length;
    render();
  }

  function open(items, start = 0) {
    ensure();
    list = items;
    index = start;
    render();
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    setTimeout(() => $("[data-lb-close]", box).focus(), 60);
  }

  function close() {
    if (!box) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
  }

  return { open, close, go };
})();
