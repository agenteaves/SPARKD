/*
  SPARKD Sitewide Responsive Helper
  ---------------------------------
  Purpose:
  - Improve layout on iPhone, Android phones, tablets, and small laptops.
  - Safe to load on any SPARKD page.
  - Does not change application logic or backend behavior.

  IMPORTANT:
  This file must be included by a page before it can affect that page.
  It is intentionally standalone so no existing SPARKD files need to be edited here.
*/

(() => {
  "use strict";

  const STYLE_ID = "sparkd-sitewide-responsive";
  if (document.getElementById(STYLE_ID)) return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
    document.head.appendChild(meta);
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    :root {
      --sparkd-safe-top: env(safe-area-inset-top, 0px);
      --sparkd-safe-right: env(safe-area-inset-right, 0px);
      --sparkd-safe-bottom: env(safe-area-inset-bottom, 0px);
      --sparkd-safe-left: env(safe-area-inset-left, 0px);
      --sparkd-mobile-gutter: clamp(12px, 3vw, 24px);
    }

    html {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }

    body {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      margin-left: auto;
      margin-right: auto;
      padding-left: max(var(--sparkd-safe-left), 0px);
      padding-right: max(var(--sparkd-safe-right), 0px);
    }

    *, *::before, *::after {
      box-sizing: border-box;
      min-width: 0;
    }

    img,
    picture,
    video,
    canvas,
    svg,
    iframe {
      max-width: 100%;
    }

    img,
    video,
    canvas {
      height: auto;
    }

    input,
    textarea,
    select,
    button {
      max-width: 100%;
      font: inherit;
    }

    input,
    textarea,
    select {
      font-size: max(16px, 1em);
    }

    textarea {
      resize: vertical;
    }

    pre,
    code {
      max-width: 100%;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    table {
      max-width: 100%;
    }

    a,
    button,
    [role="button"] {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    @media (max-width: 1024px) {
      body {
        padding-bottom: max(var(--sparkd-safe-bottom), 0px);
      }

      main,
      section,
      article,
      header,
      footer,
      nav {
        max-width: 100%;
      }

      .container,
      .wrapper,
      .content,
      .page,
      .page-content,
      .main-content,
      .site-content {
        width: min(100%, 100vw);
        max-width: 100%;
      }

      .grid,
      [class*="grid"] {
        max-width: 100%;
      }

      [style*="width: 1000px"],
      [style*="width:1000px"],
      [style*="width: 1080px"],
      [style*="width:1080px"],
      [style*="width: 1200px"],
      [style*="width:1200px"] {
        width: 100% !important;
        max-width: 100% !important;
      }
    }

    @media (max-width: 768px) {
      body {
        font-size: 16px;
      }

      h1 {
        font-size: clamp(1.75rem, 8vw, 2.6rem);
        line-height: 1.05;
        overflow-wrap: anywhere;
      }

      h2 {
        font-size: clamp(1.4rem, 6vw, 2rem);
        line-height: 1.1;
        overflow-wrap: anywhere;
      }

      h3 {
        font-size: clamp(1.15rem, 5vw, 1.5rem);
        overflow-wrap: anywhere;
      }

      p,
      li,
      label,
      small {
        overflow-wrap: anywhere;
      }

      nav,
      .nav,
      .navbar,
      .nav-links,
      .menu,
      .toolbar,
      .controls,
      .actions,
      .button-row,
      .button-group {
        flex-wrap: wrap;
      }

      button,
      .button,
      .btn,
      input[type="button"],
      input[type="submit"] {
        min-height: 44px;
      }

      input,
      textarea,
      select {
        min-height: 44px;
      }

      .modal,
      .dialog,
      [role="dialog"] {
        max-width: calc(100vw - (var(--sparkd-mobile-gutter) * 2));
      }

      .card,
      [class*="card"],
      .panel,
      [class*="panel"] {
        max-width: 100%;
      }

      canvas {
        display: block;
        max-width: 100% !important;
      }
    }

    @media (max-width: 480px) {
      :root {
        --sparkd-mobile-gutter: 12px;
      }

      body {
        width: 100%;
      }

      button,
      .button,
      .btn {
        white-space: normal;
      }

      .row,
      [class*="row"] {
        max-width: 100%;
      }

      iframe {
        width: 100%;
      }
    }

    @media (hover: none) and (pointer: coarse) {
      button,
      a,
      input,
      select,
      textarea,
      [role="button"] {
        touch-action: manipulation;
      }
    }

    @media (orientation: landscape) and (max-height: 500px) {
      .modal,
      .dialog,
      [role="dialog"] {
        max-height: 92dvh;
        overflow-y: auto;
      }
    }

    @supports (height: 100dvh) {
      .full-height,
      .fullscreen,
      [class*="full-screen"],
      [class*="fullscreen"] {
        min-height: 100dvh;
      }
    }
  `;

  document.head.appendChild(style);

  document.documentElement.classList.add("sparkd-responsive-ready");
  window.dispatchEvent(new CustomEvent("sparkd:responsive-ready"));
})();
