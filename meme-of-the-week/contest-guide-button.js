/* SPARKD Contest Guide Button v1.0
   Adds a direct-link button beside the current winner box.
   The guide itself is a separate page, not a popup.
*/
(function () {
    "use strict";

    function install() {
        const winnerSection = document.getElementById("currentWinner");
        if (!winnerSection || document.getElementById("sparkdContestGuideLink")) return;

        if (!document.getElementById("sparkdContestGuideButtonStyles")) {
            const style = document.createElement("style");
            style.id = "sparkdContestGuideButtonStyles";
            style.textContent = `
                #currentWinner { position: relative; }

                .sparkd-contest-guide-link {
                    position: absolute;
                    left: -160px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 150px;
                    padding: 14px 10px;
                    border: 1px solid rgba(0,170,255,.55);
                    border-radius: 12px;
                    background: #07101d;
                    color: #fff;
                    text-decoration: none;
                    font-weight: 900;
                    font-size: 14px;
                    line-height: 1.35;
                    text-align: center;
                    box-shadow: 0 0 18px rgba(0,170,255,.22);
                    z-index: 20;
                }

                .sparkd-contest-guide-link span {
                    display: block;
                    margin-top: 5px;
                    color: #8bd7ff;
                    font-size: 11px;
                    font-weight: 700;
                }

                .sparkd-contest-guide-link:hover {
                    box-shadow: 0 0 24px rgba(0,170,255,.42);
                }

                @media (max-width: 1100px) {
                    .sparkd-contest-guide-link {
                        position: static;
                        display: block;
                        transform: none;
                        width: min(320px, calc(100% - 30px));
                        margin: 0 auto 18px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const link = document.createElement("a");
        link.id = "sparkdContestGuideLink";
        link.className = "sparkd-contest-guide-link";
        link.href = "contest-guide.html";
        link.innerHTML = '📘 HOW TO ENTER<span>Create + submit your weekly meme</span>';

        winnerSection.insertBefore(link, winnerSection.firstChild);

        console.log("📘 SPARKD Contest Guide direct-link button ready.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
