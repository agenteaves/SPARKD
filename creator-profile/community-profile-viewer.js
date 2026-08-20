////////////////////////////////////////////////////
// SPARKD COMMUNITY PROFILE VIEWER
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // SUPABASE CONFIGURATION
    ////////////////////////////////////////////////////

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";


    const SUPABASE_ANON_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


    ////////////////////////////////////////////////////
    // GET CREATOR ID FROM URL
    ////////////////////////////////////////////////////

    function getRequestedCreatorId() {

        const params =
            new URLSearchParams(
                window.location.search
            );


        return params.get(
            "creator"
        );

    }


    ////////////////////////////////////////////////////
    // LOAD CREATOR FROM SUPABASE
    ////////////////////////////////////////////////////

    async function loadCreatorProfile(
        creatorId
    ) {

        if (!creatorId)
            return;


        if (
            typeof window.supabase === "undefined" ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.error(
                "SPARKD Profile Viewer: Supabase is not available."
            );

            return;

        }


        const viewerSupabase =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );


        try {

            const {
                data,
                error
            } =
                await viewerSupabase
                    .from("creator_profiles")
                    .select(
                        "creator_id,display_name,username,bio,profile_image,creator_level,spark_points,memes_created,missions_completed,creator_rank,joined_date"
                    )
                    .eq(
                        "creator_id",
                        creatorId
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "SPARKD Profile Viewer database error:",
                    error
                );

                return;

            }


            if (!data) {

                console.warn(
                    "SPARKD Profile Viewer: Creator not found:",
                    creatorId
                );

                return;

            }


            ////////////////////////////////////////////////////
            // WAIT FOR CREATOR PROFILE INTERFACE
            ////////////////////////////////////////////////////

            waitForProfileInterface(
                data
            );

        }
        catch (error) {

            console.error(
                "SPARKD Profile Viewer failed:",
                error
            );

        }

    }


////////////////////////////////////////////////////
// WAIT FOR PROFILE INTERFACE
////////////////////////////////////////////////////

