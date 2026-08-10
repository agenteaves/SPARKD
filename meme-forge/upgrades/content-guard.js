/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side image safety scanner
============================================================ */

(function () {

    "use strict";

    console.log(
        "🛡️ SPARKD Content Guard loading..."
    );


    let guardReady = false;
    let model = null;


    /*
     * NSFWJS model hosted locally.
     */
    const MODEL_URL =
        "./upgrades/model/";


    /*
     * Individual NSFW threshold.
     *
     * 0.15 = aggressive blocking.
     */
    const BLOCK_THRESHOLD =
        0.15;


    /*
     * Classes considered unsafe.
     */
    const BLOCKED_CLASSES = [
        "Porn",
        "Hentai",
        "Sexy"
    ];


    /*
     * Used to detect whether the model is
     * suspiciously returning the exact same
     * answer for different images.
     */
    let lastFingerprint = null;
    let lastPredictionsSignature = null;


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


            if (!model) {

                throw new Error(
                    "NSFWJS returned no model."
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


            console.error(
                "❌ SPARKD Content Guard model failed:",
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
       CREATE IMAGE CANVAS
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


        /*
         * Limit the working canvas size.
         *
         * This keeps browser memory reasonable while
         * preserving the complete image.
         */
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


        /*
         * Draw the actual selected image.
         */
        ctx.drawImage(
            image,
            0,
            0,
            scanWidth,
            scanHeight
        );


        return {
            canvas: canvas,
            width: scanWidth,
            height: scanHeight
        };

    }


    /* ============================================================
       PIXEL FINGERPRINT
    ============================================================ */

    function getPixelFingerprint(canvas) {

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


        /*
         * Sample multiple areas rather than only
         * the upper-left corner.
         */
        const sampleSize =
            32;


        const positions = [
            [0, 0],

            [
                Math.max(
                    0,
                    canvas.width - sampleSize
                ),
                0
            ],

            [
                0,
                Math.max(
                    0,
                    canvas.height - sampleSize
                )
            ],

            [
                Math.max(
                    0,
                    canvas.width - sampleSize
                ),
                Math.max(
                    0,
                    canvas.height - sampleSize
                )
            ],

            [
                Math.max(
                    0,
                    Math.floor(
                        (canvas.width -
                        sampleSize) / 2
                    )
                ),
                Math.max(
                    0,
                    Math.floor(
                        (canvas.height -
                        sampleSize) / 2
                    )
                )
            ]
        ];


        let fingerprint = 2166136261;


        for (
            const position
            of positions
        ) {

            const x =
                position[0];

            const y =
                position[1];


            const width =
                Math.min(
                    sampleSize,
                    canvas.width - x
                );


            const height =
                Math.min(
                    sampleSize,
                    canvas.height - y
                );


            if (
                width <= 0 ||
                height <= 0
            ) {

                continue;

            }


            const data =
                ctx.getImageData(
                    x,
                    y,
                    width,
                    height
                ).data;


            for (
                let i = 0;
                i < data.length;
                i += 4
            ) {

                fingerprint ^=
                    data[i];

                fingerprint =
                    Math.imul(
                        fingerprint,
                        16777619
                    );


                fingerprint ^=
                    data[i + 1];

                fingerprint =
                    Math.imul(
                        fingerprint,
                        16777619
                    );


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
       PREDICTION SIGNATURE
    ============================================================ */

    function getPredictionSignature(
        predictions
    ) {

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
       CHECK IMAGE
    ============================================================ */

    async function checkImage(
        image
    ) {

        /*
         * FAIL CLOSED
         */
        if (
            !guardReady ||
            !model
        ) {

            return {

                checked: false,

                safe: false,

                blocked: true,

                reason:
                    "Content safety model unavailable."

            };

        }


        /*
         * No image.
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

            /* ====================================================
               CREATE REAL PIXEL CANVAS
            ==================================================== */

            const scan =
                createScanCanvas(
                    image
                );


            const testCanvas =
                scan.canvas;


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

            const pixelFingerprint =
                getPixelFingerprint(
                    testCanvas
                );


            console.log(
                "🧬 SPARKD PIXEL FINGERPRINT:",
                pixelFingerprint
            );


            /* ====================================================
               RUN NSFWJS ON REAL PIXELS
            ==================================================== */

            const predictions =
                await model.classify(
                    testCanvas
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
               PREDICTION SIGNATURE
            ==================================================== */

            const predictionSignature =
                getPredictionSignature(
                    predictions
                );


            console.log(
                "🧬 SPARKD prediction signature:",
                predictionSignature
            );


            /* ====================================================
               DETECT SUSPICIOUS IDENTICAL OUTPUT
            ==================================================== */

            if (
                lastFingerprint !== null &&
                pixelFingerprint !== lastFingerprint &&
                predictionSignature ===
                lastPredictionsSignature
            ) {

                console.error(
                    "❌ SPARKD MODEL VALIDATION FAILED"
                );


                console.error(
                    "Different image pixels produced the exact same NSFWJS prediction."
                );


                console.error(
                    "Previous fingerprint:",
                    lastFingerprint
                );


                console.error(
                    "Current fingerprint:",
                    pixelFingerprint
                );


                console.error(
                    "Prediction signature:",
                    predictionSignature
                );


                return {

                    checked: false,

                    safe: false,

                    blocked: true,

                    category:
                        "MODEL_ERROR",

                    probability:
                        1,

                    predictions:
                        predictions,

                    reason:
                        "Content safety model produced identical results for different images."

                };

            }


            /*
             * Remember this scan.
             */
            lastFingerprint =
                pixelFingerprint;


            lastPredictionsSignature =
                predictionSignature;


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
                    BLOCKED_CLASSES.includes(
                        prediction.className
                    )
                ) {

                    if (
                        !strongestBlocked ||
                        prediction.probability >
                        strongestBlocked.probability
                    ) {

                        strongestBlocked =
                            prediction;

                    }

                }

            }


            /* ====================================================
               INDIVIDUAL NSFW CHECK
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
                        "Image contains prohibited NSFW content."

                };

            }


            /* ====================================================
               COMBINED NSFW SCORE
            ==================================================== */

            const pornScore =
                predictions.find(
                    function (p) {

                        return (
                            p.className ===
                            "Porn"
                        );

                    }
                )?.probability || 0;


            const hentaiScore =
                predictions.find(
                    function (p) {

                        return (
                            p.className ===
                            "Hentai"
                        );

                    }
                )?.probability || 0;


            const sexyScore =
                predictions.find(
                    function (p) {

                        return (
                            p.className ===
                            "Sexy"
                        );

                    }
                )?.probability || 0;


            const combinedNSFW =
                pornScore +
                hentaiScore +
                sexyScore;


            console.log(
                "🛡️ SPARKD combined NSFW score:",
                combinedNSFW
            );


            /*
             * Conservative combined threshold.
             */
            if (
                combinedNSFW >=
                0.25
            ) {

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


            /* ====================================================
               IMAGE PASSED
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


        }
        catch (error) {

            /*
             * FAIL CLOSED
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

        checkImage:
            checkImage,


        isReady:
            function () {

                return (
                    guardReady &&
                    !!model
                );

            },


        getModel:
            function () {

                return model;

            }

    };


    /* ============================================================
       START MODEL LOADING
    ============================================================ */

    loadContentGuard();

})();

