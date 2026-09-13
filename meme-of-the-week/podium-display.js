(() => {
  "use strict";

  const VERSION = "1.0";
  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-winner-health";
  const HOST_ID = "podiumRunnersUp";
  const STYLE_ID = "sparkdPodiumDisplayStyles";
  const REFRESH_MS = 5 * 60 * 1000;

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function imageUrl(value) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return `https://uxpbgzksfizkyxubctep.supabase.co/storage/v1/object/public/sparkd-contest-submissions/${String(value).replace(/^\/+/, "")}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${HOST_ID} {
        width: min(760px, 100%);
        margin: 16px auto 4px;
      }

      #${HOST_ID}[hidden] { display: none !important; }

      #${HOST_ID} .sparkd-podium-label {
        margin: 0 0 10px;
        text-align: center;
        font-weight: 900;
        letter-spacing: .08em;
        opacity: .9;
      }

      #${HOST_ID} .sparkd-podium-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      #${HOST_ID} .sparkd-podium-card {
        appearance: none;
        width: 100%;
        padding: 10px;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 14px;
        background: rgba(0,0,0,.32);
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }

      #${HOST_ID} .sparkd-podium-card:hover,
      #${HOST_ID} .sparkd-podium-card:focus-visible {
        transform: translateY(-2px);
        border-color: rgba(255,185,55,.75);
        box-shadow: 0 0 24px rgba(255,140,0,.2);
        outline: none;
      }

      #${HOST_ID} .sparkd-podium-thumb-wrap {
        height: 150px;
        border-radius: 10px;
        overflow: hidden;
        background: rgba(255,255,255,.04);
      }

      #${HOST_ID} .sparkd-podium-thumb {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }

      #${HOST_ID} .sparkd-podium-place {
        margin-top: 9px;
        font-size: .9rem;
        font-weight: 900;
      }

      #${HOST_ID} .sparkd-podium-title {
        margin-top: 4px;
        font-size: .95rem;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${HOST_ID} .sparkd-podium-votes {
        margin-top: 3px;
        font-size: .8rem;
        opacity: .72;
      }

      .sparkd-podium-lightbox {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(0,0,0,.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .sparkd-podium-lightbox[hidden] { display: none !important; }

      .sparkd-podium-lightbox-panel {
        position: relative;
        width: min(920px, 96vw);
        max-height: 92vh;
        overflow: auto;
        padding: 16px;
        border: 1px solid rgba(255,185,55,.5);
        border-radius: 18px;
        background: #0b0b0b;
        box-shadow: 0 0 50px rgba(255,140,0,.25);
      }

      .sparkd-podium-lightbox-image {
        display: block;
        width: 100%;
        max-height: 75vh;
        object-fit: contain;
        border-radius: 12px;
        background: #000;
      }

      .sparkd-podium-lightbox-meta {
        padding: 12px 4px 2px;
        text-align: center;
      }

      .sparkd-podium-lightbox-meta strong {
        display: block;
        font-size: 1.15rem;
      }

      .sparkd-podium-close {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 2;
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 999px;
        background: rgba(0,0,0,.75);
        color: #fff;
        font-size: 1.4rem;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        #${HOST_ID} .sparkd-podium-grid { gap: 8px; }
        #${HOST_ID} .sparkd-podium-thumb-wrap { height: 112px; }
        #${HOST_ID} .sparkd-podium-card { padding: 8px; }
        #${HOST_ID} .sparkd-podium-title { font-size: .84rem; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLightbox() {
    let box = document.getElementById("sparkdPodiumLightbox");
    if (box) return box;

    box = document.createElement("div");
    box.id = "sparkdPodiumLightbox";
    box.className = "sparkd-podium-lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Podium winner meme preview");
    box.innerHTML = `
      <div class="sparkd-podium-lightbox-panel">
        <button type="button" class="sparkd-podium-close" aria-label="Close preview">×</button>
        <img class="sparkd-podium-lightbox-image" alt="">
        <div class="sparkd-podium-lightbox-meta"></div>
      </div>
    `;

    const close = () => {
      box.hidden = true;
      document.body.style.overflow = "";
    };

    box.querySelector(".sparkd-podium-close")?.addEventListener("click", close);
    box.addEventListener("click", (event) => { if (event.target === box) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !box.hidden) close(); });
    document.body.appendChild(box);
    return box;
  }

  function openLightbox(item) {
    const box = ensureLightbox();
    const img = box.querySelector(".sparkd-podium-lightbox-image");
    const meta = box.querySelector(".sparkd-podium-lightbox-meta");
    const url = imageUrl(item.meme_image_url);
    if (img) {
      img.src = url;
      img.alt = `${item.place === 2 ? "Second" : "Third"} place: ${item.meme_title || "Meme winner"}`;
    }
    if (meta) {
      meta.innerHTML = `<strong>${item.place === 2 ? "🥈 2nd Place" : "🥉 3rd Place"} — ${esc(item.meme_title || "Meme winner")}</strong><span>${Number(item.vote_count || 0)} votes</span>`;
    }
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  async function fetchLatest() {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check_latest_completed" }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) throw new Error(data?.error || `Podium fetch failed (${response.status})`);
    return data;
  }

  function render(data) {
    const host = document.getElementById(HOST_ID);
    if (!host) return;

    const podium = Array.isArray(data?.podium) ? data.podium.filter((x) => x && (x.place === 2 || x.place === 3)) : [];
    if (data?.state !== "winner_checked" || podium.length === 0) {
      host.hidden = true;
      host.replaceChildren();
      return;
    }

    host.innerHTML = `
      <div class="sparkd-podium-label">🥈 2ND &amp; 🥉 3RD PLACE</div>
      <div class="sparkd-podium-grid"></div>
    `;

    const grid = host.querySelector(".sparkd-podium-grid");
    podium.sort((a, b) => a.place - b.place).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sparkd-podium-card";
      const url = imageUrl(item.meme_image_url);
      button.innerHTML = `
        <div class="sparkd-podium-thumb-wrap">
          ${url ? `<img class="sparkd-podium-thumb" src="${esc(url)}" alt="${esc(item.meme_title || "Podium meme")}" loading="lazy" decoding="async">` : ""}
        </div>
        <div class="sparkd-podium-place">${item.place === 2 ? "🥈 2nd Place" : "🥉 3rd Place"}</div>
        <div class="sparkd-podium-title">${esc(item.meme_title || "Meme winner")}</div>
        <div class="sparkd-podium-votes">${Number(item.vote_count || 0)} votes · Click to expand</div>
      `;
      button.addEventListener("click", () => openLightbox(item));
      grid?.appendChild(button);
    });

    host.hidden = false;
  }

  async function refresh() {
    try {
      const data = await fetchLatest();
      render(data);
      return data;
    } catch (error) {
      console.error("❌ SPARKD podium display failed:", error);
      const host = document.getElementById(HOST_ID);
      if (host) host.hidden = true;
      return null;
    }
  }

  function start() {
    injectStyles();
    ensureLightbox();
    refresh();
    window.setInterval(refresh, REFRESH_MS);
    console.log(`🏅 SPARKD podium-display.js v${VERSION} loaded.`);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  window.SPARKD_PODIUM_DISPLAY = { refresh, version: VERSION };
})();
