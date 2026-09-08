/* ============================================================
   SQ MARKET — НАБОР ИКОНОК
   Все иконки нарисованы линиями (stroke), поэтому автоматически
   принимают цвет текста. Чтобы добавить свою — вставьте новый
   ключ и содержимое SVG без обёртки <svg>.
   Использование в data.js: icon: "coffee"
   ============================================================ */

window.SQIcons = (function () {
  // width/height в em обязательны: без них SVG в потоке занимает 300x150
  const svg = (paths, extra = "") =>
    `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor"
      stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}
      aria-hidden="true">${paths}</svg>`;

  const set = {
    fridge: svg('<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M5 10h14M9 6v2M9 13.5v2.5"/>'),
    flame: svg('<path d="M12 2.7s5.2 3.7 5.2 8.6a5.2 5.2 0 1 1-10.4 0c0-1.6.7-3 1.5-4 .2 1.2.9 2 1.9 2 1.7 0 1.8-2.6 1.8-6.6Z"/>'),
    coffee: svg('<path d="M4 9h12v5.5A4.5 4.5 0 0 1 11.5 19h-3A4.5 4.5 0 0 1 4 14.5V9Z"/><path d="M16 10.5h1.8a2.2 2.2 0 1 1 0 4.4H16"/><path d="M7 5.5c0-.8.8-1.1.8-2M11 5.5c0-.8.8-1.1.8-2"/><path d="M3 21.5h14"/>'),
    bread: svg('<path d="M4.5 10.5c0-2.8 3.3-5 7.5-5s7.5 2.2 7.5 5c0 1.2-1 2-2 2v6.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6.5 19v-6.5c-1 0-2-.8-2-2Z"/><path d="M9.5 12.5v7M14 12.5v7"/>'),
    bottle: svg('<path d="M10 2.5h4v2.2c0 .9.4 1.6 1 2.2.9 1 1.5 2 1.5 3.4v9.2a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-9.2c0-1.4.6-2.4 1.5-3.4.6-.6 1-1.3 1-2.2V2.5Z"/><path d="M7.5 12.5h9"/>'),
    basket: svg('<path d="M3 8.5h18l-1.7 10a2 2 0 0 1-2 1.7H6.7a2 2 0 0 1-2-1.7L3 8.5Z"/><path d="m8 8.5 2.5-5M16 8.5 13.5 3.5M9.5 12.5v4M14.5 12.5v4"/>'),
    microwave: svg('<rect x="2.5" y="5" width="19" height="14" rx="2"/><rect x="5" y="7.5" width="10" height="9" rx="1"/><path d="M18 9v.01M18 12v.01M18 15v.01"/>'),
    table: svg('<path d="M3 9.5h18M5 9.5v10M19 9.5v10M8.5 9.5V6a3.5 3.5 0 0 1 7 0v3.5"/>'),
    wifi: svg('<path d="M2.5 9a14 14 0 0 1 19 0M6 12.6a9 9 0 0 1 12 0M9.5 16.2a4 4 0 0 1 5 0"/><circle cx="12" cy="19.6" r="1.1" fill="currentColor" stroke="none"/>'),
    moon: svg('<path d="M20 14.2A8.3 8.3 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z"/>'),
    wc: svg('<path d="M7 21v-6H5.5l1.6-5.2A1.6 1.6 0 0 1 8.6 8.6h1.3a1.6 1.6 0 0 1 1.5 1.2L13 15h-1.5v6Z"/><circle cx="9.2" cy="4.6" r="2"/><path d="M17 21v-5h2l-1.4-5.5a1.5 1.5 0 0 0-1.5-1.1"/><circle cx="16.6" cy="4.6" r="2"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>'),
    pin: svg('<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'),
    phone: svg('<path d="M6.2 3.5h3l1.5 3.8-2 1.4a11.5 11.5 0 0 0 5.6 5.6l1.4-2 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z"/>'),
    chat: svg('<path d="M20.5 11.7c0 4-3.8 7.2-8.5 7.2a9.9 9.9 0 0 1-2.8-.4L4 20.5l1.4-3.7a6.9 6.9 0 0 1-1.9-4.6c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z"/>'),
    route: svg('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5"/>'),
    check: svg('<path d="m4.5 12.5 5 5 10-11"/>'),
    arrow: svg('<path d="M5 12h13M12.5 6l6 6-6 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    star: svg('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z"/>'),
    leaf: svg('<path d="M4.5 19.5c0-8 5-13 15-13 0 9.5-5 13-10 13-2 0-5 0-5 0Z"/><path d="M9 15c2-3 4.5-5 8-6.5"/>'),
    bag: svg('<path d="M5.5 7.5h13l1 13a1.5 1.5 0 0 1-1.5 1.6H6a1.5 1.5 0 0 1-1.5-1.6l1-13Z"/><path d="M8.5 10V6a3.5 3.5 0 0 1 7 0v4"/>'),
    card: svg('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.8h19M6 15h3"/>'),
    mail: svg('<rect x="2.5" y="4.8" width="19" height="14.4" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
    close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>'),
    up: svg('<path d="M12 19V5M6 11.5 12 5l6 6.5"/>'),
    left: svg('<path d="M19 12H6M11.5 6 5 12l6.5 6"/>'),
    right: svg('<path d="M5 12h13M12.5 6l6 6-6 6"/>'),
    instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>'),
    tiktok: svg('<path d="M14 3.5v11.2a3.8 3.8 0 1 1-3.2-3.7"/><path d="M14 3.5c.4 2.6 2 4.2 4.6 4.5"/>'),
    whatsapp: svg('<path d="M20.5 11.7c0 4-3.8 7.2-8.5 7.2a9.9 9.9 0 0 1-2.8-.4L4 20.5l1.4-3.7a6.9 6.9 0 0 1-1.9-4.6c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z"/><path d="M9.4 10c0 2.6 2 4.6 4.6 4.6"/>'),
  };

  return {
    get(name) {
      return set[name] || set.star;
    },
    set,
  };
})();
