(() => {
  "use strict";

  const VERSION = "1.0";
  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-winner-health";

  const CARD_ID = "sparkdWinnerDisplay";
  const STYLE_ID = "sparkdWinnerDisplayStyles";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${CARD_ID} {
        margin: 22px 0;
        padding: 18px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 16px;
        background: rgba(0,0,0,.28);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        text-align: center;
      }

      #${CARD_ID} .sparkd-winner-kicker {
        font-weight: 900;
        letter-spacing: .08em;
        margin-bottom: 10px;
      }

      #${CARD_ID} .sparkd-winner-image-wrap {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        border-radius: 14px;
        overflow: hidden;
        background: rgba(255,255,255,.04);
      }

      #${CARD_ID} .sparkd-winner-image {
        display: block;
        width: 100%;
        max-height: 640px;
        object-fit: contain;
        object-position: center;
        margin: 0 auto;
      }

      #${CARD_ID} .sparkd-winner-title {
        margin-top: 14px;
        font-size: 1.2rem;
        font-weight: 800;
      }

      #${CARD_ID} .sparkd-winner-votes {
        margin-top: 6px;
        font-size: .98rem;
        opacity: .86;
      }

      #${CARD_ID} .sparkd-winner-note {
        margin-top: 8px;
        font-size: .85rem;
        opacity: .65;
      }
    `;
    document.head.appendChild(style);
  }

  function findAnchor() {
    return (
      document.getElementById("sparkdContestStatus") ||
      document.getElementById("motmSubmissionArea") ||
      document.querySelector(".community-submissions") ||
      document.querySelector("main")
    );
  }

  function ensureCard() {
    let card = document.getElementById(CARD_ID);
    if (card) return card;

    const anchor = findAnchor();
    if (!anchor) return null;

    card = document.createElement("section");
    card.id = CARD_ID;
    card.hidden = true;
    card.setAttribute("aria-live", "polite");

    anchor.insertAdjacentElement("afterend", card);
    return card;
  }

  async function fetchWinnerHealth() {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check_latest_completed" })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || `Winner display fetch failed (${response.status})`);
    }

    return data;
  }

  function normalizeImageUrl(value) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;

    return `https://uxpbgzksfizkyxubctep.supabase.co/storage/v1/object/public/sparkd-contest-submissions/${String(value).replace(/^\/+/, "")}`;
  }

  function renderWinner(data) {
    const card = ensureCard();
    if (!card) return;

    if (data.state !== "winner_checked" || !data.healthy || !data.submission || !data.winner) {
      card.hidden = true;
      card.replaceChildren();
      return;
    }

    const imageUrl = normalizeImageUrl(data.submission.meme_image_url);
    const title = data.submission.meme_title || "Meme of the Week";
    const votes = Number(data.winner.vote_count || 0);

    card.innerHTML = `
      <div class="sparkd-winner-kicker">🏆 MEME OF THE WEEK CHAMPION 🏆</div>

      ${imageUrl ? `
        <div class="sparkd-winner-image-wrap">
          <img
            class="sparkd-winner-image"
            src="${imageUrl}"
            alt="${title.replace(/"/g, "&quot;")}"
            loading="lazy"
            decoding="async"
          >
        </div>
      ` : ""}

      <div class="sparkd-winner-title">${title}</div>
      <div class="sparkd-winner-votes">${votes} ${votes === 1 ? "vote" : "votes"}</div>
      <div class="sparkd-winner-note">Verified weekly champion</div>
    `;

    card.hidden = false;
  }

  async function refresh() {
    try {
      const data = await fetchWinnerHealth();
      renderWinner(data);

      if (data.state === "winner_checked" && data.healthy) {
        console.log("🏆 SPARKD winner display loaded champion:", data.submission?.meme_title || data.contest?.winner_submission_id);
      } else {
        console.info("🏆 SPARKD winner display: no verified champion to show yet.");
      }

      return data;
    } catch (error) {
      console.error("❌ SPARKD winner display failed:", error);
      const card = ensureCard();
      if (card) {
        card.hidden = true;
        card.replaceChildren();
      }
      return null;
    }
  }

  function start() {
    injectStyles();
    refresh();
    console.log(`🏆 SPARKD winner-display.js v${VERSION} loaded.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.SPARKD_WINNER_DISPLAY = {
    refresh,
    version: VERSION
  };
})();
