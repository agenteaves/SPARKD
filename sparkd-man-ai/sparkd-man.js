(() => {
  "use strict";

  const cfg = window.SPARKD_MAN_CONFIG || {};
  const ENDPOINT = cfg.endpoint;
  const WAKE = String(cfg.wakePhrase || "hey spark").toLowerCase();
  const FOLLOW_UP_MS = Number(cfg.followUpWindowMs || 15000);
  const MAX_HISTORY = Number(cfg.maxHistoryMessages || 6);
  const persona = window.SPARKD_MAN_PERSONALITY || {};

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
  let speechRunId = 0;

  function bindUi() {
    const root = document.getElementById("sparkdManAi");
    if (!root) return null;

    const status = root.querySelector(".sparkd-man-status");
    const enable = root.querySelector(".sparkd-man-enable");
    const talk = root.querySelector(".sparkd-man-talk");
    const input = root.querySelector(".sparkd-man-text");
    const textRow = root.querySelector(".sparkd-man-text-row");

    if (!status || !enable || !talk || !input || !textRow) {
      console.error("SPARKD Man UI markup is incomplete.");
      return null;
    }

    if (!Recognition) {
      status.textContent = "Voice recognition is unavailable in this browser. You can still type to me.";
      enable.textContent = "🎙️ VOICE UNAVAILABLE";
      enable.disabled = true;
    }

    return { root, status, enable, talk, input, textRow };
  }

  function setStatus(ui, text) {
    ui.status.textContent = text;
  }

  function setAwake(ui, awake) {
    ui.root.classList.toggle("is-awake", awake);
    if (!awake) awakeUntil = 0;
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
    speechRunId += 1;

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
  }

  function neuralVoiceFailed(ui, errorMessage = "") {
    speaking = false;
    ui.root.classList.remove("is-speaking");

    const quotaHit = /quota|too_many_requests|429|RESOURCE_EXHAUSTED/i.test(String(errorMessage));
    setStatus(
      ui,
      quotaHit
        ? "My neural voice quota is cooling down for a moment. My text answer is still available."
        : "Neural voice link is unavailable right now. I can still answer in text."
    );

    resumeRecognition(ui);
  }

  function base64Bytes(value) {
    const raw = atob(value);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function splitSpeechText(text, maxLen = 1100) {
    const cleaned = String(text || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return [];
    if (cleaned.length <= maxLen) return [cleaned];

    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
      const sentenceText = sentence.trim();
      const next = (current + " " + sentenceText).trim();

      if (next.length <= maxLen) {
        current = next;
        continue;
      }

      if (current) chunks.push(current);

      if (sentenceText.length <= maxLen) {
        current = sentenceText;
        continue;
      }

      const words = sentenceText.split(/\s+/);
      current = "";
      for (const word of words) {
        const candidate = (current + " " + word).trim();
        if (candidate.length > maxLen && current) {
          chunks.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  async function playNeuralChunk(text, runId) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "speak", text })
    });

    if (runId !== speechRunId) return;

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
    const runId = speechRunId;

    pauseRecognition();
    speaking = true;
    ui.root.classList.add("is-speaking");

    try {
      const chunks = splitSpeechText(text);

      for (let i = 0; i < chunks.length; i++) {
        if (runId !== speechRunId || !speaking) return;

        let played = false;
        let lastError = null;

        for (let attempt = 0; attempt < 2 && !played; attempt++) {
          try {
            await playNeuralChunk(chunks[i], runId);
            if (runId !== speechRunId) return;
            played = true;
          } catch (error) {
            lastError = error;
            const message = String(error?.message || error || "");
            const quotaHit = /quota|too_many_requests|429|RESOURCE_EXHAUSTED/i.test(message);
            if (quotaHit || attempt === 1 || runId !== speechRunId) break;
            await new Promise(resolve => setTimeout(resolve, 220));
          }
        }

        if (!played) throw lastError || new Error("Neural speech chunk failed.");

        if (i < chunks.length - 1 && runId === speechRunId) {
          await new Promise(resolve => setTimeout(resolve, 140));
        }
      }

      if (runId !== speechRunId) return;

      speaking = false;
      ui.root.classList.remove("is-speaking");
      if (after) after();
      resumeRecognition(ui);
    } catch (error) {
      if (runId !== speechRunId) return;
      console.warn("SPARKD Man neural voice failed:", error);
      const detail = String(error?.message || error || "");
      stopActiveAudio();
      neuralVoiceFailed(ui, detail);
    }
  }

  function armFollowUp(ui) {
    clearTimeout(followTimer);
    awakeUntil = Date.now() + FOLLOW_UP_MS;
    setAwake(ui, true);

    followTimer = setTimeout(() => {
      if (!speaking && Date.now() >= awakeUntil) {
        setAwake(ui, false);
        setStatus(
          ui,
          voiceEnabled
            ? (persona.standbyLine || "Standing by. Say “Hey Spark” when duty calls.")
            : "Standing by. Enable voice, then say “Hey Spark.”"
        );
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
      const detail = String(error?.message || error || "");
      const msg = detail.includes("recharging his command link")
        ? detail
        : "Command link is having trouble. Try me again in a moment, citizen.";
      console.error("SPARKD Man AI:", error);
      setStatus(ui, msg);
    } finally {
      ui.talk.disabled = false;
      ui.input.disabled = false;
      ui.input.value = "";
    }
  }

  function setupRecognition(ui) {
    if (!Recognition) return;

    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      listening = true;
      ui.enable.classList.add("is-live");

      if (!speaking) {
        setStatus(
          ui,
          Date.now() < awakeUntil
            ? "Listening for your question…"
            : "Voice ready. Say “Hey Spark.”"
        );
      }
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
          const after = transcript
            .slice(wakeIndex + WAKE.length)
            .replace(/^[,!.?\s]+/, "");
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
    const ui = bindUi();
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
