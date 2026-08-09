/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side image safety scanner
   ============================================================ */

(function () {

    "use strict";

    console.log("🛡️ SPARKD Content Guard loading...");

    let guardReady = false;
    let model = null;

    /*
     * NSFWJS model hosted locally.
     */
    const MODEL_URL = "./upgrades/model/";

    /*
     * Probability required before blocking.
     * 0.70 = 70%
     */
    const BLOCK_THRESHOLD = 0.70;

    /*
     * Classes that SPARKD will block.
     */
    const BLOCKED_CLASSES = [
        "Porn",
        "Hentai",
        "Sexy"
    ];


    /* ============================================================
       LOAD MODEL
       ============================================================ */

    async function loadContentGuard() {

        try {

            if (typeof tf === "undefined") {
                throw new Error(
                    "TensorFlow.js is not loaded."
                );
            }

            if (typeof nsfwjs === "undefined") {
                throw new Error(
                    "NSFWJS is not loaded."
                );
            }

            console.log(
                "🛡️ Loading SPARKD content model..."
            );

            /*
             * Load the local SPARKD model.
             */
            model = await nsfwjs.load(MODEL_URL);

            if (!model) {
                throw new Error(
                    "NSFWJS returned no model."
                );
            }

            guardReady = true;

            console.log(
                "✅ SPARKD Content Guard ready."
            );

            window.SPARKD_CONTENT_GUARD_READY = true;

            /*
             * Notify app.js that the guard is ready.
             */
            window.dispatchEvent(
                new Event(
                    "sparkd-content-guard-ready"
                )
            );

        } catch (error) {

            guardReady = false;
            model = null;

            console.error(
                "❌ SPARKD Content Guard model failed:",
                error
            );

            window.SPARKD_CONTENT_GUARD_READY = false;

            window.dispatchEvent(
                new CustomEvent(
                    "sparkd-content-guard-error",
                    {
                        detail: error
                    }
                )
            );
        }
    }


    /* ============================================================
       CHECK IMAGE
       ============================================================ */

    async function checkImage(image) {

        /*
         * Model unavailable.
         */
        if (!guardReady || !model) {

            return {
                checked: false,
                safe: true,
                blocked: false,
                reason: "Content model unavailable"
            };
        }

        /*
         * No image supplied.
         */
        if (!image) {

            return {
                checked: false,
                safe: false,
                blocked: true,
                reason: "No image supplied"
            };
        }

        try {

            console.log(
                "🔬 NSFWJS INPUT:",
                {
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                    src: image.src
                }
            );

            /*
             * Run NSFWJS classification.
             */
            const predictions =
                await model.classify(image);

            console.log(
                "🛡️ SPARKD image scan:",
                JSON.stringify(
                    predictions,
                    null,
                    2
                )
            );

            /*
             * Find the strongest blocked category.
             */
            let strongestBlocked = null;

            for (const prediction of predictions) {

                if (
                    BLOCKED_CLASSES.includes(
                        prediction.className
                    )
                ) {

                    if (
                        !strongestBlocked ||
                        prediction.probability >
                        strongestBlocked.probability
                    ) {

                        strongestBlocked = prediction;
                    }
                }
            }


            /* ====================================================
               BLOCK
               ==================================================== */

            if (
                strongestBlocked &&
                strongestBlocked.probability >=
                BLOCK_THRESHOLD
            ) {

                console.warn(
                    "🚫 SPARKD BLOCKED:",
                    strongestBlocked.className,
                    strongestBlocked.probability
                );

                return {

                    checked: true,

                    safe: false,

                    blocked: true,

                    category:
                        strongestBlocked.className,

                    probability:
                        strongestBlocked.probability,

                    predictions:
                        predictions,

                    reason:
                        "Image contains prohibited content."
                };
            }


            /* ====================================================
               ALLOW
               ==================================================== */

            console.log(
                "✅ SPARKD image allowed."
            );

            return {

                checked: true,

                safe: true,

                blocked: false,

                predictions:
                    predictions
            };


        } catch (error) {

            console.error(
                "⚠️ SPARKD image scan failed:",
                error
            );

            /*
             * Scanner failure does not automatically
             * classify the image as unsafe.
             */
            return {

                checked: false,

                safe: true,

                blocked: false,

                reason:
                    "Image scan failed"
            };
        }
    }


    /* ============================================================
       PUBLIC SPARKD CONTENT GUARD
       ============================================================ */

    window.SPARKDContentGuard = {

        checkImage: checkImage,

        isReady: function () {
            return guardReady && !!model;
        },

        getModel: function () {
            return model;
        }

    };


    /* ============================================================
       START MODEL LOADING
       ============================================================ */

    loadContentGuard();

})();
