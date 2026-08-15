////////////////////////////////////////////////////
// SPARKD WEBSITE STATS
// Developer Upgrade Module
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // CONFIG
    ////////////////////////////////////////////////////

    const SPARKD_STATS = {

        version: "1.0.0",

        storageKey: "sparkdWebsiteStats",

        sessionKey: "sparkdStatsSession",

        enabled: true

    };


    ////////////////////////////////////////////////////
    // INITIALIZE STATS
    ////////////////////////////////////////////////////

    function initializeStats() {

        if (!SPARKD_STATS.enabled) {
            return;
        }


        let stats =
            localStorage.getItem(
                SPARKD_STATS.storageKey
            );


        if (!stats) {

            stats = {

                totalVisits: 0,

                uniqueVisitors: 0,

                pageViews: 0,

                visitsToday: 0,

                visitsThisWeek: 0,

                visitsThisMonth: 0,

                lastVisit: null,

                pages: {},

                devices: {},

                browsers: {},

                operatingSystems: {}

            };


            saveStats(stats);

        }


        recordVisit();

    }


    ////////////////////////////////////////////////////
    // LOAD STATS
    ////////////////////////////////////////////////////

    function loadStats() {

        try {

            const data =
                localStorage.getItem(
                    SPARKD_STATS.storageKey
                );


            if (!data) {

                return {

                    totalVisits: 0,

                    uniqueVisitors: 0,

                    pageViews: 0,

                    visitsToday: 0,

                    visitsThisWeek: 0,

                    visitsThisMonth: 0,

                    lastVisit: null,

                    pages: {},

                    devices: {},

                    browsers: {},

                    operatingSystems: {}

                };

            }


            return JSON.parse(data);


        }
        catch (error) {

            console.error(
                "SPARKD Stats load error:",
                error
            );


            return {

                totalVisits: 0,

                uniqueVisitors: 0,

                pageViews: 0,

                visitsToday: 0,

                visitsThisWeek: 0,

                visitsThisMonth: 0,

                lastVisit: null,

                pages: {},

                devices: {},

                browsers: {},

                operatingSystems: {}

            };

        }

    }


    ////////////////////////////////////////////////////
    // SAVE STATS
    ////////////////////////////////////////////////////

    function saveStats(stats) {

        localStorage.setItem(

            SPARKD_STATS.storageKey,

            JSON.stringify(stats)

        );

    }


    ////////////////////////////////////////////////////
    // RECORD VISIT
    ////////////////////////////////////////////////////

    function recordVisit() {

        const stats =
            loadStats();


        const today =
            new Date()
            .toISOString()
            .split("T")[0];


        const page =
            window.location.pathname;


        ////////////////////////////////////////////////////
        // PAGE VIEW
        ////////////////////////////////////////////////////

        stats.pageViews++;


        ////////////////////////////////////////////////////
        // TOTAL VISIT
        ////////////////////////////////////////////////////

        stats.totalVisits++;


        ////////////////////////////////////////////////////
        // DAILY VISITS
        ////////////////////////////////////////////////////

        if (!stats.daily) {

            stats.daily = {};

        }


        if (!stats.daily[today]) {

            stats.daily[today] = 0;

        }


        stats.daily[today]++;


        ////////////////////////////////////////////////////
        // PAGE TRACKING
        ////////////////////////////////////////////////////

        if (!stats.pages[page]) {

            stats.pages[page] = 0;

        }


        stats.pages[page]++;


        ////////////////////////////////////////////////////
        // DEVICE
        ////////////////////////////////////////////////////

        const device =
            detectDevice();


        if (!stats.devices[device]) {

            stats.devices[device] = 0;

        }


        stats.devices[device]++;


        ////////////////////////////////////////////////////
        // BROWSER
        ////////////////////////////////////////////////////

        const browser =
            detectBrowser();


        if (!stats.browsers[browser]) {

            stats.browsers[browser] = 0;

        }


        stats.browsers[browser]++;


        ////////////////////////////////////////////////////
        // OPERATING SYSTEM
        ////////////////////////////////////////////////////

        const operatingSystem =
            detectOperatingSystem();


        if (!stats.operatingSystems[operatingSystem]) {

            stats.operatingSystems[
                operatingSystem
            ] = 0;

        }


        stats.operatingSystems[
            operatingSystem
        ]++;


        ////////////////////////////////////////////////////
        // LAST VISIT
        ////////////////////////////////////////////////////

        stats.lastVisit =
            new Date().toISOString();


        ////////////////////////////////////////////////////
        // CALCULATED PERIODS
        ////////////////////////////////////////////////////

        stats.visitsToday =
            calculateToday(stats);


        stats.visitsThisWeek =
            calculateThisWeek(stats);


        stats.visitsThisMonth =
            calculateThisMonth(stats);


        saveStats(stats);

    }


    ////////////////////////////////////////////////////
    // CALCULATE TODAY
    ////////////////////////////////////////////////////

    function calculateToday(stats) {

        const today =
            new Date()
            .toISOString()
            .split("T")[0];


        if (!stats.daily) {
            return 0;
        }


        return stats.daily[today] || 0;

    }


    ////////////////////////////////////////////////////
    // CALCULATE THIS WEEK
    ////////////////////////////////////////////////////

    function calculateThisWeek(stats) {

        if (!stats.daily) {
            return 0;
        }


        const now =
            new Date();


        let total = 0;


        for (let i = 0; i < 7; i++) {

            const date =
                new Date(now);


            date.setDate(
                now.getDate() - i
            );


            const key =
                date
                .toISOString()
                .split("T")[0];


            total +=
                stats.daily[key] || 0;

        }


        return total;

    }


    ////////////////////////////////////////////////////
    // CALCULATE THIS MONTH
    ////////////////////////////////////////////////////

    function calculateThisMonth(stats) {

        if (!stats.daily) {
            return 0;
        }


        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");


        let total = 0;


        Object.keys(stats.daily)
        .forEach(function (date) {

            if (
                date.startsWith(
                    year + "-" + month
                )
            ) {

                total +=
                    stats.daily[date];

            }

        });


        return total;

    }


    ////////////////////////////////////////////////////
    // DEVICE DETECTION
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
    // BROWSER DETECTION
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
    // OPERATING SYSTEM
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
            userAgent.includes("Mac OS")
        ) {

            return "macOS";

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
            userAgent.includes("Linux")
        ) {

            return "Linux";

        }


        return "Other";

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_WEBSITE_STATS = {

        initialize:
            initializeStats,


        getStats:
            loadStats,


        refresh:
            function () {

                initializeStats();

                return loadStats();

            },


        clear:
            function () {

                localStorage.removeItem(
                    SPARKD_STATS.storageKey
                );

            }

    };


    ////////////////////////////////////////////////////
    // START
    ////////////////////////////////////////////////////

    initializeStats();


})();
