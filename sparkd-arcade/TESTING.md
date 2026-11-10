# SPARKD Runner v0.2 — preview and testing

## Independent preview

Open `sparkd-arcade/index.html` from a local HTTP server rooted at the repository root. Example:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080/sparkd-arcade/`.

The game is deliberately **not linked from the production homepage**. If the existing hosting serves repository subdirectories, the arcade URL may be publicly reachable even without a navigation link; verify hosting settings before sharing.

## Manual acceptance checklist

- [ ] Desktop: start, Space/Up jump, Down duck, P pause/resume.
- [ ] Mobile: Jump and Duck touch controls; game canvas remains visible.
- [ ] Obstacles reduce lives once per collision; invulnerability briefly prevents repeated hits.
- [ ] Energy orbs add 75 points.
- [ ] Score increases with survival; pace increases gradually.
- [ ] Three hits end the run; Play Again resets score/lives.
- [ ] High score survives reload in the same browser (localStorage).
- [ ] SPARKD Man image loads from `../sparkd-man-ai/sparkd-removebg-preview.png`; drawn fallback displays if it does not.
- [ ] Pause automatically on tab/window blur.
- [ ] No arcade links or code added to the main homepage.

## Not yet implemented

Account login, 24-hour run limits, server-side anti-cheat, public leaderboard, prizes, and weekly challenges. Local high scores are **not trustworthy for prize competition**.

## Release gate

Do not connect this page to production navigation or announce prize competitions until browser/device QA, secure backend validation, and explicit approval.
