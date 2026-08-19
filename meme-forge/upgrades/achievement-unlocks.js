////////////////////////////////////////////////////
// SPARKD ACHIEVEMENT SYSTEM
// UNLOCKS + POPUP + REPLAY + AUDIO
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // ACHIEVEMENT DATABASE
    ////////////////////////////////////////////////////

    const ACHIEVEMENTS = [

        {
            id: "first-spark",
            name: "FIRST SPARK",
            points: 2000,
            icon: "achievements/key.png",
            voice:
                "Congratulations! You've done it! First SPARKD achievement unlocked!"
        },

        {
            id: "meme-maker",
            name: "MEME MAKER",
            points: 4000,
            icon: "achievements/blacksmith.png",
            voice:
                "Meme Maker unlocked! Your creative journey has begun!"
        },

        {
            id: "mission-runner",
            name: "MISSION RUNNER",
            points: 8000,
            icon: "achievements/map.png",
            voice:
                "Mission Runner unlocked! You're becoming a true SPARKD creator!"
        },

        {
            id: "sparkd-holder",
            name: "SPARKD HOLDER",
            points: 16000,
            icon: "achievements/chest.png",
            voice:
                "SPARKD Holder unlocked! Your dedication is shining!"
        },

        {
            id: "meme-legend",
            name: "MEME LEGEND",
            points: 32000,
            icon: "achievements/throne.png",
            voice:
                "Meme Legend unlocked! You've reached legendary status!"
        },

        {
            id: "sparkd-og",
            name: "SPARKD OG",
            points: 64000,
            icon: "achievements/dragon.png",
            voice:
                "SPARKD OG unlocked! You are one of the originals!"
        }

    ];


    ////////////////////////////////////////////////////
    // STORAGE KEYS
    ////////////////////////////////////////////////////

    const SHOWN_PREFIX =
        "sparkdAchievementShown_";


    ////////////////////////////////////////////////////
    // GET SPARK POINTS
    ////////////////////////////////////////////////////

    function getSparkPoints() {

        return Number(
            localStorage.getItem("sparkPoints")
        ) || 0;

    }


    ////////////////////////////////////////////////////
    // CHECK IF FIRST-TIME POPUP WAS SHOWN
    ////////////////////////////////////////////////////

    function wasShown(id) {

        return (
            localStorage.getItem(
                SHOWN_PREFIX + id
            ) === "true"
        );

    }


    ////////////////////////////////////////////////////
    // MARK POPUP AS SHOWN
    ////////////////////////////////////////////////////

    function markShown(id) {

        localStorage.setItem(
            SHOWN_PREFIX + id,
            "true"
        );

    }


    ////////////////////////////////////////////////////
    // CREATE POPUP
    ////////////////////////////////////////////////////

    function createPopup() {

        let popup =
            document.getElementById(
                "sparkdAchievementPopup"
            );


        if (popup) {

            return popup;

        }


        popup =
            document.createElement("div");


        popup.id =
            "sparkdAchievementPopup";


        popup.innerHTML = `

            <div
                class="sparkdAchievementOverlay"
                id="sparkdAchievementOverlay"
            >

                <div
                    class="sparkdAchievementModal"
                    role="dialog"
                    aria-modal="true"
                >

                    <div class="sparkdAchievementTitle">
                        🏆 ACHIEVEMENT UNLOCKED!
                    </div>


                    <div
                        class="sparkdAchievementArtwork"
                    >

                        <img
                            id="sparkdAchievementImage"
                            src=""
                            alt="Achievement"
                        >

                    </div>


                    <div
                        id="sparkdAchievementName"
                        class="sparkdAchievementName"
                    >
                    </div>


                    <div
                        id="sparkdAchievementRequirement"
                        class="sparkdAchievementRequirement"
                    >
                    </div>


                    <button
                        id="sparkdAchievementClose"
                        class="sparkdAchievementClose"
                        type="button"
                    >
                        CLOSE
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        ////////////////////////////////////////////////////
        // CLOSE BUTTON
        ////////////////////////////////////////////////////

        const closeButton =
            document.getElementById(
                "sparkdAchievementClose"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closePopup
            );

        }


        ////////////////////////////////////////////////////
        // CLICK OUTSIDE MODAL
        ////////////////////////////////////////////////////

        const overlay =
            document.getElementById(
                "sparkdAchievementOverlay"
            );


        if (overlay) {

            overlay.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        overlay
                    ) {

                        closePopup();

                    }

                }
            );

        }


        return popup;

    }


   ////////////////////////////////////////////////////
// ACHIEVEMENT VOICE
////////////////////////////////////////////////////

function playAchievementVoice(
    achievement
) {

    if (
        !achievement ||
        !achievement.voice
    ) {

        return;

    }


    ////////////////////////////////////////////////////
    // USE SPARKD GLOBAL AUDIO SYSTEM
    ////////////////////////////////////////////////////

    if (
        window.SPARKD_AUDIO &&
        typeof window.SPARKD_AUDIO.speak ===
        "function"
    ) {

        console.log(
            "🔊 SPARKD Achievement Audio:",
            achievement.name
        );


        window.SPARKD_AUDIO.speak(
            achievement.voice
        );


        return;

    }


    ////////////////////////////////////////////////////
    // FALLBACK TO DIRECT SPEECH
    ////////////////////////////////////////////////////

    if (
        !window.speechSynthesis
    ) {

        return;

    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            achievement.voice
        );


    speech.rate =
        0.95;


    speech.pitch =
        1.0;


    speech.volume =
        1.0;


    window.speechSynthesis.speak(
        speech
    );

}


    ////////////////////////////////////////////////////
    // OPEN ACHIEVEMENT POPUP
    ////////////////////////////////////////////////////

    function showAchievement(
        achievement
    ) {

        const popup =
            createPopup();


        const image =
            document.getElementById(
                "sparkdAchievementImage"
            );


        const name =
            document.getElementById(
                "sparkdAchievementName"
            );


        const requirement =
            document.getElementById(
                "sparkdAchievementRequirement"
            );


        if (!popup) {

            return;

        }


        if (image) {

            image.src =
                achievement.icon;

            image.alt =
                achievement.name;

        }


        if (name) {

            name.textContent =
                achievement.name;

        }


        if (requirement) {

            requirement.textContent =
                achievement.points.toLocaleString() +
                " SPARK Points";

        }


        popup.classList.remove(
            "sparkd-achievement-visible"
        );


        // Force animation restart

        void popup.offsetWidth;


        popup.classList.add(
            "sparkd-achievement-visible"
        );


        ////////////////////////////////////////////////////
        // PLAY VOICE
        ////////////////////////////////////////////////////

        playAchievementVoice(
            achievement
        );

    }


    ////////////////////////////////////////////////////
    // CLOSE POPUP
    ////////////////////////////////////////////////////

    function closePopup() {

        const popup =
            document.getElementById(
                "sparkdAchievementPopup"
            );


        if (!popup) {

            return;

        }


        popup.classList.remove(
            "sparkd-achievement-visible"
        );


        if (
            window.speechSynthesis
        ) {

            window.speechSynthesis.cancel();

        }

    }


////////////////////////////////////////////////////
// UPDATE ACHIEVEMENT CARDS
////////////////////////////////////////////////////

function updateAchievements(
    points,
    allowFirstTimePopup
) {

    let unlockedCount = 0;


    ACHIEVEMENTS.forEach(
        function (achievement) {

            const card =
                document.querySelector(
                    '[data-achievement="' +
                    achievement.id +
                    '"]'
                );


            if (!card) {

                return;

            }


            if (
                points >=
                achievement.points
            ) {

                unlockedCount++;


                card.classList.remove(
                    "locked"
                );


                card.classList.add(
                    "unlocked"
                );


                ////////////////////////////////////////////////////
                // MAKE UNLOCKED CARD CLICKABLE
                ////////////////////////////////////////////////////

                card.style.cursor =
                    "pointer";


                card.onclick =
                    function () {

                        showAchievement(
                            achievement
                        );

                    };


                ////////////////////////////////////////////////////
                // FIRST-TIME UNLOCK
                ////////////////////////////////////////////////////

                if (
                    allowFirstTimePopup &&
                    !wasShown(
                        achievement.id
                    )
                ) {

                    setTimeout(
                        function () {

                            showAchievement(
                                achievement
                            );

                            markShown(
                                achievement.id
                            );

                        },
                        700
                    );

                }

            }
            else {

                card.classList.remove(
                    "unlocked"
                );


                card.classList.add(
                    "locked"
                );


                card.style.cursor =
                    "default";


                card.onclick =
                    null;

            }

        }
    );


    ////////////////////////////////////////////////////
    // ACHIEVEMENT COUNTER
    ////////////////////////////////////////////////////

    const achievementCount =
        document.getElementById(
            "achievementsUnlocked"
        );


    if (achievementCount) {

        achievementCount.textContent =
            unlockedCount;

    }

}


    ////////////////////////////////////////////////////
    // CHECK ACHIEVEMENTS
    ////////////////////////////////////////////////////

    function checkAchievements(
        allowFirstTimePopup
    ) {

        const points =
            getSparkPoints();


        updateAchievements(
            points,
            allowFirstTimePopup
        );

    }


    ////////////////////////////////////////////////////
// INITIALIZE
////////////////////////////////////////////////////

function initializeAchievements() {

    ////////////////////////////////////////////////////
    // WAIT FOR PROFILE ACHIEVEMENT CARDS
    ////////////////////////////////////////////////////

    let attempts = 0;

    const waitForAchievements =
        setInterval(function () {

            attempts++;

            const firstCard =
                document.querySelector(
                    '[data-achievement="first-spark"]'
                );

            if (firstCard) {

                clearInterval(
                    waitForAchievements
                );

                checkAchievements(true);

                return;

            }


            if (attempts >= 20) {

                clearInterval(
                    waitForAchievements
                );

                console.warn(
                    "SPARKD Achievements: Profile cards not found."
                );

            }

        }, 250);

}


    ////////////////////////////////////////////////////
    // WAIT FOR PROFILE DOM
    ////////////////////////////////////////////////////

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAchievements
        );

    }
    else {

        initializeAchievements();

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_ACHIEVEMENTS = {

        check:
            function () {

                checkAchievements(
                    false
                );

            },

        show:
            showAchievement,

        close:
            closePopup,

        getPoints:
            getSparkPoints

    };


})();
