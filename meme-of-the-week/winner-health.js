(() => {
  "use strict";

  const VERSION = "1.0";
  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-winner-health";

  async function check() {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_latest_completed" })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Health check failed (${response.status})`);
      }

      if (data.state === "no_completed_contest") {
        console.info("🏆 SPARKD winner health: no completed contest to verify yet.");
        return data;
      }

      if (data.state === "completed_without_winner") {
        console.info("🏆 SPARKD winner health: completed contest has no champion because no valid winning vote exists.", data);
        return data;
      }

      if (data.healthy) {
        console.info("✅ SPARKD winner consistency PASS", data);
      } else {
        console.warn("⚠️ SPARKD winner consistency WARNING", data);
      }

      return data;
    } catch (error) {
      console.error("❌ SPARKD winner health checker failed:", error);
      return { success: false, healthy: false, error: String(error?.message || error) };
    }
  }

  window.SPARKD_WINNER_HEALTH = {
    check,
    version: VERSION
  };

  console.log(`🏆 SPARKD winner-health.js v${VERSION} loaded.`);
  check();
})();
