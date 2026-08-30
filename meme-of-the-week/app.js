////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK
// Contest Engine v0.1
////////////////////////////////////////////////////


const SUPABASE_URL =
    "https://uxpbgzksfizkyxubctep.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


////////////////////////////////////////////////////
// SUPABASE CLIENT
////////////////////////////////////////////////////

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

////////////////////////////////////////////////////
// EXPOSE SHARED SUPABASE CLIENT
////////////////////////////////////////////////////

window.SPARKD_CONTEST_SUPABASE =
    supabaseClient;


////////////////////////////////////////////////////
// DOM ELEMENTS
////////////////////////////////////////////////////

const winnerWeek =
    document.getElementById(
        "winnerWeek"
    );


const submissionCount =
    document.getElementById(
        "submissionCount"
    );


const totalBurned =
    document.getElementById(
        "totalBurned"
    );


const daysRemaining =
    document.getElementById(
        "daysRemaining"
    );


const submitMemeButton =
    document.getElementById(
        "submitMemeButton"
    );


////////////////////////////////////////////////////
// CURRENT CONTEST
////////////////////////////////////////////////////

let currentContest =
    null;


////////////////////////////////////////////////////
// LOAD CURRENT OR NEXT CONTEST
////////////////////////////////////////////////////

async function loadCurrentContest() {

    console.log(
        "🔥 SPARKD Meme of the Week loading..."
    );


    try {

        const now =
            new Date().toISOString();


        ////////////////////////////////////////////////////
        // FIRST: LOOK FOR ACTIVE SUBMISSION CONTEST
        ////////////////////////////////////////////////////

        let {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "meme_week_contests"
                )
                .select(
                    "*"
                )
                .eq(
                    "status",
                    "submission"
                )
                .lte(
                    "week_start",
                    now
                )
                .gte(
                    "week_end",
                    now
                )
                .order(
                    "week_start",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    1
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        ////////////////////////////////////////////////////
        // IF NO ACTIVE CONTEST,
        // FIND NEXT SUBMISSION CONTEST
        ////////////////////////////////////////////////////

        if (!data) {

            const nextSubmissionResult =
                await supabaseClient
                    .from(
                        "meme_week_contests"
                    )
                    .select(
                        "*"
                    )
                    .eq(
                        "status",
                        "submission"
                    )
                    .gt(
                        "week_start",
                        now
                    )
                    .order(
                        "week_start",
                        {
                            ascending:
                                true
                        }
                    )
                    .limit(
                        1
                    )
                    .maybeSingle();


            if (
                nextSubmissionResult.error
            ) {

                throw nextSubmissionResult.error;

            }


            data =
                nextSubmissionResult.data;

        }


        ////////////////////////////////////////////////////
        // IF STILL NOTHING,
        // FIND NEXT UPCOMING CONTEST
        ////////////////////////////////////////////////////

        if (!data) {

            const upcomingResult =
                await supabaseClient
                    .from(
                        "meme_week_contests"
                    )
                    .select(
                        "*"
                    )
                    .eq(
                        "status",
                        "upcoming"
                    )
                    .gt(
                        "week_start",
                        now
                    )
                    .order(
                        "week_start",
                        {
                            ascending:
                                true
                        }
                    )
                    .limit(
                        1
                    )
                    .maybeSingle();


            if (
                upcomingResult.error
            ) {

                throw upcomingResult.error;

            }


            data =
                upcomingResult.data;

        }


        ////////////////////////////////////////////////////
        // SAVE CONTEST
        ////////////////////////////////////////////////////

        currentContest =
            data;


        ////////////////////////////////////////////////////
        // NOTHING FOUND
        ////////////////////////////////////////////////////

        if (!currentContest) {

            console.warn(
                "No current or upcoming SPARKD Meme of the Week contest found."
            );


            winnerWeek.textContent =
                "NO CONTEST SCHEDULED";


            submitMemeButton.disabled =
                true;


            submitMemeButton.textContent =
                "NO CONTEST SCHEDULED";


            return;

        }


        ////////////////////////////////////////////////////
        // CONTEST FOUND
        ////////////////////////////////////////////////////

        console.log(
            "🔥 SPARKD Meme of the Week contest:",
            currentContest
        );


        updateContestDisplay();


        await loadContestStatistics();


        await loadCommunitySubmissions();


        updateSubmitButton();


        startCountdown();

    }
    catch (error) {

        console.error(
            "SPARKD contest loading error:",
            error
        );


        winnerWeek.textContent =
            "CONTEST ERROR";


        submitMemeButton.disabled =
            true;


        submitMemeButton.textContent =
            "CONTEST UNAVAILABLE";

    }

}

////////////////////////////////////////////////////
// DISPLAY CONTEST INFORMATION
////////////////////////////////////////////////////

function updateContestDisplay() {


    const start =
        new Date(
            currentContest.week_start
        );


    const end =
        new Date(
            currentContest.week_end
        );


    const startText =
        start.toLocaleDateString(
            "en-US",
            {
                month:
                    "short",

                day:
                    "numeric"
            }
        );


    const endText =
        end.toLocaleDateString(
            "en-US",
            {
                month:
                    "short",

                day:
                    "numeric"
            }
        );


    winnerWeek.textContent =
        startText +
        " — " +
        endText;


}


////////////////////////////////////////////////////
// LOAD CONTEST STATISTICS
////////////////////////////////////////////////////

async function loadContestStatistics() {

    try {

        if (!currentContest) {

            submissionCount.textContent =
                "0";

            totalBurned.textContent =
                "0";

            return;

        }


        ////////////////////////////////////////////////////
        // ASK SECURE SUPER-HANDLER FOR STATISTICS
        //
        // DO NOT QUERY meme_week_submissions DIRECTLY
        // FROM THE BROWSER.
        ////////////////////////////////////////////////////

        const response =
            await fetch(

                "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
    JSON.stringify({

        action:
            "check_contest_statistics"

    })

                }

            );


        ////////////////////////////////////////////////////
        // CHECK HTTP RESPONSE
        ////////////////////////////////////////////////////

        if (
            !response.ok
        ) {

            throw new Error(

                "Statistics request failed: HTTP " +
                response.status

            );

        }


        ////////////////////////////////////////////////////
        // READ RESPONSE
        ////////////////////////////////////////////////////

        const data =
            await response.json();


        ////////////////////////////////////////////////////
        // CHECK SERVER RESULT
        ////////////////////////////////////////////////////

        if (
            !data.success
        ) {

            throw new Error(

                data.error ||
                "Unable to load contest statistics."

            );

        }


        ////////////////////////////////////////////////////
        // UPDATE SUBMISSION COUNT
        ////////////////////////////////////////////////////

        submissionCount.textContent =
            Number(
                data.submissionCount ||
                0
            ).toLocaleString(
                "en-US"
            );


        ////////////////////////////////////////////////////
        // UPDATE TOTAL BURNED
        ////////////////////////////////////////////////////

        totalBurned.textContent =
            Number(
                currentContest.prize_sol ||
                0
            ).toLocaleString(

                "en-US",

                {

                    maximumFractionDigits:
                        6

                }

            );


        console.log(
            "🔥 SPARKD contest statistics loaded:",
            data
        );


    }
    catch (error) {

        console.error(

            "Could not load contest statistics:",
            error

        );


        submissionCount.textContent =
            "0";


        totalBurned.textContent =
            "0";

    }

}

