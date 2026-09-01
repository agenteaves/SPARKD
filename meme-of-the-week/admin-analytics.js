////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK — ADMIN ANALYTICS
// admin-analytics.js v1.0
//
// Standalone read-only analytics module.
// Load AFTER admin-health.js on the existing admin health page.
//
// INSTALL:
// <script src="admin-analytics.js"></script>
////////////////////////////////////////////////////

(() => {
  "use strict";

  const VERSION = "1.0";
  const ENDPOINT =
    "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-admin-analytics";

  const $ = (id) => document.getElementById(id);

  function fmtNumber(value) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toLocaleString() : "0";
  }

  function fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }

  function createStyles() {
    if ($("sparkdAnalyticsStyles")) return;

    const style = document.createElement("style");
    style.id = "sparkdAnalyticsStyles";
    style.textContent = `
      #sparkdAnalyticsPanel {
        margin-top: 24px;
        border-top: 1px solid #2b2b32;
        padding-top: 22px;
      }

      #sparkdAnalyticsPanel h2 {
        margin: 0 0 6px;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-sub {
        opacity: .7;
        margin-bottom: 16px;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-section {
        margin-top: 20px;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-section h3 {
        margin: 0 0 12px;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 12px;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-card {
        background: #151519;
        border: 1px solid #2b2b32;
        border-radius: 14px;
        padding: 15px;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-label {
        font-size: .76rem;
        opacity: .62;
        text-transform: uppercase;
        letter-spacing: .06em;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-value {
        font-size: 1.18rem;
        font-weight: 800;
        margin-top: 7px;
        word-break: break-word;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-highlight {
        color: #89f7a1;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-note {
        margin-top: 12px;
        opacity: .65;
        font-size: .86rem;
      }

      #sparkdAnalyticsPanel .sparkd-analytics-error {
        color: #ff7b7b;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  function metric(label, id, highlight = false) {
    const card = document.createElement("div");
    card.className = "sparkd-analytics-card";

    const l = document.createElement("div");
    l.className = "sparkd-analytics-label";
    l.textContent = label;

    const v = document.createElement("div");
    v.id = id;
    v.className =
      "sparkd-analytics-value" +
      (highlight ? " sparkd-analytics-highlight" : "");
    v.textContent = "—";

    card.append(l, v);
    return card;
  }

  function section(title, metrics) {
    const wrap = document.createElement("section");
    wrap.className = "sparkd-analytics-section";

    const h = document.createElement("h3");
    h.textContent = title;

    const grid = document.createElement("div");
    grid.className = "sparkd-analytics-grid";

    metrics.forEach((m) => grid.appendChild(metric(m[0], m[1], m[2])));

    wrap.append(h, grid);
    return wrap;
  }

  function buildPanel() {
    if ($("sparkdAnalyticsPanel")) return;

    createStyles();

    const panel = document.createElement("section");
    panel.id = "sparkdAnalyticsPanel";
    panel.className = "hidden";

    const title = document.createElement("h2");
    title.textContent = "📊 Contest Analytics";

    const sub = document.createElement("div");
    sub.className = "sparkd-analytics-sub";
    sub.textContent =
      "Private aggregate contest metrics. Individual wallet identities are not displayed.";

    const status = document.createElement("div");
    status.id = "sparkdAnalyticsStatus";
    status.textContent = "Analytics load with the health dashboard.";

    panel.append(title, sub, status);

    panel.appendChild(
      section("Current Contest", [
        ["Phase", "sparkdA_currentPhase"],
        ["Submissions", "sparkdA_currentSubmissions"],
        ["Verified / Eligible", "sparkdA_currentVerified"],
        ["Pending Review", "sparkdA_currentPending"],
        ["Approved", "sparkdA_currentApproved"],
        ["Rejected", "sparkdA_currentRejected"],
        ["Votes", "sparkdA_currentVotes"],
        ["Voting Wallets", "sparkdA_currentVotingWallets"],
        ["Submitting Wallets", "sparkdA_currentParticipants"],
        ["Verified SPARKD Burned", "sparkdA_currentBurned", true]
      ])
    );

    panel.appendChild(
      section("Previous Contest", [
        ["Submissions", "sparkdA_prevSubmissions"],
        ["Votes", "sparkdA_prevVotes"],
        ["Submitting Wallets", "sparkdA_prevParticipants"],
        ["Winner Votes", "sparkdA_prevWinnerVotes"],
        ["Verified SPARKD Burned", "sparkdA_prevBurned", true]
      ])
    );

    panel.appendChild(
      section("Lifetime Contest Totals", [
        ["Contests Created", "sparkdA_lifeContests"],
        ["Completed Contests", "sparkdA_lifeCompleted"],
        ["Submissions", "sparkdA_lifeSubmissions"],
        ["Verified Submissions", "sparkdA_lifeVerified"],
        ["Votes", "sparkdA_lifeVotes"],
        ["Unique Submitters", "sparkdA_lifeSubmitters"],
        ["Unique Voters", "sparkdA_lifeVoters"],
        ["Winners", "sparkdA_lifeWinners"],
        ["Verified SPARKD Burned", "sparkdA_lifeBurned", true]
      ])
    );

    const note = document.createElement("div");
    note.className = "sparkd-analytics-note";
    note.id = "sparkdAnalyticsGenerated";
    panel.appendChild(note);

    const dashboard = $("dashboard");
    if (dashboard && dashboard.parentNode) {
      dashboard.parentNode.insertBefore(panel, dashboard.nextSibling);
    } else {
      document.body.appendChild(panel);
    }
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function render(data) {
    const current = data?.current || null;
    const previous = data?.previous || null;
    const lifetime = data?.lifetime || {};

    setText("sparkdA_currentPhase", current?.status || "No active contest");
    setText("sparkdA_currentSubmissions", fmtNumber(current?.submissions));
    setText("sparkdA_currentVerified", fmtNumber(current?.verifiedSubmissions));
    setText("sparkdA_currentPending", fmtNumber(current?.pending));
    setText("sparkdA_currentApproved", fmtNumber(current?.approved));
    setText("sparkdA_currentRejected", fmtNumber(current?.rejected));
    setText("sparkdA_currentVotes", fmtNumber(current?.votes));
    setText("sparkdA_currentVotingWallets", fmtNumber(current?.votingWallets));
    setText("sparkdA_currentParticipants", fmtNumber(current?.participantWallets));
    setText("sparkdA_currentBurned", `${fmtNumber(current?.verifiedSparkdBurned)} SPARKD`);

    setText("sparkdA_prevSubmissions", fmtNumber(previous?.submissions));
    setText("sparkdA_prevVotes", fmtNumber(previous?.votes));
    setText("sparkdA_prevParticipants", fmtNumber(previous?.participantWallets));
    setText("sparkdA_prevWinnerVotes", fmtNumber(previous?.winnerVoteCount));
    setText("sparkdA_prevBurned", `${fmtNumber(previous?.verifiedSparkdBurned)} SPARKD`);

    setText("sparkdA_lifeContests", fmtNumber(lifetime?.contests));
    setText("sparkdA_lifeCompleted", fmtNumber(lifetime?.completedContests));
    setText("sparkdA_lifeSubmissions", fmtNumber(lifetime?.submissions));
    setText("sparkdA_lifeVerified", fmtNumber(lifetime?.verifiedSubmissions));
    setText("sparkdA_lifeVotes", fmtNumber(lifetime?.votes));
    setText("sparkdA_lifeSubmitters", fmtNumber(lifetime?.uniqueSubmittingWallets));
    setText("sparkdA_lifeVoters", fmtNumber(lifetime?.uniqueVotingWallets));
    setText("sparkdA_lifeWinners", fmtNumber(lifetime?.winners));
    setText("sparkdA_lifeBurned", `${fmtNumber(lifetime?.verifiedSparkdBurned)} SPARKD`);

    setText(
      "sparkdAnalyticsGenerated",
      `Analytics generated: ${fmtDate(data?.generatedAt)}`
    );

    const status = $("sparkdAnalyticsStatus");
    if (status) {
      status.className = "";
      status.textContent = "✅ Analytics loaded";
    }

    $("sparkdAnalyticsPanel")?.classList.remove("hidden");
  }

  async function loadAnalytics() {
    buildPanel();

    const keyInput = $("adminKey");
    const key = keyInput?.value?.trim() || "";

    if (!key) {
      $("sparkdAnalyticsPanel")?.classList.add("hidden");
      return;
    }

    const status = $("sparkdAnalyticsStatus");
    if (status) {
      status.className = "";
      status.textContent = "Loading analytics…";
    }

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sparkd-admin-key": key
        },
        body: JSON.stringify({ action: "analytics" })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success !== true) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      render(data.analytics || {});
    } catch (error) {
      if (status) {
        status.className = "sparkd-analytics-error";
        status.textContent =
          "❌ Analytics unavailable: " +
          (error?.message || String(error));
      }
      $("sparkdAnalyticsPanel")?.classList.remove("hidden");
    }
  }

  function initialize() {
    buildPanel();

    const loadBtn = $("loadBtn");
    const adminKey = $("adminKey");

    if (loadBtn) {
      loadBtn.addEventListener("click", loadAnalytics);
    }

    if (adminKey) {
      adminKey.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          setTimeout(loadAnalytics, 0);
        }
      });
    }

    window.SPARKD_ADMIN_ANALYTICS = {
      load: loadAnalytics,
      version: VERSION
    };

    console.log(
      "📊 SPARKD admin-analytics.js v" +
      VERSION +
      " loaded."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
