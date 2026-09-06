(() => {
  "use strict";

  const cfg = window.SPARKD_MAN_CONFIG || {};
  const ENDPOINT = cfg.endpoint;
  const WAKE = String(cfg.wakePhrase || "hey spark").toLowerCase();
  const FOLLOW_UP_MS = Number(cfg.followUpWindowMs || 15000);
  const MAX_HISTORY = Number(cfg.maxHistoryMessages || 6);
  const persona = window.SPARKD_MAN_PERSONALITY || {};
  const HERO = "/sparkd-man-ai/sparkd-removebg-preview.png?v=20";

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let voiceEnabled = false;
  let listening = false;
  let speaking = false;
  let awakeUntil = 0;
  let followTimer = null;
  let history = [];
  let activeAudio = null;
  let activeAudioUrl = "";

  function makeUi() {
    const existing = document.getElementById("sparkdManAi");
    if (existing) {
      const status = existing.querySelector(".sparkd-man-status");
      const enable = existing.querySelector(".sparkd-man-enable");
      const talk = existing.querySelector(".sparkd-man-talk");
      const input = existing.querySelector(".sparkd-man-text");
      const textRow = existing.querySelector(".sparkd-man-text-row");

      if (status && enable && talk && input && textRow) {
        if (!Recognition) {
          status.textContent = "Voice recognition is unavailable in this browser. You can still type to me.";
          enable.textContent = "🎙️ VOICE UNAVAILABLE";
        }
        return { root: existing, status, enable, talk, input, textRow };
      }
    }

    const meme = document.querySelector(".meme-of-week");
    if (!meme) return null;

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
    enable.className = "sparkd-man-control sparkd-man-enable";
    enable.textContent = Recognition ? "🎙️ ENABLE HEY SPARK" : "🎙️ VOICE UNAVAILABLE";

    const talk = document.createElement("button");
    talk.type = "button";
    talk.className = "sparkd-man-control sparkd-man-talk";
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
    stage.insertBefore(root, meme);

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
    const preferred = Array.isArray(persona.voiceNames) ? persona.voiceNames : [];
    for (const wanted of preferred) {
      const exact = voices.find(v => String(v.name || "").toLowerCase() === String(wanted).toLowerCase());
      if (exact) return exact;
    }
    return voices.find(v => /natural|guy|ryan|christopher|eric|google us english|daniel|alex|david/i.test(v.name || "")) || voices[0] || null;
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

  function stopActiveAudio() {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (_) {}
      activeAudio = null;
    }
    if (activeAudioUrl) {
      try { URL.revokeObjectURL(activeAudioUrl); } catch (_) {}
      activeAudioUrl = "";
    }
    window.speechSynthesis?.cancel?.();
  }

  function neuralVoiceFailed(ui, after) {
    speaking = false;
    ui.root.classList.remove("is-speaking");
    setStatus(ui, "Neural voice link is unavailable right now. I can still answer in text.");
    if (after) after();
    resumeRecognition(ui);
  }

  function base64Bytes(value) {
    const raw = atob(value);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function splitSpeechText(text, maxLen = 320) {
    const cleaned = String(text || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return [];

    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const chunks = [];
    let current = "";

    // Keep the first spoken chunk deliberately short so neural TTS can begin faster.
    const firstTarget = 150;

    for (const sentence of sentences) {
      const sentenceText = sentence.trim();
      const limit = chunks.length === 0 ? firstTarget : maxLen;
      const next = (current + " " + sentenceText).trim();

      if (next.length <= limit) {
        current = next;
        continue;
      }

      if (current) {
        chunks.push(current);
        current = "";
      }

      const activeLimit = chunks.length === 0 ? firstTarget : maxLen;

      if (sentenceText.length <= activeLimit) {
        current = sentenceText;
      } else {
        const words = sentenceText.split(/\s+/);
        for (const word of words) {
          const wordLimit = chunks.length === 0 ? firstTarget : maxLen;
          const candidate = (current + " " + word).trim();

          if (candidate.length > wordLimit && current) {
            chunks.push(current);
            current = word;
          } else {
            current = candidate;
          }
        }
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  async function playNeuralChunk(text) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "speak", text })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success !== true || !data?.audioBase64) {
      throw new Error(data?.error || "Neural voice unavailable.");
    }

    const blob = new Blob(
      [base64Bytes(data.audioBase64)],
      { type: data.mimeType || "audio/wav" }
    );

    activeAudioUrl = URL.createObjectURL(blob);
    activeAudio = new Audio(activeAudioUrl);
    activeAudio.preload = "auto";
    activeAudio.volume = 1;

    await new Promise((resolve, reject) => {
      activeAudio.onended = resolve;
      activeAudio.onerror = () => reject(new Error("Audio playback failed."));
      activeAudio.play().catch(reject);
    });

    if (activeAudioUrl) {
      try { URL.revokeObjectURL(activeAudioUrl); } catch (_) {}
    }
    activeAudio = null;
    activeAudioUrl = "";
  }

  async function speak(ui, text, after) {
    stopActiveAudio();
    pauseRecognition();
    speaking = true;
    ui.root.classList.add("is-speaking");

    try {
      const chunks = splitSpeechText(text);
      for (let i = 0; i < chunks.length; i++) {
        if (!speaking) return;
        let played = false;
        let lastError = null;

        for (let attempt = 0; attempt < 2 && !played; attempt++) {
          try {
            await playNeuralChunk(chunks[i]);
            played = true;
          } catch (error) {
            lastError = error;
            if (attempt === 0) {
              await new Promise(resolve => setTimeout(resolve, 180));
            }
          }
        }

        if (!played) throw lastError || new Error("Neural speech chunk failed.");

        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 140));
        }
      }

      speaking = false;
      ui.root.classList.remove("is-speaking");
      if (after) after();
      resumeRecognition(ui);
    } catch (error) {
      console.warn("SPARKD Man neural voice failed:", error);
      stopActiveAudio();
      neuralVoiceFailed(ui, after);
    }
  }

  function armFollowUp(ui) {
    clearTimeout(followTimer);
    awakeUntil = Date.now() + FOLLOW_UP_MS;
    setAwake(ui, true);
    followTimer = setTimeout(() => {
      if (!speaking && Date.now() >= awakeUntil) {
        setAwake(ui, false);
        setStatus(ui, voiceEnabled
          ? (persona.standbyLine || "Standing by. Say “Hey Spark” when duty calls.")
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
    const line = persona.wakeLine || "SPARKD MAN ONLINE! What mission calls, citizen?";
    setStatus(ui, line);
    speak(ui, line, () => {
      setStatus(ui, persona.listeningLine || "I’m listening. Give me the mission.");
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
      stopActiveAudio();
      speaking = false;
      ui.root.classList.remove("is-speaking");
      setStatus(ui, "Voice stopped. I'm still standing by.");
      return;
    }

    setAwake(ui, true);
    setStatus(ui, persona.thinkingLine || "⚡ Consulting SPARKD command…");
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
        setStatus(ui, persona.deliveredLine || "Mission update delivered. What’s next?");
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
          const after = transcript.slice(wakeIndex + WAKE.length).replace(/^[,!.?\\s]+/, "");
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