////////////////////////////////////////////////////
// LOAD COMMUNITY SUBMISSIONS
////////////////////////////////////////////////////

async function loadCommunitySubmissions() {

    const grid =
        document.getElementById(
            "submissionsGrid"
        );


    if (!grid) {

        console.warn(
            "⚠️ submissionsGrid not found."
        );

        return;

    }


    if (!currentContest) {

        return;

    }


    console.log(
        "🖼️ SPARKD loading community submissions..."
    );

    

    try {
        
console.log(
    "🧪 COMMUNITY QUERY STARTING..."
);
        
        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "meme_week_submissions"
                )
                .select(
                    "id,meme_title,meme_image_url,wallet_address,dna_verified,status,created_at"
                )
                .eq(
                    "contest_id",
                    currentContest.id
                )
                .eq(
                    "dna_verified",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );

        console.log(
    "🧪 COMMUNITY QUERY FINISHED:",
    {
        data: data,
        error: error
    }
);


        if (error) {

            throw error;

        }


        ////////////////////////////////////////////////////
        // NO SUBMISSIONS
        ////////////////////////////////////////////////////

        if (
    !data ||
    data.length === 0
) {


    return;

}



        ////////////////////////////////////////////////////
        // BUILD SUBMISSION CARDS
        ////////////////////////////////////////////////////

        grid.innerHTML = "";


        for (
            const submission
            of data
        ) {


           const {
    data: publicUrlData
} =
    supabaseClient
        .storage
        .from(
            "sparkd-contest-submissions"
        )
        .getPublicUrl(
            submission.meme_image_url
        );

const imageUrl =
    publicUrlData.publicUrl;

console.log(
    "🖼️ SPARKD submission image URL:",
    imageUrl
);


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "submission-card";


            card.innerHTML = `

               <div
    class="submission-image"
    onclick="openSubmissionViewer(
        '${imageUrl}',
        '${escapeHtml(
            submission.meme_title ||
            "SPARKD Meme"
        )}'
    )"
>

    <img
        src="${imageUrl}"
        alt="${escapeHtml(
            submission.meme_title ||
            "SPARKD Meme"
        )}"
        loading="lazy"
    >

</div>


                <div class="submission-info">

                    <h3>
                        ${escapeHtml(
                            submission.meme_title ||
                            "Untitled SPARKD Meme"
                        )}
                    </h3>


                    <p>
                        👻 ${submission.wallet_address
                            ? submission.wallet_address.slice(0, 6) +
                              "..." +
                              submission.wallet_address.slice(-4)
                            : "Unknown Wallet"}
                    </p>


                </div>

            `;

            // MAKE SUBMISSION IMAGE CLICKABLE

const submissionImage =
    card.querySelector(
        ".submission-image img"
    );


if (submissionImage) {

    submissionImage.style.cursor =
        "pointer";


    submissionImage.addEventListener(
        "click",
        function () {

            openSubmissionViewer(
                imageUrl,
                submission.meme_title ||
                "SPARKD Meme"
            );

        }
    );

}

            grid.appendChild(
                card
            );

        }


        console.log(
            "🖼️ SPARKD community submissions loaded:",
            data
        );


    }
    catch (error) {

        console.error(
            "❌ Could not load community submissions:",
            error
        );


        grid.innerHTML = `

            <div class="empty-submissions">

                <span>⚠️</span>

                <p>
                    Unable to load community submissions.
                </p>

            </div>

        `;

    }

}


