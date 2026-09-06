import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), "utf8");

const index = read("index.html");
const config = read("sparkd-man-ai/sparkd-man-config.js");
const js = read("sparkd-man-ai/sparkd-man.js");
const css = read("sparkd-man-ai/sparkd-man.css");

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

check(index.includes("/sparkd-man-ai/sparkd-man.css?v=1"), "homepage must load SPARKD Man CSS");
check(index.includes("/sparkd-man-ai/sparkd-man-config.js?v=1"), "homepage must load SPARKD Man config");
check(index.includes("/sparkd-man-ai/sparkd-man.js?v=1"), "homepage must load SPARKD Man JS");
check(config.toLowerCase().includes("hey spark"), "wake phrase must remain Hey Spark");
check(js.includes("webkitSpeechRecognition"), "Chrome/WebKit speech-recognition fallback must remain");
check(js.includes("SpeechRecognition"), "speech recognition must remain available");
check(js.includes("speechSynthesis"), "browser speech synthesis must remain available");
check(js.includes("data:image/webp;base64,"), "SPARKD Man visual asset must remain bundled");
check(css.includes(".sparkd-man-stage"), "isolated homepage stage styles must remain");
check(/@media \(max-width: 980px\)/.test(css), "responsive layout guard must remain");
check(!/GEMINI_API_KEY|AIza[A-Za-z0-9_-]+/.test(config + js + css + index), "frontend must never contain a Gemini secret");
check(/functions\/v1\/sparkd-man-ai/.test(config), "frontend must use the protected Supabase endpoint");

if (failures.length) {
  console.error("\nSPARKD Man AI regression checks FAILED:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("SPARKD Man AI regression checks passed.");
