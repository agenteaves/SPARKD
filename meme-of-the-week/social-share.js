////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK — FLOATING SOCIAL SHARE
// social-share.js v1.1
//
// Standalone frontend module.
// Does NOT modify contest-submit.js, voting, lifecycle,
// winner selection, or any Supabase write path.
//
// INSTALL:
// <script src="social-share.js"></script>
////////////////////////////////////////////////////

(() => {
  "use strict";

  const VERSION = "1.1";
  const ROOT_ID = "sparkdSocialShare";
  const STYLE_ID = "sparkdSocialShareStyles";
  const TOAST_ID = "sparkdShareToast";

  const PAGE_URL = () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    return canonical || window.location.href.split("#")[0];
  };

  const clean = (value) => String(value || "").trim();

  function currentShareContext() {
    const winnerName = clean(document.getElementById("winnerName")?.textContent);
    const winnerWeek = clean(document.getElementById("winnerWeek")?.textContent);

    const hasWinner =
      winnerName &&
      !/awaiting champion/i.test(winnerName) &&
      !/no champion/i.test(winnerName);

    const title = hasWinner
      ? `🏆 ${winnerName} — SPARKD Meme of the Week`
      : "🔥 SPARKD Meme of the Week";

    const text = hasWinner
      ? `Check out ${winnerName}, the ${winnerWeek || "current"} SPARKD Meme of the Week champion!`
      : "Check out the SPARKD Meme of the Week contest — submit, vote, and see the weekly champion.";

    const winnerImage =
      document.querySelector("#winnerDisplay img")?.src ||
      document.querySelector("#currentWinner img")?.src ||
      "";

    const ogImage =
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('meta[name="twitter:image"]')?.content ||
      "";

    return {
      url: PAGE_URL(),
      title,
      text,
      image: winnerImage || ogImage
    };
  }

  function enc(value) {
    return encodeURIComponent(value);
  }

  function openPopup(url) {
    const width = 760;
    const height = 680;
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 2));

    window.open(
      url,
      "sparkdShareWindow",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
    );
  }

  function toast(message) {
    let el = document.getElementById(TOAST_ID);

    if (!el) {
      el = document.createElement("div");
      el.id = TOAST_ID;
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.classList.remove("show");
    }, 2200);
  }

  async function copyLink() {
    const { url } = currentShareContext();

    try {
      await navigator.clipboard.writeText(url);
      toast("✅ Contest link copied");
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand("copy");
        toast("✅ Contest link copied");
      } catch {
        toast("Copy failed — use your browser address bar.");
      } finally {
        input.remove();
      }
    }
  }

  async function nativeShare() {
    const ctx = currentShareContext();

    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: ctx.title,
        text: ctx.text,
        url: ctx.url
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast("Unable to open device sharing.");
      }
    }
  }

  function shareMastodon() {
    const ctx = currentShareContext();

    let instance =
      localStorage.getItem("sparkdMastodonInstance") ||
      "mastodon.social";

    const answer = window.prompt(
      "Enter your Mastodon instance (example: mastodon.social):",
      instance
    );

    if (!answer) return;

    instance = answer
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(instance)) {
      toast("That Mastodon instance does not look valid.");
      return;
    }

    localStorage.setItem("sparkdMastodonInstance", instance);

    const text = `${ctx.text}\n\n${ctx.url}`;
    openPopup(`https://${instance}/share?text=${enc(text)}`);
  }

  function shareUrl(network) {
    const ctx = currentShareContext();
    const message = `${ctx.text} ${ctx.url}`;

    switch (network) {
      case "x":
        return `https://twitter.com/intent/tweet?text=${enc(ctx.text)}&url=${enc(ctx.url)}`;

      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${enc(ctx.url)}`;

      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(ctx.url)}`;

      case "reddit":
        return `https://www.reddit.com/submit?url=${enc(ctx.url)}&title=${enc(ctx.title)}`;

      case "bluesky":
        return `https://bsky.app/intent/compose?text=${enc(message)}`;

      case "telegram":
        return `https://t.me/share/url?url=${enc(ctx.url)}&text=${enc(ctx.text)}`;

      case "whatsapp":
        return `https://wa.me/?text=${enc(message)}`;

      case "pinterest": {
        let url =
          `https://www.pinterest.com/pin/create/button/?url=${enc(ctx.url)}` +
          `&description=${enc(ctx.text)}`;

        if (ctx.image) {
          url += `&media=${enc(ctx.image)}`;
        }

        return url;
      }

      case "tumblr":
        return (
          `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${enc(ctx.url)}` +
          `&title=${enc(ctx.title)}&caption=${enc(ctx.text)}&posttype=link`
        );

      case "line":
        return (
          `https://social-plugins.line.me/lineit/share?url=${enc(ctx.url)}` +
          `&text=${enc(ctx.text)}`
        );

      case "email":
        return (
          `mailto:?subject=${enc(ctx.title)}` +
          `&body=${enc(`${ctx.text}\n\n${ctx.url}`)}`
        );

      case "sms":
        return `sms:?&body=${enc(`${ctx.text}\n${ctx.url}`)}`;

      default:
        return "";
    }
  }

  const platforms = [
    { id: "native", label: "Share", icon: "↗", action: nativeShare, mobileFirst: true },
    { id: "x", label: "X", icon: "𝕏" },
    { id: "facebook", label: "Facebook", icon: "f" },
    { id: "linkedin", label: "LinkedIn", icon: "in" },
    { id: "reddit", label: "Reddit", icon: "●" },
    { id: "bluesky", label: "Bluesky", icon: "🦋" },
    { id: "telegram", label: "Telegram", icon: "➤" },
    { id: "whatsapp", label: "WhatsApp", icon: "☎" },
    { id: "pinterest", label: "Pinterest", icon: "P" },
    { id: "tumblr", label: "Tumblr", icon: "t" },
    { id: "line", label: "LINE", icon: "LINE" },
    { id: "mastodon", label: "Mastodon", icon: "M", action: shareMastodon },
    { id: "email", label: "Email", icon: "✉", direct: true },
    { id: "sms", label: "Text message", icon: "💬", direct: true },
    { id: "copy", label: "Copy link", icon: "🔗", action: copyLink }
  ];

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 99990;
        font-family: Arial, Helvetica, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 7px;
        pointer-events: none;
      }

      #${ROOT_ID} .sparkd-share-heading {
        pointer-events: auto;
        background: rgba(15, 15, 18, .96);
        border: 1px solid rgba(255,255,255,.16);
        color: #fff;
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .1em;
        box-shadow: 0 10px 30px rgba(0,0,0,.28);
        user-select: none;
      }

      #${ROOT_ID} .sparkd-share-stack {
        display: flex;
        flex-direction: column;
        gap: 6px;
        pointer-events: auto;
        max-height: calc(100vh - 120px);
        overflow-y: auto;
        padding: 2px;
        scrollbar-width: none;
      }

      #${ROOT_ID} .sparkd-share-stack::-webkit-scrollbar {
        display: none;
      }

      #${ROOT_ID} .sparkd-share-btn {
        width: 46px;
        height: 46px;
        padding: 0;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(15, 15, 18, .95);
        color: #fff;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        font: inherit;
        font-size: 16px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.24);
        transition:
          transform .14s ease,
          border-color .14s ease,
          background .14s ease;
        text-decoration: none;
        user-select: none;
      }

      #${ROOT_ID} .sparkd-share-btn:hover,
      #${ROOT_ID} .sparkd-share-btn:focus-visible {
        transform: translateX(-5px) scale(1.05);
        border-color: rgba(255,255,255,.5);
        background: #222229;
        outline: none;
      }

      /* Recognizable platform treatments */
      #${ROOT_ID} .sparkd-share-btn[data-network="x"] {
        background: #000000; color: #ffffff;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="facebook"] {
        background: #1877F2; color: #ffffff;
        font-size: 27px; font-weight: 900;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="linkedin"] {
        background: #0A66C2; color: #ffffff; font-size: 15px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="reddit"] {
        background: #FF4500; color: #ffffff; font-size: 14px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="bluesky"] {
        background: #1185FE; color: #ffffff;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="telegram"] {
        background: #229ED9; color: #ffffff; font-size: 21px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="whatsapp"] {
        background: #25D366; color: #ffffff; font-size: 20px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="pinterest"] {
        background: #E60023; color: #ffffff; font-size: 22px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="tumblr"] {
        background: #36465D; color: #ffffff; font-size: 23px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="line"] {
        background: #06C755; color: #ffffff; font-size: 11px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="mastodon"] {
        background: #6364FF; color: #ffffff; font-size: 20px;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="email"] {
        background: #555B66; color: #ffffff;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="sms"] {
        background: #34C759; color: #ffffff;
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="native"] {
        background: #202027; color: #ffffff;
        border-color: rgba(137,247,161,.55);
      }
      #${ROOT_ID} .sparkd-share-btn[data-network="copy"] {
        background: #202027; color: #ffffff;
        border-color: rgba(255,209,102,.5);
      }
      #${ROOT_ID} .sparkd-share-btn:hover,
      #${ROOT_ID} .sparkd-share-btn:focus-visible {
        filter: brightness(1.12);
      }

      #${TOAST_ID} {
        position: fixed;
        right: 74px;
        top: 50%;
        transform: translateY(-50%) translateX(12px);
        z-index: 99999;
        background: #151519;
        color: #fff;
        border: 1px solid #34343c;
        border-radius: 12px;
        padding: 10px 13px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 13px;
        font-weight: 700;
        opacity: 0;
        pointer-events: none;
        transition: opacity .16s ease, transform .16s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
      }

      #${TOAST_ID}.show {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }

      @media (max-width: 760px) {
        #${ROOT_ID} {
          right: 8px;
          top: auto;
          bottom: 10px;
          transform: none;
          align-items: flex-end;
        }

        #${ROOT_ID} .sparkd-share-heading {
          font-size: 9px;
          padding: 6px 8px;
        }

        #${ROOT_ID} .sparkd-share-stack {
          max-height: 54vh;
        }

        #${ROOT_ID} .sparkd-share-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          font-size: 14px;
        }

        #${TOAST_ID} {
          right: 62px;
          top: auto;
          bottom: 18px;
          transform: translateX(12px);
        }

        #${TOAST_ID}.show {
          transform: translateX(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${ROOT_ID} .sparkd-share-btn,
        #${TOAST_ID} {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function makeButton(platform) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sparkd-share-btn";
    button.dataset.network = platform.id;
    button.setAttribute("aria-label", `Share on ${platform.label}`);
    button.setAttribute("title", platform.label);
    button.textContent = platform.icon;

    button.addEventListener("click", async () => {
      if (platform.action) {
        await platform.action();
        return;
      }

      const url = shareUrl(platform.id);
      if (!url) return;

      if (platform.direct) {
        window.location.href = url;
      } else {
        openPopup(url);
      }
    });

    return button;
  }

  function build() {
    if (document.getElementById(ROOT_ID)) return;

    addStyles();

    const root = document.createElement("aside");
    root.id = ROOT_ID;
    root.setAttribute("aria-label", "Share SPARKD Meme of the Week");

    const heading = document.createElement("div");
    heading.className = "sparkd-share-heading";
    heading.textContent = "SHARE SPARKD";

    const stack = document.createElement("div");
    stack.className = "sparkd-share-stack";

    platforms.forEach((platform) => {
      stack.appendChild(makeButton(platform));
    });

    root.append(heading, stack);
    document.body.appendChild(root);

    // Hide native share button where Web Share API is unavailable.
    const native = root.querySelector('[data-network="native"]');
    if (native && !navigator.share) {
      native.style.display = "none";
    }

    window.SPARKD_SOCIAL_SHARE = {
      version: VERSION,
      context: currentShareContext,
      copyLink,
      nativeShare
    };

    console.log(`📣 SPARKD social-share.js v${VERSION} loaded.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build, { once: true });
  } else {
    build();
  }
})();
