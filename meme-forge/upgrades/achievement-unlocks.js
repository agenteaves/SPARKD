////////////////////////////////////////////////////
// SPARKD ACHIEVEMENT UNLOCK SYSTEM
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // ACHIEVEMENT REQUIREMENTS
    ////////////////////////////////////////////////////

    const ACHIEVEMENTS = [

        {
            id: "first-spark",
            points: 2000
        },

        {
            id: "meme-maker",
            points: 4000
        },

        {
            id: "mission-runner",
            points: 8000
        },

        {
            id: "sparkd-holder",
            points: 16000
        },

        {
            id: "meme-legend",
            points: 32000
        },

        {
            id: "sparkd-og",
            points: 64000
        }

    ];


    ////////////////////////////////////////////////////
    // GET CURRENT SPARK POINTS
    ////////////////////////////////////////////////////

    function getSparkPoints() {

        return Number(
            localStorage.getItem("sparkPoints")
        ) || 0;

    }


    ////////////////////////////////////////////////////
    // SYNC POINTS INTO CREATOR PROFILE
    ////////////////////////////////////////////////////

    function syncProfilePoints(points) {

        const PROFILE_KEY =
            "sparkdCreatorProfile";


        try {

            const saved =
                localStorage.getItem(PROFILE_KEY);


            if (!saved) {

                return;

            }


            const profile =
                JSON.parse(saved);


            profile.sparkPoints =
                points;


            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(profile)
            );

        }
        catch (error) {

            console.warn(
                "SPARKD achievement profile sync failed:",
                error
            );

        }

    }


    ////////////////////////////////////////////////////
    // UPDATE PROFILE POINT DISPLAY
    ////////////////////////////////////////////////////

    function updatePointsDisplay(points) {

        const pointsDisplay =
            document.getElementById(
                "sparkPoints"
            );


        if (pointsDisplay) {

            pointsDisplay.textContent =
                points;

        }

    }


    ////////////////////////////////////////////////////
    // UPDATE ACHIEVEMENT CARDS
    ////////////////////////////////////////////////////

    function updateAchievements(points) {

        let unlockedCount = 0;


        ACHIEVEMENTS.forEach(function (achievement) {


            const card =
                document.querySelector(
                    '[data-achievement="' +
                    achievement.id +
                    '"]'
                );


            if (!card) {

                return;

            }


            const unlocked =
                points >= achievement.points;


            if (unlocked) {

                unlockedCount++;


                card.classList.remove(
                    "locked"
                );


                card.classList.add(
                    "unlocked"
                );


                const lockBadge =
                    card.querySelector(
                        ".lock-badge"
                    );


                if (lockBadge) {

                    lockBadge.textContent =
                        "🔥";

                }

            }
            else {

                card.classList.remove(
                    "unlocked"
                );


                card.classList.add(
                    "locked"
                );


                const lockBadge =
                    card.querySelector(
                        ".lock-badge"
                    );


                if (lockBadge) {

                    lockBadge.textContent =
                        "🔒";

                }

            }

        });


        ////////////////////////////////////////////////////
        // UPDATE ACHIEVEMENT COUNT
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
    // RUN ACHIEVEMENT CHECK
    ////////////////////////////////////////////////////

    function checkAchievements() {

        const points =
            getSparkPoints();


        syncProfilePoints(
            points
        );


        updatePointsDisplay(
            points
        );


        updateAchievements(
            points
        );

    }


    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initializeAchievements() {

        checkAchievements();

    }


    ////////////////////////////////////////////////////
    // WAIT FOR PROFILE PAGE
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
            checkAchievements,

        getPoints:
            getSparkPoints

    };


})();
