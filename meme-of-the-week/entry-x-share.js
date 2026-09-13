////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK — ENTRY SHARE ON X
// entry-x-share.js v1.0
//
// Adds a Share on X button to every community meme card.
// Sharing promotes the contest; official voting remains on SPARKD.
////////////////////////////////////////////////////

(() => {
    "use strict";

    const STYLE_ID = "sparkdEntryXShareStyles";
    const BUTTON_CLASS = "sparkd-entry-x-share";
    const GRID_ID = "submissionsGrid";

    function contestUrl() {
        const canonical = document.querySelector('link[rel="canonical"]')?.href;
        return canonical || window.location.href.split("#")[0];
    }

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .${BUTTON_CLASS} {
                width: 100%;
                margin-top: 12px;
                min-height: 42px;
                border: 1px solid rgba(255,255,255,.22);
                border-radius: 10px;
                background: #000;
                color: #fff;
                font: inherit;
                font-weight: 800;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: transform .14s ease, border-color .14s ease, background .14s ease;
            }

            .${BUTTON_CLASS}:hover,
            .${BUTTON_CLASS}:focus-visible {
                transform: translateY(-1px);
                border-color: rgba(255,255,255,.7);
                background: #171717;
                outline: none;
            }
        `;

        document.head.appendChild(style);
    }

    function buildShareUrl(title) {
        const cleanTitle = String(title || "SPARKD Meme").trim();
        const text = `I entered the SPARKD Meme of the Week ⚡ Vote for my meme!\n\n${cleanTitle}`;
        return (
            "https://twitter.com/intent/tweet?text=" +
            encodeURIComponent(text) +
            "&url=" +
            encodeURIComponent(contestUrl())
        );
    }

    function openShare(title) {
        const url = buildShareUrl(title);
        const width = 760;
        const height = 680;
        const left = Math.max(0, Math.round((window.screen.width - width) / 2));
        const top = Math.max(0, Math.round((window.screen.height - height) / 2));

        window.open(
            url,
            "sparkdEntryXShare",
            `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
        );
    }

    function enhanceCard(card) {
        if (!(card instanceof HTMLElement)) return;
        if (!card.classList.contains("submission-card")) return;
        if (card.querySelector(`.${BUTTON_CLASS}`)) return;

        const info = card.querySelector(".submission-info");
        if (!info) return;

        const title = card.querySelector("h3")?.textContent?.trim() || "SPARKD Meme";
        const button = document.createElement("button");

        button.type = "button";
        button.className = BUTTON_CLASS;
        button.setAttribute("aria-label", `Share ${title} on X`);
        button.innerHTML = "<span aria-hidden=\"true\">𝕏</span> Share on X";
        button.addEventListener("click", () => openShare(title));

        info.appendChild(button);
    }

    function enhanceAll() {
        const grid = document.getElementById(GRID_ID);
        if (!grid) return;

        grid.querySelectorAll(".submission-card").forEach(enhanceCard);
    }

    function initialize() {
        installStyles();
        enhanceAll();

        const grid = document.getElementById(GRID_ID);
        if (!grid) return;

        const observer = new MutationObserver(() => enhanceAll());
        observer.observe(grid, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    }
    else {
        initialize();
    }
})();
