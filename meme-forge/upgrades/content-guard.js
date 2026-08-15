/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side NudeNet ONNX image safety scanner
   Version: v30
============================================================ */

(function () {

    "use strict";

    console.log(
        "🛡️ SPARKD Content Guard loading..."
    );


    /* ============================================================
       STATE
    ============================================================ */

    let guardReady = false;
    let session = null;


    /* ============================================================
       MODEL PATH
    ============================================================ */

    const MODEL_URL =
        "/meme-forge/upgrades/nudenet/nudenet.onnx";


    /* ============================================================
       NUDENET SETTINGS
    ============================================================ */

    const INPUT_SIZE = 320;

    /*
     * Minimum confidence required for a detection
     * to be considered.
     */
    const DETECTION_THRESHOLD = 0.35;

    /*
     * Confidence required before an exposed body
     * part is considered prohibited.
     *
     * Lower = stricter
     * Higher = more permissive
     */
    const BLOCK_THRESHOLD = 0.70;

    /*
     * IoU threshold used for Non-Maximum Suppression.
     */
    const NMS_THRESHOLD = 0.45;


    /* ============================================================
       NUDENET DEFAULT MODEL CLASSES

       This ordering matches the documented default
       NudeNet model.
    ============================================================ */

    const NUDENET_CLASSES = [

        "exposed anus",
        "exposed armpits",
        "belly",
        "exposed belly",
        "buttocks",
        "exposed buttocks",
        "female face",
        "male face",
        "feet",
        "exposed feet",
        "breast",
        "exposed breast",
        "vagina",
        "exposed vagina",
        "male breast",
        "exposed penis"

    ];


    /* ============================================================
       PROHIBITED CLASSES

       Covered/non-exposed body parts are NOT blocked.

       Bikini/swimwear should therefore not automatically
       trigger a block.

       Explicitly exposed sexual anatomy is blocked.
    ============================================================ */

    const BLOCKED_CLASSES = [

        "exposed anus",
        "exposed buttocks",
        "exposed breast",
        "exposed vagina",
        "exposed penis"

    ];


    /* ============================================================
       LOAD MODEL
    ============================================================ */

    async function loadContentGuard() {

        try {

            if (
                typeof ort === "undefined"
            ) {

                throw new Error(
                    "ONNX Runtime Web is not loaded."
                );

            }


            console.log(
                "🛡️ Loading NudeNet ONNX model..."
            );


            session =
                await ort.InferenceSession.create(
                    MODEL_URL,
                    {
                        executionProviders: [
                            "wasm"
                        ]
                    }
                );


            if (!session) {

                throw new Error(
                    "NudeNet ONNX session was not created."
                );

            }


            console.log(
                "🧠 NudeNet ONNX model loaded."
            );


            console.log(
                "🔬 NudeNet inputs:",
                session.inputNames
            );


            console.log(
                "🔬 NudeNet outputs:",
                session.outputNames
            );


            guardReady = true;

            window.SPARKD_CONTENT_GUARD_READY =
                true;


            window.dispatchEvent(
                new Event(
                    "sparkd-content-guard-ready"
                )
            );


            console.log(
                "✅ SPARKD NudeNet Content Guard ready."
            );


        } catch (error) {

            guardReady = false;

            session = null;

            window.SPARKD_CONTENT_GUARD_READY =
                false;


            console.error(
                "❌ SPARKD Content Guard failed:",
                error
            );


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
       CREATE MODEL INPUT
    ============================================================ */

    function createModelInput(image) {

        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            INPUT_SIZE;

        canvas.height =
            INPUT_SIZE;


        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        if (!ctx) {

            throw new Error(
                "Could not create scan canvas."
            );

        }


        /*
         * Fill the entire model input.
         */
        ctx.drawImage(
            image,
            0,
            0,
            INPUT_SIZE,
            INPUT_SIZE
        );


        const imageData =
            ctx.getImageData(
                0,
                0,
                INPUT_SIZE,
                INPUT_SIZE
            );


        const pixelCount =
            INPUT_SIZE *
            INPUT_SIZE;


        /*
         * NCHW RGB float32 tensor.
         */
        const input =
            new Float32Array(
                pixelCount * 3
            );


        for (
            let i = 0;
            i < pixelCount;
            i++
        ) {

            const src =
                i * 4;


            /*
             * Red
             */
            input[i] =
                imageData.data[src] /
                255.0;


            /*
             * Green
             */
            input[
                pixelCount + i
            ] =
                imageData.data[src + 1] /
                255.0;


            /*
             * Blue
             */
            input[
                pixelCount * 2 + i
            ] =
                imageData.data[src + 2] /
                255.0;

        }


        return {

            tensor:
                new ort.Tensor(
                    "float32",
                    input,
                    [
                        1,
                        3,
                        INPUT_SIZE,
                        INPUT_SIZE
                    ]
                ),

            canvas:
                canvas

        };

    }


    /* ============================================================
       IOU
    ============================================================ */

    function calculateIoU(
        a,
        b
    ) {

        const ax1 =
            a.x;

        const ay1 =
            a.y;

        const ax2 =
            a.x + a.width;

        const ay2 =
            a.y + a.height;


        const bx1 =
            b.x;

        const by1 =
            b.y;

        const bx2 =
            b.x + b.width;

        const by2 =
            b.y + b.height;


        const ix1 =
            Math.max(
                ax1,
                bx1
            );

        const iy1 =
            Math.max(
                ay1,
                by1
            );

        const ix2 =
            Math.min(
                ax2,
                bx2
            );

        const iy2 =
            Math.min(
                ay2,
                by2
            );


        const iw =
            Math.max(
                0,
                ix2 - ix1
            );

        const ih =
            Math.max(
                0,
                iy2 - iy1
            );


        const intersection =
            iw * ih;


        const areaA =
            Math.max(
                0,
                a.width
            ) *
            Math.max(
                0,
                a.height
            );


        const areaB =
            Math.max(
                0,
                b.width
            ) *
            Math.max(
                0,
                b.height
            );


        const union =
            areaA +
            areaB -
            intersection;


        if (
            union <= 0
        ) {

            return 0;

        }


        return (
            intersection /
            union
        );

    }


    /* ============================================================
       NON-MAXIMUM SUPPRESSION
    ============================================================ */

    function applyNMS(
        detections
    ) {

        const sorted =
            [...detections].sort(
                (
                    a,
                    b
                ) =>
                    b.probability -
                    a.probability
            );


        const selected = [];


        while (
            sorted.length
        ) {

            const current =
                sorted.shift();


            selected.push(
                current
            );


            for (
                let i =
                    sorted.length - 1;
                i >= 0;
                i--
            ) {

                /*
                 * Only suppress boxes of the
                 * same class.
                 */
                if (
                    sorted[i].className !==
                    current.className
                ) {

                    continue;

                }


                if (
                    calculateIoU(
                        current,
                        sorted[i]
                    ) >=
                    NMS_THRESHOLD
                ) {

                    sorted.splice(
                        i,
                        1
                    );

                }

            }

        }


        return selected;

    }


    /* ============================================================
       PARSE NUDENET OUTPUT
    ============================================================ */

    function parseOutput(
        output
    ) {

        if (
            !output ||
            !output.dims ||
            !output.data
        ) {

            throw new Error(
                "Invalid NudeNet output."
            );

        }


        console.log(
            "🔬 NudeNet output tensor:",
            {
                dimensions:
                    output.dims,

                length:
                    output.data.length
            }
        );


        /*
         * Expected:
         *
         * [1, 22, 2100]
         *
         * 4 box channels
         * +
         * 18 class channels
         */
        if (
            output.dims.length !== 3 ||
            output.dims[0] !== 1 ||
            output.dims[1] !== 22
        ) {

            throw new Error(
                "Unsupported NudeNet output format: " +
                JSON.stringify(
                    output.dims
                )
            );

        }


        const detections =
            output.dims[2];


        const data =
            output.data;


        const rawDetections = [];


        /*
         * YOLO-style channel-first output:
         *
         * channel 0  = x
         * channel 1  = y
         * channel 2  = width
         * channel 3  = height
         *
         * channels 4-21 = class scores
         */
        for (
            let i = 0;
            i < detections;
            i++
        ) {

            const x =
                data[i];


            const y =
                data[
                    detections + i
                ];


            const width =
                data[
                    detections * 2 + i
                ];


            const height =
                data[
                    detections * 3 + i
                ];


            let bestClass =
                -1;


            let bestScore =
                0;


            for (
                let c = 0;
                c < 18;
                c++
            ) {

                const score =
                    data[
                        detections *
                        (4 + c) +
                        i
                    ];


                if (
                    Number.isFinite(
                        score
                    ) &&
                    score >
                    bestScore
                ) {

                    bestScore =
                        score;

                    bestClass =
                        c;

                }

            }


            if (
                bestClass < 0
            ) {

                continue;

            }


            if (
                !Number.isFinite(
                    bestScore
                )
            ) {

                continue;

            }


            if (
                bestScore <
                DETECTION_THRESHOLD
            ) {

                continue;

            }


            const className =
                NUDENET_CLASSES[
                    bestClass
                ] ||
                "unknown";


            rawDetections.push({

                classIndex:
                    bestClass,

                className:
                    className,

                probability:
                    bestScore,

                x:
                    x,

                y:
                    y,

                width:
                    width,

                height:
                    height

            });

        }


        /*
         * Remove duplicate overlapping detections.
         */
        const finalDetections =
            applyNMS(
                rawDetections
            );


        return finalDetections;

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
            !session
        ) {

            return {

                checked:
                    false,

                safe:
                    false,

                blocked:
                    true,

                reason:
                    "Content safety model is unavailable."

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

            console.log(
                "🧠 SPARKD running NudeNet..."
            );


            /*
             * Prepare image.
             */
            const prepared =
                createModelInput(
                    image
                );


            console.log(
                "🔬 NudeNet scan:",
                {
                    width:
                        INPUT_SIZE,

                    height:
                        INPUT_SIZE
                }
            );


            /*
             * Get input name.
             */
            const inputName =
                session.inputNames[0];


            const feeds = {};


            feeds[inputName] =
                prepared.tensor;


            /*
             * Run ONNX.
             */
            const results =
                await session.run(
                    feeds
                );


            const outputName =
                session.outputNames[0];


            const output =
                results[
                    outputName
                ];


            if (!output) {

                throw new Error(
                    "NudeNet returned no output tensor."
                );

            }


            /*
             * Parse detections.
             */
            const predictions =
                parseOutput(
                    output
                );


            console.log(
                "🛡️ SPARKD NudeNet detections:",
                predictions
            );


            /* ====================================================
               FIND PROHIBITED DETECTION
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


                if (
                    prediction.probability <
                    BLOCK_THRESHOLD
                ) {

                    continue;

                }


                if (
                    !strongestBlocked ||
                    prediction.probability >
                    strongestBlocked.probability
                ) {

                    strongestBlocked =
                        prediction;

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
                        BLOCK_THRESHOLD,

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


        } catch (error) {

            console.error(
                "⚠️ SPARKD NudeNet scan failed:",
                error
            );


            /*
             * FAIL CLOSED
             */
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
                    !!session
                );

            },

        getModel:
            function () {

                return session;

            }

    };


    /* ============================================================
       START
    ============================================================ */

    loadContentGuard();


})();

