////////////////////////////////////////////////////
// SPARKD COMMUNITY CREATOR PROFILES
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////

    const COMMUNITY_PROFILE_CONTAINER_ID =
        "sparkdCommunityProfiles";


    ////////////////////////////////////////////////////
    // CREATE COMMUNITY PROFILE BUTTON
    ////////////////////////////////////////////////////

    function createCommunityProfilesButton() {

        const header =
            document.querySelector(
                ".profileHeader"
            );


        if (!header)
            return;


        /*
         * Prevent duplicate buttons.
         */

        if (
            document.getElementById(
                "communityProfilesBtn"
            )
        ) {

            return;

        }


        const button =
            document.createElement(
                "button"
            );


        button.id =
            "communityProfilesBtn";


        button.className =
            "profileNavButton";


        button.type =
            "button";


        button.textContent =
            "👥 SPARKD Creators ▼";


        header.appendChild(
            button
        );


        button.addEventListener(
            "click",
            toggleCommunityProfiles
        );

    }


    ////////////////////////////////////////////////////
    // CREATE DROPDOWN
    ////////////////////////////////////////////////////

    function createCommunityProfilesDropdown() {

        if (
            document.getElementById(
                COMMUNITY_PROFILE_CONTAINER_ID
            )
        ) {

            return;

        }


        const container =
            document.createElement(
                "div"
            );


        container.id =
            COMMUNITY_PROFILE_CONTAINER_ID;


        container.className =
            "communityProfilesDropdown";


        container.innerHTML = `

            <div class="communityProfilesHeader">

                <strong>
                    🔥 SPARKD CREATORS
                </strong>

                <button
                    type="button"
                    id="closeCommunityProfiles"
                >
                    ✕
                </button>

            </div>


            <div
                id="communityProfilesList"
                class="communityProfilesList"
            >

                <div class="communityProfilesLoading">

                    🔄 Loading SPARKD creators...

                </div>

            </div>

        `;


        document.body.appendChild(
            container
        );


        const closeButton =
            document.getElementById(
                "closeCommunityProfiles"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeCommunityProfiles
            );

        }

    }


    ////////////////////////////////////////////////////
    // TOGGLE DROPDOWN
    ////////////////////////////////////////////////////

    function toggleCommunityProfiles() {

        createCommunityProfilesDropdown();


        const dropdown =
            document.getElementById(
                COMMUNITY_PROFILE_CONTAINER_ID
            );


        if (!dropdown)
            return;


        const isOpen =
            dropdown.classList.contains(
                "open"
            );


        if (isOpen) {

            closeCommunityProfiles();

        }
        else {

            openCommunityProfiles();

        }

    }


    ////////////////////////////////////////////////////
    // OPEN DROPDOWN
    ////////////////////////////////////////////////////

    function openCommunityProfiles() {

        const dropdown =
            document.getElementById(
                COMMUNITY_PROFILE_CONTAINER_ID
            );


        if (!dropdown)
            return;


        dropdown.classList.add(
            "open"
        );


        loadCommunityProfiles();

    }


    ////////////////////////////////////////////////////
    // CLOSE DROPDOWN
    ////////////////////////////////////////////////////

    function closeCommunityProfiles() {

        const dropdown =
            document.getElementById(
                COMMUNITY_PROFILE_CONTAINER_ID
            );


        if (!dropdown)
            return;


        dropdown.classList.remove(
            "open"
        );

    }


    ////////////////////////////////////////////////////
    // LOAD COMMUNITY PROFILES
    ////////////////////////////////////////////////////

   async function loadCommunityProfiles() {

    const list =
        document.getElementById(
            "communityProfilesList"
        );


    if (!list)
        return;


    list.innerHTML = `

        <div class="communityProfilesLoading">

            🔄 Loading SPARKD creators...

        </div>

    `;


    ////////////////////////////////////////////////////
    // SUPABASE CLIENT
    ////////////////////////////////////////////////////

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";


    const SUPABASE_ANON_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


    if (
        typeof window.supabase === "undefined" ||
        typeof window.supabase.createClient !== "function"
    ) {

        list.innerHTML = `

            <div class="communityProfilesEmpty">

                🚫 Community directory unavailable.

            </div>

        `;

        console.error(
            "SPARKD Community Profiles: Supabase is not available."
        );

        return;

    }


    const communitySupabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    ////////////////////////////////////////////////////
    // LOAD PUBLIC CREATOR PROFILES
    ////////////////////////////////////////////////////

    try {

        const {
            data,
            error
        } =
            await communitySupabase
                .from("creator_profiles")
                .select(
                    "creator_id,display_name,username,profile_image,creator_level,spark_points,memes_created,missions_completed,creator_rank,joined_date"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "SPARKD Community Profiles database error:",
                error
            );


            list.innerHTML = `

                <div class="communityProfilesEmpty">

                    🚫 Could not load creator directory.

                </div>

            `;

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            list.innerHTML = `

                <div class="communityProfilesEmpty">

                    👥

                    <strong>
                        No SPARKD creators yet.
                    </strong>

                    <span>
                        Be the first creator to register!
                    </span>

                </div>

            `;

            return;

        }


        ////////////////////////////////////////////////////
        // BUILD CREATOR LIST
        ////////////////////////////////////////////////////

        list.innerHTML = "";


        data.forEach(
            function (creator) {

                const card =
                    document.createElement(
                        "button"
                    );


                card.type =
                    "button";


                card.className =
                    "communityCreatorCard";


                card.dataset.creatorId =
                    creator.creator_id;


                const image =
                    creator.profile_image
                    ?

                    `<img
                        src="${creator.profile_image}"
                        alt="Creator profile"
                    >`

                    :

                    `<div
                        class="communityCreatorPlaceholder"
                    >
                        ⚡
                    </div>`;


                card.innerHTML = `

                    <div class="communityCreatorImage">

                        ${image}

                    </div>


                    <div class="communityCreatorInfo">

                        <strong>
                            ${creator.display_name || "SPARKD Creator"}
                        </strong>

                        <span>
                            @${creator.username || "creator"}
                        </span>

                        <small>
                            ${creator.creator_rank || "Meme Rookie"}
                        </small>

                    </div>


                    <div class="communityCreatorArrow">

                        👁️

                    </div>

                `;


                card.addEventListener(
                    "click",
                    function () {

                        viewCreatorProfile(
                            creator.creator_id
                        );

                    }
                );


                list.appendChild(
                    card
                );

            }
        );


        console.log(
            "👥 SPARKD Community Profiles loaded:",
            data.length
        );

    }
    catch (error) {

        console.error(
            "SPARKD Community Profiles failed:",
            error
        );


        list.innerHTML = `

            <div class="communityProfilesEmpty">

                🚫 Unable to load creator directory.

            </div>

        `;

    }

}

   ////////////////////////////////////////////////////
// VIEW CREATOR PROFILE
////////////////////////////////////////////////////

function viewCreatorProfile(
    creatorId
) {

    if (!creatorId)
        return;


    console.log(
        "👁️ SPARKD: Opening creator profile:",
        creatorId
    );


    window.location.href =
        "index.html?creator=" +
        encodeURIComponent(
            creatorId
        );

}


    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initializeCommunityProfiles() {

        createCommunityProfilesButton();

        createCommunityProfilesDropdown();


        console.log(
            "👥 SPARKD Community Profiles loaded."
        );

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_COMMUNITY_PROFILES = {

        open:
            openCommunityProfiles,

        close:
            closeCommunityProfiles,

        reload:
            loadCommunityProfiles,

        view:
            viewCreatorProfile

    };


    ////////////////////////////////////////////////////
    // START
    ////////////////////////////////////////////////////

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeCommunityProfiles
        );

    }
    else {

        initializeCommunityProfiles();

    }


})();

