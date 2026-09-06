(() => {
  "use strict";

  const VERSION = "1.0";
  const SUPABASE_URL = "https://uxpbgzksfizkyxubctep.supabase.co";
  const SUPABASE_KEY = "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";

  const STATUS_ID = "sparkdContestStatus";
  const STYLE_ID = "sparkdContestStatusStyles";
  const REFRESH_MS = 60_000;

  let currentContest = null;
  let timer = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${STATUS_ID} {
        margin: 14px 0 0;
        padding: 14px 16px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 14px;
        background: rgba(0,0,0,.24);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        text-align: center;
      }

      #${STATUS_ID} .sparkd-contest-status-phase {
        font-weight: 800;
        letter-spacing: .04em;
        margin-bottom: 6px;
      }

      #${STATUS_ID} .sparkd-contest-status-countdown {
        font-size: 1rem;
        opacity: .95;
      }

      #${STATUS_ID} .sparkd-contest-status-detail {
        margin-top: 5px;
        font-size: .88rem;
        opacity: .72;
      }
    `;
    document.head.appendChild(style);
  }

  function findAnchor() {
    return (
      document.getElementById("motmSubmissionArea") ||
      document.getElementById("submitMemeButton")?.parentElement ||
      document.querySelector(".submission-area") ||
      document.querySelector(".contest-actions") ||
      document.querySelector("main")
    );
  }

  function ensureStatusBox() {
    let box = document.getElementById(STATUS_ID);
    if (box) return box;

    const anchor = findAnchor();
    if (!anchor) return null;

    box = document.createElement("div");
    box.id = STATUS_ID;
    box.setAttribute("aria-live", "polite");

    if (anchor.id === "motmSubmissionArea" || anchor.classList?.contains("submission-area")) {
      anchor.appendChild(box);
    } else {
      anchor.insertAdjacentElement("afterend", box);
    }

    return box;
  }

  async function fetchCurrentContest() {
    const url = new URL(`${SUPABASE_URL}/rest/v1/meme_week_contests`);
    url.searchParams.set("select", "id,week_start,week_end,status,winner_submission_id");
    url.searchParams.set("status", "in.(submission,voting)");
    url.searchParams.set("order", "week_start.desc");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Contest status fetch failed (${response.status})`);
    }

    const rows = await response.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  function formatDuration(ms) {
    if (ms <= 0) return "0m";

    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours || days) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ");
  }

  function getPhasePresentation(contest) {
    const now = Date.now();

    if (!contest) {
      return {
        phase: "⏳ NEXT CONTEST PREPARING",
        countdown: "The next weekly contest will appear automatically.",
        detail: ""
      };
    }

    const endMs = new Date(contest.week_end).getTime();

    if (contest.status === "submission") {
      return {
        phase: "🔥 SUBMISSIONS OPEN",
        countdown:
          endMs > now
            ? `Submissions close in ${formatDuration(endMs - now)}`
            : "Submissions are closing now…",
        detail: "Voting opens automatically after submissions close."
      };
    }

    if (contest.status === "voting") {
      const votingEndMs = endMs + 12 * 60 * 60 * 1000;
      return {
        phase: "🗳️ VOTING OPEN",
        countdown:
          votingEndMs > now
            ? `Voting ends in ${formatDuration(votingEndMs - now)}`
            : "Voting is closing now…",
        detail: "The weekly champion is selected automatically when voting ends."
      };
    }

    return {
      phase: "🏆 CONTEST COMPLETE",
      countdown: "The next weekly contest will start automatically.",
      detail: ""
    };
  }

  function render() {
    const box = ensureStatusBox();
    if (!box) return;

    const view = getPhasePresentation(currentContest);
    box.innerHTML = `
      <div class="sparkd-contest-status-phase">${view.phase}</div>
      <div class="sparkd-contest-status-countdown">${view.countdown}</div>
      ${view.detail ? `<div class="sparkd-contest-status-detail">${view.detail}</div>` : ""}
    `;

    // Keep the submission controls synchronized with the authoritative contest phase.
    // Once submissions close, do not invite users into a form that can no longer succeed.
    const submissionButton = document.getElementById("submitMemeButton");
    const submissionForm = document.getElementById("motmSubmissionForm");
    const submissionStatus = document.getElementById("motmSubmissionStatus");

    if (submissionButton) {
      const submissionsOpen = currentContest?.status === "submission" &&
        new Date(currentContest.week_end).getTime() > Date.now();

      if (submissionsOpen) {
        submissionButton.disabled = false;
        submissionButton.textContent = "🔥 ENTER MEME OF THE WEEK";
        submissionButton.removeAttribute("aria-disabled");
      } else {
        submissionButton.disabled = true;
        submissionButton.textContent =
          currentContest?.status === "voting"
            ? "🔒 SUBMISSIONS CLOSED — VOTING IS NOW OPEN"
            : "🔒 SUBMISSIONS CLOSED";
        submissionButton.setAttribute("aria-disabled", "true");

        if (submissionForm) submissionForm.style.display = "none";
        if (submissionStatus) {
          submissionStatus.textContent =
            currentContest?.status === "voting"
              ? "🗳️ Voting is now open. New meme submissions are closed."
              : "🔒 Meme submissions are currently closed.";
        }
      }
    }
  }

  async function refresh() {
    try {
      currentContest = await fetchCurrentContest();
      render();
    } catch (error) {
      console.error("❌ SPARKD contest status failed:", error);
      const box = ensureStatusBox();
      if (box) {
        box.innerHTML = `
          <div class="sparkd-contest-status-phase">🔥 MEME OF THE WEEK</div>
          <div class="sparkd-contest-status-countdown">Contest status temporarily unavailable.</div>
        `;
      }
    }
  }

  function start() {
    injectStyles();
    refresh();

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      render();
      refresh();
    }, REFRESH_MS);

    console.log(`⏱️ SPARKD contest-status.js v${VERSION} loaded.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.SPARKD_CONTEST_STATUS = {
    refresh,
    version: VERSION
  };
})();
