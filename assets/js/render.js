/* ============================================================
   SQ MARKET — СБОРКА СЕКЦИЙ ИЗ data.js
   Каждая функция берёт данные и кладёт готовую разметку в свой
   контейнер. Если контейнера нет — просто пропускает.
   ============================================================ */

window.SQRender = (function () {
  const { $, $$, on, esc } = window.SQCore;
  const ico = (n) => window.SQIcons.get(n);

  /* Универсальная кнопка со слот-машиной и стрелкой */
  function btn(label, href, mod = "btn--accent", attrs = "") {
    const tag = href ? "a" : "button";
    return `<${tag} class="btn ${mod}" ${href ? `href="${href}"` : 'type="button"'} data-magnetic ${attrs}>
      <span class="btn__fill"></span>
      <span class="btn__slot"><span>${esc(label)}</span><span aria-hidden="true">${esc(label)}</span></span>
      <span class="btn__ico">${ico("arrow")}${ico("arrow")}</span>
    </${tag}>`;
  }

  /* ---------- Главный экран: цифры ---------- */
  function hero() {
    const box = $("#hero-stats");
    if (!box) return;
    box.innerHTML = window.SQ.hero.stats
      .map((s) => {
        const num = /^(\d+)(\D*)$/.exec(s.value);
        const value = num
          ? `<b data-count="${num[1]}" data-suffix="${esc(num[2])}">0</b>`
          : `<b>${esc(s.value)}</b>`;
        return `<div class="hero__stat">${value}<span>${esc(s.label)}</span></div>`;
      })
      .join("");
  }

  /* ---------- Структура 30/30/40 ---------- */
  function mix() {
    const box = $("#mix");
    if (!box) return;
    box.innerHTML = window.SQ.mix
      .map(
        (m, i) => `
      <div class="mix__row">
        <span class="mix__num" data-count="${m.value}" data-suffix="%">0%</span>
        <div>
          <div class="mix__label">${esc(m.title)}</div>
          <p class="mix__desc">${esc(m.desc)}</p>
        </div>
        <div class="mix__bar" style="--w:${m.value}%;--d:${i * 160}ms"><i></i></div>
      </div>`
      )
      .join("");

    const chips = $("#values");
    if (chips) {
      chips.innerHTML = window.SQ.values
        .map((v) => `<span class="chip"><i></i>${esc(v)}</span>`)
        .join("");
    }
  }

  /* ---------- Что внутри ---------- */
  function inside() {
    const box = $("#inside-grid");
    if (!box) return;

    box.innerHTML = window.SQ.inside
      .map(
        (f, i) => `
      <button class="card" type="button" data-inside="${i}" data-reveal style="--d:${(i % 4) * 90}ms">
        <span class="card__ico">${ico(f.icon)}</span>
        <span class="card__title">${esc(f.title)}${f.tag ? `<span class="kz">${esc(f.tag)}</span>` : ""}</span>
        <span class="card__text">${esc(f.text)}</span>
        <span class="card__more">Подробнее ${ico("arrow")}</span>
      </button>`
      )
      .join("");

    on(box, "click", (e) => {
      const card = e.target.closest("[data-inside]");
      if (!card) return;
      window.SQModal.openCard(window.SQ.inside[+card.dataset.inside]);
    });
  }

  /* ---------- Твой день ---------- */
  function day() {
    const list = $("#day-list");
    const stage = $("#day-stage");
    if (!list || !stage) return;

    list.innerHTML = window.SQ.day
      .map(
        (d, i) => `
      <button class="day__btn" type="button" data-tab="d${i}">
        <span class="day__time">${esc(d.time)}</span>
        <span>
          <span class="day__name">${esc(d.name)} — ${esc(d.short)}</span>
          <span class="day__text">${esc(d.text)}</span>
        </span>
      </button>`
      )
      .join("");

    stage.innerHTML =
      window.SQ.day
        .map(
          (d, i) =>
            `<img data-panel="d${i}" src="${esc(d.image)}" alt="${esc(d.name)} в SQ Market" loading="lazy" decoding="async">`
        )
        .join("") + `<span class="day__badge" id="day-badge"></span>`;

    // подпись под активным кадром
    window.sqDayTab = (id) => {
      const i = +String(id).replace("d", "");
      const badge = $("#day-badge");
      if (badge && window.SQ.day[i]) badge.innerHTML = `${ico("clock")}${esc(window.SQ.day[i].badge)}`;
    };

    // На телефоне большого кадра рядом нет, поэтому по нажатию
    // открываем окно с фотографией — сразу видно, что произошло.
    on(list, "click", (e) => {
      if (!window.SQCore.isMobile()) return;
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      const i = +btn.dataset.tab.replace("d", "");
      if (window.SQ.day[i]) window.SQModal.openDay(window.SQ.day[i]);
    });
  }

  /* ---------- Ассортимент ---------- */
  function menu() {
    const tabs = $("#menu-tabs");
    const panels = $("#menu-panels");
    if (!tabs || !panels) return;

    tabs.innerHTML = window.SQ.menu
      .map((c) => `<button class="tab" type="button" data-tab="${c.id}">${esc(c.title)}</button>`)
      .join("");

    panels.innerHTML = window.SQ.menu
      .map(
        (c) => `
      <div data-panel="${c.id}" hidden>
        <p class="lead" style="margin-bottom:1.6rem">${esc(c.note)}</p>
        <div class="menu__grid">
          ${c.items
            .map(
              (it, i) => `
            <button class="dish" type="button" data-dish="${c.id}:${i}">
              <span class="dish__idx">${String(i + 1).padStart(2, "0")}</span>
              <span>
                <span class="dish__name">${esc(it.name)}</span>
                <span class="dish__desc">${esc(it.desc || "")}</span>
              </span>
              <span class="dish__tag">${esc(it.price || it.tag || "")}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>`
      )
      .join("");

    // Телефонная версия: категории свёрнуты в аккордеон, секция короткая.
    const acc = $("#menu-acc");
    if (acc) {
      acc.innerHTML = window.SQ.menu
        .map(
          (c, k) => `
        <div class="acc__item ${k === 0 ? "is-open" : ""}">
          <button class="acc__head" type="button" aria-expanded="${k === 0}">
            ${esc(c.title)}<span class="acc__count">${c.items.length}</span><span class="acc__sign"></span>
          </button>
          <div class="acc__body">
            <div class="acc__inner">
              <div>
                <p class="menu__note">${esc(c.note)}</p>
                ${c.items
                  .map(
                    (it, i) => `
                  <button class="dish" type="button" data-dish="${c.id}:${i}">
                    <span class="dish__idx">${String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span class="dish__name">${esc(it.name)}</span>
                      <span class="dish__desc">${esc(it.desc || "")}</span>
                    </span>
                    <span class="dish__tag">${esc(it.price || it.tag || "")}</span>
                  </button>`
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>`
        )
        .join("");
    }

    const openDish = (e) => {
      const d = e.target.closest("[data-dish]");
      if (!d) return;
      const [cid, i] = d.dataset.dish.split(":");
      const cat = window.SQ.menu.find((c) => c.id === cid);
      if (cat) window.SQModal.openDish(cat.items[+i], cat);
    };
    on(panels, "click", openDish);
    on(acc, "click", openDish);
  }

  /* ---------- Галерея ---------- */
  function gallery() {
    const box = $("#gallery-grid");
    if (!box) return;

    const items = window.SQ.gallery.map((g) => ({
      thumb: `assets/img/thumb/${g.src}.jpg`,
      full: `assets/img/interior/${g.src}.jpg`,
      cap: g.cap,
      size: g.size,
    }));

    box.innerHTML = items
      .map(
        (g, i) => `
      <button class="shot ${g.size ? "shot--" + g.size : ""}" type="button" data-shot="${i}"
              data-reveal="scale" style="--d:${(i % 3) * 110}ms" aria-label="${esc(g.cap)}">
        <img src="${g.thumb}" alt="${esc(g.cap)}" loading="lazy" decoding="async">
        <span class="shot__veil"></span>
        <span class="shot__zoom">${ico("plus")}</span>
        <span class="shot__cap">${esc(g.cap)}</span>
      </button>`
      )
      .join("");

    on(box, "click", (e) => {
      const s = e.target.closest("[data-shot]");
      if (!s) return;
      window.SQLightbox.open(items, +s.dataset.shot);
    });
  }

  /* ---------- Адреса ---------- */
  function branches() {
    const box = $("#branches");
    if (!box) return;

    box.innerHTML = window.SQ.branches
      .map(
        (b, i) => `
      <div class="branch ${i === 0 ? "is-active" : ""}" data-branch="${i}">
        <button class="branch__main" type="button">
          <span class="branch__top">
            <span class="branch__pin">${i + 1}</span>
            <span class="branch__addr">${esc(b.address)}</span>
            <span class="branch__status"><i></i>${esc(b.status)}</span>
          </span>
          <span class="branch__meta">${esc(b.district)} · ${esc(b.hours)}</span>
        </button>
        <div class="branch__links">
          <a class="chip" href="${window.SQMap.routeUrl(b)}" data-route="${i}" target="_blank" rel="noopener">${ico("route")} Маршрут</a>
          <a class="chip" href="${esc(window.SQMap.cardUrl(b))}" target="_blank" rel="noopener">${ico("pin")} Карточка в 2ГИС</a>
        </div>
      </div>`
      )
      .join("");
  }

  /* ---------- Вопросы ---------- */
  function faq() {
    const box = $("#faq-list");
    if (!box) return;
    box.innerHTML = window.SQ.faq
      .map(
        (f, i) => `
      <div class="acc__item">
        <button class="acc__head" type="button" aria-expanded="false" id="faq-h${i}">
          ${esc(f.q)}<span class="acc__sign"></span>
        </button>
        <div class="acc__body" role="region" aria-labelledby="faq-h${i}">
          <div class="acc__inner"><div>${esc(f.a)}</div></div>
        </div>
      </div>`
      )
      .join("");
  }

  /* ---------- Контакты и футер ---------- */
  function contacts() {
    const c = window.SQ.config;
    const wa = `https://wa.me/${c.phoneRaw}`;

    const box = $("#contact-info");
    if (box) {
      const lines = [
        { i: "phone", b: c.phone, s: "Звонок и WhatsApp", href: `tel:+${c.phoneRaw}` },
        { i: "chat", b: "Написать в WhatsApp", s: "Отвечаем в рабочее время", href: wa },
        { i: "pin", b: `${window.SQ.branches.length} точки в городе ${esc(c.city)}`, s: "Смотрите на карте 2ГИС",
          // на странице «Инвесторам» секции с картой нет — уводим на главную
          href: document.getElementById("places") ? "#places" : "index.html#places" },
        { i: "clock", b: "Круглосуточно", s: "Без выходных и перерывов" },
      ];
      if (c.email) lines.splice(2, 0, { i: "mail", b: c.email, s: "Почта для партнёров", href: "mailto:" + c.email });

      box.innerHTML = lines
        .map((l) => {
          const inner = `<span class="info-line__ico">${ico(l.i)}</span><span><b>${l.b}</b><span>${esc(l.s)}</span></span>`;
          return l.href
            ? `<a class="info-line" href="${l.href}" ${l.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${inner}</a>`
            : `<div class="info-line">${inner}</div>`;
        })
        .join("");
    }

    $$("[data-phone]").forEach((el) => {
      el.textContent = c.phone;
      if (el.tagName === "A") el.href = "tel:+" + c.phoneRaw;
    });
    $$("[data-wa]").forEach((el) => (el.href = wa));

    const nav = $("#footer-nav");
    if (nav) {
      // window.SQ_NAV задаёт своё меню странице «Инвесторам»;
      // у пункта может быть готовый href вместо якоря
      nav.innerHTML = (window.SQ_NAV || window.SQ.nav)
        .map((n) => `<li><a href="${esc(n.href || "#" + n.id)}">${esc(n.label)}</a></li>`)
        .join("");
    }

    const addr = $("#footer-addr");
    if (addr) {
      addr.innerHTML = window.SQ.branches
        .map((b) => `<li><a href="${esc(window.SQMap.cardUrl(b))}" target="_blank" rel="noopener">${esc(b.address)}</a></li>`)
        .join("");
    }

    const soc = $("#socials");
    if (soc) {
      const links = [
        { u: c.instagram, i: "instagram", n: "Instagram" },
        { u: c.tiktok, i: "tiktok", n: "TikTok" },
        { u: wa, i: "whatsapp", n: "WhatsApp" },
      ].filter((l) => l.u);
      soc.innerHTML = links
        .map((l) => `<a href="${l.u}" target="_blank" rel="noopener" aria-label="${l.n}">${ico(l.i)}</a>`)
        .join("");
    }

    $$("#year").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------- Форма ---------- */
  function form() {
    const f = $("#lead-form");
    if (!f) return;

    on(f, "submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      let ok = true;

      $$(".field", f).forEach((field) => {
        const input = $("input, textarea", field);
        const err = $(".field__err", field);
        let msg = "";
        if (input.required && !input.value.trim()) msg = "Заполните поле";
        else if (input.type === "tel" && input.value.replace(/\D/g, "").length < 10) msg = "Проверьте номер";
        field.classList.toggle("is-error", !!msg);
        if (err) err.textContent = msg;
        if (msg) ok = false;
      });
      if (!ok) return;

      const endpoint = window.SQ.config.formEndpoint;
      if (endpoint) {
        try {
          await fetch(endpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(f),
          });
        } catch (err) {
          /* даже если не долетело — покажем WhatsApp ниже */
        }
      } else {
        const text = `Здравствуйте! Меня зовут ${data.name}.\nТелефон: ${data.phone}\n${data.message || ""}`;
        window.open(`https://wa.me/${window.SQ.config.phoneRaw}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      }

      f.reset();
      window.SQModal.message(
        "Заявка принята",
        "Спасибо! Мы свяжемся с вами по указанному номеру. Если удобнее в переписке — напишите нам в WhatsApp."
      );
    });
  }

  return {
    init() {
      hero(); mix(); inside(); day(); menu();
      gallery(); branches(); faq(); contacts(); form();
    },
    /* Только контакты, футер и форма — этим пользуется страница «Инвесторам»,
       где секций главной нет. */
    initContact() {
      contacts(); form();
    },
    btn,
  };
})();
