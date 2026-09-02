/* ============================================================
   SPARKD MEME OF THE WEEK - CONTEST GUIDE
   Standalone upgrade module
   Version: v1.0
   ============================================================ */

(function () {
    "use strict";

    const MODULE_ID = "sparkdContestGuide";
    const STYLE_ID = "sparkdContestGuideStyles";

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #currentWinner { position: relative; }

            .sparkd-guide-launcher {
                position: absolute;
                left: -190px;
                top: 50%;
                transform: translateY(-50%);
                width: 155px;
                padding: 14px 12px;
                border: 1px solid rgba(0,170,255,.55);
                border-radius: 12px;
                background: linear-gradient(180deg, rgba(10,20,35,.98), rgba(3,8,18,.98));
                color: #fff;
                font: inherit;
                font-size: 14px;
                font-weight: 900;
                line-height: 1.35;
                text-align: center;
                cursor: pointer;
                box-shadow: 0 0 18px rgba(0,170,255,.22), inset 0 0 14px rgba(0,170,255,.05);
                transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
                z-index: 20;
            }

            .sparkd-guide-launcher:hover {
                transform: translateY(-50%) scale(1.04);
                border-color: rgba(0,170,255,.95);
                box-shadow: 0 0 24px rgba(0,170,255,.42), inset 0 0 16px rgba(0,170,255,.08);
            }

            .sparkd-guide-launcher span {
                display: block;
                margin-top: 5px;
                color: #8bd7ff;
                font-size: 11px;
                font-weight: 700;
            }

            .sparkd-guide-overlay {
                position: fixed;
                inset: 0;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(0,0,0,.78);
                backdrop-filter: blur(5px);
                z-index: 99999;
            }

            .sparkd-guide-overlay.is-open { display: flex; }

            .sparkd-guide-modal {
                position: relative;
                width: min(720px, 100%);
                max-height: 88vh;
                overflow-y: auto;
                padding: 28px;
                border: 1px solid rgba(0,170,255,.45);
                border-radius: 18px;
                background: radial-gradient(circle at top, rgba(0,126,255,.12), transparent 40%), #07101d;
                color: #fff;
                box-shadow: 0 20px 70px rgba(0,0,0,.65);
            }

            .sparkd-guide-close {
                position: absolute;
                top: 12px;
                right: 14px;
                width: 38px;
                height: 38px;
                border: 0;
                border-radius: 50%;
                background: rgba(255,255,255,.08);
                color: #fff;
                font-size: 24px;
                cursor: pointer;
            }

            .sparkd-guide-title {
                margin: 0 42px 6px 0;
                font-size: clamp(24px, 4vw, 34px);
                font-weight: 900;
            }

            .sparkd-guide-subtitle {
                margin: 0 0 22px;
                color: #b8c7d9;
                line-height: 1.55;
            }

            .sparkd-guide-steps {
                display: grid;
                gap: 12px;
                margin: 0 0 22px;
                padding: 0;
                list-style: none;
                counter-reset: sparkdGuideStep;
            }

            .sparkd-guide-step {
                position: relative;
                min-height: 56px;
                padding: 14px 14px 14px 62px;
                border: 1px solid rgba(255,255,255,.09);
                border-radius: 12px;
                background: rgba(255,255,255,.035);
                line-height: 1.48;
                counter-increment: sparkdGuideStep;
            }

            .sparkd-guide-step::before {
                content: counter(sparkdGuideStep);
                position: absolute;
                left: 14px;
                top: 13px;
                display: grid;
                place-items: center;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: #00aaff;
                color: #00101a;
                font-weight: 1000;
            }

            .sparkd-guide-note {
                margin: 0 0 20px;
                padding: 14px;
                border-left: 3px solid #ff9d00;
                border-radius: 8px;
                background: rgba(255,157,0,.08);
                color: #e9edf2;
                line-height: 1.5;
            }

            .sparkd-guide-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }

            .sparkd-guide-action {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 46px;
                padding: 0 18px;
                border: 0;
                border-radius: 999px;
                background: linear-gradient(135deg, #00aaff, #006dff);
                color: #fff;
                text-decoration: none;
                font: inherit;
                font-weight: 900;
                cursor: pointer;
            }

            .sparkd-guide-action.secondary {
                background: rgba(255,255,255,.09);
                border: 1px solid rgba(255,255,255,.14);
            }

            @media (max-width: 1100px) {
                .sparkd-guide-launcher {
                    position: static;
                    transform: none;
                    display: block;
                    width: min(320px, calc(100% - 30px));
                    margin: 0 auto 18px;
                }
                .sparkd-guide-launcher:hover { transform: scale(1.02); }
            }

            @media (max-width: 600px) {
                .sparkd-guide-modal { padding: 22px 16px; }
                .sparkd-guide-step { padding-left: 56px; }
                .sparkd-guide-actions { flex-direction: column; }
                .sparkd-guide-action { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }

    function buildGuide() {
        if (document.getElementById(MODULE_ID)) return;

        const winnerSection = document.getElementById("currentWinner");
        if (!winnerSection) {
            console.warn("⚠️ SPARKD Contest Guide: #currentWinner not found.");
            return;
        }

        installStyles();

        const launcher = document.createElement("button");
        launcher.type = "button";
        launcher.className = "sparkd-guide-launcher";
        launcher.innerHTML = '📘 HOW TO ENTER<span>Create + submit your weekly meme</span>';

        const overlay = document.createElement("div");
        overlay.id = MODULE_ID;
        overlay.className = "sparkd-guide-overlay";
        overlay.setAttribute("aria-hidden", "true");

        overlay.innerHTML = `
            <div class="sparkd-guide-modal" role="dialog" aria-modal="true" aria-labelledby="sparkdGuideTitle">
                <button type="button" class="sparkd-guide-close" aria-label="Close contest guide">×</button>

                <h2 id="sparkdGuideTitle" class="sparkd-guide-title">🔥 How to Enter Meme of the Week</h2>

                <p class="sparkd-guide-subtitle">
                    Create your meme in SPARKD Meme Forge, download the official Forge PNG,
                    then submit it here during the active submission window.
                </p>

                <ol class="sparkd-guide-steps">
                    <li class="sparkd-guide-step"><strong>Open Meme Forge.</strong> Upload an image, add your text or emojis, and finish your meme.</li>
                    <li class="sparkd-guide-step"><strong>Download the finished meme.</strong> Use the Forge download button so you keep the official SPARKD Forge PNG data required by the contest.</li>
                    <li class="sparkd-guide-step"><strong>Return to Meme of the Week.</strong> Connect the Phantom wallet you want to use for your contest entry.</li>
                    <li class="sparkd-guide-step"><strong>Click “ENTER MEME OF THE WEEK.”</strong> Select your downloaded SPARKD Forge PNG and give the meme a title.</li>
                    <li class="sparkd-guide-step"><strong>Submit and approve the entry burn.</strong> Your wallet must hold at least 2,000 SPARKD. Phantom will show the required 2,000 SPARKD contest-entry burn for you to approve.</li>
                    <li class="sparkd-guide-step"><strong>Wait for confirmation.</strong> Do not close the page while the entry is being verified. Once successful, your meme is entered into the current weekly contest.</li>
                </ol>

                <p class="sparkd-guide-note">
                    ⚠️ Only approve the transaction if Phantom shows exactly what you expect.
                    The contest submission engine verifies the Forge meme and entry burn before finalizing the submission.
                </p>

                <div class="sparkd-guide-actions">
                    <a class="sparkd-guide-action" href="../meme-forge/">⚡ OPEN MEME FORGE</a>
                    <button type="button" class="sparkd-guide-action secondary sparkd-guide-done">GOT IT</button>
                </div>
            </div>
        `;

        function openGuide() {
            overlay.classList.add("is-open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }

        function closeGuide() {
            overlay.classList.remove("is-open");
            overlay.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }

        launcher.addEventListener("click", openGuide);
        overlay.querySelector(".sparkd-guide-close").addEventListener("click", closeGuide);
        overlay.querySelector(".sparkd-guide-done").addEventListener("click", closeGuide);
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeGuide();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && overlay.classList.contains("is-open")) closeGuide();
        });

        winnerSection.insertBefore(launcher, winnerSection.firstChild);
        document.body.appendChild(overlay);

        console.log("📘 SPARKD Contest Guide v1.0 ready.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildGuide, { once: true });
    } else {
        buildGuide();
    }
})();
