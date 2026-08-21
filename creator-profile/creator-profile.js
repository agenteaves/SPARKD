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
// LOAD SAVED / RECOVERED PROFILE
////////////////////////////////////////////////////

async function loadProfile() {

    try {

        ////////////////////////////////////////////////////
        // CHECK LOCAL PROFILE FIRST
        ////////////////////////////////////////////////////

        const saved =
            localStorage.getItem(
                PROFILE_KEY
            );


        if (saved) {

            try {

                const parsed =
                    JSON.parse(saved);


                profile = {

                    ...profile,

                    ...parsed

                };


                console.log(
                    "🔥 SPARKD: Local creator profile loaded."
                );


                return;

            }
            catch (error) {

                console.warn(
                    "SPARKD: Saved local profile could not be parsed.",
                    error
                );

            }

        }


        ////////////////////////////////////////////////////
        // CHECK EXISTING CREATOR ID
        ////////////////////////////////////////////////////

        let existingCreatorID =
            localStorage.getItem(
                "sparkdCreatorID"
            );


        ////////////////////////////////////////////////////
        // SUPABASE CHECK
        ////////////////////////////////////////////////////

        if (
            typeof window.supabase === "undefined" ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.warn(
                "SPARKD: Supabase unavailable."
            );

            return;

        }


        ////////////////////////////////////////////////////
        // SUPABASE CONFIG
        ////////////////////////////////////////////////////

        const SUPABASE_URL =
            "https://uxpbgzksfizkyxubctep.supabase.co";


        const SUPABASE_ANON_KEY =
            "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


        const recoveryClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );


        ////////////////////////////////////////////////////
        // FUNCTION: LOAD PROFILE BY CREATOR ID
        ////////////////////////////////////////////////////

        async function recoverByCreatorID(
            creatorID
        ) {

            if (!creatorID) {

                return false;

            }


            console.log(
                "🔎 SPARKD: Loading creator profile:",
                creatorID
            );


            const {
                data,
                error
            } =
                await recoveryClient
                    .from("creator_profiles")
                    .select(
                        "creator_id,display_name,username,bio,profile_image,creator_level,spark_points,memes_created,missions_completed,creator_rank,joined_date"
                    )
                    .eq(
                        "creator_id",
                        creatorID
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "SPARKD Creator Profile recovery error:",
                    error
                );

                return false;

            }


            if (!data) {

                console.warn(
                    "SPARKD: Creator profile not found:",
                    creatorID
                );

                return false;

            }


            ////////////////////////////////////////////////////
            // APPLY DATABASE PROFILE
            ////////////////////////////////////////////////////

            profile = {

                ...profile,

                displayName:
                    data.display_name ||
                    profile.displayName,

                username:
                    data.username ||
                    profile.username,

                bio:
                    data.bio ||
                    profile.bio,

                profileImage:
                    data.profile_image ||
                    profile.profileImage,

                creatorLevel:
                    data.creator_level ||
                    profile.creatorLevel,

                sparkPoints:
                    Number(
                        data.spark_points
                    ) || 0,

                memesCreated:
                    Number(
                        data.memes_created
                    ) || 0,

                missionsCompleted:
                    Number(
                        data.missions_completed
                    ) || 0,

                creatorRank:
                    data.creator_rank ||
                    profile.creatorRank,

                joinedDate:
                    data.joined_date ||
                    profile.joinedDate

            };


            ////////////////////////////////////////////////////
            // SAVE CREATOR ID
            ////////////////////////////////////////////////////

            localStorage.setItem(
                "sparkdCreatorID",
                creatorID
            );


            ////////////////////////////////////////////////////
            // SAVE RECOVERED PROFILE LOCALLY
            ////////////////////////////////////////////////////

            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(
                    profile
                )
            );


            console.log(
                "🔥 SPARKD: Creator profile recovered:",
                creatorID
            );


            return true;

        }


        ////////////////////////////////////////////////////
        // TRY EXISTING CREATOR ID
        ////////////////////////////////////////////////////

        if (existingCreatorID) {

            console.log(
                "SPARKD: Existing Creator ID found:",
                existingCreatorID
            );


            const recovered =
                await recoverByCreatorID(
                    existingCreatorID
                );


            if (recovered) {

                return;

            }

        }


        ////////////////////////////////////////////////////
        // WALLET RECOVERY
        ////////////////////////////////////////////////////

        console.log(
            "🔐 SPARKD: Attempting wallet-based profile recovery..."
        );


        ////////////////////////////////////////////////////
        // GET PHANTOM PROVIDER
        ////////////////////////////////////////////////////

        function getProvider() {

            if (
                window.phantom &&
                window.phantom.solana
            ) {

                return window.phantom.solana;

            }


            if (
                window.solana &&
                window.solana.isPhantom
            ) {

                return window.solana;

            }


            return null;

        }


        ////////////////////////////////////////////////////
        // WAIT FOR PHANTOM TO BECOME AVAILABLE
        ////////////////////////////////////////////////////

        let provider = null;


        for (
            let attempt = 0;
            attempt < 20;
            attempt++
        ) {

            provider =
                getProvider();


            if (provider) {

                break;

            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );

        }


        ////////////////////////////////////////////////////
        // PHANTOM NOT AVAILABLE
        ////////////////////////////////////////////////////

        if (!provider) {

            console.log(
                "SPARKD: Phantom wallet provider not available."
            );


            console.log(
                "SPARKD: No Creator ID available."
            );


            return;

        }


        ////////////////////////////////////////////////////
        // WAIT FOR EXISTING PHANTOM CONNECTION
        ////////////////////////////////////////////////////

        for (
            let attempt = 0;
            attempt < 20;
            attempt++
        ) {

            if (
                provider.isConnected &&
                provider.publicKey
            ) {

                break;

            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );

        }


        ////////////////////////////////////////////////////
        // GET CONNECTED WALLET
        ////////////////////////////////////////////////////

        if (
            !provider.isConnected ||
            !provider.publicKey
        ) {

            console.log(
                "SPARKD: Phantom wallet is not connected. Wallet recovery skipped."
            );


            console.log(
                "SPARKD: No Creator ID available."
            );


            return;

        }


        ////////////////////////////////////////////////////
        // WALLET ADDRESS
        ////////////////////////////////////////////////////

        const walletAddress =
            provider.publicKey.toString();


        console.log(
            "🔗 SPARKD: Connected wallet detected:",
            walletAddress
        );


        ////////////////////////////////////////////////////
        // SEARCH CREATOR PROFILE BY WALLET
        ////////////////////////////////////////////////////

        const {
            data: walletCreator,
            error: walletError
        } =
            await recoveryClient
                .from("creator_profiles")
                .select(
                    "creator_id,display_name,username,wallet_address"
                )
                .eq(
                    "wallet_address",
                    walletAddress
                )
                .maybeSingle();


        ////////////////////////////////////////////////////
        // WALLET SEARCH ERROR
        ////////////////////////////////////////////////////

        if (walletError) {

            console.error(
                "SPARKD: Wallet-based creator recovery failed:",
                walletError
            );


            return;

        }


        ////////////////////////////////////////////////////
        // CREATOR FOUND
        ////////////////////////////////////////////////////

        if (walletCreator) {

            existingCreatorID =
                walletCreator.creator_id;


            localStorage.setItem(
                "sparkdCreatorID",
                existingCreatorID
            );


            console.log(
                "🔥 SPARKD: Creator ID recovered from wallet:",
                existingCreatorID
            );


            console.log(
                "👤 SPARKD: Recovered creator:",
                walletCreator.display_name,
                "@",
                walletCreator.username
            );


            ////////////////////////////////////////////////////
            // LOAD COMPLETE PROFILE
            ////////////////////////////////////////////////////

            const recovered =
                await recoverByCreatorID(
                    existingCreatorID
                );


            if (recovered) {

                return;

            }

        }


        ////////////////////////////////////////////////////
        // NO CREATOR FOUND BY WALLET
        ////////////////////////////////////////////////////

        console.log(
            "SPARKD: No creator profile found for connected wallet."
        );


        console.log(
            "SPARKD: No Creator ID available."
        );

    }
    catch (error) {

        console.error(
            "SPARKD: loadProfile failed:",
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

                           <div
    id="creatorWalletSection"
    class="creatorWalletSection"
>

    <div
        id="holderStatus"
        class="holderStatus"
    >

        <strong>
            🔌 Wallet Not Connected
        </strong>

        <span>
            Connect your Phantom wallet to secure your SPARKD creator profile.
        </span>

    </div>


    <button
        id="connectWalletBtn"
        class="connectWalletButton"
        type="button"
    >
        🔗 Connect SPARKD Wallet
    </button>

</div> 

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
                                
                            </strong>

                        </div>


                    </div>
                    
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

        <div
            class="achievement locked"
            data-achievement="first-spark"
        >

            <div class="achievementIcon">
                <img
                    src="achievements/key.png"
                    alt="First Spark"
                >
            </div>

            <span>
                First Spark
            </span>

            <small>
                FIRST IGNITION
            </small>

        </div>


        <!-- MEME MAKER -->

        <div
            class="achievement locked"
            data-achievement="meme-maker"
        >

            <div class="achievementIcon">
                <img
                    src="achievements/blacksmith.png"
                    alt="Meme Maker"
                >
            </div>

            <span>
                Meme Maker
            </span>

            <small>
                CREATOR
            </small>

        </div>


        <!-- MISSION RUNNER -->

        <div
            class="achievement locked"
            data-achievement="mission-runner"
        >

            <div class="achievementIcon">
                <img
                    src="achievements/map.png"
                    alt="Mission Runner"
                >
            </div>

            <span>
                Mission Runner
            </span>

            <small>
                MISSION CONTROL
            </small>

        </div>


        <!-- SPARKD HOLDER -->

        <div
            class="achievement locked"
            data-achievement="sparkd-holder"
        >

            <div class="achievementIcon">
                <img
                    src="achievements/chest.png"
                    alt="SPARKD Holder"
                >
            </div>

            <span>
                SPARKD Holder
            </span>

            <small>
                HOLDER
            </small>

        </div>


        <!-- MEME LEGEND -->

        <div
            class="achievement locked"
            data-achievement="meme-legend"
        >

            <div class="achievementIcon">
                <img
                    src="achievements/throne.png"
                    alt="Meme Legend"
                >
            </div>

            <span>
                Meme Legend
            </span>

            <small>
                ELITE CREATOR
            </small>

        </div>


        <!-- SPARKD OG -->

        <div
            class="achievement locked"
            data-achievement="sparkd-og"
        >

            <div class="achievementIcon">
                <img
                    src="achievements/dragon.png"
                    alt="SPARKD OG"
                >
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


            </main>

        </div>

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
        Number(
            localStorage.getItem("sparkPoints")
        ) || 0;


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
            window.SPARKDContentGuard;


        if (
            !guard ||
            typeof guard.checkImage !== "function"
        ) {

            console.error(
                "SPARKD Content Guard API is not available."
            );


            if (status) {

                status.textContent =
                    "🚫 Content protection is not ready. Image rejected.";

            }


            return false;

        }


        try {

            /*
             * Wait for the Content Guard model
             * to finish loading.
             */

            if (
                typeof guard.isReady === "function" &&
                !guard.isReady()
            ) {

                if (status) {

                    status.textContent =
                        "🛡️ Waiting for image protection to initialize...";

                }


                await new Promise(
                    function (resolve, reject) {

                        const timeout =
                            setTimeout(
                                function () {

                                    reject(
                                        new Error(
                                            "Content Guard initialization timed out."
                                        )
                                    );

                                },
                                15000
                            );


                        function readyHandler() {

                            clearTimeout(
                                timeout
                            );


                            window.removeEventListener(
                                "sparkd-content-guard-ready",
                                readyHandler
                            );


                            resolve();

                        }


                        window.addEventListener(
                            "sparkd-content-guard-ready",
                            readyHandler
                        );

                    }
                );

            }


            /*
             * Convert uploaded File into an Image.
             */

            const image =
                await new Promise(
                    function (resolve, reject) {

                        const reader =
                            new FileReader();


                        reader.onload =
                            function (event) {

                                const img =
                                    new Image();


                                img.onload =
                                    function () {

                                        resolve(
                                            img
                                        );

                                    };


                                img.onerror =
                                    function () {

                                        reject(
                                            new Error(
                                                "Could not load image for safety scan."
                                            )
                                        );

                                    };


                                img.src =
                                    event.target.result;

                            };


                        reader.onerror =
                            function () {

                                reject(
                                    new Error(
                                        "Could not read image file."
                                    )
                                );

                            };


                        reader.readAsDataURL(
                            file
                        );

                    }
                );


            /*
             * Run the existing SPARKD Content Guard.
             */

            const result =
                await guard.checkImage(
                    image
                );


            /*
             * FAIL CLOSED
             */

            if (
                !result ||
                result.safe !== true ||
                result.blocked === true
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

async function saveEditedProfile() {

    ////////////////////////////////////////////////////
    // REQUIRE PHANTOM WALLET BEFORE SAVING
    ////////////////////////////////////////////////////

    const phantom =
        window.phantom?.solana;

    if (
        !phantom ||
        !phantom.isPhantom ||
        !phantom.isConnected ||
        !phantom.publicKey
    ) {

        console.warn(
            "SPARKD: Phantom wallet must be connected before saving a creator profile."
        );

        alert(
            "Please connect your Phantom wallet before saving your creator profile."
        );

        return;

    }

    console.log(
        "🔐 SPARKD: Phantom wallet verified. Saving creator profile..."
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


    ////////////////////////////////////////////////////
    // UPDATE LOCAL PROFILE DATA
    ////////////////////////////////////////////////////

    if (displayName) {

        profile.displayName =
            displayName.value.trim()
            ||
            "SPARKD Creator";

    }


    if (username) {

        profile.username =
            username.value
                .trim()
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


    ////////////////////////////////////////////////////
    // SAVE PROFILE LOCALLY
    ////////////////////////////////////////////////////

    localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(
            profile
        )
    );


    ////////////////////////////////////////////////////
    // GET / CREATE CREATOR ID
    ////////////////////////////////////////////////////

    let creatorID =
        localStorage.getItem(
            "sparkdCreatorID"
        );


    if (!creatorID) {

        creatorID =
            "CREATOR-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase();


        localStorage.setItem(
            "sparkdCreatorID",
            creatorID
        );


        console.log(
            "🔥 SPARKD: New Creator ID created:",
            creatorID
        );

    }

    
    ////////////////////////////////////////////////////
    // SUPABASE CONNECTION
    ////////////////////////////////////////////////////

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";


    const SUPABASE_ANON_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


    if (
        typeof window.supabase === "undefined" ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "SPARKD Creator Profile: Supabase library unavailable."
        );


        alert(
            "⚠️ Profile saved locally, but community registration is temporarily unavailable."
        );


        return;

    }


    ////////////////////////////////////////////////////
    // CREATE SUPABASE CLIENT
    ////////////////////////////////////////////////////

    const creatorSupabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    ////////////////////////////////////////////////////
    // BUILD COMMUNITY PROFILE
    ////////////////////////////////////////////////////

    const communityProfile = {

        creator_id:
            creatorID,

        display_name:
            profile.displayName,

        username:
            profile.username,

        bio:
            profile.bio,

        profile_image:
            profile.profileImage,

        creator_level:
            profile.creatorLevel,

        spark_points:
            Number(
                localStorage.getItem(
                    "sparkPoints"
                )
            ) || 0,

        memes_created:
            Number(
                profile.memesCreated
            ) || 0,

        missions_completed:
            Number(
                profile.missionsCompleted
            ) || 0,

        creator_rank:
            profile.creatorRank,

        joined_date:
            profile.joinedDate,

        updated_at:
            new Date().toISOString()

    };


    ////////////////////////////////////////////////////
    // SAVE TO SUPABASE
    ////////////////////////////////////////////////////

    try {

        const {
            error
        } =
            await creatorSupabase
                .from(
                    "creator_profiles"
                )
                .upsert(
                    communityProfile,
                    {
                        onConflict:
                            "creator_id"
                    }
                );


        ////////////////////////////////////////////////////
        // CHECK DATABASE RESULT
        ////////////////////////////////////////////////////

        if (error) {

            console.error(
                "SPARKD Creator Profile database error:",
                error
            );


            alert(
                "⚠️ Profile saved locally, but the community profile could not be registered."
            );


            return;

        }


        ////////////////////////////////////////////////////
        // SUCCESS
        ////////////////////////////////////////////////////

        console.log(
            "🔥 SPARKD Creator Profile registered in community database."
        );


        alert(
            "🔥 SPARKD Creator Profile saved and registered with the community!"
        );

    }
    catch (error) {

        console.error(
            "SPARKD Creator Profile save failed:",
            error
        );


        alert(
            "⚠️ Profile saved locally, but community registration failed."
        );

    }

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

async function initializeCreatorProfile() {

    /*
     * Wait for the local profile or
     * Supabase recovery to finish.
     */

    await loadProfile();


    /*
     * Build the profile interface
     * after profile data is ready.
     */

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

    
    updateProfile:
        updateProfileDisplay

};


})();

