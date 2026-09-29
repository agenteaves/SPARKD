import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const exists = p => fs.existsSync(path.join(root, p));

const index = read("meme-of-the-week/index.html");
const app = read("meme-of-the-week/app.js");
const status = read("meme-of-the-week/contest-status.js");
const rules = read("meme-of-the-week/contest-rules.js");
const guide = read("meme-of-the-week/contest-guide.html");
const submit = read("meme-forge/upgrades/contest-submit.js");

assert(!exists("meme-of-the-week/voting.js"));
assert(!exists("meme-of-the-week/voter-reward.js"));
assert(!/voting(?:-ux)?\.js|voter-reward\.js/.test(index));
assert(!/VOTING_WINDOW_MS|PUBLIC_VOTER_STORAGE_KEY/.test(read("meme-of-the-week/contest-config.js")));
assert(!/vote_count|VOTING ENDS IN/.test(app));
assert(!/VOTING_WINDOW_MS|votingOpen/.test(status));
assert(!/vote|voting/i.test(rules + guide));

assert(index.includes('id="completedContestBurned"'));
assert(index.indexOf('id="completedContestBurned"') > index.indexOf('id="totalBurned"'));
assert(app.includes("data.completedContestBurned"));
assert(app.includes("COMPLETED_BURN_CACHE_KEY"));
assert(/contest-image\.js/.test(index));
assert(/server-nudenet-guard\.js/.test(index));
assert(app.includes("SPARKD_CONTEST_IMAGE.prepare(file)"));
assert(submit.includes("entryData.memeID") && submit.includes("entryMemeID"));
assert(!/verifyForge\s*\(\s*wallet\s*,\s*entryData/.test(submit));
assert(/equal.chance random drawing/i.test(rules));
assert(/status", "in\.\(upcoming,submission\)"/.test(status));

console.log("SPARKD contest regression checks passed.");
