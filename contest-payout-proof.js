(() => {
  "use strict";

  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-payout-proof";
  const BUTTON_ID = "contestPayoutProofButton";
  const MODAL_ID = "contestPayoutProofModal";
  const LIST_ID = "contestPayoutProofList";
  const STYLE_ID = "contestPayoutProofStyles";

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .contest-proof-card {
        width: min(360px, 92vw);
        margin: 0 auto 14px;
        padding: 18px 20px;
        border: 1px solid rgba(72, 255, 161, .55);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(8, 25, 17, .96), rgba(5, 12, 9, .96));
        box-shadow: 0 12px 36px rgba(0,0,0,.28), 0 0 24px rgba(48,255,145,.08);
        color: #fff;
        cursor: pointer;
        text-align: center;
        font: inherit;
      }
      .contest-proof-card:hover,
      .contest-proof-card:focus-visible {
        transform: translateY(-2px);
        border-color: rgba(72,255,161,.95);
        box-shadow: 0 15px 40px rgba(0,0,0,.34), 0 0 28px rgba(48,255,145,.16);
        outline: none;
      }
      .contest-proof-icon { font-size: 1.45rem; margin-bottom: 4px; }
      .contest-proof-title { font-weight: 900; letter-spacing: .05em; }
      .contest-proof-meta { margin-top: 5px; font-size: .8rem; opacity: .78; }
      .contest-proof-link { display:block; margin-top: 9px; color:#5dffae; font-weight:800; font-size:.8rem; }

      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(0,0,0,.82);
        backdrop-filter: blur(8px);
      }
      #${MODAL_ID}[hidden] { display: none !important; }
      #${MODAL_ID} .contest-proof-panel {
        width: min(760px, 100%);
        max-height: 88vh;
        overflow: auto;
        border-radius: 22px;
        border: 1px solid rgba(72,255,161,.5);
        background: #080d0a;
        color: #fff;
        box-shadow: 0 25px 90px rgba(0,0,0,.65);
        padding: 22px;
      }
      #${MODAL_ID} .contest-proof-header {
        display:flex;
        justify-content:space-between;
        gap:16px;
        align-items:flex-start;
        margin-bottom:16px;
      }
      #${MODAL_ID} h2 { margin:0 0 5px; font-size:1.35rem; }
      #${MODAL_ID} .contest-proof-subtitle { margin:0; opacity:.72; font-size:.92rem; }
      #${MODAL_ID} .contest-proof-close {
        border:0;
        background:transparent;
        color:#fff;
        font-size:1.6rem;
        cursor:pointer;
      }
      #${LIST_ID} { display:grid; gap:12px; }
      .contest-proof-row {
        border:1px solid rgba(255,255,255,.11);
        border-radius:15px;
        padding:14px;
        background:rgba(255,255,255,.035);
      }
      .contest-proof-row-head {
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:center;
        margin-bottom:9px;
      }
      .contest-proof-place { font-weight:900; color:#5dffae; }
      .contest-proof-verified { font-size:.78rem; font-weight:900; color:#5dffae; }
      .contest-proof-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px 16px;
        font-size:.88rem;
      }
      .contest-proof-grid span { opacity:.72; display:block; font-size:.73rem; margin-bottom:2px; }
      .contest-proof-signature {
        margin-top:10px;
        word-break:break-all;
        font-size:.78rem;
        opacity:.82;
      }
      .contest-proof-solscan {
        display:inline-block;
        margin-top:10px;
        color:#5dffae;
        font-weight:900;
        text-decoration:none;
      }
      .contest-proof-status {
        padding:14px;
        border-radius:12px;
        background:rgba(255,255,255,.05);
        opacity:.82;
      }
      @media(max-width:620px){
        #${MODAL_ID} .contest-proof-panel { padding:16px; }
        .contest-proof-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function placeLabel(place) {
    return place === 1 ? "🥇 1st Place" : place === 2 ? "🥈 2nd Place" : place === 3 ? "🥉 3rd Place" : "Winner";
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  }

  function shortWallet(value) {
    if (!value || value.length < 12) return value || "—";
    return `${value.slice(0,6)}...${value.slice(-4)}`;
  }

  function shortSignature(value) {
    if (!value || value.length < 20) return value || "—";
    return `${value.slice(0,10)}...${value.slice(-10)}`;
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.hidden = true;
    modal.innerHTML = `
      <div class="contest-proof-panel" role="dialog" aria-modal="true" aria-labelledby="contestPayoutProofTitle">
        <div class="contest-proof-header">
          <div>
            <h2 id="contestPayoutProofTitle">✅ Verified Contest Winner Payouts</h2>
            <p class="contest-proof-subtitle">Paid winner transactions from the latest completed SPARKD Meme of the Week contest.</p>
          </div>
          <button class="contest-proof-close" type="button" aria-label="Close">✕</button>
        </div>
        <div id="${LIST_ID}" class="contest-proof-status">Loading verified payout records...</div>
      </div>`;

    modal.querySelector(".contest-proof-close")?.addEventListener("click", () => { modal.hidden = true; });
    modal.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) modal.hidden = true; });
    document.body.appendChild(modal);
    return modal;
  }

  async function loadProofs() {
    const list = document.getElementById(LIST_ID);
    if (!list) return;
    list.className = "contest-proof-status";
    list.textContent = "Loading verified payout records...";

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "latest_verified_podium" }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || data?.success !== true) throw new Error(data?.error || "Unable to load payout proof.");

      const payouts = Array.isArray(data.payouts) ? data.payouts : [];
      if (!payouts.length) {
        list.className = "contest-proof-status";
        list.textContent = "No verified winner payout transactions are available yet.";
        return;
      }

      list.className = "";
      list.innerHTML = payouts.map(payout => {
        const sig = String(payout.transaction_signature || "");
        const solscan = `https://solscan.io/tx/${encodeURIComponent(sig)}`;
        const sol = payout.amount_sol == null ? "—" : Number(payout.amount_sol).toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
        return `
          <article class="contest-proof-row">
            <div class="contest-proof-row-head">
              <div class="contest-proof-place">${placeLabel(Number(payout.place))}</div>
              <div class="contest-proof-verified">✓ PAID & RECORDED</div>
            </div>
            <div class="contest-proof-grid">
              <div><span>Prize</span>$${Number(payout.reward_usd || 0).toFixed(2)} USD worth of SOL</div>
              <div><span>SOL Sent</span>${sol} SOL</div>
              <div><span>Recipient</span>${shortWallet(String(payout.recipient_wallet || ""))}</div>
              <div><span>Paid</span>${formatDate(payout.paid_at)}</div>
            </div>
            <div class="contest-proof-signature"><strong>Transaction:</strong> ${shortSignature(sig)}</div>
            <a class="contest-proof-solscan" href="${solscan}" target="_blank" rel="noopener noreferrer">VERIFY ON SOLSCAN ↗</a>
          </article>`;
      }).join("");
    } catch (error) {
      list.className = "contest-proof-status";
      list.textContent = "Unable to load verified payout records right now. Please try again shortly.";
      console.error("SPARKD payout proof error:", error);
    }
  }

  function initialize() {
    addStyles();
    const button = document.getElementById(BUTTON_ID);
    if (!button) return;
    const modal = ensureModal();
    button.addEventListener("click", async () => {
      modal.hidden = false;
      await loadProofs();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