////////////////////////////////////////////////////
// HTML ESCAPE HELPER
////////////////////////////////////////////////////

function escapeHtml(
    value
) {

    return String(
        value
    )
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
// SUBMISSION WINDOW
////////////////////////////////////////////////////

function submissionsAreOpen() {

    if (
        !currentContest
    ) {

        return false;

    }


    const now =
        Date.now();


    const start =
        new Date(
            currentContest.week_start
        ).getTime();


    const end =
        new Date(
            currentContest.week_end
        ).getTime();


    return (

        now >= start &&
        now <= end

    );

}


////////////////////////////////////////////////////
// UPDATE ENTER BUTTON
////////////////////////////////////////////////////

function updateSubmitButton() {

    if (
        submissionsAreOpen()
    ) {

        submitMemeButton.disabled =
            false;


        submitMemeButton.textContent =
            "🔥 ENTER MEME OF THE WEEK";

    }
    else {

        submitMemeButton.disabled =
            true;


        submitMemeButton.textContent =
            "SUBMISSIONS CLOSED";

    }

}


////////////////////////////////////////////////////
// COUNTDOWN
////////////////////////////////////////////////////

function startCountdown() {


    function updateCountdown() {


        if (!currentContest) {

            return;

        }


        const now =
            Date.now();


        const end =
            new Date(
                currentContest.week_end
            ).getTime();


        const remaining =
            end -
            now;


        if (
            remaining <= 0
        ) {


            daysRemaining.textContent =
                "CLOSED";


            updateSubmitButton();


            return;

        }


        const totalSeconds =
            Math.floor(
                remaining / 1000
            );


        const days =
            Math.floor(
                totalSeconds /
                86400
            );


        const hours =
            Math.floor(
                (
                    totalSeconds %
                    86400
                ) /
                3600
            );


        const minutes =
            Math.floor(
                (
                    totalSeconds %
                    3600
                ) /
                60
            );


        daysRemaining.textContent =
            days +
            "d " +
            hours +
            "h " +
            minutes +
            "m";


    }


    updateCountdown();


    setInterval(
        updateCountdown,
        60000
    );

}


////////////////////////////////////////////////////
// ENTER BUTTON
////////////////////////////////////////////////////

submitMemeButton.addEventListener(
    "click",
    function () {


        if (
            !submissionsAreOpen()
        ) {


            alert(
                "Meme of the Week submissions are currently closed."
            );


            return;

        }


        alert(
            "Submission system coming online."
        );


    }
);


////////////////////////////////////////////////////
// INITIALIZE
////////////////////////////////////////////////////

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCurrentContest();

        loadHallOfFame();

    }
);

