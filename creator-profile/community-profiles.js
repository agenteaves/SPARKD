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


        /*
         * Supabase connection will be added
         * after we connect this file to the
         * existing SPARKD Supabase project.
         */

        list.innerHTML = `

            <div class="communityProfilesEmpty">

                👥

                <strong>
                    SPARKD Creator Directory
                </strong>

                <span>
                    Community profiles will appear here.
                </span>

            </div>

        `;

    }


    ////////////////////////////////////////////////////
    // VIEW CREATOR PROFILE
    ////////////////////////////////////////////////////

    function viewCreatorProfile(
        creatorId
    ) {

        if (!creatorId)
            return;


        /*
         * The public profile viewer will be
         * connected here.
         */

        console.log(
            "SPARKD: View creator profile:",
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

