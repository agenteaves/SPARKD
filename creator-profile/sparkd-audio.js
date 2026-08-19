////////////////////////////////////////////////////
// SPARKD GLOBAL AUDIO SYSTEM
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // AUDIO STATE
    ////////////////////////////////////////////////////

    let audioReady = false;


    ////////////////////////////////////////////////////
    // INITIALIZE SPEECH SYSTEM
    ////////////////////////////////////////////////////

    function initializeAudio() {

        if (
            audioReady
        ) {

            return;

        }


        if (
            !window.speechSynthesis
        ) {

            console.warn(
                "SPARKD Audio: Speech synthesis not available."
            );

            return;

        }


        ////////////////////////////////////////////////////
        // CREATE A SILENT SPEECH UTTERANCE
        //
        // This runs during the user's real interaction
        // with the website.
        ////////////////////////////////////////////////////

        try {

            const unlock =
                new SpeechSynthesisUtterance(
                    ""
                );


            unlock.volume =
                0;


            unlock.rate =
                1;


            unlock.pitch =
                1;


            window.speechSynthesis.speak(
                unlock
            );


            audioReady =
                true;


            localStorage.setItem(
                "sparkdAudioReady",
                "true"
            );


            console.log(
                "🔊 SPARKD Audio System initialized."
            );

        }
        catch (error) {

            console.warn(
                "SPARKD Audio initialization failed:",
                error
            );

        }

    }


    ////////////////////////////////////////////////////
    // FIRST USER INTERACTION
    ////////////////////////////////////////////////////

    function handleFirstInteraction() {

        initializeAudio();


        document.removeEventListener(
            "click",
            handleFirstInteraction,
            true
        );


        document.removeEventListener(
            "touchstart",
            handleFirstInteraction,
            true
        );


        document.removeEventListener(
            "keydown",
            handleFirstInteraction,
            true
        );

    }


    ////////////////////////////////////////////////////
    // LISTEN FOR USER INTERACTION
    ////////////////////////////////////////////////////

    document.addEventListener(
        "click",
        handleFirstInteraction,
        true
    );


    document.addEventListener(
        "touchstart",
        handleFirstInteraction,
        true
    );


    document.addEventListener(
        "keydown",
        handleFirstInteraction,
        true
    );


    ////////////////////////////////////////////////////
    // PUBLIC AUDIO API
    ////////////////////////////////////////////////////

    window.SPARKD_AUDIO = {

        initialize:
            initializeAudio,


        isReady:
            function () {

                return audioReady;

            },


        speak:
            function (text) {

                if (
                    !window.speechSynthesis ||
                    !text
                ) {

                    return;

                }


                window.speechSynthesis.cancel();


                const speech =
                    new SpeechSynthesisUtterance(
                        text
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

    };


    ////////////////////////////////////////////////////
    // EXISTING AUDIO STATE
    ////////////////////////////////////////////////////

    if (
        localStorage.getItem(
            "sparkdAudioReady"
        ) === "true"
    ) {

        console.log(
            "🔊 SPARKD Audio: Previous interaction detected."
        );

    }


})();
