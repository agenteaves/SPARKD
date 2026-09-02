//////////////////////////////////////////////////// // SPARKD MEME OF
THE WEEK — CONTEST RULES // contest-rules.js v1.1 // // Standalone
frontend module. // Injects a Contest Rules button beside the current //
week/date heading above the large winner box. // // Does NOT modify
contest-submit.js, voting.js, // lifecycle logic, winner selection, or
Supabase writes. ////////////////////////////////////////////////////

(() => { “use strict”;

const VERSION = “1.1”; const ROOT_ID = “sparkdContestRules”; const
MODAL_ID = “sparkdContestRulesModal”; const STYLE_ID =
“sparkdContestRulesStyles”;

const RULE_SECTIONS = [ { title: “1. Contest Overview”, items: [ “SPARKD
Meme of the Week is a weekly community meme contest.”, “Each weekly
contest moves automatically through a submission phase, a voting phase,
and winner finalization.”, “The live contest dates, phase, and countdown
shown on the contest page are the public schedule. Server and database
time control whether an action is actually accepted.” ] }, { title: “2.
Meme Entry Requirements”, items: [ “Contest entries must be submitted
through the official SPARKD Meme of the Week submission system.”, “The
meme must be a valid SPARKD Meme Forge PNG that passes Forge DNA
verification.”, “The submitting wallet must hold at least 2,000 SPARKD
at the time the entry is prepared.”, “Entering a meme requires a
verified burn of exactly 2,000 SPARKD.”, “The burn is an on-chain token
burn. Once successfully broadcast and confirmed, burned SPARKD cannot be
returned.”, “A meme title is required and may contain up to 100
characters.”, “The submission must be completed during the active
submission window. Late new submissions are rejected by the
server/database even if a browser page is still open.” ] }, { title: “3.
Wallet & Burn Verification”, items: [ “The entrant uses a compatible
Solana wallet such as Phantom to authorize the contest transaction.”,
“The contest verifies the SPARKD burn on-chain before the entry is
finalized.”, “A valid entry must have both DNA verification and burn
verification.”, “Canceling or rejecting the wallet transaction before it
is broadcast does not create a completed entry or verified burn.”, “Only
burns associated with the correct active contest and submission window
are accepted.” ] }, { title: “4. Submission Status & Moderation”, items:
[ “New valid entries may initially appear with a pending status.”,
“Contest administrators may approve or reject a pending submission.”, “A
rejected meme is not eligible to receive contest votes.”, “A meme does
not currently need an approved status to appear as voting-eligible; it
must have verified Forge DNA, a verified burn, and must not be
rejected.”, “Winner submissions are protected from ordinary moderation
changes after winner finalization.” ] }, { title: “5. Voting Rules”,
items: [ “Voting is available only while the contest is officially in
the voting phase.”, “The voting period lasts 12 hours after the
submission period closes.”, “The exact voting window is enforced
server-side. Votes outside the allowed time are rejected.”, “A voter
must connect a Phantom wallet and sign the contest voting message to
prove control of that wallet.”, “Voting does not burn SPARKD and does
not require sending SOL.”, “There is currently no minimum SPARKD holding
requirement for voters.”, “Each wallet receives exactly one vote per
weekly contest.”, “Once a wallet has successfully voted in that weekly
contest, it cannot cast a second vote in the same contest.”, “An entrant
may not vote for their own meme. An entrant may vote for another
eligible meme in the same weekly contest.”, “A vote may only be cast for
an eligible submission belonging to that contest.”, “Signed voting
requests must be valid and fresh; expired or invalid signatures are
rejected.” ] }, { title: “6. Weekly Voter Reward”, items: [ “Each
eligible wallet that successfully casts a valid vote is automatically
entered once in the weekly voter reward drawing.”, “No purchase is
necessary to vote or to enter the voter reward drawing, and voting does
not require a SPARKD burn or SOL payment.”, “The weekly voter reward is
$5 USD worth of SOL.”, “Each eligible voting wallet receives no more
than one drawing entry per weekly contest.”, “The reward winner is
selected randomly by the server after voting closes and is separate from
the Meme of the Week winner.”, “Self-votes are prohibited and are not
eligible for the voter reward drawing.”, “Odds of winning depend on the
number of eligible voting wallets for that weekly contest.”, “The voter
reward is void where prohibited.” ] }, { title: “7. Sharing &
Campaigning”, items: [ “Entrants may share the contest and encourage
friends, followers, or other community members to vote for their meme.”,
“Every vote must still be independently cast from a wallet that
satisfies the contest voting rules.”, “Community promotion does not
override the one-wallet-one-vote rule or the prohibition on
self-voting.” ] }, { title: “8. How the Winner Is Chosen”, items: [
“When voting closes, the eligible meme with the highest verified vote
total wins.”, “If two or more eligible memes are tied, the meme
submitted earlier wins the tie.”, “A contest must have at least one
valid vote to produce a champion.”, “If a completed contest receives
zero valid votes, no artificial winner is created.”, “Winner selection
and contest rollover are performed automatically by the server-side
contest lifecycle.” ] }, { title: “9. Champion & Hall of Fame”, items: [
“The official weekly winner becomes the Meme of the Week champion.”,
“The champion may be displayed in the large winner area on the contest
page and in SPARKD’s champion displays.”, “Completed champions are
preserved in the Meme Hall of Fame / Previous Champions area.”, “The
next weekly contest is created automatically after the previous contest
is finalized.” ] }, { title: “10. Technical Validity”, items: [ “Browser
displays and countdowns are informational; the server/database is the
final authority for contest phase, submission eligibility, voting
eligibility, and winner finalization.”, “Transactions, signatures,
submissions, or votes that fail verification are not counted.”,
“Temporary wallet, Solana, Supabase, internet, or other third-party
service failures may prevent an action from completing. A user should
confirm that the site reports a successful submission or vote before
assuming it was recorded.” ] } ];

function addStyles() { if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID} {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      #${ROOT_ID} .sparkd-rules-week {
        margin: 0;
      }

      #${ROOT_ID} .sparkd-rules-button {
        appearance: none;
        border: 1px solid rgba(255, 196, 0, .55);
        background: rgba(24, 24, 28, .96);
        color: #fff;
        border-radius: 999px;
        padding: 9px 14px;
        font: inherit;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .06em;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.24);
        transition: transform .14s ease, border-color .14s ease, background .14s ease;
      }

      #${ROOT_ID} .sparkd-rules-button:hover,
      #${ROOT_ID} .sparkd-rules-button:focus-visible {
        transform: translateY(-1px);
        border-color: rgba(255, 215, 74, .95);
        background: #24242a;
        outline: none;
      }

      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 22px;
        background: rgba(0,0,0,.76);
        backdrop-filter: blur(6px);
      }

      #${MODAL_ID}.open {
        display: flex;
      }

      #${MODAL_ID} .sparkd-rules-panel {
        width: min(920px, 100%);
        max-height: min(88vh, 960px);
        overflow: auto;
        background: #111116;
        color: #f5f5f7;
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 22px;
        box-shadow: 0 24px 70px rgba(0,0,0,.55);
      }

      #${MODAL_ID} .sparkd-rules-header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px;
        background: rgba(17,17,22,.97);
        border-bottom: 1px solid rgba(255,255,255,.12);
      }

      #${MODAL_ID} .sparkd-rules-title {
        margin: 0;
        font-size: clamp(20px, 3vw, 28px);
        line-height: 1.1;
      }

      #${MODAL_ID} .sparkd-rules-close {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.18);
        background: #202027;
        color: #fff;
        font-size: 22px;
        cursor: pointer;
      }

      #${MODAL_ID} .sparkd-rules-body {
        padding: 20px;
      }

      #${MODAL_ID} .sparkd-rules-intro {
        margin: 0 0 18px;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(255, 196, 0, .08);
        border: 1px solid rgba(255, 196, 0, .24);
        line-height: 1.55;
      }

      #${MODAL_ID} .sparkd-rule-section {
        padding: 18px 0;
        border-bottom: 1px solid rgba(255,255,255,.09);
      }

      #${MODAL_ID} .sparkd-rule-section:last-child {
        border-bottom: 0;
      }

      #${MODAL_ID} .sparkd-rule-section h3 {
        margin: 0 0 12px;
        font-size: 17px;
      }

      #${MODAL_ID} .sparkd-rule-section ul {
        margin: 0;
        padding-left: 21px;
      }

      #${MODAL_ID} .sparkd-rule-section li {
        margin: 8px 0;
        line-height: 1.55;
        color: #dedee5;
      }

      #${MODAL_ID} .sparkd-rules-footer {
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(255,255,255,.045);
        color: #c8c8d0;
        font-size: 13px;
        line-height: 1.5;
      }

      @media (max-width: 640px) {
        #${MODAL_ID} {
          padding: 10px;
        }

        #${MODAL_ID} .sparkd-rules-panel {
          max-height: 94vh;
          border-radius: 16px;
        }

        #${MODAL_ID} .sparkd-rules-header,
        #${MODAL_ID} .sparkd-rules-body {
          padding: 15px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${ROOT_ID} .sparkd-rules-button {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);

}