////////////////////////////////////////////////////
// TEMPORARY MEME OF THE WEEK SUBMISSION TEST
//
// NO TOKEN BURN
// NO SOL TRANSFER
////////////////////////////////////////////////////

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const testButton =
            document.getElementById(
                "testSubmitButton"
            );

        const testFile =
            document.getElementById(
                "testMemeFile"
            );

        const testTitle =
            document.getElementById(
                "testMemeTitle"
            );


        if (
            !testButton ||
            !testFile
        ) {

            console.warn(
                "SPARKD test submission controls not found."
            );

            return;

        }


        testButton.addEventListener(
            "click",
            async function () {

                try {

                    ////////////////////////////////////////////////////
                    // FILE CHECK
                    ////////////////////////////////////////////////////

                    const file =
                        testFile.files[0];


                    if (!file) {

                        alert(
                            "Select a SPARKD Forge PNG first."
                        );

                        return;

                    }


                    ////////////////////////////////////////////////////
                    // WALLET CHECK
                    ////////////////////////////////////////////////////

                    if (
                        typeof currentWallet !==
                            "string" ||
                        !currentWallet
                    ) {

                        alert(
                            "Connect your Phantom wallet first."
                        );

                        return;

                    }


                    ////////////////////////////////////////////////////
                    // READ FORGE DNA
                    ////////////////////////////////////////////////////

                    const reader =
                        new FileReader();


                    reader.onload =
                        async function (event) {

                            try {

                                const bytes =
                                    new Uint8Array(
                                        event.target.result
                                    );


                                const text =
                                    new TextDecoder()
                                        .decode(bytes);


                                const marker =
                                    "SPARKD-FORGE";


                                const markerPosition =
                                    text.indexOf(
                                        marker
                                    );


                                if (
                                    markerPosition ===
                                    -1
                                ) {

                                    throw new Error(
                                        "No SPARKD Forge DNA found in this PNG."
                                    );

                                }


                                const jsonStart =
                                    text.indexOf(
                                        "{",
                                        markerPosition
                                    );


                                const jsonEnd =
                                    text.indexOf(
                                        "}",
                                        jsonStart
                                    );


                                if (
                                    jsonStart === -1 ||
                                    jsonEnd === -1
                                ) {

                                    throw new Error(
                                        "SPARKD Forge metadata could not be read."
                                    );

                                }


                                const forgeData =
                                    JSON.parse(
                                        text.substring(
                                            jsonStart,
                                            jsonEnd + 1
                                        )
                                    );


                               console.log(
                                    "🔥 SPARKD Forge data:",
                                    forgeData
                                );


                                ////////////////////////////////////////////////////
                                // SUBMIT TEST
                                ////////////////////////////////////////////////////

                                testButton.disabled =
                                    true;


                                testButton.textContent =
                                "⏳ SUBMITTING...";


                              const result =
                                await window.SPARKD_CONTEST.submitMeme(
                                    file,
                                    forgeData,
                                    testTitle
                                        ? testTitle.value
                                        : "Test SPARKD Meme"
    );;


                                console.log(
                                "🔥 REAL SUBMISSION RESULT:",
                                result
                            );


                                alert(
                                "🔥 SUBMISSION SUCCESS!\n\n" +
                                "Submission ID:\n" +
                                result.submission.id
                            );


                            }
                            catch (error) {

                                console.error(
                                    "❌ SPARKD SUBMISSION FAILED:",
                                    error
                                );


                                alert(
                                    "❌ TEST SUBMISSION FAILED\n\n" +
                                    error.message
                                );

                            }
                            finally {

                                testButton.disabled =
                                    false;


                                testButton.textContent =
                                    "🧪 TEST SUBMISSION";

                            }

                        };


                    reader.readAsArrayBuffer(
                        file
                    );


                }
                catch (error) {

                    console.error(
                        "❌ Test submission error:",
                        error
                    );


                    alert(
                        "❌ TEST SUBMISSION FAILED\n\n" +
                        error.message
                    );

                }

            }
        );

    }
);

