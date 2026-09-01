////////////////////////////////////////////////////
// SPARKD HOME PAGE — WEEKLY CHAMPION
// Read-only homepage module v1.0
//
// PURPOSE
// - Display the latest Meme of the Week champion
//   directly on the SPARKD home page.
// - Read only from the existing contest tables.
// - Do NOT touch submission, wallet, burn, recovery,
//   voting, or contest engine code.
//
// INSTALL
// Add this near the bottom of the SPARKD home page,
// before </body>:
//
// <script src="upgrades/home-weekly-champion.js"></script>
//
// Adjust the path above only if this file is stored
// in a different folder.
////////////////////////////////////////////////////

(function () {
    "use strict";

    const MODULE_NAME =
        "SPARKD Home Weekly Champion";

    const MODULE_VERSION =
        "1.0";

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";

    // This is the same browser-safe publishable key
    // already used by the Meme of the Week front end.
    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";

    const STORAGE_BUCKET =
        "sparkd-contest-submissions";

    // Change this only if the public contest URL changes.
    const CONTEST_PAGE_URL =
        "/meme-of-the-week/";

    const REFRESH_INTERVAL_MS =
        5 * 60 * 1000;

    const SECTION_ID =
        "sparkdHomeWeeklyChampion";

    const STYLE_ID =
        "sparkdHomeWeeklyChampionStyles";

    let refreshTimer =
        null;

    ////////////////////////////////////////////////////
    // SMALL HELPERS
    ////////////////////////////////////////////////////

    function safeText(value, fallback) {
        if (
            typeof value ===
                "string" &&
            value.trim()
        ) {
            return value.trim();
        }

        return fallback;
    }

    function formatWeek(
        weekStart,
        weekEnd
    ) {
        try {
            const start =
                new Date(
                    weekStart
                );

            const end =
                new Date(
                    weekEnd
                );

            if (
                Number.isNaN(
                    start.getTime()
                ) ||
                Number.isNaN(
                    end.getTime()
                )
            ) {
                return "WEEKLY CHAMPION";
            }

            const formatter =
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        month:
                            "short",
                        day:
                            "numeric"
                    }
                );

            return (
                formatter.format(
                    start
                ) +
                " — " +
                formatter.format(
                    end
                )
            );
        }
        catch (error) {
            return "WEEKLY CHAMPION";
        }
    }

    function buildPublicImageUrl(
        imagePath
    ) {
        if (
            typeof imagePath !==
                "string" ||
            !imagePath.trim()
        ) {
            return "";
        }

        const cleanPath =
            imagePath.trim();

        if (
            /^https?:\/\//i.test(
                cleanPath
            )
        ) {
            return cleanPath;
        }

        const encodedPath =
            cleanPath
                .split("/")
                .map(
                    function (
                        segment
                    ) {
                        return encodeURIComponent(
                            segment
                        );
                    }
                )
                .join("/");

        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            STORAGE_BUCKET +
            "/" +
            encodedPath
        );
    }

    ////////////////////////////////////////////////////
    // READ-ONLY SUPABASE REST REQUEST
    ////////////////////////////////////////////////////

    async function supabaseRead(
        table,
        queryString
    ) {
        const response =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/" +
                table +
                "?" +
                queryString,
                {
                    method:
                        "GET",

                    headers: {
                        "apikey":
                            SUPABASE_PUBLISHABLE_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_PUBLISHABLE_KEY,

                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            const message =
                await response.text();

            throw new Error(
                "SPARKD champion read failed (" +
                response.status +
                "): " +
                message
            );
        }

        return await response.json();
    }

    ////////////////////////////////////////////////////
    // LOAD LATEST OFFICIAL WINNER
    ////////////////////////////////////////////////////

    async function getLatestChampion() {
        const contests =
            await supabaseRead(
                "meme_week_contests",
                [
                    "select=id,week_start,week_end,winner_submission_id",
                    "winner_submission_id=not.is.null",
                    "order=week_start.desc",
                    "limit=1"
                ].join("&")
            );

        if (
            !Array.isArray(
                contests
            ) ||
            contests.length ===
                0 ||
            !contests[0]
                .winner_submission_id
        ) {
            return null;
        }

        const contest =
            contests[0];

        const submissions =
            await supabaseRead(
                "meme_week_submissions",
                [
                    "select=id,meme_title,meme_image_url,wallet_address,creator_id",
                    "id=eq." +
                        encodeURIComponent(
                            contest
                                .winner_submission_id
                        ),
                    "limit=1"
                ].join("&")
            );

        if (
            !Array.isArray(
                submissions
            ) ||
            submissions.length ===
                0
        ) {
            return null;
        }

        return {
            contest:
                contest,

            submission:
                submissions[0]
        };
    }

    ////////////////////////////////////////////////////
    // MODULE STYLES
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
            #${SECTION_ID} {
                width: min(1120px, calc(100% - 32px));
                margin: 34px auto 44px;
                position: relative;
                z-index: 2;
            }

            #${SECTION_ID} * {
                box-sizing: border-box;
            }

            #${SECTION_ID} .sparkd-home-champion-shell {
                position: relative;
                overflow: hidden;
                border: 1px solid rgba(255, 193, 7, 0.38);
                border-radius: 24px;
                padding: clamp(18px, 3vw, 34px);
                background:
                    radial-gradient(
                        circle at top right,
                        rgba(255, 193, 7, 0.13),
                        transparent 38%
                    ),
                    linear-gradient(
                        145deg,
                        rgba(18, 18, 18, 0.98),
                        rgba(7, 7, 7, 0.98)
                    );
                box-shadow:
                    0 20px 50px rgba(0, 0, 0, 0.34),
                    inset 0 0 45px rgba(255, 193, 7, 0.035);
            }

            #${SECTION_ID} .sparkd-home-champion-kicker {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
                font-size: 0.78rem;
                line-height: 1;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #ffc107;
            }

            #${SECTION_ID} .sparkd-home-champion-heading {
                margin: 0;
                font-size: clamp(1.55rem, 4vw, 2.65rem);
                line-height: 1.08;
                color: #ffffff;
            }

            #${SECTION_ID} .sparkd-home-champion-subheading {
                margin: 10px 0 0;
                max-width: 720px;
                color: rgba(255,255,255,0.72);
                font-size: clamp(0.95rem, 2vw, 1.08rem);
                line-height: 1.55;
            }

            #${SECTION_ID} .sparkd-home-champion-card {
                display: grid;
                grid-template-columns:
                    minmax(240px, 0.9fr)
                    minmax(260px, 1.1fr);
                gap: clamp(20px, 4vw, 42px);
                align-items: center;
                margin-top: 24px;
            }

            #${SECTION_ID} .sparkd-home-champion-media {
                position: relative;
                width: 100%;
                min-height: 260px;
                display: grid;
                place-items: center;
                overflow: hidden;
                border-radius: 18px;
                border: 1px solid rgba(255,255,255,0.12);
                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.055),
                        rgba(255,255,255,0.018)
                    );
            }

            #${SECTION_ID} .sparkd-home-champion-image {
                display: block;
                width: 100%;
                max-height: 520px;
                object-fit: contain;
                background: #080808;
            }

            #${SECTION_ID} .sparkd-home-champion-placeholder {
                padding: 46px 22px;
                text-align: center;
                color: rgba(255,255,255,0.7);
            }

            #${SECTION_ID} .sparkd-home-champion-placeholder-icon {
                display: block;
                margin-bottom: 12px;
                font-size: 3rem;
            }

            #${SECTION_ID} .sparkd-home-champion-week {
                margin: 0 0 8px;
                color: #ffc107;
                font-size: 0.82rem;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            #${SECTION_ID} .sparkd-home-champion-title {
                margin: 0;
                color: #ffffff;
                font-size: clamp(1.5rem, 3vw, 2.35rem);
                line-height: 1.12;
                overflow-wrap: anywhere;
            }

            #${SECTION_ID} .sparkd-home-champion-copy {
                margin: 12px 0 0;
                color: rgba(255,255,255,0.72);
                line-height: 1.6;
            }

            #${SECTION_ID} .sparkd-home-champion-wallet {
                display: inline-block;
                margin-top: 14px;
                color: rgba(255,255,255,0.56);
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.82rem;
                overflow-wrap: anywhere;
            }

            #${SECTION_ID} .sparkd-home-champion-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 22px;
            }

            #${SECTION_ID} .sparkd-home-champion-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 46px;
                padding: 0 18px;
                border-radius: 12px;
                border: 1px solid #ffc107;
                text-decoration: none;
                font-weight: 800;
                letter-spacing: 0.02em;
                transition:
                    transform 160ms ease,
                    box-shadow 160ms ease,
                    background 160ms ease;
            }

            #${SECTION_ID} .sparkd-home-champion-button-primary {
                color: #111;
                background: #ffc107;
            }

            #${SECTION_ID} .sparkd-home-champion-button-secondary {
                color: #ffc107;
                background: transparent;
            }

            #${SECTION_ID} .sparkd-home-champion-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(255, 193, 7, 0.16);
            }

            #${SECTION_ID} .sparkd-home-champion-status {
                margin-top: 14px;
                color: rgba(255,255,255,0.54);
                font-size: 0.82rem;
            }

            @media (max-width: 760px) {
                #${SECTION_ID} {
                    width: min(100% - 20px, 1120px);
                    margin-top: 22px;
                    margin-bottom: 28px;
                }

                #${SECTION_ID} .sparkd-home-champion-card {
                    grid-template-columns: 1fr;
                }

                #${SECTION_ID} .sparkd-home-champion-media {
                    min-height: 220px;
                }

                #${SECTION_ID} .sparkd-home-champion-actions {
                    flex-direction: column;
                }

                #${SECTION_ID} .sparkd-home-champion-button {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    ////////////////////////////////////////////////////
    // CREATE THE HOMEPAGE SECTION
    ////////////////////////////////////////////////////

    function createSection() {
        let section =
            document.getElementById(
                SECTION_ID
            );

        if (section) {
            return section;
        }

        section =
            document.createElement(
                "section"
            );

        section.id =
            SECTION_ID;

        section.setAttribute(
            "aria-label",
            "SPARKD Meme of the Week Champion"
        );

        const shell =
            document.createElement(
                "div"
            );

        shell.className =
            "sparkd-home-champion-shell";

        const kicker =
            document.createElement(
                "div"
            );

        kicker.className =
            "sparkd-home-champion-kicker";

        kicker.textContent =
            "🏆 SPARKD MEME OF THE WEEK";

        const heading =
            document.createElement(
                "h2"
            );

        heading.className =
            "sparkd-home-champion-heading";

        heading.textContent =
            "Weekly Champion";

        const subheading =
            document.createElement(
                "p"
            );

        subheading.className =
            "sparkd-home-champion-subheading";

        subheading.textContent =
            "The latest official SPARKD community champion is featured here for every visitor.";

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "sparkd-home-champion-card";

        card.setAttribute(
            "data-champion-card",
            ""
        );

        shell.append(
            kicker,
            heading,
            subheading,
            card
        );

        section.appendChild(
            shell
        );

        return section;
    }

    ////////////////////////////////////////////////////
    // PLACE SECTION NEAR TOP OF HOMEPAGE
    ////////////////////////////////////////////////////

    function mountSection(
        section
    ) {
        if (
            section.isConnected
        ) {
            return;
        }

        const hero =
            document.querySelector(
                ".hero, .hero-section, #hero, #home, [data-hero]"
            );

        if (
            hero &&
            hero.parentNode
        ) {
            hero.insertAdjacentElement(
                "afterend",
                section
            );

            return;
        }

        const main =
            document.querySelector(
                "main"
            );

        if (main) {
            main.insertAdjacentElement(
                "afterbegin",
                section
            );

            return;
        }

        const header =
            document.querySelector(
                "header"
            );

        if (
            header &&
            header.parentNode
        ) {
            header.insertAdjacentElement(
                "afterend",
                section
            );

            return;
        }

        document.body.insertAdjacentElement(
            "afterbegin",
            section
        );
    }

    ////////////////////////////////////////////////////
    // RENDER — WAITING STATE
    ////////////////////////////////////////////////////

    function renderWaiting(
        section
    ) {
        const card =
            section.querySelector(
                "[data-champion-card]"
            );

        if (!card) {
            return;
        }

        card.replaceChildren();

        const media =
            document.createElement(
                "div"
            );

        media.className =
            "sparkd-home-champion-media";

        const placeholder =
            document.createElement(
                "div"
            );

        placeholder.className =
            "sparkd-home-champion-placeholder";

        const icon =
            document.createElement(
                "span"
            );

        icon.className =
            "sparkd-home-champion-placeholder-icon";

        icon.textContent =
            "🏆";

        const text =
            document.createElement(
                "strong"
            );

        text.textContent =
            "Awaiting the next SPARKD champion";

        placeholder.append(
            icon,
            text
        );

        media.appendChild(
            placeholder
        );

        const details =
            document.createElement(
                "div"
            );

        const week =
            document.createElement(
                "p"
            );

        week.className =
            "sparkd-home-champion-week";

        week.textContent =
            "MEME OF THE WEEK";

        const title =
            document.createElement(
                "h3"
            );

        title.className =
            "sparkd-home-champion-title";

        title.textContent =
            "Champion Coming Soon";

        const copy =
            document.createElement(
                "p"
            );

        copy.className =
            "sparkd-home-champion-copy";

        copy.textContent =
            "When the current contest names an official winner, the champion meme will automatically appear here.";

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "sparkd-home-champion-actions";

        const contestLink =
            document.createElement(
                "a"
            );

        contestLink.className =
            "sparkd-home-champion-button sparkd-home-champion-button-primary";

        contestLink.href =
            CONTEST_PAGE_URL;

        contestLink.textContent =
            "🔥 VIEW MEME OF THE WEEK";

        actions.appendChild(
            contestLink
        );

        details.append(
            week,
            title,
            copy,
            actions
        );

        card.append(
            media,
            details
        );
    }

    ////////////////////////////////////////////////////
    // RENDER — OFFICIAL CHAMPION
    ////////////////////////////////////////////////////

    function renderChampion(
        section,
        champion
    ) {
        const card =
            section.querySelector(
                "[data-champion-card]"
            );

        if (!card) {
            return;
        }

        const contest =
            champion.contest;

        const submission =
            champion.submission;

        const titleText =
            safeText(
                submission
                    .meme_title,
                "SPARKD Champion"
            );

        const imageUrl =
            buildPublicImageUrl(
                submission
                    .meme_image_url
            );

        card.replaceChildren();

        const mediaLink =
            document.createElement(
                "a"
            );

        mediaLink.className =
            "sparkd-home-champion-media";

        mediaLink.href =
            CONTEST_PAGE_URL;

        mediaLink.setAttribute(
            "aria-label",
            "View " +
                titleText +
                " in Meme of the Week"
        );

        if (imageUrl) {
            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "sparkd-home-champion-image";

            image.src =
                imageUrl;

            image.alt =
                titleText +
                " — SPARKD Meme of the Week Champion";

            image.loading =
                "eager";

            image.decoding =
                "async";

            mediaLink.appendChild(
                image
            );
        }
        else {
            const placeholder =
                document.createElement(
                    "div"
                );

            placeholder.className =
                "sparkd-home-champion-placeholder";

            placeholder.textContent =
                "🏆 SPARKD Weekly Champion";

            mediaLink.appendChild(
                placeholder
            );
        }

        const details =
            document.createElement(
                "div"
            );

        const week =
            document.createElement(
                "p"
            );

        week.className =
            "sparkd-home-champion-week";

        week.textContent =
            "🏆 " +
            formatWeek(
                contest.week_start,
                contest.week_end
            );

        const title =
            document.createElement(
                "h3"
            );

        title.className =
            "sparkd-home-champion-title";

        title.textContent =
            titleText;

        const copy =
            document.createElement(
                "p"
            );

        copy.className =
            "sparkd-home-champion-copy";

        copy.textContent =
            "Official SPARKD Meme of the Week champion.";

        details.append(
            week,
            title,
            copy
        );

        const wallet =
            safeText(
                submission
                    .wallet_address,
                ""
            );

        if (wallet) {
            const walletText =
                document.createElement(
                    "span"
                );

            walletText.className =
                "sparkd-home-champion-wallet";

            walletText.textContent =
                "Champion wallet: " +
                wallet.slice(
                    0,
                    6
                ) +
                "…" +
                wallet.slice(
                    -4
                );

            details.appendChild(
                walletText
            );
        }

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "sparkd-home-champion-actions";

        const contestLink =
            document.createElement(
                "a"
            );

        contestLink.className =
            "sparkd-home-champion-button sparkd-home-champion-button-primary";

        contestLink.href =
            CONTEST_PAGE_URL;

        contestLink.textContent =
            "🏆 VIEW CHAMPION";

        const contestHomeLink =
            document.createElement(
                "a"
            );

        contestHomeLink.className =
            "sparkd-home-champion-button sparkd-home-champion-button-secondary";

        contestHomeLink.href =
            CONTEST_PAGE_URL;

        contestHomeLink.textContent =
            "🔥 ENTER MEME OF THE WEEK";

        actions.append(
            contestLink,
            contestHomeLink
        );

        details.appendChild(
            actions
        );

        card.append(
            mediaLink,
            details
        );
    }

    ////////////////////////////////////////////////////
    // REFRESH
    ////////////////////////////////////////////////////

    async function refreshChampion() {
        const section =
            document.getElementById(
                SECTION_ID
            );

        if (!section) {
            return;
        }

        try {
            const champion =
                await getLatestChampion();

            if (!champion) {
                renderWaiting(
                    section
                );

                console.log(
                    "🏆 " +
                    MODULE_NAME +
                    ": no official champion yet."
                );

                return;
            }

            renderChampion(
                section,
                champion
            );

            console.log(
                "🏆 " +
                MODULE_NAME +
                ": champion loaded.",
                {
                    contestId:
                        champion
                            .contest
                            .id,

                    submissionId:
                        champion
                            .submission
                            .id,

                    title:
                        champion
                            .submission
                            .meme_title
                }
            );
        }
        catch (error) {
            // Keep the homepage usable if the champion
            // service is temporarily unavailable.
            renderWaiting(
                section
            );

            console.error(
                "❌ " +
                MODULE_NAME +
                " failed to load:",
                error
            );
        }
    }

    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initialize() {
        installStyles();

        const section =
            createSection();

        mountSection(
            section
        );

        renderWaiting(
            section
        );

        refreshChampion();

        if (refreshTimer) {
            window.clearInterval(
                refreshTimer
            );
        }

        refreshTimer =
            window.setInterval(
                refreshChampion,
                REFRESH_INTERVAL_MS
            );

        console.log(
            "🏆 " +
            MODULE_NAME +
            " v" +
            MODULE_VERSION +
            " loaded."
        );
    }

    ////////////////////////////////////////////////////
    // SAFE GLOBAL HELPER
    //
    // This is intentionally read-only.
    ////////////////////////////////////////////////////

    window.SPARKD_HOME_CHAMPION = {
        refresh:
            refreshChampion,

        version:
            MODULE_VERSION
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
