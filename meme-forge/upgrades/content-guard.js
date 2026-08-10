/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side image safety scanner
   Version: v23 - simplified production build
============================================================ */

(function () {
    "use strict";

    console.log("🛡️ SPARKD Content Guard loading...");

    let guardReady = false;
    let model = null;

    const MODEL_URL = "./upgrades/model/";

    const BLOCK_THRESHOLDS = {
        Porn: 0.65,
        Hentai: 0.65,
        Sexy: 0.80
    };

    const BLOCKED_CLASSES = ["Porn", "Hentai", "Sexy"];


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

            model = await nsfwjs.load(MODEL_URL);

            if (!model) {
                throw new Error("NSFWJS returned no model.");
            }

            console.log("🧠 NSFWJS model loaded.");

            guardReady = true;

            window.SPARKD_CONTENT_GUARD_READY = true;

            window.dispatchEvent(
                new Event("sparkd-content-guard-ready")
            );

            console.log("✅ SPARKD Content Guard ready.");

        } catch (error) {

            guardReady = false;
            model = null;

            window.SPARKD_CONTENT_GUARD_READY = false;

            console.error(
                "❌ SPARKD Content Guard failed:",
                error
            );

            window.dispatchEvent(
                new CustomEvent(
                    "sparkd-content-guard-error",
                    { detail: error }
                )
            );
        }
    }


    /* ============================================================
       CREATE SCAN CANVAS
    ============================================================ */

    function createScanCanvas(image) {

        const width =
            image.naturalWidth || image.width;

        const height =
            image.naturalHeight || image.height;

        if (!width || !height) {
            throw new Error("Image has invalid dimensions.");
        }

        const MAX_SIZE = 1600;

        let scanWidth = width;
        let scanHeight = height;

        if (
            scanWidth > MAX_SIZE ||
            scanHeight > MAX_SIZE
        ) {
            const scale = Math.min(
                MAX_SIZE / scanWidth,
                MAX_SIZE / scanHeight
            );

            scanWidth = Math.max(
                1,
                Math.round(scanWidth * scale)
            );

            scanHeight = Math.max(
                1,
                Math.round(scanHeight * scale)
            );
        }

        const canvas =
            document.createElement("canvas");

        canvas.width = scanWidth;
        canvas.height = scanHeight;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            throw new Error(
                "Could not create image canvas."
            );
        }

        ctx.drawImage(
            image,
            0,
            0,
            scanWidth,
            scanHeight
        );

        return canvas;
    }


    /* ============================================================
       CHECK IMAGE
    ============================================================ */

    async function checkImage(image) {

        /*
         * FAIL CLOSED
         */
        if (!guardReady || !model) {
            return {
                checked: false,
                safe: false,
                blocked: true,
                reason:
                    "Content safety model is unavailable."
            };
        }

        if (!image) {
            return {
                checked: false,
                safe: false,
                blocked: true,
                reason: "No image supplied."
            };
        }

        try {

            const canvas =
                createScanCanvas(image);

            console.log(
                "🧠 SPARKD running NSFWJS classify(canvas)..."
            );

            const predictions =
                await model.classify(canvas);

            if (
                !Array.isArray(predictions) ||
                predictions.length === 0
            ) {
                throw new Error(
                    "NSFWJS returned no predictions."
                );
            }

            console.log(
                "🛡️ SPARKD image scan:",
                predictions
            );


            /* ====================================================
               FIND STRONGEST BLOCKED CATEGORY
            ==================================================== */

            let strongestBlocked = null;

            for (const prediction of predictions) {

                if (
                    !BLOCKED_CLASSES.includes(
                        prediction.className
                    )
                ) {
                    continue;
                }

                const threshold =
                    BLOCK_THRESHOLDS[
                        prediction.className
                    ];

                if (
                    prediction.probability >=
                    threshold
                ) {

                    if (
                        !strongestBlocked ||
                        prediction.probability >
                        strongestBlocked.probability
                    ) {
                        strongestBlocked = {
                            className:
                                prediction.className,

                            probability:
                                prediction.probability,

                            threshold:
                                threshold
                        };
                    }
                }
            }


            /* ====================================================
               BLOCK
            ==================================================== */

            if (strongestBlocked) {

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

                    threshold:
                        strongestBlocked.threshold,

                    predictions:
                        predictions,

                    reason:
                        "Image contains prohibited NSFW content."
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
                predictions: predictions
            };

        } catch (error) {

            console.error(
                "⚠️ SPARKD image scan failed:",
                error
            );

            /*
             * FAIL CLOSED
             */
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
       PUBLIC API
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
       START
    ============================================================ */

    loadContentGuard();

})();