////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK
// PHANTOM WALLET CONNECTION
////////////////////////////////////////////////////

let currentWallet = null;


////////////////////////////////////////////////////
// GET PHANTOM PROVIDER
////////////////////////////////////////////////////

function getContestWalletProvider() {

    if (
        window.solana &&
        window.solana.isPhantom
    ) {

        return window.solana;

    }

    return null;

}


////////////////////////////////////////////////////
// SHOW CONNECTED WALLET
////////////////////////////////////////////////////

function showContestWallet(
    publicKey
) {

    const status =
        document.getElementById(
            "contestWalletStatus"
        );

    const button =
        document.getElementById(
            "contestConnectWallet"
        );


    if (!publicKey) {

        return;

    }


    currentWallet =
        publicKey.toString();


    if (status) {

        status.textContent =
            "🟢 Wallet Connected: " +
            currentWallet.slice(0, 6) +
            "..." +
            currentWallet.slice(-4);

    }


    if (button) {

        button.textContent =
            "🔗 WALLET CONNECTED";

    }


    console.log(
        "🔐 SPARKD Meme of the Week wallet:",
        currentWallet
    );

}


////////////////////////////////////////////////////
// CONNECT PHANTOM WALLET
////////////////////////////////////////////////////

async function connectContestWallet() {

    const provider =
        getContestWalletProvider();


    if (!provider) {

        alert(
            "👻 Phantom Wallet was not detected. Please install or open Phantom Wallet."
        );

        return;

    }


    try {

        console.log(
            "🔗 SPARKD Meme of the Week: Connecting to Phantom..."
        );


        const response =
            await provider.connect();


        const publicKey =
            response &&
            response.publicKey
                ? response.publicKey
                : provider.publicKey;


        if (!publicKey) {

            throw new Error(
                "Phantom connected but no wallet address was returned."
            );

        }


        showContestWallet(
            publicKey
        );


    }
    catch (error) {

        console.error(
            "❌ SPARKD Meme of the Week wallet connection failed:",
            error
        );

    }

}


