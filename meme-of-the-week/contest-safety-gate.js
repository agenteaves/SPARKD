(() => {
  "use strict";

  const HEALTH_URL = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-public-health";
  const CHECK_EVERY_MS = 60_000;
  const MESSAGE = "The site is currently experiencing technical difficulties at this time. Please check back later.";
  let blocked = true; // fail closed until server health is confirmed
  let overlay = null;

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

  function setBlocked(value) {
    blocked = value;
    const el = ensureOverlay();
    document.documentElement.classList.toggle("sparkd-contest-unhealthy", blocked);
    el.style.display = blocked ? "flex" : "none";
    el.setAttribute("aria-hidden", blocked ? "false" : "true");
  }

  function stopUnsafeAction(event) {
    if (!blocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setBlocked(true);
  }

  async function checkHealth() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${HEALTH_URL}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return setBlocked(true);
      const data = await response.json();
      setBlocked(data?.healthy !== true);
    } catch (_) {
      setBlocked(true);
    }
  }

  function start() {
    ensureOverlay();
    setBlocked(true);

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

  console.log("🛑 SPARKD contest-safety-gate.js v1.0 loaded.");
})();
