// SPARKD Meme of the Week — shared public frontend configuration
(() => {
  "use strict";

  const existing = window.SPARKD_CONTEST_CONFIG || {};

  window.SPARKD_CONTEST_CONFIG = Object.freeze({
    ...existing,
    VOTING_WINDOW_MS: 12 * 60 * 60 * 1000,
    PUBLIC_VOTER_STORAGE_KEY: "sparkd_public_voter_seed_v1"
  });
})();
