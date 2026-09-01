(() => { “use strict”; const ENDPOINT =
“https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-admin-health”;

const $ = (id) => document.getElementById(id); const fmt = (v) => v ?
new Date(v).toLocaleString() : “—”;

async function loadHealth() { const key = $(“adminKey”).value.trim();
$(“message”).textContent = “Loading…”;
$(“dashboard”).classList.add(“hidden”);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sparkd-admin-key": key
        },
        body: JSON.stringify({ action: "health" })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || `Request failed (${res.status})`);

      const h = data.health || {};
      const c = h.current_contest || {};
      const counts = h.counts || {};
      const cron = h.cron || {};
      const last = cron.last_run || {};
      const winner = h.latest_winner || null;

      const healthy = Boolean(cron.active) && (!last.status || last.status === "succeeded");
      $("systemHealth").textContent = healthy ? "✅ Healthy" : "⚠️ Check required";
      $("systemHealth").className = `value ${healthy ? "ok" : "warn"}`;
      $("phase").textContent = c.status || "No active contest";
      $("nextTransition").textContent = fmt(c.next_transition_at);
      $("submissions").textContent = counts.submissions ?? 0;
      $("eligible").textContent = counts.eligible_submissions ?? 0;
      $("votes").textContent = counts.votes ?? 0;
      $("cron").textContent = cron.active ? `✅ Active (${cron.schedule || ""})` : "❌ Inactive";
      $("lastRun").textContent = last.status ? `${last.status} — ${fmt(last.start_time)}` : "No run recorded";
      $("winner").textContent = winner ? `${winner.meme_title || "Winner"} — ${winner.vote_count ?? 0} votes` : "No champion yet";
      $("raw").textContent = JSON.stringify(h, null, 2);

      $("message").textContent = `Last checked: ${fmt(h.checked_at)}`;
      $("dashboard").classList.remove("hidden");
    } catch (err) {
      $("message").textContent = `❌ ${err.message || err}`;
    }

}

$(“loadBtn”).addEventListener(“click”, loadHealth);
$(“adminKey”).addEventListener(“keydown”, (e) => { if (e.key ===
“Enter”) loadHealth(); });

console.log(“🛡️ SPARKD admin-health.js v1.0 loaded.”); })();
