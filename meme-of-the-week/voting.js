////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK — VOTING UI
// voting.js v1.0
//
// NEW STANDALONE MODULE.
// Does not modify contest-submit.js or app.js.
//
// INSTALL:
// <script src="voting.js"></script>
//
// The script injects a voting button beside the
// existing "ENTER MEME OF THE WEEK" button.
////////////////////////////////////////////////////

(function () {
    "use strict";

    const VERSION = "1.0";

    const VOTING_ENDPOINT =
        "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-voting";

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";

    const STORAGE_BUCKET =
        "sparkd-contest-submissions";

    const BUTTON_ID =
        "sparkdVoteButton";

    const MODAL_ID =
        "sparkdVotingModal";

    const STYLE_ID =
        "sparkdVotingStyles";

    ////////////////////////////////////////////////////
    // HELPERS
    ////////////////////////////////////////////////////

    function getPhantom() {
        if (
            window.solana &&
            window.solana.isPhantom
        ) {
            return window.solana;
        }

        return null;
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
        }
        catch (_) {
            // Ignore unavailable contest global.
        }

        const phantom =
            getPhantom();

        if (
            phantom &&
            phantom.publicKey
        ) {
            return phantom.publicKey.toString();
        }

        return null;
    }

    function imageUrl(path) {
        if (
            typeof path !== "string" ||
            !path.trim()
        ) {
            return "";
        }

        const clean =
            path.trim();

        if (
            /^https?:\/\//i.test(clean)
        ) {
            return clean;
        }

        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            STORAGE_BUCKET +
            "/" +
            clean
                .split("/")
                .map(encodeURIComponent)
                .join("/")
        );
    }

    function bytesToBase64(bytes) {
        let binary = "";

        for (
            let i = 0;
            i < bytes.length;
            i++
        ) {
            binary +=
                String.fromCharCode(
                    bytes[i]
                );
        }

        return btoa(binary);
    }

    function randomNonce() {
        const bytes =
            new Uint8Array(16);

        crypto.getRandomValues(
            bytes
        );

        return Array.from(bytes)
            .map(
                value =>
                    value
                        .toString(16)
                        .padStart(2, "0")
            )
            .join("");
    }

    async function api(
        action,
        payload = {}
    ) {
        const response =
            await fetch(
                VOTING_ENDPOINT,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            action,
                            ...payload
                        })
                }
            );

        let result;

        try {
            result =
                await response.json();
        }
        catch (_) {
            result = {
                success:
                    false,

                error:
                    "Voting service returned an invalid response."
            };
        }

        if (
            !response.ok ||
            result?.success !== true
        ) {
            throw new Error(
                result?.error ||
                "Voting request failed."
            );
        }

        return result;
    }

    ////////////////////////////////////////////////////
    // STYLES
    ////////////////////////////////////////////////////

    function installStyles() {
        if (
            document.getElementById(
                STYLE_ID
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            STYLE_ID;

        style.textContent = `
            #${BUTTON_ID} {
                margin-left: 10px;
            }

            #${MODAL_ID} {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: grid;
                place-items: center;
                padding: 18px;
                background: rgba(0,0,0,0.82);
                backdrop-filter: blur(6px);
            }

            #${MODAL_ID} * {
                box-sizing: border-box;
            }

            #${MODAL_ID} .sparkd-vote-panel {
                width: min(1100px, 100%);
                max-height: 90vh;
                overflow: auto;
                border-radius: 20px;
                border: 1px solid rgba(255,193,7,0.35);
                background: #0b0b0b;
                color: #fff;
                padding: 22px;
                box-shadow: 0 25px 80px rgba(0,0,0,0.55);
            }

            #${MODAL_ID} .sparkd-vote-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 18px;
                margin-bottom: 18px;
            }

            #${MODAL_ID} .sparkd-vote-header h2 {
                margin: 0 0 7px;
            }

            #${MODAL_ID} .sparkd-vote-header p {
                margin: 0;
                color: rgba(255,255,255,0.68);
            }

            #${MODAL_ID} .sparkd-vote-close {
                border: 0;
                background: transparent;
                color: #fff;
                font-size: 1.55rem;
                cursor: pointer;
            }

            #${MODAL_ID} .sparkd-vote-message {
                padding: 14px;
                border-radius: 12px;
                background: rgba(255,255,255,0.06);
                color: rgba(255,255,255,0.82);
                margin-bottom: 18px;
            }

            #${MODAL_ID} .sparkd-vote-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                gap: 16px;
            }

            #${MODAL_ID} .sparkd-vote-card {
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 16px;
                overflow: hidden;
                background: rgba(255,255,255,0.035);
            }

            #${MODAL_ID} .sparkd-vote-image-wrap {
                width: 100%;
                aspect-ratio: 1 / 1;
                display: grid;
                place-items: center;
                background: #050505;
                overflow: hidden;
            }

            #${MODAL_ID} .sparkd-vote-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            #${MODAL_ID} .sparkd-vote-body {
                padding: 14px;
            }

            #${MODAL_ID} .sparkd-vote-title {
                margin: 0 0 8px;
                font-size: 1.05rem;
                overflow-wrap: anywhere;
            }

            #${MODAL_ID} .sparkd-vote-count {
                margin: 0 0 12px;
                color: #ffc107;
                font-weight: 800;
            }

            #${MODAL_ID} .sparkd-vote-action {
                width: 100%;
                min-height: 42px;
                border: 1px solid #ffc107;
                border-radius: 10px;
                background: #ffc107;
                color: #111;
                font-weight: 800;
                cursor: pointer;
            }

            #${MODAL_ID} .sparkd-vote-action:disabled {
                cursor: not-allowed;
                opacity: 0.55;
            }

            #${MODAL_ID} .sparkd-vote-selected {
                border-color: #ffc107;
                box-shadow: 0 0 0 1px rgba(255,193,7,0.25);
            }

            @media (max-width: 700px) {
                #${BUTTON_ID} {
                    margin-left: 0;
                    margin-top: 10px;
                    width: 100%;
                }

                #${MODAL_ID} {
                    padding: 8px;
                }

                #${MODAL_ID} .sparkd-vote-panel {
                    padding: 15px;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    ////////////////////////////////////////////////////
    // BUTTON
    ////////////////////////////////////////////////////

    function installButton() {
        if (
            document.getElementById(
                BUTTON_ID
            )
        ) {
            return;
        }

        const submitButton =
            document.getElementById(
                "submitMemeButton"
            );

        const submissionArea =
            document.getElementById(
                "motmSubmissionArea"
            );

        if (
            !submitButton &&
            !submissionArea
        ) {
            console.warn(
                "⚠️ SPARKD voting: submission area not found."
            );

            return;
        }

        const button =
            document.createElement(
                "button"
            );

        button.id =
            BUTTON_ID;

        button.type =
            "button";

        button.className =
            submitButton?.className ||
            "motm-button";

        button.textContent =
            "🗳️ VOTE FOR MEME OF THE WEEK";

        button.addEventListener(
            "click",
            openVoting
        );

        if (
            submitButton &&
            submitButton.parentNode
        ) {
            submitButton.insertAdjacentElement(
                "afterend",
                button
            );
        }
        else {
            submissionArea.appendChild(
                button
            );
        }
    }

    ////////////////////////////////////////////////////
    // MODAL
    ////////////////////////////////////////////////////

    function createModal() {
        const existing =
            document.getElementById(
                MODAL_ID
            );

        if (existing) {
            existing.remove();
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            MODAL_ID;

        const panel =
            document.createElement(
                "div"
            );

        panel.className =
            "sparkd-vote-panel";

        const header =
            document.createElement(
                "div"
            );

        header.className =
            "sparkd-vote-header";

        const headingWrap =
            document.createElement(
                "div"
            );

        const heading =
            document.createElement(
                "h2"
            );

        heading.textContent =
            "🗳️ Vote for Meme of the Week";

        const subtitle =
            document.createElement(
                "p"
            );

        subtitle.textContent =
            "One verified wallet vote per weekly contest.";

        headingWrap.append(
            heading,
            subtitle
        );

        const close =
            document.createElement(
                "button"
            );

        close.type =
            "button";

        close.className =
            "sparkd-vote-close";

        close.setAttribute(
            "aria-label",
            "Close voting"
        );

        close.textContent =
            "✕";

        close.addEventListener(
            "click",
            () => modal.remove()
        );

        header.append(
            headingWrap,
            close
        );

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "sparkd-vote-message";

        message.textContent =
            "Loading voting status...";

        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "sparkd-vote-grid";

        panel.append(
            header,
            message,
            grid
        );

        modal.appendChild(
            panel
        );

        modal.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    modal
                ) {
                    modal.remove();
                }
            }
        );

        document.body.appendChild(
            modal
        );

        return {
            modal,
            message,
            grid
        };
    }

    ////////////////////////////////////////////////////
    // LOAD VOTING STATE
    ////////////////////////////////////////////////////

    async function openVoting() {
        const ui =
            createModal();

        try {
            const wallet =
                await getConnectedWallet();

            const state =
                await api(
                    "get_voting_state",
                    {
                        wallet
                    }
                );

            renderVotingState(
                ui,
                state,
                wallet
            );
        }
        catch (error) {
            ui.message.textContent =
                "❌ " +
                error.message;
        }
    }

    function renderVotingState(
        ui,
        state,
        wallet
    ) {
        ui.grid.replaceChildren();

        if (
            !state.contest
        ) {
            ui.message.textContent =
                "No active Meme of the Week contest was found.";

            return;
        }

        if (
            state.votingOpen !== true
        ) {
            ui.message.textContent =
                "🕒 Voting is not open yet. Voting becomes available when the contest enters the voting phase.";

            return;
        }

        const submissions =
            Array.isArray(
                state.submissions
            )
                ? state.submissions
                : [];

        if (
            submissions.length === 0
        ) {
            ui.message.textContent =
                "No eligible memes are available for voting.";

            return;
        }

        if (
            state.userVote
        ) {
            ui.message.textContent =
                "✅ This wallet has already voted in this weekly contest.";
        }
        else if (!wallet) {
            ui.message.textContent =
                "🔌 Connect your Phantom wallet before casting your vote.";
        }
        else {
            ui.message.textContent =
                "Choose one meme. Phantom will ask you to sign a message proving wallet ownership. No token transaction or burn is performed.";
        }

        for (
            const submission
            of submissions
        ) {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "sparkd-vote-card";

            if (
                state.userVote?.submissionId ===
                submission.id
            ) {
                card.classList.add(
                    "sparkd-vote-selected"
                );
            }

            const imageWrap =
                document.createElement(
                    "div"
                );

            imageWrap.className =
                "sparkd-vote-image-wrap";

            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "sparkd-vote-image";

            image.src =
                imageUrl(
                    submission.memeImageUrl
                );

            image.alt =
                submission.memeTitle ||
                "SPARKD contest meme";

            image.loading =
                "lazy";

            imageWrap.appendChild(
                image
            );

            const body =
                document.createElement(
                    "div"
                );

            body.className =
                "sparkd-vote-body";

            const title =
                document.createElement(
                    "h3"
                );

            title.className =
                "sparkd-vote-title";

            title.textContent =
                submission.memeTitle ||
                "Untitled SPARKD Meme";

            const count =
                document.createElement(
                    "p"
                );

            count.className =
                "sparkd-vote-count";

            count.textContent =
                Number(
                    submission.voteCount ||
                    0
                ) +
                (
                    Number(
                        submission.voteCount ||
                        0
                    ) === 1
                        ? " vote"
                        : " votes"
                );

            const voteButton =
                document.createElement(
                    "button"
                );

            voteButton.type =
                "button";

            voteButton.className =
                "sparkd-vote-action";

            if (
                state.userVote?.submissionId ===
                submission.id
            ) {
                voteButton.textContent =
                    "✅ YOUR VOTE";
            }
            else {
                voteButton.textContent =
                    "🗳️ VOTE FOR THIS MEME";
            }

            voteButton.disabled =
                !wallet ||
                Boolean(
                    state.userVote
                );

            voteButton.addEventListener(
                "click",
                () =>
                    castVote(
                        ui,
                        state.contest.id,
                        submission.id
                    )
            );

            body.append(
                title,
                count,
                voteButton
            );

            card.append(
                imageWrap,
                body
            );

            ui.grid.appendChild(
                card
            );
        }
    }

    ////////////////////////////////////////////////////
    // CAST VOTE WITH PHANTOM MESSAGE SIGNATURE
    ////////////////////////////////////////////////////

    async function castVote(
        ui,
        contestId,
        submissionId
    ) {
        const phantom =
            getPhantom();

        if (!phantom) {
            ui.message.textContent =
                "❌ Phantom Wallet was not detected.";

            return;
        }

        try {
            let wallet =
                await getConnectedWallet();

            if (!wallet) {
                const connection =
                    await phantom.connect();

                wallet =
                    connection?.publicKey
                        ?.toString() ||
                    phantom.publicKey
                        ?.toString() ||
                    null;
            }

            if (!wallet) {
                throw new Error(
                    "Unable to determine connected wallet."
                );
            }

            if (
                typeof phantom.signMessage !==
                "function"
            ) {
                throw new Error(
                    "This Phantom wallet does not support message signing."
                );
            }

            const timestamp =
                new Date()
                    .toISOString();

            const nonce =
                randomNonce();

            const message =
                [
                    "SPARKD Meme of the Week Vote",
                    "Contest: " +
                        contestId,
                    "Submission: " +
                        submissionId,
                    "Wallet: " +
                        wallet,
                    "Timestamp: " +
                        timestamp,
                    "Nonce: " +
                        nonce
                ].join("\n");

            const encodedMessage =
                new TextEncoder()
                    .encode(
                        message
                    );

            ui.message.textContent =
                "👻 Confirm the vote message in Phantom. This does not send SOL or burn SPARKD.";

            const signed =
                await phantom
                    .signMessage(
                        encodedMessage,
                        "utf8"
                    );

            const signatureBytes =
                signed?.signature ||
                signed;

            if (
                !signatureBytes ||
                typeof signatureBytes.length !==
                    "number"
            ) {
                throw new Error(
                    "Phantom did not return a message signature."
                );
            }

            ui.message.textContent =
                "🗳️ Recording your vote...";

            await api(
                "cast_vote",
                {
                    contestId,
                    submissionId,
                    wallet,
                    timestamp,
                    nonce,
                    message,
                    signatureBase64:
                        bytesToBase64(
                            signatureBytes
                        )
                }
            );

            ui.message.textContent =
                "✅ Vote recorded successfully.";

            const state =
                await api(
                    "get_voting_state",
                    {
                        wallet
                    }
                );

            renderVotingState(
                ui,
                state,
                wallet
            );
        }
        catch (error) {
            const message =
                error?.message ||
                String(error);

            if (
                /reject/i.test(
                    message
                )
            ) {
                ui.message.textContent =
                    "Voting cancelled. No vote was recorded.";
            }
            else {
                ui.message.textContent =
                    "❌ " +
                    message;
            }
        }
    }

    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initialize() {
        installStyles();
        installButton();

        console.log(
            "🗳️ SPARKD voting.js v" +
            VERSION +
            " loaded."
        );
    }

    window.SPARKD_VOTING = {
        open:
            openVoting,

        version:
            VERSION
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:
                    true
            }
        );
    }
    else {
        initialize();
    }
})();
