(() => {
  "use strict";

  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-system-monitor";

  function ensurePanel() {
    if (document.getElementById("sparkdMonitorPanel")) return;

    const style = document.createElement("style");
    style.textContent = `
      #sparkdMonitorPanel { margin-top: 24px; padding: 18px; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; background: rgba(255,255,255,.035); }
      #sparkdMonitorPanel .monitor-head { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
      #sparkdMonitorPanel .monitor-title { font-weight:800; font-size:18px; }
      #sparkdMonitorPanel .monitor-badge { padding:7px 11px; border-radius:999px; font-weight:800; letter-spacing:.04em; }
      #sparkdMonitorPanel .healthy { background:rgba(44,190,100,.15); border:1px solid rgba(44,190,100,.45); }
      #sparkdMonitorPanel .warning { background:rgba(245,180,35,.15); border:1px solid rgba(245,180,35,.45); }
      #sparkdMonitorPanel .critical { background:rgba(235,70,70,.16); border:1px solid rgba(235,70,70,.5); }
      #sparkdMonitorPanel .monitor-meta { margin-top:10px; opacity:.72; font-size:13px; }
      #sparkdMonitorPanel .monitor-issues { display:grid; gap:10px; margin-top:14px; }
      #sparkdMonitorPanel .monitor-issue { padding:12px; border:1px solid rgba(255,255,255,.12); border-radius:10px; background:rgba(0,0,0,.18); }
      #sparkdMonitorPanel .monitor-issue strong { display:block; margin-bottom:4px; }
      #sparkdMonitorPanel .monitor-ok { margin-top:14px; opacity:.86; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement("section");
    panel.id = "sparkdMonitorPanel";
    panel.innerHTML = `
      <div class="monitor-head">
        <div class="monitor-title">Automated Failure Monitor</div>
        <div id="sparkdMonitorBadge" class="monitor-badge">NOT CHECKED</div>
      </div>
      <div id="sparkdMonitorMeta" class="monitor-meta">Use Load Health to run the protected monitor.</div>
      <div id="sparkdMonitorIssues" class="monitor-issues"></div>
    `;

    const dashboard = document.getElementById("dashboard");
    if (dashboard) dashboard.appendChild(panel);
    else document.body.appendChild(panel);
  }

  function render(data) {
    ensurePanel();
    const badge = document.getElementById("sparkdMonitorBadge");
    const meta = document.getElementById("sparkdMonitorMeta");
    const issuesEl = document.getElementById("sparkdMonitorIssues");

    const status = String(data?.status || "critical").toLowerCase();
    badge.className = `monitor-badge ${status}`;
    badge.textContent = status.toUpperCase();

    const cron = data?.cron || {};
    const contest = data?.active_contest || {};
    meta.textContent = `Checked ${data?.checked_at || "unknown"} • Cron ${cron.active ? "active" : "inactive"} • Last run ${cron.last_status || "unknown"} • Contest ${contest.status || "none"}`;

    const issues = Array.isArray(data?.issues) ? data.issues : [];
    if (!issues.length) {
      issuesEl.innerHTML = `<div class="monitor-ok">No lifecycle, cron, contest-phase, next-contest, or winner-record failures detected.</div>`;
      return;
    }

    issuesEl.innerHTML = issues.map(issue => `
      <div class="monitor-issue">
        <strong>${String(issue.level || "warning").toUpperCase()} — ${issue.code || "monitor_issue"}</strong>
        <div>${issue.message || "System monitor detected an issue."}</div>
      </div>
    `).join("");
  }

  async function loadMonitor() {
    ensurePanel();
    const key = document.getElementById("adminKey")?.value?.trim();
    if (!key) return;

    const badge = document.getElementById("sparkdMonitorBadge");
    badge.className = "monitor-badge";
    badge.textContent = "CHECKING";

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sparkd-admin-key": key
        },
        body: JSON.stringify({ action: "health" })
      });

      const data = await response.json();
      if (!response.ok || data?.success !== true) {
        throw new Error(data?.error || "Monitor request failed.");
      }
      render(data);
    } catch (error) {
      render({
        success: false,
        status: "critical",
        checked_at: new Date().toISOString(),
        cron: {},
        active_contest: {},
        issues: [{ level: "critical", code: "monitor_unreachable", message: error instanceof Error ? error.message : String(error) }]
      });
    }
  }

  ensurePanel();
  document.getElementById("loadBtn")?.addEventListener("click", () => {
    setTimeout(loadMonitor, 0);
  });

  console.log("🛡️ SPARKD admin-monitor.js v1.0 loaded.");
})();
