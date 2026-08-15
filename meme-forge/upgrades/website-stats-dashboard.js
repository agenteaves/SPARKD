////////////////////////////////////////////////////
// SPARKD WEBSITE STATS DASHBOARD
// Supabase Statistics Dashboard
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // OPEN DASHBOARD
    ////////////////////////////////////////////////////

    async function openWebsiteStats() {

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


                <div
                    id="statsLoading"
                    class="statsLoading"
                >
                    Loading statistics...
                </div>


                <div
                    id="statsError"
                    class="statsError"
                    style="display:none;"
                >
                </div>


                <div
                    id="statsDashboardContent"
                    style="display:none;"
                >


                    <div class="statsGrid">


                        <div class="statCard">

                            <div class="statTitle">
                                👥 Unique Visitors
                            </div>

                            <div
                                class="statValue"
                                id="statsUniqueVisitors"
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


                    </div>



                    <div class="statsSection">

                        <h3>
                            📄 Top Pages
                        </h3>

                        <div id="statsPages">
                        </div>

                    </div>



                    <div class="statsSection">

                        <h3>
                            💻 Devices
                        </h3>

                        <div id="statsDevices">
                        </div>

                    </div>



                    <div class="statsSection">

                        <h3>
                            🌐 Browsers
                        </h3>

                        <div id="statsBrowsers">
                        </div>

                    </div>



                    <div class="statsSection">

                        <h3>
                            🖥 Operating Systems
                        </h3>

                        <div id="statsOperatingSystems">
                        </div>

                    </div>



                    <div class="statsSection">

                        <h3>
                            🔗 Referrers
                        </h3>

                        <div id="statsReferrers">
                        </div>

                    </div>



                    <div class="statsActions">

                        <button
                            id="refreshWebsiteStats"
                        >
                            🔄 Refresh Stats
                        </button>

                    </div>


                </div>

            </div>

        `;


        document.body.appendChild(
            dashboard
        );


        addDashboardStyles();


        ////////////////////////////////////////////////////
        // CLOSE
        ////////////////////////////////////////////////////

        document.getElementById(
            "closeWebsiteStats"
        ).onclick = function () {

            dashboard.remove();

        };


        ////////////////////////////////////////////////////
        // LOAD DATA
        ////////////////////////////////////////////////////

        await loadWebsiteStats();

    }


   ////////////////////////////////////////////////////
// LOAD SUPABASE STATS
////////////////////////////////////////////////////

async function loadWebsiteStats() {

    const loading =
        document.getElementById(
            "statsLoading"
        );


    const errorBox =
        document.getElementById(
            "statsError"
        );


    const content =
        document.getElementById(
            "statsDashboardContent"
        );


    if (
        !loading ||
        !errorBox ||
        !content
    ) {

        return;

    }


    loading.style.display =
        "block";


    errorBox.style.display =
        "none";


    content.style.display =
        "none";


    ////////////////////////////////////////////////////
    // CHECK STATS SUPABASE CLIENT
    ////////////////////////////////////////////////////

    const statsClient =
        window.SPARKD_WEBSITE_STATS
            ?.supabaseClient;


    if (!statsClient) {

        showStatsError(
            "Supabase connection is not available."
        );

        return;

    }


    ////////////////////////////////////////////////////
    // LOAD STATISTICS
    ////////////////////////////////////////////////////

    try {

        const { data, error } =
            await statsClient
                .rpc(
                    "get_website_stats"
                );


        ////////////////////////////////////////////////////
        // CHECK RPC ERROR
        ////////////////////////////////////////////////////

        if (error) {

            console.error(
                "SPARKD Stats RPC error:",
                error
            );


            showStatsError(
                "Could not load website statistics."
            );


            return;

        }


        ////////////////////////////////////////////////////
        // CHECK DATA
        ////////////////////////////////////////////////////

        if (!data) {

            showStatsError(
                "No statistics were returned."
            );


            return;

        }


        ////////////////////////////////////////////////////
        // UPDATE OVERVIEW
        ////////////////////////////////////////////////////

        document.getElementById(
            "statsUniqueVisitors"
        ).textContent =
            data.uniqueVisitors || 0;


        document.getElementById(
            "statsPageViews"
        ).textContent =
            data.totalPageViews || 0;


        document.getElementById(
            "statsToday"
        ).textContent =
            data.visitsToday || 0;


        document.getElementById(
            "statsWeek"
        ).textContent =
            data.visitsThisWeek || 0;


        document.getElementById(
            "statsMonth"
        ).textContent =
            data.visitsThisMonth || 0;


        ////////////////////////////////////////////////////
        // UPDATE LISTS
        ////////////////////////////////////////////////////

        renderTopPages(
            data.topPages
        );


        renderDevices(
            data.devices
        );


        renderBrowsers(
            data.browsers
        );


        renderOperatingSystems(
            data.operatingSystems
        );


        renderReferrers(
            data.referrers
        );


        ////////////////////////////////////////////////////
        // SHOW DASHBOARD
        ////////////////////////////////////////////////////

        loading.style.display =
            "none";


        content.style.display =
            "block";


        ////////////////////////////////////////////////////
        // REFRESH BUTTON
        ////////////////////////////////////////////////////

        const refreshButton =
            document.getElementById(
                "refreshWebsiteStats"
            );


        if (refreshButton) {

            refreshButton.onclick =
                loadWebsiteStats;

        }

    }
    catch (err) {

        console.error(
            "SPARKD Stats error:",
            err
        );


        showStatsError(
            "Unexpected error loading statistics."
        );

    }

}

    ////////////////////////////////////////////////////
    // ERROR DISPLAY
    ////////////////////////////////////////////////////

    function showStatsError(message) {

        const loading =
            document.getElementById(
                "statsLoading"
            );


        const errorBox =
            document.getElementById(
                "statsError"
            );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.textContent =
                message;

            errorBox.style.display =
                "block";

        }

    }


    ////////////////////////////////////////////////////
    // TOP PAGES
    ////////////////////////////////////////////////////

    function renderTopPages(data) {

        const element =
            document.getElementById(
                "statsPages"
            );


        if (!element) {
            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            element.innerHTML =
                "<div class='statsEmpty'>No page data yet.</div>";

            return;

        }


        element.innerHTML =
            data
            .map(function (item) {

                return `

                    <div class="statsRow">

                        <span>
                            ${escapeHTML(
                                item.page
                            )}
                        </span>

                        <strong>
                            ${item.views}
                        </strong>

                    </div>

                `;

            })
            .join("");

    }


    ////////////////////////////////////////////////////
    // DEVICES
    ////////////////////////////////////////////////////

    function renderDevices(data) {

        renderCountList(
            "statsDevices",
            data,
            "device"
        );

    }


    ////////////////////////////////////////////////////
    // BROWSERS
    ////////////////////////////////////////////////////

    function renderBrowsers(data) {

        renderCountList(
            "statsBrowsers",
            data,
            "browser"
        );

    }


    ////////////////////////////////////////////////////
    // OPERATING SYSTEMS
    ////////////////////////////////////////////////////

    function renderOperatingSystems(data) {

        renderCountList(
            "statsOperatingSystems",
            data,
            "operatingSystem"
        );

    }


    ////////////////////////////////////////////////////
    // REFERRERS
    ////////////////////////////////////////////////////

    function renderReferrers(data) {

        const element =
            document.getElementById(
                "statsReferrers"
            );


        if (!element) {
            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            element.innerHTML =
                "<div class='statsEmpty'>No referrer data yet.</div>";

            return;

        }


        element.innerHTML =
            data
            .map(function (item) {

                return `

                    <div class="statsRow">

                        <span>
                            ${escapeHTML(
                                item.referrer
                            )}
                        </span>

                        <strong>
                            ${item.count}
                        </strong>

                    </div>

                `;

            })
            .join("");

    }


    ////////////////////////////////////////////////////
    // GENERIC COUNT LIST
    ////////////////////////////////////////////////////

    function renderCountList(
        elementId,
        data,
        nameKey
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
            data.length === 0
        ) {

            element.innerHTML =
                "<div class='statsEmpty'>No data yet.</div>";

            return;

        }


        element.innerHTML =
            data
            .map(function (item) {

                return `

                    <div class="statsRow">

                        <span>
                            ${escapeHTML(
                                item[nameKey]
                            )}
                        </span>

                        <strong>
                            ${item.count}
                        </strong>

                    </div>

                `;

            })
            .join("");

    }


    ////////////////////////////////////////////////////
    // HTML SECURITY
    ////////////////////////////////////////////////////

    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

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
                    rgba(0, 0, 0, 0.97);

                color: white;

                font-family:
                    Arial, sans-serif;

                overflow-y: auto;

            }


            .statsHeader {

                position: sticky;

                top: 0;

                z-index: 2;

                display: flex;

                justify-content:
                    space-between;

                align-items: center;

                padding:
                    18px 24px;

                background:
                    #111;

                border-bottom:
                    1px solid #333;

                font-size:
                    21px;

                font-weight:
                    bold;

            }


            .statsHeader button {

                border:
                    none;

                background:
                    transparent;

                color:
                    white;

                font-size:
                    20px;

                cursor:
                    pointer;

            }


            .statsContent {

                max-width:
                    1100px;

                margin:
                    auto;

                padding:
                    25px;

            }


            .statsGrid {

                display:
                    grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(
                            180px,
                            1fr
                        )
                    );

                gap:
                    15px;

                margin-bottom:
                    25px;

            }


            .statCard {

                background:
                    #181818;

                border:
                    1px solid #333;

                border-radius:
                    12px;

                padding:
                    20px;

            }


            .statTitle {

                color:
                    #aaa;

                font-size:
                    14px;

                margin-bottom:
                    10px;

            }


            .statValue {

                font-size:
                    30px;

                font-weight:
                    bold;

            }


            .statsSection {

                background:
                    #181818;

                border:
                    1px solid #333;

                border-radius:
                    12px;

                padding:
                    20px;

                margin-bottom:
                    15px;

            }


            .statsSection h3 {

                margin-top:
                    0;

                margin-bottom:
                    15px;

            }


            .statsRow {

                display:
                    flex;

                justify-content:
                    space-between;

                align-items:
                    center;

                padding:
                    10px 0;

                border-bottom:
                    1px solid #292929;

                gap:
                    20px;

            }


            .statsRow:last-child {

                border-bottom:
                    none;

            }


            .statsEmpty {

                color:
                    #888;

            }


            .statsLoading {

                text-align:
                    center;

                padding:
                    60px 20px;

                color:
                    #aaa;

                font-size:
                    18px;

            }


            .statsError {

                text-align:
                    center;

                padding:
                    60px 20px;

                color:
                    #ff6a00;

                font-size:
                    18px;

            }


            .statsActions {

                display:
                    flex;

                gap:
                    10px;

                margin-top:
                    20px;

            }


            .statsActions button {

                border:
                    none;

                border-radius:
                    8px;

                padding:
                    11px 16px;

                cursor:
                    pointer;

                font-weight:
                    bold;

                background:
                    #ff6a00;

                color:
                    white;

            }


            @media (
                max-width: 600px
            ) {

                .statsContent {

                    padding:
                        15px;

                }


                .statsHeader {

                    padding:
                        15px;

                    font-size:
                        18px;

                }


                .statsGrid {

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(
                                0,
                                1fr
                            )
                        );

                }


                .statCard {

                    padding:
                        15px;

                }


                .statValue {

                    font-size:
                        24px;

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