function waitForProfileInterface(
    creator
) {

    let attempts = 0;


    const timer =
        setInterval(
            function () {

                attempts++;


                const profilePage =
                    document.getElementById(
                        "sparkdProfilePage"
                    );


                const displayName =
                    document.getElementById(
                        "displayNameInput"
                    );


                const username =
                    document.getElementById(
                        "usernameInput"
                    );


                const bio =
                    document.getElementById(
                        "bioInput"
                    );


                /*
                 * Wait until creator-profile.js
                 * has finished building the page.
                 */

                if (
                    profilePage &&
                    displayName &&
                    username &&
                    bio
                ) {

                    clearInterval(
                        timer
                    );


                    console.log(
                        "👁️ SPARKD Profile Viewer: Profile interface ready."
                    );


                    activateViewOnlyMode(
                        creator
                    );


                    return;

                }


                /*
                 * Keep trying for up to 20 seconds.
                 */

                if (
                    attempts >= 200
                ) {

                    clearInterval(
                        timer
                    );


                    console.error(
                        "SPARKD Profile Viewer: Timed out waiting for profile interface."
                    );

                }

            },
            100
        );

}

    ////////////////////////////////////////////////////
    // ACTIVATE VIEW-ONLY MODE
    ////////////////////////////////////////////////////

    function activateViewOnlyMode(
        creator
    ) {

        console.log(
            "👁️ SPARKD Viewing creator profile:",
            creator.creator_id
        );


        ////////////////////////////////////////////////////
        // DISPLAY CREATOR INFORMATION
        ////////////////////////////////////////////////////

        const displayName =
            document.getElementById(
                "displayNameInput"
            );


        const username =
            document.getElementById(
                "usernameInput"
            );


        const bio =
            document.getElementById(
                "bioInput"
            );


        if (displayName) {

            displayName.value =
                creator.display_name ||
                "SPARKD Creator";

        }


        if (username) {

            username.value =
                creator.username ||
                "creator";

        }


        if (bio) {

            bio.value =
                creator.bio ||
                "";

        }


        ////////////////////////////////////////////////////
        // PROFILE IMAGE
        ////////////////////////////////////////////////////

        const preview =
            document.getElementById(
                "profileImagePreview"
            );


        if (
            preview &&
            creator.profile_image
        ) {

            preview.innerHTML = `

                <img
                    src="${creator.profile_image}"
                    alt="SPARKD Creator Profile"
                >

            `;

        }


        ////////////////////////////////////////////////////
        // CREATOR STATS
        ////////////////////////////////////////////////////

        setText(
            "creatorLevel",
            creator.creator_level ||
            "Level 1 - Meme Rookie"
        );


        setText(
            "sparkPoints",
            Number(
                creator.spark_points
            ) || 0
        );


        setText(
            "memesCreated",
            Number(
                creator.memes_created
            ) || 0
        );


        setText(
            "missionsCompleted",
            Number(
                creator.missions_completed
            ) || 0
        );


        setText(
            "creatorRank",
            creator.creator_rank ||
            "Meme Rookie"
        );


        setText(
            "joinedDate",
            creator.joined_date ||
            "--"
        );


        ////////////////////////////////////////////////////
        // DISABLE EDITING
        ////////////////////////////////////////////////////

        if (displayName) {

            displayName.readOnly =
                true;

        }


        if (username) {

            username.readOnly =
                true;

        }


        if (bio) {

            bio.readOnly =
                true;

        }


        ////////////////////////////////////////////////////
        // HIDE EDIT CONTROLS
        ////////////////////////////////////////////////////

        const saveButton =
            document.getElementById(
                "saveProfileBtn"
            );


        if (saveButton) {

            saveButton.style.display =
                "none";

        }


        const uploadButton =
            document.querySelector(
                ".uploadProfileButton"
            );


        if (uploadButton) {

            uploadButton.style.display =
                "none";

        }


        const imageInput =
            document.getElementById(
                "profileImageInput"
            );


        if (imageInput) {

            imageInput.disabled =
                true;

        }


        ////////////////////////////////////////////////////
        // CHANGE PAGE TITLE
        ////////////////////////////////////////////////////

        const logo =
            document.querySelector(
                ".profileLogo"
            );


        if (logo) {

            logo.innerHTML = `

                🔥 SPARKD

                <span>
                    CREATOR PROFILE — VIEWING
                </span>

            `;

        }


        ////////////////////////////////////////////////////
        // CHANGE HOLDER BADGE
        ////////////////////////////////////////////////////

        const holderBadge =
            document.getElementById(
                "holderBadge"
            );


        if (holderBadge) {

            holderBadge.textContent =
                "👁️ SPARKD CREATOR PROFILE";

        }


        ////////////////////////////////////////////////////
        // ADD BACK BUTTON
        ////////////////////////////////////////////////////

        createBackButton();


        ////////////////////////////////////////////////////
        // LOCK PROFILE INPUTS VISUALLY
        ////////////////////////////////////////////////////

        if (displayName)
            displayName.style.cursor =
                "default";


        if (username)
            username.style.cursor =
                "default";


        if (bio)
            bio.style.cursor =
                "default";

    }


    ////////////////////////////////////////////////////
    // SET TEXT HELPER
    ////////////////////////////////////////////////////

    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (element) {

            element.textContent =
                value;

        }

    }


    ////////////////////////////////////////////////////
    // BACK TO COMMUNITY PROFILES
    ////////////////////////////////////////////////////

    function createBackButton() {

        if (
            document.getElementById(
                "communityViewerBackBtn"
            )
        ) {

            return;

        }


        const header =
            document.querySelector(
                ".profileHeader"
            );


        if (!header)
            return;


        const button =
            document.createElement(
                "button"
            );


        button.id =
            "communityViewerBackBtn";


        button.type =
            "button";


        button.className =
            "profileNavButton";


        button.textContent =
            "👥 Back to Creators";


        button.style.left =
            "360px";


        button.addEventListener(
            "click",
            function () {

                window.location.href =
                    "index.html";

            }
        );


        header.appendChild(
            button
        );

    }


    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initializeProfileViewer() {

        const creatorId =
            getRequestedCreatorId();


        if (!creatorId) {

            console.log(
                "SPARKD Profile Viewer: No creator requested."
            );

            return;

        }


        loadCreatorProfile(
            creatorId
        );

    }


    ////////////////////////////////////////////////////
    // START
    ////////////////////////////////////////////////////

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeProfileViewer
        );

    }
    else {

        initializeProfileViewer();

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_COMMUNITY_PROFILE_VIEWER = {

        load:
            loadCreatorProfile

    };


})();

