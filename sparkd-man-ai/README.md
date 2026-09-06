# SPARKD Man AI

Isolated homepage voice assistant for sparkdcoin.com.

## User flow

1. SPARKD Man stands beside the homepage Meme of the Week box.
2. The user clicks **Enable Hey Spark** once to grant microphone permission.
3. While the page remains open, saying **"Hey Spark"** wakes him.
4. The user asks a question by voice; a text input and Talk button remain available as fallbacks.
5. SPARKD Man answers in a short superhero-style voice using the browser's speech synthesis.

## Architecture

- `sparkd-man-config.js` — public endpoint and wake-word settings.
- `sparkd-man.css` — isolated responsive presentation/animation.
- `sparkd-man.js` — wake phrase, speech recognition, text fallback, TTS, session history.
- Supabase Edge Function `sparkd-man-ai` — rate-limited server-side AI endpoint using the existing `GEMINI_API_KEY` secret.

No Gemini credential is exposed to the browser. The assistant does not sign transactions, move funds, or provide price predictions.
