import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const exists = p => fs.existsSync(path.join(root, p));

const index = read("meme-of-the-week/index.html");
const voting = read("meme-of-the-week/voting.js");
const status = read("meme-of-the-week/contest-status.js");
const rules = read("meme-of-the-week/contest-rules.js");
const guide = read("meme-of-the-week/contest-guide.html");
const reward = read("meme-of-the-week/voter-reward.js");
const config = read("meme-of-the-week/contest-config.js");

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

check(!exists("meme-of-the-week/voting-ux.js"), "legacy voting-ux.js must not exist");
check(!/voting-ux\.js/.test(index), "index.html must not load voting-ux.js");
check(/contest-config\.js/.test(index), "index.html must load contest-config.js");
check(/voting\.js\?v=public-voting-2/.test(index), "index.html must load the public voting module");
check(/VOTING_WINDOW_MS:\s*12\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(config), "shared voting window must remain 12 hours");
check(status.includes("SPARKD_CONTEST_CONFIG?.VOTING_WINDOW_MS"), "contest-status.js must consume shared voting window config");
check(/state\.votingOpen/.test(voting), "voting.js must rely on authoritative backend voting state");
check(voting.includes("SPARKD_CONTEST_CONFIG?.PUBLIC_VOTER_STORAGE_KEY"), "voting.js must consume shared voter storage key");
check(/No wallet is required|no wallet is required|does not require a wallet/.test(voting + rules + guide + reward), "public-facing files must describe walletless voting");
check(!/Connect Phantom to vote|must connect a Phantom wallet|One verified Phantom wallet vote/i.test(voting + rules + guide + reward), "active files must not require Phantom to vote");
check(/optional.*\$5 SOL|\$5 SOL.*optional/i.test(voting + rules + guide + reward), "reward copy must keep Phantom reward entry optional");
check(/12 hours after the submission period closes/.test(rules), "contest rules must state the 12-hour voting window");
check(/12 hours after submissions close/.test(guide), "contest guide must state the 12-hour voting window");
check(/zero valid votes.*no artificial winner/i.test(rules + guide), "zero-vote contests must not promise an artificial winner");

if (failures.length) {
  console.error("\nSPARKD contest regression checks FAILED:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("SPARKD contest regression checks passed.");
