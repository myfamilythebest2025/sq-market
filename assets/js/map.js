/* ============================================================
   SQ MARKET — КАРТА 2ГИС
   ------------------------------------------------------------
   Работает в двух режимах.

   1) ЖИВАЯ КАРТА — если в data.js заполнен config.mapApiKey.
      Официальный MapGL 2ГИС: настоящая карта, которую можно двигать
      и приближать, с нашими фирменными метками. Все ссылки наши,
      ничего чужого. Ключ бесплатный: https://dev.2gis.ru/order/

   2) БЕЗ КЛЮЧА — виджет 2ГИС в рамке: работает сразу, настраивать
      ничего не надо. У виджета осталась старая начинка: свои ссылки
      он собирает на московский домен и открывает пустую страницу,
      поэтому кликов ему не даём, а сверху кладём свою панель
      с правильными кнопками.

   Как добавить точку: допишите её в SQ.branches в data.js —
   нужны firmId (из ссылки 2gis.kz/astana/firm/<ID>), lat и lon.
   ============================================================ */

window.SQMap = (function () {
  const { $, $$, on } = window.SQCore;

  const CITY = "astana";   // город в адресах 2ГИС: astana, almaty, shymkent…
  const ZOOM = 16.5;

  const key = () => String((window.SQ.config && window.SQ.config.mapApiKey) || "").trim();
  const branches = () => window.SQ.branches;

  /* ------------------------------------------------------------
     ССЫЛКИ НА МАРШРУТ
     Формат 2ГИС: /directions/points/<точка А>|<точка Б>
     Точка = "долгота,широта" плюс, по желанию, ";id организации".
     Пустая точка А записывается как ведущий "|" — тогда 2ГИС сам
     спросит «Моё местоположение».
     ------------------------------------------------------------ */
  const point = (lon, lat, id) => `${lon},${lat}` + (id ? `;${id}` : "");

  /* Что показывать 2ГИС для точки: карточку филиала, а пока её нет — здание */
  const objectId = (b) => b.firmId || b.geoId || "";

  function routeUrl(b) {
    return `https://2gis.kz/${CITY}/directions/points/` +
      encodeURIComponent(`|${point(b.lon, b.lat, objectId(b))}`);
  }

  function routeFromUrl(from, b) {
    return `https://2gis.kz/${CITY}/directions/points/` +
      encodeURIComponent(
        `${point(from.lon.toFixed(6), from.lat.toFixed(6))}|${point(b.lon, b.lat, objectId(b))}`
      );
  }

  /* Ссылка на карточку филиала.
     Берём прямой адрес по id — он открывается сразу. Короткая ссылка
     go.2gis.com тоже работает, но идёт через лишнюю переадресацию,
     поэтому оставляем её только как запасной вариант. */
  function cardUrl(b) {
    if (b.firmId) return `https://2gis.kz/${CITY}/firm/${b.firmId}`;
    if (b.geoId) return `https://2gis.kz/${CITY}/geo/${b.geoId}`;
    return b.link || "";
  }

  /* Виджет 2ГИС умеет показывать только организацию. Если карточки филиала
     ещё нет, встроенной карты не будет — вместо неё показываем табличку
     с адресом и кнопками. Появится firmId — карта включится сама. */
  const hasWidget = (b) => !!b.firmId;

  /* Ссылка на виджет 2ГИС (режим без ключа) */
  function widgetSrc(b) {
    const options = {
      pos: { lat: b.lat, lon: b.lon, zoom: 17 },
      opt: { city: CITY },
      org: String(b.firmId || ""),
    };
    return "https://widgets.2gis.com/widget?type=firmsonmap&options=" +
      encodeURIComponent(JSON.stringify(options));
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

    // Пока ждём геолокацию, вкладка не должна быть пустой
    if (tab && tab.document) {
      try {
        tab.document.write(
          '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
          "<title>Открываем 2ГИС…</title><style>" +
          "html,body{height:100%;margin:0}body{display:grid;place-items:center;" +
          "font:600 15px/1.5 system-ui,sans-serif;background:#0c1310;color:#f4f3ec}" +
          "i{display:block;width:34px;height:34px;margin:0 auto 14px;border-radius:50%;" +
          "border:3px solid rgba(255,255,255,.2);border-top-color:#ff8a00;" +
          "animation:s .8s linear infinite}@keyframes s{to{transform:rotate(360deg)}}" +
          "</style></head><body><div><i></i>Открываем 2ГИС…</div></body></html>"
        );
        tab.document.close();
      } catch (e) { /* не критично */ }
    }

    const go = (url) => {
      if (tab && !tab.closed) {
        tab.location.href = url;
        try { tab.opener = null; } catch (e) { /* не критично */ }
      } else {
        window.location.href = url;
      }
    };

    let done = false;
    const finish = (url) => { if (!done) { done = true; go(url); } };

    const ask = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(routeFromUrl({ lon: pos.coords.longitude, lat: pos.coords.latitude }, b)),
        () => finish(routeUrl(b)),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
      );
      // страховка: дольше четырёх секунд человека не держим
      setTimeout(() => finish(routeUrl(b)), 4200);
    };

    if (!navigator.geolocation) return finish(routeUrl(b));

    // Если в местоположении уже отказали — не ждём и не спрашиваем снова
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" })
        .then((p) => (p.state === "denied" ? finish(routeUrl(b)) : ask()))
        .catch(ask);
    } else {
      ask();
    }
  }

  /* ============================================================
     ЖИВАЯ КАРТА (MapGL)
     ============================================================ */
  let sdk = null;

  function loadSdk() {
    if (sdk) return sdk;
    sdk = new Promise((resolve, reject) => {
      if (window.mapgl) return resolve(window.mapgl);
      const el = document.createElement("script");
      el.src = "https://mapgl.2gis.com/api/js/v1";
      el.async = true;
      el.onload = () => (window.mapgl ? resolve(window.mapgl) : reject(new Error("нет mapgl")));
      el.onerror = () => reject(new Error("MapGL не загрузился"));
      document.head.appendChild(el);
    });
    return sdk;
  }

  /* Фирменная метка: капля с белым кружком. Активная — оранжевая. */
  function pin(active) {
    const fill = active ? "#ff8a00" : "#0a6b3e";
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="60" viewBox="0 0 46 60">' +
      '<path d="M23 58C23 58 42 35 42 22.5C42 11.2 33.5 2 23 2S4 11.2 4 22.5C4 35 23 58 23 58Z" ' +
      `fill="${fill}" stroke="#ffffff" stroke-width="3"/>` +
      '<circle cx="23" cy="22" r="7" fill="#ffffff"/></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const ICON = (active) => ({ icon: pin(active), size: [46, 60], anchor: [23, 58] });

  /* Создаёт живую карту в контейнере. onPick — что делать при клике по метке. */
  async function mountLive(box, index, onPick) {
    const mapgl = await loadSdk();
    const list = branches();
    const b = list[index] || list[0];

    const map = new mapgl.Map(box, {
      center: [b.lon, b.lat],
      zoom: ZOOM,
      key: key(),
      zoomControl: "bottomRight",
    });

    /* Ждём, пока карта реально отрисуется. Если ключ неверный или
       исчерпан лимит, события не будет — тогда бросаем ошибку и
       вызывающий код вернёт виджет, а не оставит пустой прямоугольник. */
    await new Promise((resolve, reject) => {
      let settled = false;
      const ok = () => { if (!settled) { settled = true; resolve(); } };
      map.on("idle", ok);
      map.on("styleload", ok);
      setTimeout(() => {
        if (settled) return;
        settled = true;
        try { map.destroy(); } catch (e) { /* уже уничтожена */ }
        reject(new Error("карта не отрисовалась — проверьте ключ 2ГИС"));
      }, 8000);
    });

    /* При неверном ключе 2ГИС рисует поверх карты свою надпись
       «Your MapGL key is invalid». Ловим её и возвращаем виджет —
       посетитель не должен видеть служебных сообщений. */
    await new Promise((r) => setTimeout(r, 900));
    if (/key is invalid|invalid key/i.test(box.textContent || "")) {
      try { map.destroy(); } catch (e) { /* уже уничтожена */ }
      throw new Error("ключ MapGL не принят");
    }

    const markers = list.map((br, i) => {
      const m = new mapgl.Marker(map, { coordinates: [br.lon, br.lat], ...ICON(i === index) });
      m.on("click", () => onPick && onPick(i));
      return m;
    });

    return {
      map,
      show(i) {
        const t = list[i];
        if (!t) return;
        markers.forEach((m, k) => m.setIcon(ICON(k === i)));
        map.setCenter([t.lon, t.lat], { animate: true, duration: 700 });
      },
      destroy() { try { map.destroy(); } catch (e) { /* уже уничтожена */ } },
    };
  }

  /* ============================================================
     СЕКЦИЯ «АДРЕСА»
     ============================================================ */
  let live = null;
  let current = 0;

  function init() {
    const wrap = $("#map");
    const list = $("#branches");
    if (!wrap) return;

    const setLinks = (i) => {
      const b = branches()[i];
      if (!b) return;
      current = i;
      if (list) $$("[data-branch]", list).forEach((el, k) => el.classList.toggle("is-active", k === i));
      const tag = $(".map__tag span", wrap);
      if (tag) tag.textContent = b.address;
      const openLink = $("[data-map-open]", wrap);
      if (openLink) openLink.href = cardUrl(b);
      const routeLink = $("[data-map-route]", wrap);
      if (routeLink) { routeLink.href = routeUrl(b); routeLink.dataset.route = i; }
    };

    const showBranch = (i) => {
      setLinks(i);
      if (live) return live.show(i);

      const b = branches()[i];
      const frame = $("#map-frame");
      // у точки ещё нет карточки в 2ГИС — карту показать нечем
      wrap.classList.toggle("is-soon", !hasWidget(b));
      if (!hasWidget(b)) { wrap.classList.add("is-ready"); return; }
      if (frame) { wrap.classList.remove("is-ready"); frame.src = widgetSrc(b); }
    };

    const bindFrame = (frame) => on(frame, "load", () => wrap.classList.add("is-ready"));
    const startFrame = $("#map-frame");
    if (startFrame) bindFrame(startFrame);

    if (list) {
      on(list, "click", (e) => {
        if (e.target.closest("a")) return;           // клики по ссылкам не перехватываем
        const item = e.target.closest("[data-branch]");
        if (!item) return;
        const i = +item.dataset.branch;
        // На телефоне карты рядом нет — открываем её во всплывающем окне
        if (window.SQCore.isMobile()) window.SQModal.openBranch(branches()[i], i);
        else showBranch(i);
      });
    }

    /* Все кнопки «Маршрут» — и в карточках, и над картой.

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
      const b = branches()[+el.dataset.route] || branches()[current];
      if (b) openRoute(b);
    });

    // карта грузится, только когда секция появилась на экране
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((x) => x.isIntersecting)) return;
        io.disconnect();
        start();
      },
      { rootMargin: "300px" }
    );
    io.observe(wrap);

    function start() {
      setLinks(0);

      if (!key()) {                        // ключа нет — показываем виджет
        showBranch(0);
        return;
      }

      const box = document.createElement("div");
      box.className = "map__live";
      wrap.insertBefore(box, wrap.firstChild);
      const frame = $("#map-frame");
      if (frame) frame.remove();

      mountLive(box, 0, (i) => showBranch(i))
        .then((inst) => {
          live = inst;
          wrap.classList.add("is-ready", "is-live");
        })
        .catch(() => {                     // ключ не подошёл — возвращаем виджет
          box.remove();
          const f = document.createElement("iframe");
          f.id = "map-frame";
          f.title = "SQ Market на карте 2ГИС";
          f.referrerPolicy = "no-referrer-when-downgrade";
          bindFrame(f);
          f.src = widgetSrc(branches()[0]);
          wrap.insertBefore(f, wrap.firstChild);
        });
    }
  }

  return {
    init, routeUrl, routeFromUrl, cardUrl, widgetSrc, openRoute, mountLive,
    hasWidget, hasKey: () => !!key(),
  };
})();
