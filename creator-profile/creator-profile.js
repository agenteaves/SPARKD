////////////////////////////////////////////////////
// SPARKD CREATOR PROFILE
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // PROFILE STATE
    ////////////////////////////////////////////////////

    const PROFILE_KEY =
        "sparkdCreatorProfile";


    let profile = {

        displayName:
            "SPARKD Creator",

        username:
            "creator",

        bio:
            "Creating the next viral SPARKD memes. 🔥",

        profileImage:
            null,

        creatorLevel:
            "Level 1 - Meme Rookie",

        sparkPoints:
            0,

        memesCreated:
            0,

        missionsCompleted:
            0,

        creatorRank:
            "Meme Rookie",

        joinedDate:
            new Date().toLocaleDateString()

    };


    ////////////////////////////////////////////////////
    // LOAD SAVED PROFILE
    ////////////////////////////////////////////////////

    function loadProfile() {

        try {

            const saved =
                localStorage.getItem(
                    PROFILE_KEY
                );


            if (saved) {

                const parsed =
                    JSON.parse(saved);


                profile = {

                    ...profile,

                    ...parsed

                };

            }

        }
        catch (error) {

            console.warn(
                "SPARKD profile could not be loaded:",
                error
            );

        }

    }


    ////////////////////////////////////////////////////
    // SAVE PROFILE
    ////////////////////////////////////////////////////

    function saveProfile() {

        try {

            localStorage.setItem(

                PROFILE_KEY,

                JSON.stringify(profile)

            );

        }
        catch (error) {

            console.error(
                "SPARKD profile could not be saved:",
                error
            );

        }

    }


    ////////////////////////////////////////////////////
    // CREATE PROFILE INTERFACE
    ////////////////////////////////////////////////////

    function createProfileInterface() {

        const body =
            document.body;


        body.innerHTML = `

        <div id="sparkdProfilePage">

            <header class="profileHeader">

                <button
                    id="profileHomeBtn"
                    class="profileNavButton"
                >
                    🏠 Home
                </button>


                <div class="profileLogo">

                    🔥 SPARKD

                    <span>
                        CREATOR PROFILE
                    </span>

                </div>

            </header>


            <main class="profileContainer">


                <!-- PROFILE CARD -->

                <section class="profileCard">


                    <div class="profileTop">


                        <!-- PROFILE IMAGE -->

                        <div class="profileImageSection">

                            <div
                                id="profileImagePreview"
                                class="profileImage"
                            >
                                ⚡
                            </div>


                            <label
                                for="profileImageInput"
                                class="uploadProfileButton"
                            >
                                🖼 Change Picture
                            </label>


                            <input
                                type="file"
                                id="profileImageInput"
                                accept="image/*"
                                hidden
                            />


                            <div
                                id="profileScanStatus"
                                class="profileScanStatus"
                            >
                                🛡️ Image protection active
                            </div>

                        </div>


                        <!-- CREATOR INFORMATION -->

                        <div class="creatorInfo">

                            <div
                                class="holderBadge"
                                id="holderBadge"
                            >
                                🔥 SPARKD CREATOR
                            </div>


                            <input
                                id="displayNameInput"
                                class="profileInput profileNameInput"
                                type="text"
                                maxlength="40"
                                placeholder="Creator Name"
                            />


                            <input
                                id="usernameInput"
                                class="profileInput"
                                type="text"
                                maxlength="30"
                                placeholder="@username"
                            />


                            <textarea
                                id="bioInput"
                                class="profileInput profileBioInput"
                                maxlength="250"
                                placeholder="Tell the SPARKD community about yourself..."
                            ></textarea>


                            <button
                                id="saveProfileBtn"
                                class="saveProfileButton"
                            >
                                💾 Save Profile
                            </button>

                        </div>

                    </div>


                </section>


                <!-- CREATOR STATS -->

                <section class="profileSection">

                    <h2>
                        ⚡ Creator Stats
                    </h2>


                    <div class="statsGrid">


                        <div class="profileStat">

                            <span>
                                ⭐ Creator Level
                            </span>

                            <strong id="creatorLevel">
                                Level 1 - Meme Rookie
                            </strong>

                        </div>


                        <div class="profileStat">

                            <span>
                                🪙 SPARK Points
                            </span>

                            <strong id="sparkPoints">
                                0
                            </strong>

                        </div>


                        <div class="profileStat">

                            <span>
                                🎨 Memes Created
                            </span>

                            <strong id="memesCreated">
                                0
                            </strong>

                        </div>


                        <div class="profileStat">

                            <span>
                                🚀 Missions Completed
                            </span>

                            <strong id="missionsCompleted">
                                0
                            </strong>

                        </div>


                        <div class="profileStat">

                            <span>
                                🏆 Creator Rank
                            </span>

                            <strong id="creatorRank">
                                Meme Rookie
                            </strong>

                        </div>


                        <div class="profileStat">

                            <span>
                                📅 Joined
                            </span>

                            <strong id="joinedDate">
                                --
                            </strong>

                        </div>


                    </div>

                </section>


                <!-- SPARKD HOLDER -->

                <section class="profileSection holderSection">

                    <h2>
                        🔥 SPARKD Holder Status
                    </h2>


                    <div
                        id="holderStatus"
                        class="holderStatus"
                    >

                        <strong>
                            Wallet Not Connected
                        </strong>

                        <span>
                            Connect your wallet to verify SPARKD ownership.
                        </span>

                    </div>


                    <button
                        id="connectWalletBtn"
                        class="connectWalletButton"
                    >
                        🔗 Connect SPARKD Wallet
                    </button>

                </section>


                <!-- FEATURED MEME -->

                <section class="profileSection">

                    <h2>
                        🌟 Featured Meme
                    </h2>


                    <div
                        id="featuredMeme"
                        class="featuredMeme"
                    >

                        <div>
                            🎨
                        </div>

                        <p>
                            Your featured SPARKD meme will appear here.
                        </p>

                    </div>

                </section>


<!-- ACHIEVEMENTS -->

<section class="profileSection">

    <h2>
        🏆 Creator Achievements
    </h2>


    <div class="achievementGrid">


        <!-- FIRST SPARK -->

        <div class="achievement locked">

        <div class="achievementIcon">
            <img src="achievements/key.png" alt="First Spark">
        </div>

            <span>
                First Spark
            </span>

            <small>
                FIRST IGNITION
            </small>

        </div>


        <!-- MEME MAKER -->

        <div class="achievement locked">

            <div class="achievementIcon">
                ◉
            </div>

            <span>
                Meme Maker
            </span>

            <small>
                CREATOR
            </small>

        </div>


        <!-- MISSION RUNNER -->

        <div class="achievement locked">

            <div class="achievementIcon">
                ⟁
            </div>

            <span>
                Mission Runner
            </span>

            <small>
                MISSION CONTROL
            </small>

        </div>


        <!-- SPARKD HOLDER -->

        <div class="achievement locked">

            <div class="achievementIcon">
                ◇
            </div>

            <span>
                SPARKD Holder
            </span>

            <small>
                HOLDER
            </small>

        </div>


        <!-- MEME LEGEND -->

        <div class="achievement locked">

            <div class="achievementIcon">
                ⬢
            </div>

            <span>
                Meme Legend
            </span>

            <small>
                ELITE CREATOR
            </small>

        </div>


        <!-- SPARKD OG -->

        <div class="achievement locked">

            <div class="achievementIcon">
                ✦
            </div>

            <span>
                SPARKD OG
            </span>

            <small>
                ORIGINAL SPARK
            </small>

        </div>


    </div>

</section>

`;

    }

    ////////////////////////////////////////////////////
    // UPDATE PROFILE DISPLAY
    ////////////////////////////////////////////////////

    function updateProfileDisplay() {

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


        const level =
            document.getElementById(
                "creatorLevel"
            );


        const points =
            document.getElementById(
                "sparkPoints"
            );


        const memes =
            document.getElementById(
                "memesCreated"
            );


        const missions =
            document.getElementById(
                "missionsCompleted"
            );


        const rank =
            document.getElementById(
                "creatorRank"
            );


        const joined =
            document.getElementById(
                "joinedDate"
            );


        if (displayName)
            displayName.value =
                profile.displayName;


        if (username)
            username.value =
                profile.username;


        if (bio)
            bio.value =
                profile.bio;


        if (level)
            level.textContent =
                profile.creatorLevel;


        if (points)
            points.textContent =
                profile.sparkPoints;


        if (memes)
            memes.textContent =
                profile.memesCreated;


        if (missions)
            missions.textContent =
                profile.missionsCompleted;


        if (rank)
            rank.textContent =
                profile.creatorRank;


        if (joined)
            joined.textContent =
                profile.joinedDate;


        updateProfileImage();

    }


    ////////////////////////////////////////////////////
    // UPDATE PROFILE IMAGE
    ////////////////////////////////////////////////////

    function updateProfileImage() {

        const preview =
            document.getElementById(
                "profileImagePreview"
            );


        if (!preview)
            return;


        if (profile.profileImage) {

            preview.innerHTML = `

                <img
                    src="${profile.profileImage}"
                    alt="SPARKD Creator Profile"
                >

            `;

        }
        else {

            preview.innerHTML =
                "⚡";

        }

    }


    ////////////////////////////////////////////////////
    // PROFILE IMAGE SECURITY
    ////////////////////////////////////////////////////

    async function scanProfileImage(file) {

        if (!file)
            return false;


        const status =
            document.getElementById(
                "profileScanStatus"
            );


        if (status) {

            status.textContent =
                "🛡️ Scanning image...";

        }


        ////////////////////////////////////////////////////
        // CHECK FOR EXISTING SPARKD CONTENT GUARD
        ////////////////////////////////////////////////////

        const guard =
            window.SPARKD_CONTENT_GUARD;


        if (
            guard &&
            typeof guard.scanImage === "function"
        ) {

            try {

                const result =
                    await guard.scanImage(file);


                if (
                    result === false ||
                    (
                        result &&
                        result.safe === false
                    )
                ) {

                    if (status) {

                        status.textContent =
                            "🚫 Image rejected by SPARKD Content Guard.";

                    }

                    return false;

                }


                if (status) {

                    status.textContent =
                        "✅ Image approved by SPARKD Content Guard.";

                }


                return true;

            }
            catch (error) {

                console.error(
                    "SPARKD profile image scan failed:",
                    error
                );


                if (status) {

                    status.textContent =
                        "🚫 Image could not be verified.";

                }


                return false;

            }

        }


        ////////////////////////////////////////////////////
        // DO NOT BYPASS MODERATION
        ////////////////////////////////////////////////////

        console.error(
            "SPARKD Content Guard API is not available."
        );


        if (status) {

            status.textContent =
                "🚫 Content protection is not ready. Image rejected.";

        }


        return false;

    }


    ////////////////////////////////////////////////////
    // HANDLE PROFILE IMAGE
    ////////////////////////////////////////////////////

    async function handleProfileImage(event) {

        const file =
            event.target.files[0];


        if (!file)
            return;


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Please select an image file."
            );

            return;

        }


        const safe =
            await scanProfileImage(file);


        if (!safe) {

            event.target.value =
                "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function (e) {

                profile.profileImage =
                    e.target.result;


                updateProfileImage();

                saveProfile();

            };


        reader.readAsDataURL(file);

    }


    ////////////////////////////////////////////////////
    // SAVE EDITED PROFILE
    ////////////////////////////////////////////////////

    function saveEditedProfile() {

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

            profile.displayName =
                displayName.value.trim()
                ||
                "SPARKD Creator";

        }


        if (username) {

            profile.username =
                username.value.trim()
                .replace(
                    /^@/,
                    ""
                )
                ||
                "creator";

        }


        if (bio) {

            profile.bio =
                bio.value.trim();

        }


        saveProfile();


        alert(
            "🔥 SPARKD Creator Profile saved!"
        );

    }


    ////////////////////////////////////////////////////
    // HOME BUTTON
    ////////////////////////////////////////////////////

    function setupNavigation() {

        const home =
            document.getElementById(
                "profileHomeBtn"
            );


        if (home) {

            home.onclick =
                function () {

                    window.location.href =
                        "/";

                };

        }

    }


    ////////////////////////////////////////////////////
    // EVENT LISTENERS
    ////////////////////////////////////////////////////

    function setupEvents() {

        const imageInput =
            document.getElementById(
                "profileImageInput"
            );


        if (imageInput) {

            imageInput.addEventListener(
                "change",
                handleProfileImage
            );

        }


        const saveButton =
            document.getElementById(
                "saveProfileBtn"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveEditedProfile
            );

        }


        setupNavigation();

    }


    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initializeCreatorProfile() {

        loadProfile();

        createProfileInterface();

        updateProfileDisplay();

        setupEvents();

        console.log(
            "🔥 SPARKD Creator Profile loaded."
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeCreatorProfile
        );

    }
    else {

        initializeCreatorProfile();

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_CREATOR_PROFILE = {

        getProfile:
            function () {

                return {
                    ...profile
                };

            },

        saveProfile:
            saveProfile,

        updateProfile:
            updateProfileDisplay

    };


})();
