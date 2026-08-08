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
     * NSFWJS model hosted publicly.
     *
     * The browser downloads the model.
     * Nothing is hosted on the SPARKD server.
     */
     const MODEL_URL = "./upgrades/model/";

    /*
     * Conservative thresholds.
     *
     * Only block when the model has reasonably strong
     * confidence that the image belongs to a blocked class.
     */
    const BLOCK_THRESHOLD = 0.70;

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
                throw new Error("TensorFlow.js is not loaded.");
            }

            if (typeof nsfwjs === "undefined") {
                throw new Error("NSFWJS is not loaded.");
            }

            console.log("🛡️ Loading SPARKD content model...");

            /*
             * Explicitly provide the model URL.
             * This prevents NSFWJS from attempting to use
             * its broken/default browser model path.
             */
            model = await nsfwjs.load(MODEL_URL);

            if (!model) {
                throw new Error("NSFWJS returned no model.");
            }

            guardReady = true;

            console.log("✅ SPARKD Content Guard ready.");

            window.SPARKD_CONTENT_GUARD_READY = true;

            /*
             * Notify anything waiting for the guard.
             */
            window.dispatchEvent(
                new Event("sparkd-content-guard-ready")
            );

        } catch (error) {

            guardReady = false;
            model = null;

            console.error(
                "❌ SPARKD Content Guard model failed:",
                error
            );

            window.SPARKD_CONTENT_GUARD_READY = false;

            /*
             * IMPORTANT:
             *
             * A model-loading failure must NOT automatically
             * classify every image as unsafe.
             *
             * The caller can decide what to do.
             */
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
         * If the model is unavailable, don't falsely label
         * the image as unsafe.
         */
        if (!guardReady || !model) {

            return {
                checked: false,
                safe: true,
                blocked: false,
                reason: "Content model unavailable"
            };
        }

        if (!image) {

            return {
                checked: false,
                safe: false,
                blocked: true,
                reason: "No image supplied"
            };
        }

        try {

            /*
             * NSFWJS expects an image/canvas/video element.
             */

            console.log("🔬 NSFWJS INPUT:", {
                width: image.naturalWidth,
                height: image.naturalHeight,
                src: image.src
            });
           
            const predictions =
                await model.classify(image);

            console.log(
                "🛡️ SPARKD image scan:",
                predictions
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

                    predictions: predictions,

                    reason:
                        "Image contains prohibited content."
                };
            }


            /* ====================================================
               ALLOW
               ==================================================== */

            console.log("✅ SPARKD image allowed.");

            return {

                checked: true,

                safe: true,

                blocked: false,

                predictions: predictions
            };


        } catch (error) {

            console.error(
                "⚠️ SPARKD image scan failed:",
                error
            );

            /*
             * Do NOT falsely block an image because the
             * classifier itself encountered an error.
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
       PUBLIC API
       ============================================================ */

    window.SPARKDContentGuard = {

        checkImage: checkImage,

        isReady: function () {
            return guardReady;
        },

        getModel: function () {
            return model;
        }

    };


    /*
     * Backwards-compatible aliases in case another Forge
     * upgrade is already looking for these functions.
     */

    window.checkSparkdImage = checkImage;
    window.checkImageSafety = checkImage;


    /* ============================================================
       START
       ============================================================ */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadContentGuard,
            {
                once: true
            }
        );

    } else {

        loadContentGuard();

    }

})();
