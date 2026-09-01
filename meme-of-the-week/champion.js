////////////////////////////////////////////////////
// SPARKD HOME PAGE — MEME OF THE WEEK CHAMPION
// champion.js v1.1
//
// PURPOSE
// - Fill the EXISTING homepage ".meme-week-box"
//   with the latest official Meme of the Week image.
// - Do NOT create a new homepage section.
// - Do NOT touch contest submission or burn logic.
//
// HOMEPAGE REQUIREMENT
// Existing HTML must contain:
//
// <div class="meme-week-box">
//     ...
// </div>
//
// INSTALL
// <script src="meme-of-the-week/champion.js"></script>
////////////////////////////////////////////////////

(function () {
    "use strict";

    const MODULE_NAME =
        "SPARKD Homepage Champion";

    const MODULE_VERSION =
        "1.1";

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";

    const STORAGE_BUCKET =
        "sparkd-contest-submissions";

    const BOX_SELECTOR =
        ".meme-week-box";

    const PLACEHOLDER_SELECTOR =
        ".meme-week-placeholder";

    const STYLE_ID =
        "sparkdHomepageChampionStyles";

    const REFRESH_INTERVAL_MS =
        5 * 60 * 1000;

    let refreshTimer =
        null;

    ////////////////////////////////////////////////////
    // STYLE ONLY THE EXISTING HOMEPAGE BOX
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
            ${BOX_SELECTOR}.sparkd-champion-loaded {
                padding: 0 !important;
                overflow: hidden !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            ${BOX_SELECTOR} .sparkd-home-champion-image {
                display: block !important;
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                object-fit: contain !important;
                object-position: center center !important;
                margin: 0 auto !important;
            }

            ${BOX_SELECTOR} .sparkd-home-champion-link {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
            }
        `;

        document.head.appendChild(
            style
        );
    }

    ////////////////////////////////////////////////////
    // READ-ONLY SUPABASE REQUEST
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
                "Champion read failed (" +
                response.status +
                "): " +
                message
            );
        }

        return await response.json();
    }

    ////////////////////////////////////////////////////
    // BUILD PUBLIC STORAGE URL
    ////////////////////////////////////////////////////

    function getPublicImageUrl(
        imagePath
    ) {
        if (
            typeof imagePath !==
                "string" ||
            !imagePath.trim()
        ) {
            return "";
        }

        const path =
            imagePath.trim();

        if (
            /^https?:\/\//i.test(
                path
            )
        ) {
            return path;
        }

        const encoded =
            path
                .split("/")
                .map(
                    function (
                        part
                    ) {
                        return encodeURIComponent(
                            part
                        );
                    }
                )
                .join("/");

        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            STORAGE_BUCKET +
            "/" +
            encoded
        );
    }

    ////////////////////////////////////////////////////
    // GET LATEST OFFICIAL WINNER
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
                    "select=id,meme_title,meme_image_url",
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
    // RESTORE ORIGINAL PLACEHOLDER IF NO CHAMPION
    ////////////////////////////////////////////////////

    function showPlaceholder(
        box
    ) {
        if (
            box.querySelector(
                PLACEHOLDER_SELECTOR
            )
        ) {
            box.classList.remove(
                "sparkd-champion-loaded"
            );

            return;
        }

        box.classList.remove(
            "sparkd-champion-loaded"
        );

        box.innerHTML = `
            <div class="meme-week-placeholder">
                <strong>
                    WINNERS GET THEIR
                    MEME PLACED HERE
                </strong>

                <span>
                    Winners will receive a small amount of Sol
                </span>
            </div>
        `;
    }

    ////////////////////////////////////////////////////
    // FILL EXISTING BOX WITH WHOLE CHAMPION IMAGE
    ////////////////////////////////////////////////////

    function renderChampion(
        box,
        champion
    ) {
        const submission =
            champion.submission;

        const imageUrl =
            getPublicImageUrl(
                submission
                    .meme_image_url
            );

        if (!imageUrl) {
            showPlaceholder(
                box
            );

            return;
        }

        const title =
            (
                typeof submission
                    .meme_title ===
                    "string" &&
                submission
                    .meme_title
                    .trim()
            )
                ? submission
                    .meme_title
                    .trim()
                : "SPARKD Meme of the Week Champion";

        const link =
            document.createElement(
                "a"
            );

        link.className =
            "sparkd-home-champion-link";

        link.href =
            "/meme-of-the-week/";

        link.setAttribute(
            "aria-label",
            "View the SPARKD Meme of the Week champion"
        );

        const image =
            document.createElement(
                "img"
            );

        image.className =
            "sparkd-home-champion-image";

        image.src =
            imageUrl;

        image.alt =
            title;

        image.loading =
            "eager";

        image.decoding =
            "async";

        link.appendChild(
            image
        );

        box.replaceChildren(
            link
        );

        box.classList.add(
            "sparkd-champion-loaded"
        );

        console.log(
            "🏆 " +
            MODULE_NAME +
            ": champion image loaded.",
            {
                title:
                    title,

                submissionId:
                    submission.id,

                image:
                    imageUrl
            }
        );
    }

    ////////////////////////////////////////////////////
    // REFRESH HOMEPAGE CHAMPION
    ////////////////////////////////////////////////////

    async function refreshChampion() {
        const box =
            document.querySelector(
                BOX_SELECTOR
            );

        if (!box) {
            console.warn(
                "⚠️ " +
                MODULE_NAME +
                ": .meme-week-box was not found."
            );

            return;
        }

        try {
            const champion =
                await getLatestChampion();

            if (!champion) {
                showPlaceholder(
                    box
                );

                console.log(
                    "🏆 " +
                    MODULE_NAME +
                    ": no official champion yet."
                );

                return;
            }

            renderChampion(
                box,
                champion
            );
        }
        catch (error) {
            console.error(
                "❌ " +
                MODULE_NAME +
                " failed:",
                error
            );

            // Leave or restore the existing homepage placeholder
            // instead of breaking the hero section.
            showPlaceholder(
                box
            );
        }
    }

    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initialize() {
        installStyles();

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
