// SPARKD Meme of the Week — shared public frontend configuration
(() => {
  "use strict";

  const existing = window.SPARKD_CONTEST_CONFIG || {};

  window.SPARKD_CONTEST_CONFIG = Object.freeze({
    ...existing,
    DRAW_WINDOW_MS: 0
  });
})();
