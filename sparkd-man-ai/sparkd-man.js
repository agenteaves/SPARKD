(() => {
  "use strict";

  const cfg = window.SPARKD_MAN_CONFIG || {};
  const ENDPOINT = cfg.endpoint;
  const WAKE = String(cfg.wakePhrase || "hey spark").toLowerCase();
  const FOLLOW_UP_MS = Number(cfg.followUpWindowMs || 15000);
  const MAX_HISTORY = Number(cfg.maxHistoryMessages || 6);
  const HERO = "data:image/webp;base64,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";

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let voiceEnabled = false;
  let listening = false;
  let speaking = false;
  let awakeUntil = 0;
  let followTimer = null;
  let history = [];

  function makeUi() {
    const meme = document.querySelector(".meme-of-week");
    if (!meme || document.getElementById("sparkdManAi")) return null;

    const stage = document.createElement("div");
    stage.className = "sparkd-man-stage";
    meme.parentNode.insertBefore(stage, meme);
    stage.appendChild(meme);

    const root = document.createElement("aside");
    root.id = "sparkdManAi";
    root.className = "sparkd-man-ai";
    root.setAttribute("aria-label", "SPARKD Man AI voice assistant");

    const img = document.createElement("img");
    img.className = "sparkd-man-figure";
    img.src = HERO;
    img.alt = "SPARKD Man superhero";

    const bubble = document.createElement("div");
    bubble.className = "sparkd-man-bubble";

    const name = document.createElement("div");
    name.className = "sparkd-man-name";
    name.textContent = "⚡ SPARKD MAN";

    const status = document.createElement("div");
    status.className = "sparkd-man-status";
    status.textContent = Recognition
      ? "Standing by. Enable voice, then say “Hey Spark.”"
      : "Voice recognition is unavailable in this browser. You can still type to me.";

    bubble.append(name, status);

    const controls = document.createElement("div");
    controls.className = "sparkd-man-controls";

    const enable = document.createElement("button");
    enable.type = "button";
    enable.className = "sparkd-man-control";
    enable.textContent = Recognition ? "🎙️ ENABLE HEY SPARK" : "🎙️ VOICE UNAVAILABLE";

    const talk = document.createElement("button");
    talk.type = "button";
    talk.className = "sparkd-man-control";
    talk.textContent = "⚡ TALK TO SPARK";

    controls.append(enable, talk);

    const textRow = document.createElement("form");
    textRow.className = "sparkd-man-text-row";

    const input = document.createElement("input");
    input.className = "sparkd-man-text";
    input.type = "text";
    input.maxLength = 500;
    input.placeholder = "Ask SPARKD Man…";
    input.setAttribute("aria-label", "Ask SPARKD Man");

    const send = document.createElement("button");
    send.className = "sparkd-man-send";
    send.type = "submit";
    send.textContent = "➤";
    send.setAttribute("aria-label", "Send question to SPARKD Man");

    textRow.append(input, send);

    const note = document.createElement("p");
    note.className = "sparkd-man-note";
    note.textContent = "Voice works while this page is open. SPARKD Man can explain the project and contest, but he cannot move funds or give financial advice.";

    root.append(img, bubble, controls, textRow, note);
    stage.appendChild(root);

    return { root, status, enable, talk, input, textRow };
  }

  function setStatus(ui, text) {
    ui.status.textContent = text;
  }

  function setAwake(ui, awake) {
    ui.root.classList.toggle("is-awake", awake);
    if (!awake) awakeUntil = 0;
  }

  function chooseVoice() {
    const voices = speechSynthesis.getVoices().filter(v => /^en(-|_)/i.test(v.lang || ""));
    return voices.find(v => /google us english|microsoft david|daniel|alex|male/i.test(v.name || "")) || voices[0] || null;
  }

  function pauseRecognition() {
    if (recognition && listening) {
      try { recognition.stop(); } catch (_) {}
    }
  }

  function resumeRecognition(ui) {
    if (!voiceEnabled || speaking || !recognition || listening) return;
    try {
      recognition.start();
      ui.enable.classList.add("is-live");
    } catch (_) {}
  }

  function speak(ui, text, after) {
    if (!("speechSynthesis" in window)) {
      if (after) after();
      return;
    }

    speechSynthesis.cancel();
    pauseRecognition();
    speaking = true;
    ui.root.classList.add("is-speaking");

    const u = new SpeechSynthesisUtterance(text);
    const voice = chooseVoice();
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.pitch = 0.72;
    u.volume = 1;

    const done = () => {
      speaking = false;
      ui.root.classList.remove("is-speaking");
      if (after) after();
      resumeRecognition(ui);
    };

    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  }

  function armFollowUp(ui) {
    clearTimeout(followTimer);
    awakeUntil = Date.now() + FOLLOW_UP_MS;
    setAwake(ui, true);
    followTimer = setTimeout(() => {
      if (!speaking && Date.now() >= awakeUntil) {
        setAwake(ui, false);
        setStatus(ui, voiceEnabled
          ? "Standing by. Say “Hey Spark” when you need me."
          : "Standing by. Enable voice, then say “Hey Spark.”");
      }
    }, FOLLOW_UP_MS + 250);
  }

  function wake(ui, directQuestion = "") {
    armFollowUp(ui);
    if (directQuestion.trim()) {
      ask(ui, directQuestion.trim());
      return;
    }
    const line = "SPARKD MAN ONLINE! State your mission, citizen!";
    setStatus(ui, line);
    speak(ui, line, () => {
      setStatus(ui, "Listening for your question…");
      armFollowUp(ui);
    });
  }

  function addHistory(role, text) {
    history.push({ role, text: String(text).slice(0, 500) });
    history = history.slice(-MAX_HISTORY);
  }

  async function ask(ui, question) {
    const q = String(question || "").trim();
    if (!q) return;

    if (/^(sleep|stand down|go to sleep)$/i.test(q)) {
      clearTimeout(followTimer);
      setAwake(ui, false);
      setStatus(ui, "Standing down. Say “Hey Spark” when duty calls.");
      speak(ui, "Standing down, citizen. Call when duty strikes!");
      return;
    }

    if (/^(stop|stop talking|be quiet)$/i.test(q)) {
      speechSynthesis?.cancel?.();
      setStatus(ui, "Voice stopped. I'm still standing by.");
      return;
    }

    setAwake(ui, true);
    setStatus(ui, "⚡ Consulting the SPARKD command center…");
    ui.talk.disabled = true;
    ui.input.disabled = true;

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true || !data?.answer) {
        throw new Error(data?.error || "SPARKD Man could not reach command.");
      }

      const answer = String(data.answer).trim();
      addHistory("user", q);
      addHistory("assistant", answer);
      setStatus(ui, answer);
      speak(ui, answer, () => {
        setStatus(ui, "Mission update delivered. Listening for a follow-up…");
        armFollowUp(ui);
      });
    } catch (error) {
      const msg = "Command link is having trouble. Try me again in a moment, citizen.";
      console.error("SPARKD Man AI:", error);
      setStatus(ui, msg);
      speak(ui, msg);
    } finally {
      ui.talk.disabled = false;
      ui.input.disabled = false;
      ui.input.value = "";
    }
  }

  function setupRecognition(ui) {
    if (!Recognition) {
      ui.enable.disabled = true;
      return;
    }

    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      listening = true;
      ui.enable.classList.add("is-live");
      if (!speaking) setStatus(ui, Date.now() < awakeUntil
        ? "Listening for your question…"
        : "Voice ready. Say “Hey Spark.”");
    };

    recognition.onend = () => {
      listening = false;
      ui.enable.classList.remove("is-live");
      if (voiceEnabled && !speaking) {
        setTimeout(() => resumeRecognition(ui), 300);
      }
    };

    recognition.onerror = event => {
      listening = false;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        voiceEnabled = false;
        ui.enable.classList.remove("is-live");
        ui.enable.textContent = "🎙️ ENABLE HEY SPARK";
        setStatus(ui, "Microphone permission is off. You can type to me, or enable voice again.");
        return;
      }
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setStatus(ui, "Voice link flickered. I’m reconnecting…");
      }
    };

    recognition.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const transcript = String(event.results[i][0]?.transcript || "").trim();
        if (!transcript) continue;

        const lower = transcript.toLowerCase();
        const wakeIndex = lower.indexOf(WAKE);

        if (wakeIndex >= 0) {
          const after = transcript.slice(wakeIndex + WAKE.length).replace(/^[,!.?s]+/, "");
          wake(ui, after);
          return;
        }

        if (Date.now() < awakeUntil) {
          ask(ui, transcript);
          return;
        }
      }
    };
  }

  function init() {
    const ui = makeUi();
    if (!ui || !ENDPOINT) return;

    setupRecognition(ui);

    ui.enable.addEventListener("click", () => {
      if (!Recognition) return;
      voiceEnabled = !voiceEnabled;
      if (voiceEnabled) {
        ui.enable.textContent = "🟢 HEY SPARK ENABLED";
        setStatus(ui, "Voice ready. Say “Hey Spark.”");
        resumeRecognition(ui);
      } else {
        ui.enable.textContent = "🎙️ ENABLE HEY SPARK";
        pauseRecognition();
        setAwake(ui, false);
        setStatus(ui, "Voice paused. Type a question or enable Hey Spark again.");
      }
    });

    ui.talk.addEventListener("click", () => {
      if (Recognition) {
        if (!voiceEnabled) {
          voiceEnabled = true;
          ui.enable.textContent = "🟢 HEY SPARK ENABLED";
        }
        wake(ui);
        resumeRecognition(ui);
      } else {
        ui.input.focus();
        setAwake(ui, true);
        setStatus(ui, "Type your mission below, citizen.");
      }
    });

    ui.textRow.addEventListener("submit", event => {
      event.preventDefault();
      const q = ui.input.value.trim();
      if (q) ask(ui, q);
    });

    if ("speechSynthesis" in window) {
      speechSynthesis.getVoices();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
