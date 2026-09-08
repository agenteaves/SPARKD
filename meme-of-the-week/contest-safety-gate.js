(() => {
  "use strict";

  const HEALTH_URL = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-public-health";
  const CHECK_EVERY_MS = 60_000;
  const INITIAL_RETRY_DELAYS_MS = [0, 1500, 3000];
  const HEALTH_TIMEOUT_MS = 5000;
  const MESSAGE = "The site is currently experiencing technical difficulties at this time. Please check back later.";
  let blocked = true; // fail closed until server health is confirmed
  let overlay = null;
  let checking = false;
  let showOverlay = false;

  function ensureOverlay() {
    if (overlay) return overlay;
    const style = document.createElement("style");
    style.textContent = `
      #sparkdTechnicalDifficulties {
        position: fixed; inset: 0; z-index: 2147483647;
        display: none; align-items: center; justify-content: center;
        padding: 24px; background: #080808; color: #fff;
        text-align: center; font-family: Arial, Helvetica, sans-serif;
      }
      #sparkdTechnicalDifficulties .sparkd-tech-card {
        width: min(680px, 100%); padding: 34px 28px;
        border: 1px solid rgba(255,255,255,.16); border-radius: 18px;
        background: rgba(255,255,255,.04); box-shadow: 0 20px 70px rgba(0,0,0,.45);
      }
      #sparkdTechnicalDifficulties .sparkd-tech-title {
        margin: 0 0 14px; font-size: clamp(24px, 5vw, 38px); font-weight: 900;
      }
      #sparkdTechnicalDifficulties .sparkd-tech-message {
        margin: 0; font-size: clamp(16px, 3vw, 20px); line-height: 1.55; opacity: .9;
      }
      html.sparkd-contest-unhealthy, html.sparkd-contest-unhealthy body { overflow: hidden !important; }
    `;
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.id = "sparkdTechnicalDifficulties";
    overlay.setAttribute("role", "alert");
    overlay.setAttribute("aria-live", "assertive");
    overlay.innerHTML = `
      <div class="sparkd-tech-card">
        <div class="sparkd-tech-title">Technical Difficulties</div>
        <p class="sparkd-tech-message">${MESSAGE}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function setBlocked(value, displayOverlay = value) {
    blocked = value;
    showOverlay = blocked && displayOverlay;
    const el = ensureOverlay();
    document.documentElement.classList.toggle("sparkd-contest-unhealthy", showOverlay);
    el.style.display = showOverlay ? "flex" : "none";
    el.setAttribute("aria-hidden", showOverlay ? "false" : "true");
  }

  function stopUnsafeAction(event) {
    if (!blocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // If the user tries an action while health is still unknown/unhealthy,
    // surface the safety message immediately.
    setBlocked(true, true);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function requestHealthOnce() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const response = await fetch(`${HEALTH_URL}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data?.healthy === true;
    } catch (_) {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function checkHealth() {
    if (checking) return;
    checking = true;

    // Keep unsafe actions blocked, but don't immediately show a full outage
    // screen for a single transient mobile/Safari network miss.
    setBlocked(true, false);

    try {
      for (const delay of INITIAL_RETRY_DELAYS_MS) {
        if (delay) await wait(delay);

        const healthy = await requestHealthOnce();

        if (healthy) {
          setBlocked(false, false);
          return;
        }
      }

      // Only show "Technical Difficulties" after the quick retry burst fails.
      setBlocked(true, true);
    } finally {
      checking = false;
    }
  }

  function start() {
    ensureOverlay();
    // Fail closed immediately, but keep the page visible while the first
    // health-check retry burst runs.
    setBlocked(true, false);

    // Capture-phase guard prevents submission even if another script is already loaded.
    document.addEventListener("submit", stopUnsafeAction, true);
    document.addEventListener("click", (event) => {
      if (!blocked) return;
      const target = event.target instanceof Element ? event.target.closest("button, input[type='submit'], [role='button']") : null;
      if (target) stopUnsafeAction(event);
    }, true);

    checkHealth();
    setInterval(checkHealth, CHECK_EVERY_MS);
    window.addEventListener("online", checkHealth);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkHealth();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  console.log("🛑 SPARKD contest-safety-gate.js v1.1 loaded.");
})();