////////////////////////////////////////////////////
// CHECK EXISTING PHANTOM CONNECTION
////////////////////////////////////////////////////

async function checkContestWallet() {

    const provider =
        getContestWalletProvider();


    if (!provider) {

        return;

    }


    try {

        const response =
            await provider.connect({
                onlyIfTrusted:
                    true
            });


        if (
            response &&
            response.publicKey
        ) {

            showContestWallet(
                response.publicKey
            );

        }

    }
    catch (error) {

        // No trusted connection is normal.
        console.log(
            "🔌 No existing trusted Phantom connection."
        );

    }

}


////////////////////////////////////////////////////
// WALLET EVENTS
////////////////////////////////////////////////////

function setupContestWallet() {

    const button =
        document.getElementById(
            "contestConnectWallet"
        );


    if (!button) {

        console.warn(
            "⚠️ Contest wallet button not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        connectContestWallet
    );


    const provider =
        getContestWalletProvider();


    if (provider) {

        provider.on(
            "connect",
            function (publicKey) {

                showContestWallet(
                    publicKey
                );

            }
        );


        provider.on(
            "disconnect",
            function () {

                currentWallet =
                    null;


                const status =
                    document.getElementById(
                        "contestWalletStatus"
                    );


                const button =
                    document.getElementById(
                        "contestConnectWallet"
                    );


                if (status) {

                    status.textContent =
                        "🔌 Wallet Not Connected";

                }


                if (button) {

                    button.textContent =
                        "🔗 CONNECT SPARKD WALLET";

                }


                console.log(
                    "🔌 SPARKD Meme of the Week wallet disconnected."
                );

            }
        );

    }


    checkContestWallet();

}

////////////////////////////////////////////////////
// INITIALIZE CONTEST WALLET
////////////////////////////////////////////////////

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupContestWallet();

    }
);


// =================================================
// SPARKD MEME SUBMISSION VIEWER
// =================================================