function createModal() { if (document.getElementById(MODAL_ID)) return;

    const modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "sparkdRulesTitle");

    const panel = document.createElement("div");
    panel.className = "sparkd-rules-panel";

    const header = document.createElement("div");
    header.className = "sparkd-rules-header";

    const title = document.createElement("h2");
    title.id = "sparkdRulesTitle";
    title.className = "sparkd-rules-title";
    title.textContent = "📜 SPARKD Contest Rules";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "sparkd-rules-close";
    close.setAttribute("aria-label", "Close contest rules");
    close.textContent = "×";

    header.append(title, close);

    const body = document.createElement("div");
    body.className = "sparkd-rules-body";

    const intro = document.createElement("p");
    intro.className = "sparkd-rules-intro";
    intro.textContent =
      "These rules summarize how SPARKD Meme of the Week entries, voting, verification, and winner selection currently operate.";

    body.appendChild(intro);

    RULE_SECTIONS.forEach((section) => {
      const sectionEl = document.createElement("section");
      sectionEl.className = "sparkd-rule-section";

      const h3 = document.createElement("h3");
      h3.textContent = section.title;

      const ul = document.createElement("ul");
      section.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });

      sectionEl.append(h3, ul);
      body.appendChild(sectionEl);
    });

    const footer = document.createElement("div");
    footer.className = "sparkd-rules-footer";
    footer.textContent =
      "SPARKD may update contest rules as the contest system evolves. The rules displayed on the live contest page should be treated as the current public version.";

    body.appendChild(footer);
    panel.append(header, body);
    modal.appendChild(panel);
    document.body.appendChild(modal);

    function closeModal() {
      modal.classList.remove("open");
      document.body.style.removeProperty("overflow");
    }

    close.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        closeModal();
      }
    });

}

