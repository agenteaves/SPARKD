////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK — VOTING UX UPGRADE
// voting-ux.js v1.0
//
// NEW STANDALONE MODULE.
// Load AFTER voting.js.
//
// Does NOT modify:
// - contest-submit.js
// - voting.js
// - contest-voting Edge Function
// - contest lifecycle / DB constraints
//
// INSTALL:
// <script src="voting-ux.js"></script>
////////////////////////////////////////////////////

(function () {
    "use strict";

    const VERSION = "1.0";
    const ENDPOINT =
        "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-voting";
    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";
    const STORAGE_BUCKET =
        "sparkd-contest-submissions";

    const BUTTON_ID = "sparkdVoteButton";
    const MODAL_ID = "sparkdVotingUxModal";
    const STYLE_ID = "sparkdVotingUxStyles";
    const REFRESH_MS = 20000;

    let refreshTimer = null;
    let countdownTimer = null;
    let currentUi = null;
    let currentState = null;
    let currentWallet = null;
    let busy = false;

    function getPhantom() {
        return window.solana && window.solana.isPhantom
            ? window.solana
            : null;
    }

    async function getConnectedWallet() {
        try {
            if (
                typeof currentWallet !== "undefined" &&
                typeof currentWallet === "string" &&
                currentWallet
            ) {
                return currentWallet;
            }
        } catch (_) {}

        const phantom = getPhantom();
        return phantom?.publicKey
            ? phantom.publicKey.toString()
            : null;
    }

    function imageUrl(path) {
        if (typeof path !== "string" || !path.trim()) return "";
        const clean = path.trim();
        if (/^https?:\/\//i.test(clean)) return clean;

        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            STORAGE_BUCKET +
            "/" +
            clean.split("/").map(encodeURIComponent).join("/")
        );
    }

    function bytesToBase64(bytes) {
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function randomNonce() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes)
            .map(v => v.toString(16).padStart(2, "0"))
            .join("");
    }

    async function api(action, payload = {}) {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action, ...payload })
        });

        let result;
        try {
            result = await response.json();
        } catch (_) {
            result = {
                success: false,
                error: "Voting service returned an invalid response."
            };
        }

        if (!response.ok || result?.success !== true) {
            const error = new Error(
                result?.error || "Voting request failed."
            );
            error.payload = result;
            throw error;
        }

        return result;
    }

    function formatRemaining(ms) {
        if (!Number.isFinite(ms) || ms <= 0) return "00:00:00";

        const total = Math.floor(ms / 1000);
        const days = Math.floor(total / 86400);
        const hours = Math.floor((total % 86400) / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;

        const time = [hours, minutes, seconds]
            .map(v => String(v).padStart(2, "0"))
            .join(":");

        return days > 0 ? `${days}d ${time}` : time;
    }

    function getPhase(state) {
        const contest = state?.contest;
        if (!contest) return {
            key: "none",
            label: "NO ACTIVE CONTEST",
            target: null
        };

        if (contest.status === "submission") {
            return {
                key: "submission",
                label: "VOTING OPENS IN",
                target: new Date(contest.week_end).getTime()
            };
        }

        if (contest.status === "voting") {
            return {
                key: "voting",
                label: "VOTING CLOSES IN",
                target:
                    new Date(contest.week_end).getTime() +
                    12 * 60 * 60 * 1000
            };
        }

        return {
            key: "closed",
            label: "VOTING CLOSED",
            target: null
        };
    }

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${MODAL_ID} {
                position: fixed;
                inset: 0;
                z-index: 100000;
                background: rgba(0,0,0,.88);
                display: grid;
                place-items: center;
                padding: 18px;
                overflow-y: auto;
                font-family: inherit;
            }

            #${MODAL_ID} * {
                box-sizing: border-box;
            }

            #${MODAL_ID} .sparkd-vux-panel {
                width: min(1120px, 100%);
                max-height: 94vh;
                overflow-y: auto;
                background: #0b0b0b;
                color: #fff;
                border: 1px solid rgba(255,193,7,.45);
                border-radius: 18px;
                box-shadow: 0 24px 70px rgba(0,0,0,.65);
            }

            #${MODAL_ID} .sparkd-vux-header {
                position: sticky;
                top: 0;
                z-index: 5;
                display: flex;
                justify-content: space-between;
                gap: 16px;
                align-items: flex-start;
                padding: 18px 20px;
                background: rgba(11,11,11,.97);
                border-bottom: 1px solid rgba(255,255,255,.08);
            }

            #${MODAL_ID} h2 {
                margin: 0 0 5px;
                font-size: clamp(1.35rem, 3vw, 2rem);
            }

            #${MODAL_ID} .sparkd-vux-subtitle {
                margin: 0;
                color: #cfcfcf;
                font-size: .92rem;
            }

            #${MODAL_ID} .sparkd-vux-close {
                border: 1px solid rgba(255,255,255,.2);
                background: #171717;
                color: #fff;
                width: 42px;
                height: 42px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 1.15rem;
                flex: 0 0 auto;
            }

            #${MODAL_ID} .sparkd-vux-hero {
                display: grid;
                grid-template-columns: repeat(3, minmax(0,1fr));
                gap: 12px;
                padding: 16px 20px 4px;
            }

            #${MODAL_ID} .sparkd-vux-stat {
                background: #111;
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 12px;
                padding: 14px;
                min-height: 78px;
            }

            #${MODAL_ID} .sparkd-vux-stat-label {
                color: #a9a9a9;
                font-size: .76rem;
                font-weight: 800;
                letter-spacing: .07em;
                text-transform: uppercase;
                margin-bottom: 6px;
            }

            #${MODAL_ID} .sparkd-vux-stat-value {
                color: #ffc107;
                font-size: 1.15rem;
                font-weight: 900;
                overflow-wrap: anywhere;
            }

            #${MODAL_ID} .sparkd-vux-message {
                margin: 14px 20px 0;
                padding: 12px 14px;
                border-radius: 10px;
                background: rgba(255,255,255,.055);
                border: 1px solid rgba(255,255,255,.08);
                line-height: 1.45;
            }

            #${MODAL_ID} .sparkd-vux-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                padding: 14px 20px 0;
            }

            #${MODAL_ID} .sparkd-vux-live {
                font-size: .82rem;
                color: #a9a9a9;
            }

            #${MODAL_ID} .sparkd-vux-live strong {
                color: #70e000;
            }

            #${MODAL_ID} .sparkd-vux-sort {
                background: #141414;
                color: #fff;
                border: 1px solid rgba(255,255,255,.15);
                border-radius: 8px;
                padding: 8px 10px;
            }

            #${MODAL_ID} .sparkd-vux-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                gap: 14px;
                padding: 16px 20px 22px;
            }

            #${MODAL_ID} .sparkd-vux-card {
                position: relative;
                overflow: hidden;
                background: #101010;
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 14px;
                transition: transform .16s ease, border-color .16s ease;
            }

            #${MODAL_ID} .sparkd-vux-card:hover {
                transform: translateY(-2px);
                border-color: rgba(255,193,7,.45);
            }

            #${MODAL_ID} .sparkd-vux-card.is-user-vote {
                border-color: #ffc107;
                box-shadow: 0 0 0 1px rgba(255,193,7,.25);
            }

            #${MODAL_ID} .sparkd-vux-rank {
                position: absolute;
                z-index: 2;
                top: 10px;
                left: 10px;
                background: rgba(0,0,0,.82);
                border: 1px solid rgba(255,255,255,.15);
                padding: 5px 8px;
                border-radius: 999px;
                font-size: .78rem;
                font-weight: 900;
            }

            #${MODAL_ID} .sparkd-vux-image-wrap {
                aspect-ratio: 1 / 1;
                display: grid;
                place-items: center;
                background: #050505;
            }

            #${MODAL_ID} .sparkd-vux-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            #${MODAL_ID} .sparkd-vux-body {
                padding: 13px;
            }

            #${MODAL_ID} .sparkd-vux-title {
                margin: 0 0 10px;
                font-size: 1rem;
                overflow-wrap: anywhere;
            }

            #${MODAL_ID} .sparkd-vux-meta {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                align-items: center;
                margin-bottom: 11px;
            }

            #${MODAL_ID} .sparkd-vux-count {
                margin: 0;
                color: #ffc107;
                font-weight: 900;
            }

            #${MODAL_ID} .sparkd-vux-badge {
                font-size: .73rem;
                font-weight: 900;
                color: #111;
                background: #ffc107;
                border-radius: 999px;
                padding: 4px 7px;
            }

            #${MODAL_ID} .sparkd-vux-action {
                width: 100%;
                min-height: 44px;
                border: 1px solid #ffc107;
                border-radius: 10px;
                background: #ffc107;
                color: #111;
                font-weight: 900;
                cursor: pointer;
            }

            #${MODAL_ID} .sparkd-vux-action:disabled {
                cursor: not-allowed;
                opacity: .52;
            }

            #${MODAL_ID} .sparkd-vux-empty {
                grid-column: 1 / -1;
                padding: 30px;
                text-align: center;
                color: #bbb;
                border: 1px dashed rgba(255,255,255,.15);
                border-radius: 12px;
            }

            @media (max-width: 720px) {
                #${MODAL_ID} {
                    padding: 6px;
                }

                #${MODAL_ID} .sparkd-vux-panel {
                    max-height: 98vh;
                }

                #${MODAL_ID} .sparkd-vux-hero {
                    grid-template-columns: 1fr;
                    padding-left: 12px;
                    padding-right: 12px;
                }

                #${MODAL_ID} .sparkd-vux-header,
                #${MODAL_ID} .sparkd-vux-grid,
                #${MODAL_ID} .sparkd-vux-toolbar {
                    padding-left: 12px;
                    padding-right: 12px;
                }

                #${MODAL_ID} .sparkd-vux-message {
                    margin-left: 12px;
                    margin-right: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function stopTimers() {
        if (refreshTimer) clearInterval(refreshTimer);
        if (countdownTimer) clearInterval(countdownTimer);
        refreshTimer = null;
        countdownTimer = null;
    }

    function closeModal() {
        stopTimers();
        currentUi = null;
        currentState = null;
        const modal = document.getElementById(MODAL_ID);
        if (modal) modal.remove();
    }

    function createModal() {
        closeModal();

        const modal = document.createElement("div");
        modal.id = MODAL_ID;

        const panel = document.createElement("div");
        panel.className = "sparkd-vux-panel";

        const header = document.createElement("div");
        header.className = "sparkd-vux-header";

        const headingWrap = document.createElement("div");
        const heading = document.createElement("h2");
        heading.textContent = "🗳️ Meme of the Week Voting";

        const subtitle = document.createElement("p");
        subtitle.className = "sparkd-vux-subtitle";
        subtitle.textContent =
            "One verified Phantom wallet vote per weekly contest.";

        headingWrap.append(heading, subtitle);

        const close = document.createElement("button");
        close.type = "button";
        close.className = "sparkd-vux-close";
        close.setAttribute("aria-label", "Close voting");
        close.textContent = "✕";
        close.addEventListener("click", closeModal);

        header.append(headingWrap, close);

        const hero = document.createElement("div");
        hero.className = "sparkd-vux-hero";

        const phaseStat = statBox("Contest phase");
        const timerStat = statBox("Countdown");
        const voteStat = statBox("Total votes");
        hero.append(
            phaseStat.box,
            timerStat.box,
            voteStat.box
        );

        const message = document.createElement("div");
        message.className = "sparkd-vux-message";
        message.textContent = "Loading voting status...";

        const toolbar = document.createElement("div");
        toolbar.className = "sparkd-vux-toolbar";

        const live = document.createElement("div");
        live.className = "sparkd-vux-live";
        live.innerHTML = "<strong>● LIVE</strong> totals refresh automatically";

        const sort = document.createElement("select");
        sort.className = "sparkd-vux-sort";
        sort.setAttribute("aria-label", "Sort memes");
        sort.innerHTML = `
            <option value="votes">Most votes</option>
            <option value="title">Title A–Z</option>
        `;
        sort.addEventListener("change", () => {
            if (currentState && currentUi) {
                renderCards(currentUi, currentState, currentWallet);
            }
        });

        toolbar.append(live, sort);

        const grid = document.createElement("div");
        grid.className = "sparkd-vux-grid";

        panel.append(header, hero, message, toolbar, grid);
        modal.appendChild(panel);

        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal();
        });

        document.body.appendChild(modal);

        return {
            modal,
            message,
            grid,
            sort,
            phaseValue: phaseStat.value,
            timerLabel: timerStat.label,
            timerValue: timerStat.value,
            voteValue: voteStat.value
        };
    }

    function statBox(labelText) {
        const box = document.createElement("div");
        box.className = "sparkd-vux-stat";

        const label = document.createElement("div");
        label.className = "sparkd-vux-stat-label";
        label.textContent = labelText;

        const value = document.createElement("div");
        value.className = "sparkd-vux-stat-value";
        value.textContent = "—";

        box.append(label, value);
        return { box, label, value };
    }

    function updateCountdown(ui, state) {
        const phase = getPhase(state);

        if (phase.key === "submission") {
            ui.phaseValue.textContent = "🔥 SUBMISSIONS";
        } else if (phase.key === "voting") {
            ui.phaseValue.textContent = "🗳️ VOTING OPEN";
        } else if (phase.key === "closed") {
            ui.phaseValue.textContent = "✅ CLOSED";
        } else {
            ui.phaseValue.textContent = "—";
        }

        ui.timerLabel.textContent = phase.label;

        if (!phase.target) {
            ui.timerValue.textContent = "—";
            return;
        }

        const remaining = phase.target - Date.now();
        ui.timerValue.textContent = formatRemaining(remaining);

        if (remaining <= 0) {
            setTimeout(() => refreshState(true), 750);
        }
    }

    function totalVotes(state) {
        return (state?.submissions || []).reduce(
            (sum, s) => sum + Number(s.voteCount || 0),
            0
        );
    }

    function stateMessage(state, wallet) {
        if (!state?.contest) {
            return "No active Meme of the Week contest was found.";
        }

        if (state.contest.status === "submission") {
            return "🕒 Submissions are still open. Voting will unlock automatically when the contest enters the voting phase.";
        }

        if (state.votingOpen !== true) {
            return "🔒 Voting is currently closed.";
        }

        if (!Array.isArray(state.submissions) || state.submissions.length === 0) {
            return "No eligible memes are available for voting.";
        }

        if (state.userVote) {
            const picked = state.submissions.find(
                s => s.id === state.userVote.submissionId
            );
            return picked
                ? `✅ Your wallet voted for “${picked.memeTitle}”. Your vote is locked for this weekly contest.`
                : "✅ This wallet has already voted in this weekly contest.";
        }

        if (!wallet) {
            return "🔌 Connect Phantom to vote. Browsing and live vote totals are still available without connecting.";
        }

        return "Choose one meme below. Phantom will ask you to sign a message proving wallet ownership. No SOL or SPARKD is transferred.";
    }

    function renderCards(ui, state, wallet) {
        ui.grid.replaceChildren();

        const submissions = Array.isArray(state?.submissions)
            ? [...state.submissions]
            : [];

        if (!submissions.length) {
            const empty = document.createElement("div");
            empty.className = "sparkd-vux-empty";
            empty.textContent =
                state?.contest?.status === "submission"
                    ? "Eligible submissions will appear here when voting opens."
                    : "No eligible memes are available.";
            ui.grid.appendChild(empty);
            return;
        }

        if (ui.sort.value === "title") {
            submissions.sort((a, b) =>
                String(a.memeTitle || "").localeCompare(
                    String(b.memeTitle || "")
                )
            );
        } else {
            submissions.sort((a, b) =>
                Number(b.voteCount || 0) - Number(a.voteCount || 0)
            );
        }

        submissions.forEach((submission, index) => {
            const card = document.createElement("article");
            card.className = "sparkd-vux-card";

            const isUserVote =
                state.userVote?.submissionId === submission.id;

            if (isUserVote) {
                card.classList.add("is-user-vote");
            }

            const rank = document.createElement("div");
            rank.className = "sparkd-vux-rank";
            rank.textContent =
                ui.sort.value === "votes"
                    ? `#${index + 1}`
                    : "MEME";

            const imageWrap = document.createElement("div");
            imageWrap.className = "sparkd-vux-image-wrap";

            const image = document.createElement("img");
            image.className = "sparkd-vux-image";
            image.src = imageUrl(submission.memeImageUrl);
            image.alt =
                submission.memeTitle || "SPARKD contest meme";
            image.loading = "lazy";
            imageWrap.appendChild(image);

            const body = document.createElement("div");
            body.className = "sparkd-vux-body";

            const title = document.createElement("h3");
            title.className = "sparkd-vux-title";
            title.textContent =
                submission.memeTitle || "Untitled SPARKD Meme";

            const meta = document.createElement("div");
            meta.className = "sparkd-vux-meta";

            const count = document.createElement("p");
            count.className = "sparkd-vux-count";
            const votes = Number(submission.voteCount || 0);
            count.textContent = `${votes} ${votes === 1 ? "vote" : "votes"}`;

            meta.appendChild(count);

            if (isUserVote) {
                const badge = document.createElement("span");
                badge.className = "sparkd-vux-badge";
                badge.textContent = "YOUR VOTE";
                meta.appendChild(badge);
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "sparkd-vux-action";

            if (isUserVote) {
                button.textContent = "✅ YOUR VOTE";
            } else if (state.userVote) {
                button.textContent = "VOTE ALREADY USED";
            } else if (state.votingOpen !== true) {
                button.textContent = "VOTING NOT OPEN";
            } else if (!wallet) {
                button.textContent = "CONNECT PHANTOM TO VOTE";
            } else {
                button.textContent = "🗳️ VOTE FOR THIS MEME";
            }

            button.disabled =
                busy ||
                state.votingOpen !== true ||
                Boolean(state.userVote);

            button.addEventListener("click", async () => {
                if (!wallet && state.votingOpen === true) {
                    await connectAndRefresh();
                    return;
                }
                await castVote(submission.id);
            });

            body.append(title, meta, button);
            card.append(rank, imageWrap, body);
            ui.grid.appendChild(card);
        });
    }

    function renderState(ui, state, wallet) {
        currentState = state;
        currentWallet = wallet;

        updateCountdown(ui, state);
        ui.voteValue.textContent = String(totalVotes(state));
        ui.message.textContent = stateMessage(state, wallet);
        renderCards(ui, state, wallet);
    }

    async function connectAndRefresh() {
        const phantom = getPhantom();

        if (!phantom) {
            if (currentUi) {
                currentUi.message.textContent =
                    "❌ Phantom Wallet was not detected.";
            }
            return;
        }

        try {
            busy = true;
            const connection = await phantom.connect();
            currentWallet =
                connection?.publicKey?.toString() ||
                phantom.publicKey?.toString() ||
                null;
            await refreshState(true);
        } catch (error) {
            if (currentUi) {
                currentUi.message.textContent =
                    /reject/i.test(error?.message || "")
                        ? "Wallet connection cancelled."
                        : "❌ " + (error?.message || String(error));
            }
        } finally {
            busy = false;
            if (currentUi && currentState) {
                renderState(currentUi, currentState, currentWallet);
            }
        }
    }

    async function castVote(submissionId) {
        if (busy || !currentState?.contest) return;

        const phantom = getPhantom();
        if (!phantom) {
            currentUi.message.textContent =
                "❌ Phantom Wallet was not detected.";
            return;
        }

        try {
            busy = true;
            renderCards(currentUi, currentState, currentWallet);

            let wallet = await getConnectedWallet();

            if (!wallet) {
                const connection = await phantom.connect();
                wallet =
                    connection?.publicKey?.toString() ||
                    phantom.publicKey?.toString() ||
                    null;
            }

            if (!wallet) {
                throw new Error(
                    "Unable to determine connected wallet."
                );
            }

            if (typeof phantom.signMessage !== "function") {
                throw new Error(
                    "This Phantom wallet does not support message signing."
                );
            }

            const contestId = currentState.contest.id;
            const timestamp = new Date().toISOString();
            const nonce = randomNonce();

            const message = [
                "SPARKD Meme of the Week Vote",
                "Contest: " + contestId,
                "Submission: " + submissionId,
                "Wallet: " + wallet,
                "Timestamp: " + timestamp,
                "Nonce: " + nonce
            ].join("\n");

            currentUi.message.textContent =
                "👻 Confirm the vote message in Phantom. This does not send SOL or burn SPARKD.";

            const signed = await phantom.signMessage(
                new TextEncoder().encode(message),
                "utf8"
            );

            const signatureBytes =
                signed?.signature || signed;

            if (
                !signatureBytes ||
                typeof signatureBytes.length !== "number"
            ) {
                throw new Error(
                    "Phantom did not return a message signature."
                );
            }

            currentUi.message.textContent =
                "🗳️ Recording your vote...";

            await api("cast_vote", {
                contestId,
                submissionId,
                wallet,
                timestamp,
                nonce,
                message,
                signatureBase64: bytesToBase64(signatureBytes)
            });

            currentWallet = wallet;
            currentUi.message.textContent =
                "✅ Vote recorded successfully.";
            await refreshState(true);
        } catch (error) {
            const message = error?.message || String(error);

            if (/reject/i.test(message)) {
                currentUi.message.textContent =
                    "Voting cancelled. No vote was recorded.";
            } else {
                currentUi.message.textContent = "❌ " + message;
            }

            if (error?.payload?.alreadyVoted) {
                await refreshState(true);
            }
        } finally {
            busy = false;
            if (currentUi && currentState) {
                renderCards(currentUi, currentState, currentWallet);
            }
        }
    }

    async function refreshState(showLoading = false) {
        if (!currentUi || busy) return;

        try {
            if (showLoading) {
                currentUi.message.textContent =
                    "Refreshing voting status...";
            }

            const wallet = await getConnectedWallet();
            const state = await api(
                "get_voting_state",
                { wallet }
            );

            renderState(currentUi, state, wallet);
        } catch (error) {
            if (currentUi) {
                currentUi.message.textContent =
                    "❌ " + (error?.message || String(error));
            }
        }
    }

    async function openVotingUx() {
        installStyles();

        currentUi = createModal();
        currentUi.message.textContent =
            "Loading voting status...";

        await refreshState(false);

        countdownTimer = setInterval(() => {
            if (currentUi && currentState) {
                updateCountdown(currentUi, currentState);
            }
        }, 1000);

        refreshTimer = setInterval(() => {
            refreshState(false);
        }, REFRESH_MS);
    }

    function takeOverVoteButton() {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return false;

        if (button.dataset.sparkdVotingUx === VERSION) {
            return true;
        }

        button.dataset.sparkdVotingUx = VERSION;
        button.title =
            "Open the live Meme of the Week voting dashboard";

        button.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                openVotingUx();
            },
            true
        );

        return true;
    }

    function initialize() {
        installStyles();

        if (!takeOverVoteButton()) {
            const observer = new MutationObserver(() => {
                if (takeOverVoteButton()) {
                    observer.disconnect();
                }
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            setTimeout(() => observer.disconnect(), 15000);
        }

        window.SPARKD_VOTING_UX = {
            open: openVotingUx,
            refresh: () => refreshState(true),
            version: VERSION
        };

        console.log(
            "✨ SPARKD voting-ux.js v" +
            VERSION +
            " loaded."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
