////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK
// Contest Engine v0.1
//
// READ-ONLY CONTEST DISPLAY
//
// This version:
// - Reads the current weekly contest
// - Displays contest dates
// - Displays submission statistics
// - Calculates time remaining
//
// NO TOKEN TRANSACTION
// NO TOKEN BURN
// NO CONTEST SUBMISSION
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
        // FIRST: LOOK FOR ACTIVE CONTEST
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
        // FIND THE NEXT UPCOMING CONTEST
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


        const {
            count,
            error
        } =
            await supabaseClient
                .from(
                    "meme_submissions"
                )
                .select(
                    "id",
                    {
                        count:
                            "exact",

                        head:
                            true
                    }
                )
                .eq(
                    "contest_id",
                    currentContest.id
                );


        if (error) {

            throw error;

        }


        submissionCount.textContent =
            Number(
                count || 0
            ).toLocaleString(
                "en-US"
            );


        totalBurned.textContent =
            Number(
                currentContest.prize_sol || 0
            ).toLocaleString(
                "en-US",
                {
                    maximumFractionDigits:
                        6
                }
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
// SUBMISSION WINDOW
////////////////////////////////////////////////////

function submissionsAreOpen() {


    if (!currentContest) {

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


    }
);


