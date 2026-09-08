/* ============================================================
   SQ MARKET — КАРТА 2ГИС
   ------------------------------------------------------------
   Используется официальный виджет 2ГИС (без ключа и регистрации):
   он отдаёт настоящие тайлы 2ГИС и карточку организации с адресом,
   телефоном и способами оплаты.

   ВАЖНО про клики. У виджета осталась старая начинка: внутренние
   ссылки он собирает как 2gis.ru/moscow/... и открывает пустую
   страницу, а в углу пишет «Посмотреть на карте Москвы». Поэтому
   сам виджет мы делаем некликабельным (pointer-events: none),
   а сверху кладём свои кнопки с правильными адресами 2gis.kz.
   Заодно это убирает «залипание» страницы на карте при прокрутке
   пальцем на телефоне.

   Как добавить точку: допишите её в SQ.branches в data.js —
   нужны firmId (из ссылки 2gis.kz/astana/firm/<ID>), lat и lon.
   ============================================================ */

window.SQMap = (function () {
  const { $, $$, on, esc } = window.SQCore;

  const CITY = "astana";   // город в адресах 2ГИС: astana, almaty, shymkent…
  const ZOOM = 17;

  /* Ссылка на виджет 2ГИС для одного филиала */
  function widgetSrc(b) {
    const options = {
      pos: { lat: b.lat, lon: b.lon, zoom: ZOOM },
      opt: { city: CITY },
      org: String(b.firmId || ""),
    };
    return "https://widgets.2gis.com/widget?type=firmsonmap&options=" +
      encodeURIComponent(JSON.stringify(options));
  }

  /* ------------------------------------------------------------
     ССЫЛКИ НА МАРШРУТ
     Формат 2ГИС: /directions/points/<точка А>|<точка Б>
     Точка = "долгота,широта" плюс, по желанию, ";id организации".
     Пустая точка А записывается как ведущий "|" — тогда 2ГИС сам
     спросит «Моё местоположение».
     ------------------------------------------------------------ */
  const point = (lon, lat, id) =>
    `${lon},${lat}` + (id ? `;${id}` : "");

  /* Маршрут без известного положения клиента: 2ГИС предложит определить его сам */
  function routeUrl(b) {
    return `https://2gis.kz/${CITY}/directions/points/` +
      encodeURIComponent(`|${point(b.lon, b.lat, b.firmId)}`);
  }

  /* Готовый маршрут «от клиента до магазина» */
  function routeFromUrl(from, b) {
    return `https://2gis.kz/${CITY}/directions/points/` +
      encodeURIComponent(
        `${point(from.lon.toFixed(6), from.lat.toFixed(6))}|${point(b.lon, b.lat, b.firmId)}`
      );
  }

  /* ------------------------------------------------------------
     Кнопка «Маршрут» на КОМПЬЮТЕРЕ.
     Спрашиваем у браузера, где человек находится, и открываем 2ГИС
     уже с построенным маршрутом. Если геолокация запрещена (или сайт
     открыт по http, где она недоступна) — открываем карточку маршрута,
     и 2ГИС спросит место сам.

     Пустую вкладку открываем СРАЗУ по нажатию: если сделать это после
     ответа геолокации, браузер посчитает её всплывающим окном.
     ВАЖНО: без "noopener" — с ним window.open возвращает null, и ссылка
     уходила в текущую вкладку, а рядом оставалась пустая страница.
     ------------------------------------------------------------ */
  function openRoute(b) {
    const tab = window.open("", "_blank");
    const go = (url) => {
      if (tab && !tab.closed) {
        tab.location.href = url;
        try { tab.opener = null; } catch (e) { /* не критично */ }
      } else {
        window.location.href = url;
      }
    };

    if (!navigator.geolocation) return go(routeUrl(b));

    let done = false;
    const finish = (url) => { if (!done) { done = true; go(url); } };

    navigator.geolocation.getCurrentPosition(
      (pos) => finish(routeFromUrl({ lon: pos.coords.longitude, lat: pos.coords.latitude }, b)),
      () => finish(routeUrl(b)),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );

    // страховка, если браузер молчит и не вызывает ни один колбэк
    setTimeout(() => finish(routeUrl(b)), 7500);
  }

  /* Правильная ссылка на карточку филиала */
  function cardUrl(b) {
    return b.link || `https://2gis.kz/${CITY}/firm/${b.firmId}`;
  }

  function init() {
    const wrap = $("#map");
    const frame = $("#map-frame");
    const list = $("#branches");
    if (!wrap || !frame) return;

    const branches = window.SQ.branches;
    let current = 0;

    const showBranch = (i) => {
      const b = branches[i];
      if (!b) return;
      current = i;
      wrap.classList.remove("is-ready");
      frame.src = widgetSrc(b);

      $$("[data-branch]", list).forEach((el, k) => el.classList.toggle("is-active", k === i));

      const tag = $(".map__tag span", wrap);
      if (tag) tag.textContent = b.address;

      const openLink = $("[data-map-open]", wrap);
      if (openLink) openLink.href = cardUrl(b);
      const routeLink = $("[data-map-route]", wrap);
      if (routeLink) {
        routeLink.href = routeUrl(b);
        routeLink.dataset.route = i;
      }
    };

    on(frame, "load", () => wrap.classList.add("is-ready"));

    if (list) {
      on(list, "click", (e) => {
        if (e.target.closest("a")) return;           // клики по ссылкам не перехватываем
        const item = e.target.closest("[data-branch]");
        if (!item) return;
        const i = +item.dataset.branch;
        // На телефоне карты рядом нет — открываем её во всплывающем окне
        if (window.SQCore.isMobile()) window.SQModal.openBranch(branches[i], i);
        else showBranch(i);
      });
    }

    /* Все кнопки «Маршрут» на странице — и в карточках, и над картой.

       На телефоне ничего не перехватываем: это обычная ссылка на 2gis.kz,
       и телефон сам открывает её в приложении 2ГИС, если оно установлено
       (так работают app links). Приложение строит маршрут от текущего
       положения — как раз то, что нужно. Приложения нет — откроется сайт.

       На компьютере приложения нет, поэтому там спрашиваем геолокацию
       и открываем 2ГИС уже с готовым маршрутом. */
    on(document, "click", (e) => {
      const el = e.target.closest("[data-route]");
      if (!el) return;
      if (window.SQCore.isMobile()) return;      // пусть отработает обычная ссылка
      e.preventDefault();
      const b = branches[+el.dataset.route] || branches[current];
      if (b) openRoute(b);
    });

    // карта грузится только когда секция появилась на экране — так страница открывается быстрее
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        showBranch(0);
        io.disconnect();
      },
      { rootMargin: "300px" }
    );
    io.observe(wrap);
  }

  return { init, routeUrl, routeFromUrl, cardUrl, widgetSrc, openRoute };
})();