function openSubmissionViewer(
    imageUrl,
    memeTitle
) {

    const viewer =
        document.createElement(
            "div"
        );


    viewer.id =
        "submissionViewer";


    viewer.innerHTML = `

        <div class="submission-viewer-backdrop">

            <div class="submission-viewer-content">

                <button
                    class="submission-viewer-close"
                    type="button"
                    aria-label="Close"
                >
                    ✕
                </button>

                <img
                    src="${imageUrl}"
                    alt="${escapeHtml(
                        memeTitle
                    )}"
                >

                <div class="submission-viewer-title">
                    ${escapeHtml(
                        memeTitle
                    )}
                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        viewer
    );


    const closeButton =
        viewer.querySelector(
            ".submission-viewer-close"
        );


    const backdrop =
        viewer.querySelector(
            ".submission-viewer-backdrop"
        );


    closeButton.addEventListener(
        "click",
        function () {

            viewer.remove();

        }
    );


    backdrop.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                backdrop
            ) {

                viewer.remove();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function closeWithEscape(
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                viewer.remove();

                document.removeEventListener(
                    "keydown",
                    closeWithEscape
                );

            }

        }
    );

}


// =================================================
// SPARKD MEME HALL OF FAME
// =================================================

async function loadHallOfFame() {

    const hall =
        document.getElementById(
            "hallOfFame"
        );


    if (!hall) {

        console.warn(
            "⚠️ hallOfFame element not found."
        );

        return;

    }


    console.log(
        "🏆 SPARKD Hall of Fame loading..."
    );


    try {

        //////////////////////////////////////////////////
        // LOAD PREVIOUS CONTESTS WITH WINNERS
        //////////////////////////////////////////////////

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "meme_week_contests"
                )
                .select(
                    "id,week_start,week_end,status,winner_submission_id"
                )
                .not(
                    "winner_submission_id",
                    "is",
                    null
                )
                .order(
                    "week_start",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            throw error;

        }


        console.log(
            "🏆 SPARKD Hall of Fame contests:",
            data
        );


        //////////////////////////////////////////////////
        // NO PREVIOUS CHAMPIONS
        //////////////////////////////////////////////////

        if (
            !data ||
            data.length === 0
        ) {

            console.log(
                "🏆 No previous champions yet."
            );

            return;

        }


        //////////////////////////////////////////////////
        // CLEAR HALL OF FAME
        //////////////////////////////////////////////////

        hall.innerHTML = "";


        //////////////////////////////////////////////////
        // BUILD CHAMPION CARDS
        //////////////////////////////////////////////////

        for (
            const contest
            of data
        ) {


            if (
                !contest.winner_submission_id
            ) {

                continue;

            }


            //////////////////////////////////////////////////
            // LOAD WINNING SUBMISSION
            //////////////////////////////////////////////////

            const {
                data: submission,
                error: submissionError
            } =
                await supabaseClient
                    .from(
                        "meme_week_submissions"
                    )
                    .select(
                        "id,meme_title,meme_image_url,wallet_address"
                    )
                    .eq(
                        "id",
                        contest.winner_submission_id
                    )
                    .maybeSingle();


            if (submissionError) {

                console.error(
                    "❌ Could not load champion submission:",
                    submissionError
                );

                continue;

            }


            if (!submission) {

                console.warn(
                    "⚠️ Champion submission not found:",
                    contest.winner_submission_id
                );

                continue;

            }


            //////////////////////////////////////////////////
            // BUILD IMAGE URL
            //////////////////////////////////////////////////

            const imageUrl =
                supabaseClient
                    .storage
                    .from(
                        "sparkd-contest-submissions"
                    )
                    .getPublicUrl(
                        submission.meme_image_url
                    )
                    .data
                    .publicUrl;


            console.log(
                "🏆 Champion image URL:",
                imageUrl
            );


            //////////////////////////////////////////////////
            // CREATE CHAMPION CARD
            //////////////////////////////////////////////////

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "hall-card";


            card.innerHTML = `

                <div class="hall-image">

                    <img
                        src="${imageUrl}"
                        alt="${escapeHtml(
                            submission.meme_title ||
                            "SPARKD Champion"
                        )}"
                        loading="lazy"
                    >

                </div>


                <div class="hall-info">

                    <div class="hall-title">

                        🏆 ${escapeHtml(
                            submission.meme_title ||
                            "Untitled Champion"
                        )}

                    </div>


                    <div class="hall-week">

                        ${new Date(
                            contest.week_start
                        ).toLocaleDateString(
                            "en-US",
                            {
                                month:
                                    "short",

                                day:
                                    "numeric",

                                year:
                                    "numeric"
                            }
                        )}

                    </div>


                    <div class="hall-wallet">

                        👻 ${
                            submission.wallet_address
                                ? submission.wallet_address.slice(0, 6) +
                                  "..." +
                                  submission.wallet_address.slice(-4)
                                : "Unknown Wallet"
                        }

                    </div>

                </div>

            `;


            //////////////////////////////////////////////////
            // MAKE CHAMPION IMAGE CLICKABLE
            //////////////////////////////////////////////////

            const championImage =
                card.querySelector(
                    ".hall-image img"
                );


            if (championImage) {

                championImage.style.cursor =
                    "pointer";


                championImage.addEventListener(
                    "click",
                    function () {

                        openSubmissionViewer(
                            imageUrl,
                            submission.meme_title ||
                            "SPARKD Champion"
                        );

                    }
                );

            }


            hall.appendChild(
                card
            );

        }


        console.log(
            "🏆 SPARKD Hall of Fame cards built."
        );


    }
    catch (error) {

        console.error(
            "❌ Could not load Hall of Fame:",
            error
        );

    }

}

