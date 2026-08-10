/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side image safety scanner
   Version: v21
============================================================ */

(function () {

    "use strict";

    console.log(
        "🛡️ SPARKD Content Guard loading..."
    );


    let guardReady = false;
    let model = null;


    /* ============================================================
       MODEL
    ============================================================ */

    const MODEL_URL =
        "./upgrades/model/";


    /* ============================================================
       BLOCK THRESHOLDS
       
       These are intentionally conservative enough to avoid
       normal-photo false positives.
    ============================================================ */

    const BLOCK_THRESHOLDS = {

        Porn: 0.70,

        Hentai: 0.70,

        Sexy: 0.80

    };


    const BLOCKED_CLASSES = [
        "Porn",
        "Hentai",
        "Sexy"
    ];


    /* ============================================================
       DEBUG STATE
    ============================================================ */

    let lastFingerprint = null;

    let lastPredictionSignature = null;


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
       WAIT FOR IMAGE TO ACTUALLY LOAD
    ============================================================ */

    function waitForImage(image) {

        return new Promise(
            function (resolve, reject) {

                if (!image) {

                    reject(
                        new Error(
                            "No image supplied."
                        )
                    );

                    return;

                }


                /*
                 * Already loaded.
                 */
                if (
                    image.complete &&
                    image.naturalWidth > 0 &&
                    image.naturalHeight > 0
                ) {

                    resolve(image);

                    return;

                }


                /*
                 * Wait for actual browser image decode.
                 */
                image.onload =
                    function () {

                        resolve(image);

                    };


                image.onerror =
                    function () {

                        reject(
                            new Error(
                                "Browser could not load image."
                            )
                        );

                    };

            }
        );

    }


    /* ============================================================
       CREATE FRESH SCAN CANVAS
    ============================================================ */

    function createScanCanvas(image) {

        const sourceWidth =
            image.naturalWidth ||
            image.width;


        const sourceHeight =
            image.naturalHeight ||
            image.height;


        if (
            !sourceWidth ||
            !sourceHeight
        ) {

            throw new Error(
                "Image has invalid dimensions."
            );

        }


        const MAX_SIZE =
            1600;


        let scanWidth =
            sourceWidth;


        let scanHeight =
            sourceHeight;


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


        /*
         * Completely new canvas for every scan.
         */
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
                    alpha:
                        true,

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
         * Clear the canvas first.
         */
        ctx.clearRect(
            0,
            0,
            scanWidth,
            scanHeight
        );


        /*
         * Draw ONLY the actual source image.
         */
        ctx.drawImage(
            image,
            0,
            0,
            scanWidth,
            scanHeight
        );


        /*
         * Force the browser to actually read the
         * resulting pixels.
         */
        const imageData =
            ctx.getImageData(
                0,
                0,
                scanWidth,
                scanHeight
            );


        return {

            canvas:
                canvas,

            ctx:
                ctx,

            imageData:
                imageData,

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
        imageData
    ) {

        if (
            !imageData ||
            !imageData.data
        ) {

            throw new Error(
                "Invalid ImageData."
            );

        }


        const data =
            imageData.data;


        let fingerprint =
            2166136261;


        /*
         * Sample the entire image at intervals.
         *
         * This is stronger than checking only five corners.
         */
        const sampleCount =
            20000;


        const step =
            Math.max(
                4,
                Math.floor(
                    data.length /
                    sampleCount
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
       PIXEL STATISTICS
       
       This helps prove whether the model input is actually
       changing between images.
    ============================================================ */

    function getPixelStatistics(
        imageData
    ) {

        const data =
            imageData.data;


        let red =
            0;

        let green =
            0;

        let blue =
            0;

        let alpha =
            0;


        const pixelCount =
            data.length / 4;


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            red +=
                data[i];

            green +=
                data[i + 1];

            blue +=
                data[i + 2];

            alpha +=
                data[i + 3];

        }


        return {

            averageRed:
                Number(
                    red /
                    pixelCount
                ).toFixed(2),

            averageGreen:
                Number(
                    green /
                    pixelCount
                ).toFixed(2),

            averageBlue:
                Number(
                    blue /
                    pixelCount
                ).toFixed(2),

            averageAlpha:
                Number(
                    alpha /
                    pixelCount
                ).toFixed(2),

            firstPixel:
                Array.from(
                    data.slice(
                        0,
                        4
                    )
                ),

            lastPixel:
                Array.from(
                    data.slice(
                        Math.max(
                            0,
                            data.length - 4
                        )
                    )
                )

        };

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
       RUN MODEL ON FRESH IMAGE DATA
       
       IMPORTANT:
       We create a NEW tensor from the image pixels every time.
    ============================================================ */

    async function classifyFreshPixels(
        imageData,
        width,
        height
    ) {

        if (!model) {

            throw new Error(
                "NSFWJS model unavailable."
            );

        }


        if (
            typeof tf === "undefined"
        ) {

            throw new Error(
                "TensorFlow.js unavailable."
            );

        }


        /*
         * Copy the pixel buffer.
         *
         * This guarantees this scan owns its own
         * pixel memory.
         */
        const pixelArray =
            new Uint8Array(
                imageData.data
            );


        /*
         * Create a completely fresh TensorFlow tensor.
         *
         * Shape:
         *
         * [height, width, 3]
         */
        const tensor =
            tf.tensor3d(
                pixelArray,
                [
                    height,
                    width,
                    4
                ],
                "int32"
            );


        /*
         * Remove alpha channel.
         *
         * NSFWJS models expect RGB.
         */
        const rgbTensor =
            tensor
                .slice(
                    [0, 0, 0],
                    [-1, -1, 3]
                );


        /*
         * NSFWJS normally handles preprocessing itself
         * when classify() receives an HTML image/canvas.
         *
         * Here we use the model's underlying classify
         * pipeline only if available.
         *
         * First try the standard model.classify(tensor)
         * path.
         */
        let predictions;


        try {

            predictions =
                await model.classify(
                    rgbTensor
                );

        }
        finally {

            /*
             * Always dispose temporary tensors.
             */
            rgbTensor.dispose();

            tensor.dispose();

        }


        return predictions;

    }


    /* ============================================================
       STANDARD FALLBACK CLASSIFICATION
       
       If the tensor path isn't supported by this NSFWJS
       build, use the fresh canvas as a fallback.
    ============================================================ */

    async function classifyFreshCanvas(
        canvas
    ) {

        if (!model) {

            throw new Error(
                "NSFWJS model unavailable."
            );

        }


        return await model.classify(
            canvas
        );

    }


    /* ============================================================
       CHECK IMAGE
    ============================================================ */

    async function checkImage(
        image
    ) {

        /*
         * FAIL CLOSED if model unavailable.
         */
        if (
            !guardReady ||
            !model
        ) {

            return {

                checked:
                    false,

                safe:
                    false,

                blocked:
                    true,

                reason:
                    "Content safety model unavailable."

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
               WAIT FOR REAL IMAGE
            ==================================================== */

            await waitForImage(
                image
            );


            /* ====================================================
               CREATE FRESH PIXEL BUFFER
            ==================================================== */

            const scan =
                createScanCanvas(
                    image
                );


            console.log(
                "🔬 NSFWJS FRESH INPUT:",
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
               PIXEL STATISTICS
            ==================================================== */

            const statistics =
                getPixelStatistics(
                    scan.imageData
                );


            console.log(
                "📊 SPARKD PIXEL STATISTICS:",
                statistics
            );


            /* ====================================================
               PIXEL FINGERPRINT
            ==================================================== */

            const fingerprint =
                getPixelFingerprint(
                    scan.imageData
                );


            console.log(
                "🧬 SPARKD PIXEL FINGERPRINT:",
                fingerprint
            );


            /* ====================================================
               VERIFY INPUT ACTUALLY CHANGES
            ==================================================== */

            if (
                lastFingerprint !== null &&
                fingerprint === lastFingerprint
            ) {

                console.warn(
                    "⚠️ SPARKD WARNING: current image has the same pixel fingerprint as the previous scan."
                );

            }


            lastFingerprint =
                fingerprint;


            /* ====================================================
               MODEL INFERENCE
               
               Use a fresh TensorFlow tensor first.
            ==================================================== */

            let predictions;


            try {

                console.log(
                    "🧠 SPARKD running NSFWJS on FRESH RGB tensor..."
                );


                predictions =
                    await classifyFreshPixels(
                        scan.imageData,
                        scan.width,
                        scan.height
                    );


                console.log(
                    "🧠 SPARKD fresh tensor inference completed."
                );

            }
            catch (tensorError) {

                /*
                 * Some NSFWJS builds do not accept tensors
                 * through model.classify().
                 *
                 * Fall back to the freshly-created canvas.
                 */
                console.warn(
                    "⚠️ Tensor inference unavailable. Using fresh canvas fallback:",
                    tensorError
                );


                predictions =
                    await classifyFreshCanvas(
                        scan.canvas
                    );

            }


            /* ====================================================
               VALIDATE PREDICTIONS
            ==================================================== */

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
               DETECT SUSPICIOUS IDENTICAL MODEL OUTPUT
               
               IMPORTANT:
               
               We DO NOT automatically block here.
               
               This is diagnostic information.
            ==================================================== */

            if (
                lastPredictionSignature !== null &&
                predictionSignature ===
                lastPredictionSignature &&
                fingerprint !==
                lastFingerprint
            ) {

                console.error(
                    "🚨 SPARKD WARNING:"
                );


                console.error(
                    "Different image pixels produced the exact same NSFWJS prediction."
                );


                console.error(
                    "This may indicate an inference/model problem."
                );

            }


            lastPredictionSignature =
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
                    typeof threshold !==
                    "number"
                ) {

                    continue;

                }


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


            /* ====================================================
               BLOCK STRONG INDIVIDUAL CLASSIFICATION
            ==================================================== */

            if (
                strongestBlocked &&
                strongestBlocked.probability >=
                strongestBlocked.threshold
            ) {

                console.warn(
                    "🚫 SPARKD BLOCKED:",
                    strongestBlocked.className,
                    "Probability:",
                    strongestBlocked.probability,
                    "Threshold:",
                    strongestBlocked.threshold
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
               IMAGE PASSED
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

            /*
             * FAIL CLOSED.
             */
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
                    !!model
                );

            },


        getModel:
            function () {

                return model;

            }

    };


    /* ============================================================
       START MODEL
    ============================================================ */

    loadContentGuard();

})();

