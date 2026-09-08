/* ============================================================
   SQ MARKET — ТОЧКА ВХОДА
   Порядок важен: сначала собираем разметку из data.js,
   потом навешиваем на неё движение и интерактив.
   ============================================================ */

(function () {
  function boot() {
    window.SQCore.init();     // тема, курсор, прелоадер, скролл
    window.SQRender.init();   // секции из data.js
    window.SQUI.init();       // появления, магнитные кнопки, табы
    window.SQNav.init();      // «жидкая» навигация
    window.SQMap.init();      // карта 2ГИС

    // если пришли по ссылке с якорем — доедем сами, с учётом высоты шапки
    if (location.hash.length > 1) {
      setTimeout(() => window.SQCore.scrollToId(location.hash.slice(1)), 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
