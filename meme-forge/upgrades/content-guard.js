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
     * SPARKD should be conservative.
     *
     * A lower threshold means questionable NSFW images
     * are rejected instead of being allowed.
     */
    const BLOCK_THRESHOLD = 0.15;

    /*
     * Classes considered unsafe by SPARKD.
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
         *
         * IMPORTANT:
         * Fail closed. Never approve an image when the
         * safety model is unavailable.
         */
        if (!guardReady || !model) {

            return {
                checked: false,
                safe: false,
                blocked: true,
                reason:
                    "Content safety model unavailable."
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
                reason:
                    "No image supplied."
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
             * Run NSFWJS.
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
             * Find the strongest unsafe category.
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


            /*
             * Determine whether the image should be blocked.
             *
             * SPARKD uses a conservative threshold because
             * the goal is to prevent nude/NSFW uploads rather
             * than merely block images that NSFWJS is 70%+
             * certain are pornographic.
             */
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
                        "Image contains prohibited NSFW content."
                };
            }


            /*
             * Additional combined NSFW check.
             *
             * Sometimes NSFWJS distributes confidence across
             * Porn, Hentai, and Sexy instead of putting most
             * of the probability into one class.
             */
            const pornScore =
                predictions.find(
                    p => p.className === "Porn"
                )?.probability || 0;

            const hentaiScore =
                predictions.find(
                    p => p.className === "Hentai"
                )?.probability || 0;

            const sexyScore =
                predictions.find(
                    p => p.className === "Sexy"
                )?.probability || 0;


            const combinedNSFW =
                pornScore +
                hentaiScore +
                sexyScore;


            /*
             * If the combined NSFW confidence is significant,
             * reject the image.
             */
            if (combinedNSFW >= 0.25) {

                console.warn(
                    "🚫 SPARKD BLOCKED: Combined NSFW score",
                    combinedNSFW
                );

                return {

                    checked: true,

                    safe: false,

                    blocked: true,

                    category:
                        "NSFW",

                    probability:
                        combinedNSFW,

                    predictions:
                        predictions,

                    reason:
                        "Image contains prohibited NSFW content."
                };
            }


            /*
             * IMAGE PASSED
             */
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

            /*
             * IMPORTANT:
             * If scanning fails, do NOT approve the image.
             */
            console.error(
                "⚠️ SPARKD image scan failed:",
                error
            );

            return {

                checked: false,

                safe: false,

                blocked: true,

                reason:
                    "Image could not be verified for safety."

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

