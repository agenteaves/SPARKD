////////////////////////////////////////////////////
// SPARKD WEBSITE STATS
// Supabase Website Visitor Tracker
////////////////////////////////////////////////////

(function () {

    "use strict";
    
    ////////////////////////////////////////////////////
    // SUPABASE CONFIG
    ////////////////////////////////////////////////////

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


    ////////////////////////////////////////////////////
    // SUPABASE CLIENT
    ////////////////////////////////////////////////////

    let statsSupabaseClient = null;


    if (
        typeof supabase !== "undefined"
    ) {

        statsSupabaseClient =
            supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

    }

    ////////////////////////////////////////////////////
    // CONFIG
    ////////////////////////////////////////////////////

    const STATS_CONFIG = {

        sessionKey:
            "sparkdWebsiteStatsSession",

        sessionDuration:
            30 * 60 * 1000

    };


    ////////////////////////////////////////////////////
    // CREATE / GET SESSION
    ////////////////////////////////////////////////////

    function getSessionId() {

        const now =
            Date.now();


        const existing =
            localStorage.getItem(
                STATS_CONFIG.sessionKey
            );


        if (existing) {

            try {

                const session =
                    JSON.parse(existing);


                if (
                    session.id &&
                    now - session.created <
                    STATS_CONFIG.sessionDuration
                ) {

                    return session.id;

                }

            }
            catch (error) {

                console.warn(
                    "SPARKD stats session could not be read."
                );

            }

        }


        const newSession = {

            id:
                generateSessionId(),

            created:
                now

        };


        localStorage.setItem(

            STATS_CONFIG.sessionKey,

            JSON.stringify(newSession)

        );


        return newSession.id;

    }


    ////////////////////////////////////////////////////
    // GENERATE SESSION ID
    ////////////////////////////////////////////////////

    function generateSessionId() {

        if (
            window.crypto &&
            crypto.randomUUID
        ) {

            return crypto.randomUUID();

        }


        return (

            Date.now().toString(36)
            +
            "-"
            +
            Math.random()
                .toString(36)
                .substring(2, 12)

        );

    }


    ////////////////////////////////////////////////////
    // DETECT DEVICE
    ////////////////////////////////////////////////////

    function detectDevice() {

        const width =
            window.innerWidth;


        if (width <= 768) {

            return "Mobile";

        }


        if (width <= 1024) {

            return "Tablet";

        }


        return "Desktop";

    }


    ////////////////////////////////////////////////////
    // DETECT BROWSER
    ////////////////////////////////////////////////////

    function detectBrowser() {

        const userAgent =
            navigator.userAgent;


        if (
            userAgent.includes("Edg/")
        ) {

            return "Microsoft Edge";

        }


        if (
            userAgent.includes("OPR/")
        ) {

            return "Opera";

        }


        if (
            userAgent.includes("Chrome")
            &&
            !userAgent.includes("Edg")
        ) {

            return "Google Chrome";

        }


        if (
            userAgent.includes("Firefox")
        ) {

            return "Mozilla Firefox";

        }


        if (
            userAgent.includes("Safari")
            &&
            !userAgent.includes("Chrome")
        ) {

            return "Safari";

        }


        return "Other";

    }


    ////////////////////////////////////////////////////
    // DETECT OPERATING SYSTEM
    ////////////////////////////////////////////////////

    function detectOperatingSystem() {

        const userAgent =
            navigator.userAgent;


        if (
            userAgent.includes("Windows")
        ) {

            return "Windows";

        }


        if (
            userAgent.includes("Android")
        ) {

            return "Android";

        }


        if (
            userAgent.includes("iPhone")
            ||
            userAgent.includes("iPad")
        ) {

            return "iOS";

        }


        if (
            userAgent.includes("Mac OS")
        ) {

            return "macOS";

        }


        if (
            userAgent.includes("Linux")
        ) {

            return "Linux";

        }


        return "Other";

    }


   ////////////////////////////////////////////////////
// SEND VISIT TO SUPABASE
////////////////////////////////////////////////////

async function recordVisit() {

    ////////////////////////////////////////////////////
    // WAIT FOR EXISTING SUPABASE CLIENT
    ////////////////////////////////////////////////////

    let attempts = 0;

    while (
        (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) &&
        attempts < 50
    ) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );

        attempts++;

    }


    ////////////////////////////////////////////////////
    // SUPABASE STILL NOT AVAILABLE
    ////////////////////////////////////////////////////

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {

        console.error(
            "SPARKD Stats: Supabase client could not be initialized."
        );

        return;

    }


    ////////////////////////////////////////////////////
    // CREATE SESSION ID
    ////////////////////////////////////////////////////

    const sessionId =
        getSessionId();


    ////////////////////////////////////////////////////
    // BUILD VISIT DATA
    ////////////////////////////////////////////////////

    const visit = {

        session_id:
            sessionId,

        page:
            window.location.pathname,

        referrer:
            document.referrer || null,

        device:
            detectDevice(),

        browser:
            detectBrowser(),

        operating_system:
            detectOperatingSystem()

    };


    ////////////////////////////////////////////////////
    // SEND VISIT
    ////////////////////////////////////////////////////

    try {

        const { error } =
            await supabaseClient
                .from("website_visits")
                .insert(visit);


        if (error) {

            console.error(
                "SPARKD Stats: visit recording failed:",
                error
            );

            return;

        }


        console.log(
            "SPARKD Stats: visit recorded."
        );


    } catch (err) {

        console.error(
            "SPARKD Stats: visit recording error:",
            err
        );

    }

}

    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_WEBSITE_STATS = {

        recordVisit:
            recordVisit,

        getSessionId:
            getSessionId

    };


    ////////////////////////////////////////////////////
    // START TRACKING
    ////////////////////////////////////////////////////

    recordVisit();


})();
