////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK — VOTER REWARD NOTICE
// voter-reward.js v1.0
//
// Standalone frontend module.
// Adds a clear $5 SOL weekly voter-reward notice near voting.
//
// Does NOT alter voting mechanics, submission, lifecycle,
// winner selection, or any Supabase write path.
////////////////////////////////////////////////////

(() => {
  "use strict";

  const VERSION = "1.0";
  const NOTICE_ID = "sparkdVoterRewardNotice";
  const STYLE_ID = "sparkdVoterRewardNoticeStyles";

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${NOTICE_ID} {
        margin: 16px 0;
        padding: 16px 18px;
        border: 1px solid rgba(255, 202, 40, .45);
        border-radius: 16px;
        background:
          linear-gradient(135deg, rgba(255,202,40,.12), rgba(255,255,255,.035));
        box-shadow: 0 10px 28px rgba(0,0,0,.18);
      }

      #${NOTICE_ID} .sparkd-reward-title {
        margin: 0 0 7px;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: .025em;
      }

      #${NOTICE_ID} .sparkd-reward-copy {
        margin: 0;
        line-height: 1.5;
      }

      #${NOTICE_ID} .sparkd-reward-fine {
        display: block;
        margin-top: 8px;
        font-size: 12px;
        opacity: .8;
        line-height: 1.45;
      }
    `;
    document.head.appendChild(style);
  }

  function buildNotice() {
    if (document.getElementById(NOTICE_ID)) return true;

    const target =
      document.getElementById("sparkdVoteButton") ||
      document.getElementById("motmSubmissionArea") ||
      document.querySelector(".competition-stats");

    if (!target || !target.parentNode) return false;

    const box = document.createElement("aside");
    box.id = NOTICE_ID;
    box.setAttribute("aria-label", "Weekly voter reward");

    const title = document.createElement("div");
    title.className = "sparkd-reward-title";
    title.textContent = "🎁 VOTE & YOU COULD WIN $5 IN SOL";

    const copy = document.createElement("p");
    copy.className = "sparkd-reward-copy";
    copy.textContent =
      "Cast one valid weekly vote for another community member's meme and your voting wallet is automatically entered into that week's random voter reward drawing.";

    const fine = document.createElement("span");
    fine.className = "sparkd-reward-fine";
    fine.textContent =
      "No purchase necessary to vote. One drawing entry per valid voting wallet per weekly contest. You cannot vote for your own meme. Odds depend on the number of eligible voters. $5 USD value paid in SOL; selected after the contest is finalized. Void where prohibited.";

    box.append(title, copy, fine);

    // Prefer directly above the voting control when it exists.
    if (target.id === "sparkdVoteButton") {
      target.parentNode.insertBefore(box, target);
    } else {
      target.parentNode.insertBefore(box, target.nextSibling);
    }

    return true;
  }

  function init() {
    addStyles();

    if (!buildNotice()) {
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (buildNotice() || tries >= 40) clearInterval(timer);
      }, 250);

      const observer = new MutationObserver(() => {
        if (buildNotice()) observer.disconnect();
      });

      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 12000);
    }

    window.SPARKD_VOTER_REWARD = { version: VERSION };
    console.log(`🎁 SPARKD voter-reward.js v${VERSION} loaded.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
