/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side image safety scanner
   Version: v22
============================================================ */

(function () {

    "use strict";

    console.log(
        "🛡️ SPARKD Content Guard loading..."
    );


    let guardReady = false;
    let model = null;


    /* ============================================================
       MODEL LOCATION
    ============================================================ */

    const MODEL_URL =
        "./upgrades/model/";


    /* ============================================================
       SAFETY THRESHOLDS
    ============================================================ */

    const BLOCK_THRESHOLDS = {

        Porn: 0.65,

        Hentai: 0.65,

        Sexy: 0.80

    };


    const BLOCKED_CLASSES = [
        "Porn",
        "Hentai",
        "Sexy"
    ];


    /* ============================================================
       MODEL VALIDATION
    ============================================================ */

    let modelValidated =
        false;


    let validationRunning =
        false;


    /* ============================================================
       LOAD MODEL
    ============================================================ */

    async function loadContentGuard() {

        try {

            if (
                typeof tf === "undefined"
            ) {

                throw new Error(
                    "TensorFlow.js is not loaded."
                );

            }


            if (
                typeof nsfwjs === "undefined"
            ) {

                throw new Error(
                    "NSFWJS is not loaded."
                );

            }


            console.log(
                "🛡️ Loading SPARKD content model..."
            );


            model =
                await nsfwjs.load(
                    MODEL_URL
                );

           console.log("🧪 SPARKD TESTING LOADED MODEL...");

const testCanvasA = document.createElement("canvas");
testCanvasA.width = 224;
testCanvasA.height = 224;

const ctxA = testCanvasA.getContext("2d");

// Completely black image
ctxA.fillStyle = "#000000";
ctxA.fillRect(0, 0, 224, 224);

const testA = await model.classify(testCanvasA);

console.log(
    "🧪 SPARKD BLACK TEST:",
    testA
);


// Completely white image
const testCanvasB = document.createElement("canvas");
testCanvasB.width = 224;
testCanvasB.height = 224;

const ctxB = testCanvasB.getContext("2d");

ctxB.fillStyle = "#ffffff";
ctxB.fillRect(0, 0, 224, 224);

const testB = await model.classify(testCanvasB);

console.log(
    "🧪 SPARKD WHITE TEST:",
    testB
);


            if (!model) {

                throw new Error(
                    "NSFWJS returned no model."
                );

            }


            console.log(
                "🧠 NSFWJS model loaded."
            );


            /*
             * DO NOT mark the guard ready until the
             * model passes a sanity check.
             */
            await validateModel();


            if (!modelValidated) {

                throw new Error(
                    "NSFWJS model failed validation."
                );

            }


            guardReady = true;


            console.log(
                "✅ SPARKD Content Guard ready."
            );


            window.SPARKD_CONTENT_GUARD_READY =
                true;


            window.dispatchEvent(
                new Event(
                    "sparkd-content-guard-ready"
                )
            );

        }
        catch (error) {

            guardReady = false;

            model = null;

            modelValidated = false;


            console.error(
                "❌ SPARKD Content Guard failed:",
                error
            );


            window.SPARKD_CONTENT_GUARD_READY =
                false;


            window.dispatchEvent(
                new CustomEvent(
                    "sparkd-content-guard-error",
                    {
                        detail:
                            error
                    }
                )
            );

        }

    }


    /* ============================================================
       CREATE TEST IMAGE
       
       Creates two radically different images.
       
       This lets us verify that the model actually responds
       to changing pixels.
    ============================================================ */

    function createValidationImages() {

        const size =
            224;


        /*
         * IMAGE A
         *
         * Solid black.
         */
        const canvasA =
            document.createElement(
                "canvas"
            );


        canvasA.width =
            size;

        canvasA.height =
            size;


        const ctxA =
            canvasA.getContext(
                "2d"
            );


        ctxA.fillStyle =
            "#000000";


        ctxA.fillRect(
            0,
            0,
            size,
            size
        );


        /*
         * IMAGE B
         *
         * Bright multi-color pattern.
         */
        const canvasB =
            document.createElement(
                "canvas"
            );


        canvasB.width =
            size;

        canvasB.height =
            size;


        const ctxB =
            canvasB.getContext(
                "2d"
            );


        ctxB.fillStyle =
            "#ffffff";


        ctxB.fillRect(
            0,
            0,
            size,
            size
        );


        ctxB.fillStyle =
            "#ff0000";


        ctxB.fillRect(
            0,
            0,
            112,
            112
        );


        ctxB.fillStyle =
            "#00ff00";


        ctxB.fillRect(
            112,
            0,
            112,
            112
        );


        ctxB.fillStyle =
            "#0000ff";


        ctxB.fillRect(
            0,
            112,
            112,
            112
        );


        ctxB.fillStyle =
            "#000000";


        ctxB.fillRect(
            112,
            112,
            112,
            112
        );


        return {

            imageA:
                canvasA,

            imageB:
                canvasB

        };

    }


    /* ============================================================
       PREDICTION SIGNATURE
    ============================================================ */

    function getPredictionSignature(
        predictions
    ) {

        if (
            !Array.isArray(
                predictions
            )
        ) {

            return "";

        }


        return predictions
            .map(
                function (prediction) {

                    return (
                        prediction.className +
                        ":" +
                        Number(
                            prediction.probability
                        ).toFixed(8)
                    );

                }
            )
            .join("|");

    }


    /* ============================================================
       VALIDATE MODEL
    ============================================================ */

    async function validateModel() {

        if (
            validationRunning
        ) {

            return;

        }


        validationRunning =
            true;


        try {

            console.log(
                "🧪 SPARKD validating NSFWJS model..."
            );


            const tests =
                createValidationImages();


            /*
             * Run the actual NSFWJS classify()
             * function on the two different canvases.
             */
            const resultA =
                await model.classify(
                    tests.imageA
                );


            const resultB =
                await model.classify(
                    tests.imageB
                );


            const signatureA =
                getPredictionSignature(
                    resultA
                );


            const signatureB =
                getPredictionSignature(
                    resultB
                );


            console.log(
                "🧪 MODEL TEST A:",
                resultA
            );


            console.log(
                "🧪 MODEL TEST B:",
                resultB
            );


            console.log(
                "🧪 MODEL SIGNATURE A:",
                signatureA
            );


            console.log(
                "🧪 MODEL SIGNATURE B:",
                signatureB
            );


            /*
             * If two radically different canvases produce
             * the exact same prediction vector, the model
             * is not functioning correctly.
             */
            if (
                signatureA ===
                signatureB
            ) {

                console.error(
                    "🚨 SPARKD MODEL FAILURE"
                );


                console.error(
                    "Two completely different images produced identical NSFWJS predictions."
                );


                console.error(
                    "The Content Guard will remain disabled."
                );


                modelValidated =
                    false;


                return;

            }


            /*
             * Model responds differently to different
             * inputs.
             */
            modelValidated =
                true;


            console.log(
                "✅ SPARKD NSFWJS MODEL VALIDATION PASSED."
            );

        }
        catch (error) {

            modelValidated =
                false;


            console.error(
                "❌ SPARKD model validation error:",
                error
            );

        }
        finally {

            validationRunning =
                false;

        }

    }


    /* ============================================================
       CREATE REAL IMAGE CANVAS
    ============================================================ */

    function createScanCanvas(image) {

        const width =
            image.naturalWidth ||
            image.width;


        const height =
            image.naturalHeight ||
            image.height;


        if (
            !width ||
            !height
        ) {

            throw new Error(
                "Image has invalid dimensions."
            );

        }


        const MAX_SIZE =
            1600;


        let scanWidth =
            width;


        let scanHeight =
            height;


        if (
            scanWidth > MAX_SIZE ||
            scanHeight > MAX_SIZE
        ) {

            const scale =
                Math.min(
                    MAX_SIZE / scanWidth,
                    MAX_SIZE / scanHeight
                );


            scanWidth =
                Math.max(
                    1,
                    Math.round(
                        scanWidth * scale
                    )
                );


            scanHeight =
                Math.max(
                    1,
                    Math.round(
                        scanHeight * scale
                    )
                );

        }


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            scanWidth;


        canvas.height =
            scanHeight;


        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );


        if (!ctx) {

            throw new Error(
                "Could not create image canvas."
            );

        }


        ctx.clearRect(
            0,
            0,
            scanWidth,
            scanHeight
        );


        ctx.drawImage(
            image,
            0,
            0,
            scanWidth,
            scanHeight
        );


        return {

            canvas:
                canvas,

            width:
                scanWidth,

            height:
                scanHeight

        };

    }


    /* ============================================================
       PIXEL FINGERPRINT
    ============================================================ */

    function getPixelFingerprint(
        canvas
    ) {

        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );


        if (!ctx) {

            throw new Error(
                "Could not read image pixels."
            );

        }


        const data =
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            ).data;


        let fingerprint =
            2166136261;


        const step =
            Math.max(
                4,
                Math.floor(
                    data.length /
                    20000
                )
            );


        for (
            let i = 0;
            i < data.length;
            i += step
        ) {

            fingerprint ^=
                data[i];


            fingerprint =
                Math.imul(
                    fingerprint,
                    16777619
                );


            if (
                i + 1 <
                data.length
            ) {

                fingerprint ^=
                    data[i + 1];


                fingerprint =
                    Math.imul(
                        fingerprint,
                        16777619
                    );

            }


            if (
                i + 2 <
                data.length
            ) {

                fingerprint ^=
                    data[i + 2];


                fingerprint =
                    Math.imul(
                        fingerprint,
                        16777619
                    );

            }

        }


        return (
            fingerprint >>> 0
        );

    }


    /* ============================================================
       CHECK IMAGE
    ============================================================ */

    async function checkImage(
        image
    ) {

        /*
         * FAIL CLOSED.
         */
        if (
            !guardReady ||
            !model ||
            !modelValidated
        ) {

            return {

                checked:
                    false,

                safe:
                    false,

                blocked:
                    true,

                reason:
                    "Content safety model is unavailable or failed validation."

            };

        }


        if (!image) {

            return {

                checked:
                    false,

                safe:
                    false,

                blocked:
                    true,

                reason:
                    "No image supplied."

            };

        }


        try {

            /* ====================================================
               CREATE FRESH CANVAS
            ==================================================== */

            const scan =
                createScanCanvas(
                    image
                );


            console.log(
                "🔬 NSFWJS INPUT:",
                {

                    width:
                        scan.width,

                    height:
                        scan.height,

                    sourceWidth:
                        image.naturalWidth,

                    sourceHeight:
                        image.naturalHeight,

                    src:
                        image.src

                }
            );


            /* ====================================================
               VERIFY PIXELS
            ==================================================== */

            const fingerprint =
                getPixelFingerprint(
                    scan.canvas
                );


            console.log(
                "🧬 SPARKD PIXEL FINGERPRINT:",
                fingerprint
            );


            /* ====================================================
               RUN STANDARD NSFWJS CLASSIFY
               
               This is the important part.
               
               No manually-created TensorFlow tensor.
               No preprocessing override.
            ==================================================== */

            console.log(
                "🧠 SPARKD running NSFWJS classify(canvas)..."
            );


            const predictions =
                await model.classify(
                    scan.canvas
                );


            if (
                !Array.isArray(
                    predictions
                ) ||
                predictions.length === 0
            ) {

                throw new Error(
                    "NSFWJS returned no predictions."
                );

            }


            console.log(
                "🛡️ SPARKD image scan:",
                JSON.stringify(
                    predictions,
                    null,
                    2
                )
            );


            /* ====================================================
               FIND STRONGEST UNSAFE CATEGORY
            ==================================================== */

            let strongestBlocked =
                null;


            for (
                const prediction
                of predictions
            ) {

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

            if (
                strongestBlocked
            ) {

                console.warn(
                    "🚫 SPARKD BLOCKED:",
                    strongestBlocked.className,
                    strongestBlocked.probability
                );


                return {

                    checked:
                        true,

                    safe:
                        false,

                    blocked:
                        true,

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

                checked:
                    true,

                safe:
                    true,

                blocked:
                    false,

                predictions:
                    predictions

            };

        }
        catch (error) {

            console.error(
                "⚠️ SPARKD image scan failed:",
                error
            );


            return {

                checked:
                    false,

                safe:
                    false,

                blocked:
                    true,

                reason:
                    "Image could not be verified for safety."

            };

        }

    }


    /* ============================================================
       PUBLIC API
    ============================================================ */

    window.SPARKDContentGuard = {

        checkImage:
            checkImage,


        isReady:
            function () {

                return (
                    guardReady &&
                    !!model &&
                    modelValidated
                );

            },


        getModel:
            function () {

                return model;

            }

    };


    /* ============================================================
       START
    ============================================================ */

    loadContentGuard();

})();