function openModal() { const modal = document.getElementById(MODAL_ID);
if (!modal) return;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".sparkd-rules-close")?.focus();

}

function injectButton() { if (document.getElementById(ROOT_ID)) return
true;

    const winnerWeek = document.getElementById("winnerWeek");
    const winnerDisplay = document.getElementById("winnerDisplay");

    if (!winnerWeek || !winnerDisplay) return false;

    const wrapper = document.createElement("div");
    wrapper.id = ROOT_ID;

    // Keep the existing heading exactly as-is; only wrap it so the
    // standalone Rules button can sit beside it.
    winnerWeek.parentNode.insertBefore(wrapper, winnerWeek);
    winnerWeek.classList.add("sparkd-rules-week");
    wrapper.appendChild(winnerWeek);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sparkd-rules-button";
    button.textContent = "📜 CONTEST RULES";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", MODAL_ID);
    button.addEventListener("click", openModal);

    wrapper.appendChild(button);
    return true;

}

function init() { addStyles(); createModal();

    if (!injectButton()) {
      // Allows the module to load safely even if another public module
      // renders the winner area slightly later.
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (injectButton() || tries >= 20) clearInterval(timer);
      }, 250);
    }

    window.SPARKD_CONTEST_RULES = {
      version: VERSION,
      open: openModal,
      rules: RULE_SECTIONS
    };

    console.log(`📜 SPARKD contest-rules.js v${VERSION} loaded.`);

}

if (document.readyState === “loading”) {
document.addEventListener(“DOMContentLoaded”, init, { once: true }); }
else { init(); } })();
