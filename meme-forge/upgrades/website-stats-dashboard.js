////////////////////////////////////////////////////
// SPARKD WEBSITE STATS DASHBOARD
// Developer Upgrade Module
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // OPEN DASHBOARD
    ////////////////////////////////////////////////////

    function openWebsiteStats() {

        if (
            document.getElementById(
                "sparkdWebsiteStatsDashboard"
            )
        ) {

            return;

        }


        const dashboard =
            document.createElement("div");


        dashboard.id =
            "sparkdWebsiteStatsDashboard";


        dashboard.innerHTML = `

            <div class="statsHeader">

                <div>
                    📊 SPARKD Website Stats
                </div>

                <button id="closeWebsiteStats">
                    ✖
                </button>

            </div>


            <div class="statsContent">


                <div class="statsGrid">


                    <div class="statCard">

                        <div class="statTitle">
                            👥 Total Visits
                        </div>

                        <div
                            class="statValue"
                            id="statsTotalVisits"
                        >
                            0
                        </div>

                    </div>



                    <div class="statCard">

                        <div class="statTitle">
                            📄 Page Views
                        </div>

                        <div
                            class="statValue"
                            id="statsPageViews"
                        >
                            0
                        </div>

                    </div>



                    <div class="statCard">

                        <div class="statTitle">
                            📅 Today
                        </div>

                        <div
                            class="statValue"
                            id="statsToday"
                        >
                            0
                        </div>

                    </div>



                    <div class="statCard">

                        <div class="statTitle">
                            📈 This Week
                        </div>

                        <div
                            class="statValue"
                            id="statsWeek"
                        >
                            0
                        </div>

                    </div>



                    <div class="statCard">

                        <div class="statTitle">
                            🗓 This Month
                        </div>

                        <div
                            class="statValue"
                            id="statsMonth"
                        >
                            0
                        </div>

                    </div>



                    <div class="statCard">

                        <div class="statTitle">
                            🕐 Last Visit
                        </div>

                        <div
                            class="statValue statSmall"
                            id="statsLastVisit"
                        >
                            —
                        </div>

                    </div>


                </div>



                <div class="statsSection">

                    <h3>
                        📄 Top Pages
                    </h3>

                    <div id="statsPages">
                        No data yet.
                    </div>

                </div>



                <div class="statsSection">

                    <h3>
                        💻 Devices
                    </h3>

                    <div id="statsDevices">
                        No data yet.
                    </div>

                </div>



                <div class="statsSection">

                    <h3>
                        🌐 Browsers
                    </h3>

                    <div id="statsBrowsers">
                        No data yet.
                    </div>

                </div>



                <div class="statsSection">

                    <h3>
                        🖥 Operating Systems
                    </h3>

                    <div id="statsOperatingSystems">
                        No data yet.
                    </div>

                </div>



                <div class="statsActions">

                    <button
                        id="refreshWebsiteStats"
                    >
                        🔄 Refresh Stats
                    </button>


                    <button
                        id="clearWebsiteStats"
                    >
                        🗑 Clear Local Stats
                    </button>

                </div>


            </div>

        `;


        document.body.appendChild(
            dashboard
        );


        addDashboardStyles();


        updateDashboard();


        ////////////////////////////////////////////////////
        // CLOSE
        ////////////////////////////////////////////////////

        document.getElementById(
            "closeWebsiteStats"
        ).onclick = function () {

            dashboard.remove();

        };


        ////////////////////////////////////////////////////
        // REFRESH
        ////////////////////////////////////////////////////

        document.getElementById(
            "refreshWebsiteStats"
        ).onclick = function () {

            updateDashboard();

        };


        ////////////////////////////////////////////////////
        // CLEAR
        ////////////////////////////////////////////////////

        document.getElementById(
            "clearWebsiteStats"
        ).onclick = function () {

            const confirmClear =
                confirm(
                    "Clear the local SPARKD website statistics?"
                );


            if (!confirmClear) {
                return;
            }


            if (
                window.SPARKD_WEBSITE_STATS
            ) {

                window.SPARKD_WEBSITE_STATS.clear();

            }


            updateDashboard();

        };

    }


    ////////////////////////////////////////////////////
    // UPDATE DASHBOARD
    ////////////////////////////////////////////////////

    function updateDashboard() {

        if (
            !window.SPARKD_WEBSITE_STATS
        ) {

            console.error(
                "SPARKD Website Stats module not loaded."
            );

            return;

        }


        const stats =
            window.SPARKD_WEBSITE_STATS
            .getStats();


        document.getElementById(
            "statsTotalVisits"
        ).textContent =
            stats.totalVisits || 0;


        document.getElementById(
            "statsPageViews"
        ).textContent =
            stats.pageViews || 0;


        document.getElementById(
            "statsToday"
        ).textContent =
            stats.visitsToday || 0;


        document.getElementById(
            "statsWeek"
        ).textContent =
            stats.visitsThisWeek || 0;


        document.getElementById(
            "statsMonth"
        ).textContent =
            stats.visitsThisMonth || 0;


        document.getElementById(
            "statsLastVisit"
        ).textContent =
            formatDate(
                stats.lastVisit
            );


        renderList(
            "statsPages",
            stats.pages
        );


        renderList(
            "statsDevices",
            stats.devices
        );


        renderList(
            "statsBrowsers",
            stats.browsers
        );


        renderList(
            "statsOperatingSystems",
            stats.operatingSystems
        );

    }


    ////////////////////////////////////////////////////
    // RENDER LIST
    ////////////////////////////////////////////////////

    function renderList(
        elementId,
        data
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {
            return;
        }


        if (
            !data ||
            Object.keys(data).length === 0
        ) {

            element.innerHTML =
                "<div class='statsEmpty'>No data yet.</div>";

            return;

        }


        const entries =
            Object.entries(data)
            .sort(
                function (a, b) {

                    return b[1] - a[1];

                }
            );


        element.innerHTML =
            entries
            .map(
                function (entry) {

                    return `

                        <div class="statsRow">

                            <span>
                                ${escapeHTML(entry[0])}
                            </span>

                            <strong>
                                ${entry[1]}
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

    }


    ////////////////////////////////////////////////////
    // DATE FORMAT
    ////////////////////////////////////////////////////

    function formatDate(date) {

        if (!date) {
            return "—";
        }


        try {

            return new Date(date)
                .toLocaleString();

        }
        catch (error) {

            return "—";

        }

    }


    ////////////////////////////////////////////////////
    // HTML SECURITY
    ////////////////////////////////////////////////////

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    ////////////////////////////////////////////////////
    // DASHBOARD CSS
    ////////////////////////////////////////////////////

    function addDashboardStyles() {

        if (
            document.getElementById(
                "sparkdWebsiteStatsStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement("style");


        style.id =
            "sparkdWebsiteStatsStyles";


        style.textContent = `

            #sparkdWebsiteStatsDashboard {

                position: fixed;

                inset: 0;

                z-index: 999999;

                background:
                    rgba(0, 0, 0, 0.96);

                color: white;

                font-family:
                    Arial, sans-serif;

                overflow-y: auto;

            }


            .statsHeader {

                position: sticky;

                top: 0;

                display: flex;

                justify-content: space-between;

                align-items: center;

                padding: 18px 24px;

                background: #111;

                border-bottom:
                    1px solid #333;

                font-size: 21px;

                font-weight: bold;

            }


            .statsHeader button {

                border: none;

                background: transparent;

                color: white;

                font-size: 20px;

                cursor: pointer;

            }


            .statsContent {

                max-width: 1100px;

                margin: auto;

                padding: 25px;

            }


            .statsGrid {

                display: grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(180px, 1fr)
                    );

                gap: 15px;

                margin-bottom: 25px;

            }


            .statCard {

                background: #181818;

                border:
                    1px solid #333;

                border-radius: 12px;

                padding: 20px;

                box-sizing: border-box;

            }


            .statTitle {

                color: #aaa;

                font-size: 14px;

                margin-bottom: 10px;

            }


            .statValue {

                font-size: 30px;

                font-weight: bold;

            }


            .statSmall {

                font-size: 15px;

                line-height: 1.4;

            }


            .statsSection {

                background: #181818;

                border:
                    1px solid #333;

                border-radius: 12px;

                padding: 20px;

                margin-bottom: 15px;

            }


            .statsSection h3 {

                margin-top: 0;

                margin-bottom: 15px;

            }


            .statsRow {

                display: flex;

                justify-content: space-between;

                align-items: center;

                padding: 10px 0;

                border-bottom:
                    1px solid #292929;

            }


            .statsRow:last-child {

                border-bottom: none;

            }


            .statsEmpty {

                color: #888;

            }


            .statsActions {

                display: flex;

                gap: 10px;

                flex-wrap: wrap;

                margin-top: 20px;

            }


            .statsActions button {

                border: none;

                border-radius: 8px;

                padding: 11px 16px;

                cursor: pointer;

                font-weight: bold;

            }


            #refreshWebsiteStats {

                background: #ff6a00;

                color: white;

            }


            #clearWebsiteStats {

                background: #333;

                color: white;

            }


            @media (
                max-width: 600px
            ) {

                .statsContent {

                    padding: 15px;

                }


                .statsHeader {

                    padding: 15px;

                    font-size: 18px;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_WEBSITE_STATS_DASHBOARD = {

        open:
            openWebsiteStats

    };


})();
