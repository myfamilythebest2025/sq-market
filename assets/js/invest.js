/* ============================================================
   SQ MARKET — СТРАНИЦА «ИНВЕСТОРАМ»
   Собирает секции из invest-data.js и считает калькулятор.
   Проценты в таблице и все суммы считаются от чисел в данных,
   поэтому руками их нигде править не нужно.
   ============================================================ */

window.SQInvest = (function () {
  const { $, $$, on, esc, clamp } = window.SQCore;
  const ico = (n) => window.SQIcons.get(n);
  const D = window.SQ_INVEST;

  /* ---------- Числа ---------- */
  const NB = " ";                                   // неразрывный пробел

  /* 200000000 → «200 000 000» */
  function groups(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  }
  const money = (n) => groups(n) + NB + "₸";

  /* Короткая запись для крупных сумм: 200 000 000 → «200 млн ₸» */
  function short(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 ? 1 : 0).replace(".", ",") + NB + "млрд" + NB + "₸";
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace(".", ",") + NB + "млн" + NB + "₸";
    return money(n);
  }

  /* Доля в процентах: 28000000 от 60000000 → «46,7%» */
  function pct(part, total, digits = 1) {
    if (!total) return "0%";
    const v = (part / total) * 100;
    const s = Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(digits).replace(".", ",");
    return s + "%";
  }

  /* «16 месяцев» с правильным окончанием */
  function months(n) {
    const v = Math.max(1, Math.round(n));
    const t10 = v % 10, t100 = v % 100;
    let word = "месяцев";
    if (t10 === 1 && t100 !== 11) word = "месяц";
    else if (t10 >= 2 && t10 <= 4 && (t100 < 12 || t100 > 14)) word = "месяца";
    return v + NB + word;
  }

  /* ============================================================
     ЭКОНОМИКА ТОЧКИ — считаем один раз, пользуются все секции
     ============================================================ */
  const ECO = (function () {
    const e = D.economics;
    const revenue = e.revenue.value;
    const spent = e.costs.reduce((s, c) => s + c.value, 0);
    return { revenue, spent, net: revenue - spent };
  })();

  /* ---------- Кнопка в фирменном стиле ---------- */
  const btn = (label, href, mod = "btn--accent", attrs = "") =>
    window.SQRender.btn(label, href, mod, attrs);

  /* ============================================================
     1. ГЛАВНЫЙ ЭКРАН
     ============================================================ */
  function hero() {
    const h = D.hero;
    const wa = `https://wa.me/${window.SQ.config.phoneRaw}`;

    $("#inv-hero-label").textContent = h.label;
    $("#inv-hero-title").textContent = h.title;
    $("#inv-hero-lead").textContent = h.lead;
    if (h.image) $("#inv-hero-img").src = h.image;

    $("#inv-hero-cta").innerHTML =
      btn(h.primary.label, h.primary.href, "btn--accent btn--lg") +
      btn(h.secondary.label, h.secondary.href || wa, "btn--glass btn--lg", 'target="_blank" rel="noopener"');

    $("#inv-hero-stats").innerHTML = h.stats
      .map(
        (s, i) => `
      <div class="inv-stat" style="--d:${i * 90}ms">
        <b data-count="${esc(s.value)}" data-suffix="${esc(s.suffix || "")}">0</b>
        <span>${esc(s.label)}</span>
      </div>`
      )
      .join("");
  }

  /* ============================================================
     2. ПАССИВНЫЙ ДОХОД
     ============================================================ */
  function passive() {
    const p = D.passive;
    $("#inv-passive-label").textContent = p.label;
    $("#inv-passive-title").textContent = p.title;
    $("#inv-passive-accent").innerHTML = `<span class="inv-accent">${esc(p.accent)}</span>`;

    $("#inv-passive-list").innerHTML = p.items
      .map(
        (it, i) => `
      <article class="inv-step" data-reveal style="--d:${i * 120}ms">
        <span class="inv-step__n" aria-hidden="true">${esc(it.n)}</span>
        <div class="inv-step__body">
          <h3>${esc(it.name)}</h3>
          <p>${esc(it.desc)}</p>
        </div>
      </article>`
      )
      .join("");

    $("#inv-passive-note").innerHTML = `${ico("check")}<span>${esc(p.note)}</span>`;
  }

  /* ============================================================
     3. ЧТО ПРЕДЛАГАЕМ + КРУГОВАЯ ДИАГРАММА
     Кольцо рисуем двумя дугами: длина каждой — её процент.
     Анимация запускается классом is-in от появления при скролле.
     ============================================================ */
  function offer() {
    const o = D.offer;
    $("#inv-offer-label").textContent = o.label;
    $("#inv-offer-title").textContent = o.title;

    $("#inv-offer-points").innerHTML = o.points
      .map(
        (p, i) => `
      <li style="--d:${i * 90}ms">
        <span class="inv-points__ico">${ico("check")}</span>
        <span><b>${esc(p.strong)}</b> ${esc(p.rest)}</span>
      </li>`
      )
      .join("");

    const R = 78;
    const C = 2 * Math.PI * R;
    const holders = o.donut.holders.value;
    const company = o.donut.company.value;

    $("#inv-donut").innerHTML = `
      <div class="inv-donut__ring">
        <svg viewBox="0 0 200 200" role="img" aria-label="Доля акционеров ${holders}%, доля управляющей компании ${company}%">
          <circle class="inv-donut__track" cx="100" cy="100" r="${R}"></circle>
          <circle class="inv-donut__arc inv-donut__arc--company" cx="100" cy="100" r="${R}"
                  style="--len:${C.toFixed(1)};--dash:${((company / 100) * C).toFixed(1)}"></circle>
          <circle class="inv-donut__arc inv-donut__arc--holders" cx="100" cy="100" r="${R}"
                  style="--len:${C.toFixed(1)};--dash:${((holders / 100) * C).toFixed(1)};--rot:${(company / 100) * 360}"></circle>
        </svg>
        <div class="inv-donut__center"><b>100%</b><span>одной точки</span></div>
      </div>
      <div class="inv-donut__legend">
        <div class="inv-donut__item inv-donut__item--company">
          <b>${company}%</b><span>${esc(o.donut.company.label)}</span>
        </div>
        <div class="inv-donut__item inv-donut__item--holders">
          <b>${holders}%</b><span>${esc(o.donut.holders.label)}</span>
        </div>
      </div>`;
  }

  /* ============================================================
     4. ПУЛЫ
     ============================================================ */
  function pools() {
    const intro = D.poolsIntro;
    $("#inv-pools-label").textContent = intro.label;
    $("#inv-pools-title").textContent = intro.title;
    $("#inv-pools-lead").textContent = intro.lead;

    $("#inv-pools").innerHTML = D.pools
      .map((p, i) => {
        const min = p.minPercent * p.pricePerPercent;
        const bar =
          p.share == null
            ? ""
            : `<div class="inv-pool__bar" style="--p:${clamp(p.share, 0, 100)}%">
                 <i></i><span>разобрано ${p.share}% из 30%</span>
               </div>`;

        return `
      <article class="inv-pool ${p.open ? "is-open" : ""}" data-reveal style="--d:${i * 120}ms">
        <div class="inv-pool__media">
          <img src="${esc(p.image)}" alt="" aria-hidden="true" loading="lazy" width="700" height="466">
          <span class="inv-pool__tag">${esc(p.n)}</span>
        </div>
        <div class="inv-pool__body">
          <div class="inv-pool__head">
            <h3>${esc(p.title)}</h3>
            <span class="inv-pool__status ${p.open ? "is-on" : ""}">${esc(p.status)}</span>
          </div>
          <p class="inv-pool__area">${ico("pin")}<span>${esc(p.area)}</span></p>

          <dl class="inv-pool__nums">
            <div><dt>Сумма проекта</dt><dd>${money(p.project)}</dd></div>
            <div><dt>Стоимость 1% доли</dt><dd>${money(p.pricePerPercent)}</dd></div>
            <div><dt>Минимальный вход ${p.minPercent}%</dt><dd>${money(min)}</dd></div>
            <div><dt>Дивиденды при ${p.minPercent}% доли</dt><dd>${money(ECO.net * (p.minPercent * 2) / 100)}<i>в месяц до окупаемости</i></dd></div>
          </dl>
          ${bar}
          <div class="inv-pool__cta">
            ${btn("Рассчитать долю", "#calc", "btn--accent")}
            ${btn("Условия пула", "#terms", "btn--ghost")}
          </div>
        </div>
      </article>`;
      })
      .join("");

    const next = D.poolsNext;
    $("#inv-pools-next").innerHTML = `
      <div class="inv-next__head">
        <h3>${esc(next.title)}</h3>
        <p>${esc(next.lead)}</p>
      </div>
      <ul class="inv-next__list">
        ${next.items
          .map(
            (it) => `<li><span class="inv-next__ico">${ico("pin")}</span>
                     <span><b>${esc(it.title)}</b><i>${esc(it.note)}</i></span>
                     <em>в подготовке</em></li>`
          )
          .join("")}
      </ul>`;
  }

  /* ============================================================
     5. УСЛОВИЯ СОТРУДНИЧЕСТВА
     ============================================================ */
  function terms() {
    const t = D.terms;
    $("#inv-terms-label").textContent = t.label;
    $("#inv-terms-title").textContent = t.title;
    $("#inv-terms-min").innerHTML = `${ico("star")}<span>${esc(t.minEntry)}</span>`;

    $("#inv-terms-cards").innerHTML = t.cards
      .map(
        (c, i) => `
      <article class="inv-term inv-term--${esc(c.tone)}" data-reveal style="--d:${i * 130}ms">
        <p class="inv-term__phase">${esc(c.phase)}</p>
        <p class="inv-term__rule">${esc(c.rule)}</p>
      </article>`
      )
      .join("");

    const ex = t.example;
    $("#inv-terms-example").innerHTML = `
      <p class="inv-example__title">${ico("card")}<span>${esc(ex.title)}</span></p>
      <div class="inv-example__flow">
        ${ex.steps
          .map(
            (s, i) => `
          <div class="inv-example__step">
            <b>${esc(s.head)}</b>
            <span>${esc(s.body)}</span>
          </div>
          ${i < ex.steps.length - 1 ? `<span class="inv-example__arrow" aria-hidden="true">${ico("arrow")}</span>` : ""}`
          )
          .join("")}
      </div>`;
  }

  /* ============================================================
     6. ЭКОНОМИКА ТОЧКИ
     Проценты считаем от выручки — таблица всегда сходится.
     ============================================================ */
  function economics() {
    const e = D.economics;
    $("#inv-eco-label").textContent = e.label;
    $("#inv-eco-title").textContent = e.title;
    $("#inv-eco-period").innerHTML = `Показатели модели формата, <span class="inv-accent">${esc(e.period)}</span>.`;

    const row = (name, value, share, mod = "") => `
      <div class="inv-row ${mod}" style="--w:${clamp(share, 0, 100)}%">
        <span class="inv-row__name">${esc(name)}</span>
        <span class="inv-row__pct">${pct(value, ECO.revenue)}</span>
        <span class="inv-row__val">${money(value)}</span>
        <i class="inv-row__bar" aria-hidden="true"></i>
      </div>`;

    $("#inv-eco-table").innerHTML =
      row(e.revenue.name, ECO.revenue, 100, "inv-row--head") +
      e.costs.map((c) => row(c.name, c.value, (c.value / ECO.revenue) * 100)).join("") +
      row(e.profitName, ECO.net, (ECO.net / ECO.revenue) * 100, "inv-row--profit");

    $("#inv-eco-note").innerHTML = `${ico("check")}<span>${esc(e.note)}</span>`;
  }

  /* ============================================================
     7. КАЛЬКУЛЯТОР ДИВИДЕНДОВ
     ------------------------------------------------------------
     Вложение          = доля % × стоимость 1%
     До окупаемости    = чистая прибыль × (доля × 2)%
     После окупаемости = чистая прибыль × доля%
     Окупаемость       = вложение ÷ выплата до окупаемости
     ============================================================ */
  function calc() {
    const c = D.calc;
    const pool = D.pools[0];
    $("#inv-calc-label").textContent = c.label;
    $("#inv-calc-title").textContent = c.title;
    $("#inv-calc-lead").textContent = c.lead;

    const min = pool.minPercent;
    const max = c.maxPercent;
    const start = min;

    $("#inv-calc").innerHTML = `
      <div class="inv-calc__panel">
        <div class="inv-calc__head">
          <div>
            <p class="inv-calc__cap">Ваша доля в точке</p>
            <p class="inv-calc__share"><b id="calc-share">${String(start).replace(".", ",")}</b><i>%</i></p>
          </div>
          <div class="inv-calc__pool">
            <span>${esc(pool.n)} · ${esc(pool.title)}</span>
            <b>1% = ${money(pool.pricePerPercent)}</b>
          </div>
        </div>

        <label class="inv-calc__slider">
          <span class="sr-only">Размер доли в процентах</span>
          <input type="range" id="calc-range" min="${min}" max="${max}" step="0.5" value="${start}"
                 aria-label="Размер доли в процентах">
          <span class="inv-calc__scale" aria-hidden="true"><i>${min}%</i><i>${max}%</i></span>
        </label>

        <div class="inv-calc__grid">
          <div class="inv-calc__cell inv-calc__cell--wide">
            <span>Сумма вложения</span>
            <b id="calc-invest"></b>
          </div>
          <div class="inv-calc__cell inv-calc__cell--accent">
            <span>Дивиденды до окупаемости</span>
            <b id="calc-before"></b>
            <i id="calc-before-note"></i>
          </div>
          <div class="inv-calc__cell">
            <span>Дивиденды после окупаемости</span>
            <b id="calc-after"></b>
            <i id="calc-after-note"></i>
          </div>
          <div class="inv-calc__cell">
            <span>Окупаемость вложений</span>
            <b id="calc-payback"></b>
            <i>при выходе точки на плановую прибыль</i>
          </div>
          <div class="inv-calc__cell">
            <span>Доход за ${c.horizonYears} года</span>
            <b id="calc-horizon"></b>
            <i id="calc-horizon-note"></i>
          </div>
        </div>

        <div class="inv-calc__foot">
          ${btn(c.cta, "#form", "btn--accent btn--lg", 'id="calc-cta"')}
          <p class="faint">Чистая прибыль точки в модели — ${money(ECO.net)} в месяц.</p>
        </div>
      </div>`;

    const range = $("#calc-range");
    const out = {
      share: $("#calc-share"),
      invest: $("#calc-invest"),
      before: $("#calc-before"),
      beforeNote: $("#calc-before-note"),
      after: $("#calc-after"),
      afterNote: $("#calc-after-note"),
      payback: $("#calc-payback"),
      horizon: $("#calc-horizon"),
      horizonNote: $("#calc-horizon-note"),
    };

    let lastShare = start;

    function update() {
      const share = parseFloat(range.value);
      lastShare = share;

      const invest = share * pool.pricePerPercent;
      const before = (ECO.net * share * 2) / 100;
      const after = (ECO.net * share) / 100;
      const payback = before > 0 ? invest / before : 0;

      const horizonMonths = c.horizonYears * 12;
      const atDouble = Math.min(payback, horizonMonths);
      const total = before * atDouble + after * Math.max(0, horizonMonths - payback);

      out.share.textContent = String(share).replace(".", ",");
      out.invest.textContent = money(invest);
      out.before.textContent = money(before);
      out.beforeNote.textContent = `${(share * 2).toString().replace(".", ",")}% от чистой прибыли, ежемесячно`;
      out.after.textContent = money(after);
      out.afterNote.textContent = `${String(share).replace(".", ",")}% от чистой прибыли, бессрочно`;
      out.payback.textContent = months(payback);
      out.horizon.textContent = short(total);
      out.horizonNote.textContent = `сверх вложений — ${short(Math.max(0, total - invest))}`;

      range.style.setProperty("--p", ((share - min) / (max - min)) * 100 + "%");
    }

    on(range, "input", update);
    update();

    /* Кнопка «Хочу такую долю» — подставляем расчёт в сообщение формы */
    on($("#calc-cta"), "click", () => {
      const msg = $("#f-msg");
      if (!msg) return;
      msg.value =
        `Интересует доля ${String(lastShare).replace(".", ",")}% в пуле «${pool.title}». ` +
        `Сумма вложения — ${money(lastShare * pool.pricePerPercent).replace(/ /g, " ")}.`;
      msg.dispatchEvent(new Event("input"));
    });
  }

  /* ============================================================
     8. КАК СТАТЬ АКЦИОНЕРОМ
     ============================================================ */
  function steps() {
    const s = D.steps;
    $("#inv-steps-label").textContent = s.label;
    $("#inv-steps-title").textContent = s.title;

    $("#inv-steps-list").innerHTML = s.items
      .map(
        (it, i) => `
      <article class="inv-path__item" data-reveal style="--d:${i * 110}ms">
        <span class="inv-path__n">${esc(it.n)}</span>
        <h3>${esc(it.name)}</h3>
        <p>${esc(it.desc)}</p>
      </article>`
      )
      .join("");
  }

  /* ============================================================
     9. ПОЗИЦИОНИРОВАНИЕ И МИССИЯ
     ============================================================ */
  function brand() {
    const b = D.brand;
    if (b.image) $("#inv-brand-img").src = b.image;

    $("#inv-brand-cards").innerHTML = b.cards
      .map(
        (c, i) => `
      <article class="inv-card" data-reveal style="--d:${i * 140}ms">
        <h3>${esc(c.title)}</h3>
        ${c.points.map((p) => `<p>${esc(p)}</p>`).join("")}
      </article>`
      )
      .join("");
  }

  /* ============================================================
     10. ОСНОВАТЕЛЬ
     Если фото ещё нет — вместо него аккуратная заглушка с инициалами.
     ============================================================ */
  function founder() {
    const f = D.founder;
    const insta = f.instagram
      ? `<a class="inv-founder__insta" href="${esc(f.instagram)}" target="_blank" rel="noopener">
           ${ico("instagram")}<span>Instagram</span>
         </a>`
      : "";

    $("#inv-founder").innerHTML = `
      <div class="inv-founder__media" data-reveal="left">
        <div class="inv-founder__photo">
          <img src="${esc(f.photo)}" alt="${esc(f.name)}" loading="lazy"
               onerror="this.closest('.inv-founder__photo').classList.add('is-empty');this.remove()">
          <span class="inv-founder__initials" aria-hidden="true">${esc(f.initials)}</span>
        </div>
        <div class="inv-founder__goal">
          <b>${esc(f.goal.value)}</b><span>${esc(f.goal.label)}</span>
        </div>
      </div>

      <div class="inv-founder__body" data-reveal="right">
        <p class="label">${esc(f.label)}</p>
        <h2>${esc(f.name)}</h2>
        <ul class="inv-founder__facts">
          ${f.facts.map((x) => `<li><span>${ico("check")}</span>${esc(x)}</li>`).join("")}
        </ul>
        <blockquote class="inv-founder__quote">${esc(f.quote)}</blockquote>
        ${insta}
      </div>`;
  }

  /* ============================================================
     11. ФОРМА И СНОСКА
     ============================================================ */
  function formHead() {
    $("#inv-form-label").textContent = D.form.label;
    $("#inv-form-title").textContent = D.form.title;
    $("#inv-form-lead").textContent = D.form.lead;
    $("#inv-disclaimer").textContent = D.disclaimer;
  }

  return {
    init() {
      hero();
      passive();
      offer();
      pools();
      terms();
      economics();
      calc();
      steps();
      brand();
      founder();
      formHead();
    },
  };
})();

/* ============================================================
   ЗАПУСК СТРАНИЦЫ
   Порядок тот же, что на главной: сначала разметка, потом движение.
   ============================================================ */
(function () {
  function boot() {
    window.SQ_NAV = window.SQ_INVEST.nav;   // своё меню вместо разделов главной

    window.SQCore.init();
    window.SQInvest.init();
    window.SQRender.initContact();           // телефон, WhatsApp, футер, форма
    window.SQUI.init();
    window.SQNav.init();

    if (location.hash.length > 1) {
      setTimeout(() => window.SQCore.scrollToId(location.hash.slice(1)), 400);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
