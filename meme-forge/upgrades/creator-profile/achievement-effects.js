////////////////////////////////////////////////////
// SPARKD ACHIEVEMENT VISUAL EFFECTS
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // EFFECT DEFINITIONS
    ////////////////////////////////////////////////////

    const EFFECTS = {

        "first-spark":
            "spark",


        "meme-maker":
            "forge",


        "mission-runner":
            "mission",


        "sparkd-holder":
            "treasure",


        "meme-legend":
            "legend",


        "sparkd-og":
            "dragon"

    };


    ////////////////////////////////////////////////////
    // ADD EFFECT TO CARD
    ////////////////////////////////////////////////////

    function applyEffect(
        card,
        achievementId
    ) {

        if (!card) {

            return;

        }


        const effect =
            EFFECTS[
                achievementId
            ];


        if (!effect) {

            return;

        }


        ////////////////////////////////////////////////////
        // REMOVE PREVIOUS EFFECT
        ////////////////////////////////////////////////////

        card.classList.remove(
            "sparkd-effect-spark",
            "sparkd-effect-forge",
            "sparkd-effect-mission",
            "sparkd-effect-treasure",
            "sparkd-effect-legend",
            "sparkd-effect-dragon"
        );


        ////////////////////////////////////////////////////
        // ADD NEW EFFECT
        ////////////////////////////////////////////////////

        card.classList.add(
            "sparkd-effect-" +
            effect
        );

    }


    ////////////////////////////////////////////////////
    // FIND UNLOCKED CARDS
    ////////////////////////////////////////////////////

    function scanCards() {

        Object.keys(
            EFFECTS
        ).forEach(
            function (achievementId) {

                const card =
                    document.querySelector(
                        '[data-achievement="' +
                        achievementId +
                        '"]'
                    );


                if (!card) {

                    return;

                }


                if (
                    card.classList.contains(
                        "unlocked"
                    )
                ) {

                    applyEffect(
                        card,
                        achievementId
                    );

                }

            }
        );

    }


    ////////////////////////////////////////////////////
    // WATCH FOR CARD UNLOCKS
    ////////////////////////////////////////////////////

    function observeAchievements() {

        const observer =
            new MutationObserver(
                function () {

                    scanCards();

                }
            );


        observer.observe(
            document.body,
            {

                subtree:
                    true,

                attributes:
                    true,

                attributeFilter:
                    [
                        "class"
                    ]

            }
        );

    }


    ////////////////////////////////////////////////////
    // INITIALIZE
    ////////////////////////////////////////////////////

    function initialize() {

        scanCards();

        observeAchievements();

    }


    ////////////////////////////////////////////////////
    // WAIT FOR PAGE
    ////////////////////////////////////////////////////

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    }
    else {

        initialize();

    }


    ////////////////////////////////////////////////////
    // PUBLIC API
    ////////////////////////////////////////////////////

    window.SPARKD_ACHIEVEMENT_EFFECTS = {

        refresh:
            scanCards,

        apply:
            applyEffect

    };


})();
