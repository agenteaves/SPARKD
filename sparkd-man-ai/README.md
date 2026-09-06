# SPARKD Man AI

Isolated homepage voice assistant for sparkdcoin.com.

## User flow

1. SPARKD Man stands to the left of the homepage Meme of the Week box.
2. The user can type a question immediately, click **Talk to Spark**, or enable **Hey Spark** for browser speech recognition.
3. While the page remains open, saying **"Hey Spark"** wakes him.
4. Questions are sent to the Supabase Edge Function `sparkd-man-ai`.
5. Answers are spoken with Gemini neural TTS using the server-side SPARKD Man voice configuration. The browser's built-in speech synthesis is not used for answer playback.

## Architecture

- `sparkd-man-config.js` — public endpoint, wake phrase, follow-up window, and history settings.
- `sparkd-man-personality.js` — client-side status and character lines only.
- `sparkd-man.css` — isolated responsive presentation and glow/animation.
- `sparkd-man.js` — UI binding, speech recognition, neural-audio playback, text input, and session history.
- `sparkd-removebg-preview.png` — transparent homepage SPARKD Man artwork.
- Supabase Edge Function `sparkd-man-ai` — Gemini answer generation, Gemini neural TTS, live contest context, deterministic identity/contest routing, and durable database-backed rate limiting.

No Gemini credential is exposed to the browser. SPARKD Man does not sign transactions, move funds, place trades, provide price predictions, or give financial advice.
