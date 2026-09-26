(() => {
  "use strict";

  const HEALTH_URL = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-public-health";
  const CHECK_EVERY_MS = 60_000;
  const INITIAL_RETRY_DELAYS_MS = [0, 1500, 3000];
  const HEALTH_TIMEOUT_MS = 5000;
  let blocked = false;
  let checking = false;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function requestHealthOnce() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const response = await fetch(`${HEALTH_URL}?t=${Date.now()}`, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.healthy === true;
    } catch (_) {
      // A browser/network/CORS failure is not proof that SPARKD is unhealthy.
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function checkHealth() {
    if (checking) return;
    checking = true;
    try {
      let sawExplicitUnhealthy = false;
      for (const delay of INITIAL_RETRY_DELAYS_MS) {
        if (delay) await wait(delay);
        const healthy = await requestHealthOnce();
        if (healthy === true) {
          blocked = false;
          return;
        }
        if (healthy === false) sawExplicitUnhealthy = true;
      }
      // Never replace the public website with a full-screen outage merely
      // because Safari/in-app browsers could not reach the health endpoint.
      // Server-side contest endpoints remain authoritative for protected actions.
      blocked = sawExplicitUnhealthy;
    } finally {
      checking = false;
    }
  }

  function start() {
    // The public site must remain browsable even if a mobile browser cannot
    // complete this optional health probe. Protected contest operations are
    // still validated by their server endpoints.
    blocked = false;
    checkHealth();
    setInterval(checkHealth, CHECK_EVERY_MS);
    window.addEventListener("online", checkHealth);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkHealth();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  console.log("SPARKD contest-safety-gate.js v1.2 loaded.");
})();
