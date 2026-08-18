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
    // GET SPARK POINTS
    ////////////////////////////////////////////////////

    function getSparkPoints() {

        return Number(
            localStorage.getItem("sparkPoints")
        ) || 0;

    }


    ////////////////////////////////////////////////////
    // UPDATE PROFILE POINTS
    ////////////////////////////////////////////////////

    function syncProfilePoints(points) {

        const PROFILE_KEY =
            "sparkdCreatorProfile";


        try {

            const saved =
                localStorage.getItem(
                    PROFILE_KEY
                );


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
                "SPARKD profile sync failed:",
                error
            );

        }

    }


    ////////////////////////////////////////////////////
    // UPDATE ACHIEVEMENT CARDS
    ////////////////////////////////////////////////////

    function updateAchievements(points) {

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


                    const icon =
                        card.querySelector(
                            ".achievementIcon"
                        );


                    if (icon) {

                        icon.classList.add(
                            "unlocked"
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

                }

            }
        );


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
    // CHECK ACHIEVEMENTS
    ////////////////////////////////////////////////////

    function checkAchievements() {

        const points =
            getSparkPoints();


        syncProfilePoints(
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
    // WAIT FOR DOM
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
