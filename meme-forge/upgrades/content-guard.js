/* ============================================================
   SPARKD CONTENT GUARD
   Browser-side NudeNet ONNX image safety scanner
   Version: v24 - NudeNet tensor decoder
============================================================ */

(function () {
"use strict";

console.log("🛡️ SPARKD Content Guard loading...");


/* ============================================================
   STATE
============================================================ */

let guardReady = false;
let session = null;


/* ============================================================
   MODEL
============================================================ */

const MODEL_URL =
    "./upgrades/nudenet/model.onnx";


/* ============================================================
   NUDENET SETTINGS
============================================================ */

const INPUT_SIZE = 320;


/*
 * NudeNet class order for the 22-output model.
 *
 * The model returns 22 values for each detection:
 *
 * 0-3   = bounding box
 * 4     = object confidence
 * 5-21  = class scores
 *
 * These are the NudeNet classes used by the model.
 */

const NUDENET_CLASSES = [
    "exposed_anus",
    "exposed_armpits",
    "exposed_belly",
    "exposed_buttocks",
    "exposed_breast",
    "exposed_genitalia",
    "exposed_male_chest",
    "exposed_female_breast",
    "exposed_female_genitalia",
    "exposed_male_genitalia",
    "exposed_buttocks",
    "covered_breast",
    "covered_genitalia",
    "covered_buttocks",
    "male_chest",
    "female_breast",
    "female_genitalia"
];


/*
 * Anything in this list can cause a block.
 *
 * We deliberately do NOT block ordinary clothed body parts.
 */

const BLOCKED_CLASSES = [
    "exposed_breast",
    "exposed_female_breast",
    "exposed_genitalia",
    "exposed_female_genitalia",
    "exposed_male_genitalia",
    "exposed_anus",
    "exposed_buttocks"
];


/*
 * Confidence required before blocking.
 *
 * Start conservative enough to avoid blocking normal
 * photographs while still catching obvious nudity.
 */

const BLOCK_THRESHOLD = 0.55;


/* ============================================================
   LOAD MODEL
============================================================ */

async function loadContentGuard() {

    try {

        if (typeof ort === "undefined") {

            throw new Error(
                "ONNX Runtime Web (ort) is not loaded."
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
                "NudeNet ONNX session could not be created."
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

        window.SPARKD_CONTENT_GUARD_READY = true;


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

        window.SPARKD_CONTENT_GUARD_READY = false;


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
   CREATE IMAGE CANVAS
============================================================ */

function createScanCanvas(image) {

    const width =
        image.naturalWidth ||
        image.width;

    const height =
        image.naturalHeight ||
        image.height;


    if (!width || !height) {

        throw new Error(
            "Image has invalid dimensions."
        );
    }


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
     * Fill the canvas first.
     *
     * This prevents transparent PNG areas from becoming
     * unpredictable input.
     */

    ctx.fillStyle =
        "#000000";

    ctx.fillRect(
        0,
        0,
        INPUT_SIZE,
        INPUT_SIZE
    );


    /*
     * Preserve aspect ratio.
     */

    const scale =
        Math.min(
            INPUT_SIZE / width,
            INPUT_SIZE / height
        );


    const drawWidth =
        width * scale;

    const drawHeight =
        height * scale;


    const offsetX =
        (INPUT_SIZE - drawWidth) / 2;

    const offsetY =
        (INPUT_SIZE - drawHeight) / 2;


    ctx.drawImage(
        image,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
    );


    return canvas;
}


/* ============================================================
   CANVAS -> FLOAT32 RGB TENSOR
============================================================ */

function canvasToTensor(canvas) {

    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );


    if (!ctx) {

        throw new Error(
            "Could not read scan canvas."
        );
    }


    const imageData =
        ctx.getImageData(
            0,
            0,
            INPUT_SIZE,
            INPUT_SIZE
        );


    const pixels =
        imageData.data;


    /*
     * NudeNet expects:
     *
     * [1, 3, 320, 320]
     *
     * RGB
     *
     * normalized to 0-1
     */

    const area =
        INPUT_SIZE *
        INPUT_SIZE;


    const input =
        new Float32Array(
            3 * area
        );


    for (
        let y = 0;
        y < INPUT_SIZE;
        y++
    ) {

        for (
            let x = 0;
            x < INPUT_SIZE;
            x++
        ) {

            const pixelIndex =
                (
                    y *
                    INPUT_SIZE +
                    x
                ) * 4;


            const tensorIndex =
                y *
                INPUT_SIZE +
                x;


            input[
                tensorIndex
            ] =
                pixels[
                    pixelIndex
                ] / 255;


            input[
                area +
                tensorIndex
            ] =
                pixels[
                    pixelIndex + 1
                ] / 255;


            input[
                area * 2 +
                tensorIndex
            ] =
                pixels[
                    pixelIndex + 2
                ] / 255;
        }
    }


    return new ort.Tensor(
        "float32",
        input,
        [
            1,
            3,
            INPUT_SIZE,
            INPUT_SIZE
        ]
    );
}


/* ============================================================
   SIGMOID
============================================================ */

function sigmoid(value) {

    /*
     * Protect against overflow.
     */

    if (value >= 0) {

        const z =
            Math.exp(-value);

        return 1 / (1 + z);

    } else {

        const z =
            Math.exp(value);

        return z / (1 + z);
    }
}


/* ============================================================
   DECODE NUDENET OUTPUT
============================================================ */

function decodeNudeNetOutput(outputTensor) {

    if (!outputTensor) {

        throw new Error(
            "NudeNet returned no output tensor."
        );
    }


    const dims =
        outputTensor.dims;


    const data =
        outputTensor.data;


    console.log(
        "🔬 NudeNet output tensor:",
        {
            dimensions: dims,
            length: data.length
        }
    );


    /*
     * Expected:
     *
     * [1, 22, 2100]
     */

    if (
        !Array.isArray(dims) ||
        dims.length !== 3
    ) {

        throw new Error(
            "Unexpected NudeNet output dimensions."
        );
    }


    const channels =
        dims[1];

    const detections =
        dims[2];


    if (
        channels !== 22
    ) {

        throw new Error(
            "Unexpected NudeNet channel count: " +
            channels
        );
    }


    if (
        data.length !==
        channels * detections
    ) {

        throw new Error(
            "NudeNet output tensor size mismatch."
        );
    }


    const results = [];


    /*
     * Tensor layout:
     *
     * [1, 22, 2100]
     *
     * Therefore each channel contains all 2100
     * detections.
     */

    for (
        let detection = 0;
        detection < detections;
        detection++
    ) {


        const x =
            Number(
                data[
                    detection
                ]
            );


        const y =
            Number(
                data[
                    detections +
                    detection
                ]
            );


        const width =
            Number(
                data[
                    detections * 2 +
                    detection
                ]
            );


        const height =
            Number(
                data[
                    detections * 3 +
                    detection
                ]
            );


        /*
         * Object confidence.
         */

        const objectnessRaw =
            Number(
                data[
                    detections * 4 +
                    detection
                ]
            );


        const objectness =
            sigmoid(
                objectnessRaw
            );


        let bestClass =
            null;


        let bestProbability =
            0;


        /*
         * Channels 5-21 contain class scores.
         */

        for (
            let classIndex = 0;
            classIndex < 17;
            classIndex++
        ) {

            const rawScore =
                Number(
                    data[
                        detections *
                        (
                            5 +
                            classIndex
                        ) +
                        detection
                    ]
                );


            const probability =
                sigmoid(
                    rawScore
                );


            if (
                probability >
                bestProbability
            ) {

                bestProbability =
                    probability;


                bestClass =
                    NUDENET_CLASSES[
                        classIndex
                    ];
            }
        }


        /*
         * Combine object confidence with
         * class confidence.
         */

        const confidence =
            objectness *
            bestProbability;


        if (
            bestClass &&
            confidence >=
            0.05
        ) {

            results.push({

                className:
                    bestClass,

                probability:
                    confidence,

                objectness:
                    objectness,

                classProbability:
                    bestProbability,

                box: {
                    x: x,
                    y: y,
                    width: width,
                    height: height
                }
            });
        }
    }


    /*
     * Highest confidence first.
     */

    results.sort(
        function (a, b) {

            return (
                b.probability -
                a.probability
            );
        }
    );


    return results;
}

/* ============================================================
   CHECK IMAGE
   SPARKD NudeNet ONNX detector
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
            reason:
                "No image supplied."
        };
    }

    try {

        /* ====================================================
           CREATE 320x320 INPUT
        ==================================================== */

        const canvas =
            document.createElement("canvas");

        canvas.width = 320;
        canvas.height = 320;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            throw new Error(
                "Could not create scan canvas."
            );
        }

        /*
         * NudeNet expects RGB image data.
         * Draw the complete image into the model input.
         */
        ctx.drawImage(
            image,
            0,
            0,
            320,
            320
        );

        console.log(
            "🧠 SPARKD running NudeNet..."
        );

        console.log(
            "🔬 NudeNet scan:",
            {
                width: canvas.width,
                height: canvas.height
            }
        );


        /* ====================================================
           CREATE FLOAT32 NCHW TENSOR
        ==================================================== */

        const imageData =
            ctx.getImageData(
                0,
                0,
                320,
                320
            );

        const input =
            new Float32Array(
                1 * 3 * 320 * 320
            );

        const planeSize =
            320 * 320;

        for (
            let y = 0;
            y < 320;
            y++
        ) {

            for (
                let x = 0;
                x < 320;
                x++
            ) {

                const src =
                    (y * 320 + x) * 4;

                const dst =
                    y * 320 + x;

                /*
                 * RGB
                 * Normalize 0..255 -> 0..1
                 */
                input[
                    dst
                ] =
                    imageData.data[src] / 255;

                input[
                    planeSize + dst
                ] =
                    imageData.data[src + 1] / 255;

                input[
                    planeSize * 2 + dst
                ] =
                    imageData.data[src + 2] / 255;
            }
        }


        /* ====================================================
           RUN ONNX MODEL
        ==================================================== */

        const inputName =
            session.inputNames[0];

        const feeds = {};

        feeds[inputName] =
            new ort.Tensor(
                "float32",
                input,
                [1, 3, 320, 320]
            );

        const results =
            await session.run(feeds);

        const outputName =
            session.outputNames[0];

        const output =
            results[outputName];

        if (!output) {
            throw new Error(
                "NudeNet returned no output tensor."
            );
        }

        console.log(
            "🔬 NudeNet output tensor:",
            {
                dimensions: output.dims,
                length: output.data.length
            }
        );


        /* ====================================================
           VERIFY OUTPUT
           Expected:
           [1, 22, 2100]
        ==================================================== */

        if (
            !Array.isArray(output.dims) ||
            output.dims.length !== 3
        ) {
            throw new Error(
                "Unexpected NudeNet output dimensions."
            );
        }

        const batch =
            output.dims[0];

        const channels =
            output.dims[1];

        const detections =
            output.dims[2];

        if (
            batch !== 1 ||
            channels !== 22
        ) {
            throw new Error(
                "Unexpected NudeNet output format: " +
                JSON.stringify(output.dims)
            );
        }


        /* ====================================================
           NUDENET CLASS LABELS

           18 classes follow the 4 box values.
        ==================================================== */

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
            "exposed penis",
            "unknown_16",
            "unknown_17"

        ];


        /*
         * Classes that should cause SPARKD
         * to reject an image.
         */
        const BLOCKED_PARTS = [

            "exposed anus",
            "exposed belly",
            "exposed buttocks",
            "exposed breasts",
            "exposed breast",
            "exposed vagina",
            "exposed penis"

        ];


        /* ====================================================
           PARSE YOLO OUTPUT
           
           Output layout:

           [1, 22, 2100]

           First 4 channels:
           x
           y
           width
           height

           Remaining 18:
           class confidence
        ==================================================== */

        const data =
            output.data;

        const parsedPredictions = [];

        let strongestBlocked = null;

        /*
         * NudeNet's ONNX output is channel-first.

         * data[
         *     channel * detections + detection
         * ]
         */

        for (
            let i = 0;
            i < detections;
            i++
        ) {

            const x =
                data[
                    i
                ];

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


            /*
             * Find strongest class
             */
            for (
                let c = 0;
                c < 18;
                c++
            ) {

                const score =
                    data[
                        detections * (4 + c) + i
                    ];

                if (
                    score > bestScore
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


            const className =
                NUDENET_CLASSES[
                    bestClass
                ] || "unknown";


            /*
             * Ignore extremely weak detections.
             */
            if (
                bestScore < 0.30
            ) {
                continue;
            }


            const prediction = {

                className:
                    className,

                probability:
                    bestScore,

                box: [
                    x,
                    y,
                    width,
                    height
                ]

            };


            parsedPredictions.push(
                prediction
            );


            /* =================================================
               BLOCK PROHIBITED BODY-PART DETECTIONS
            ================================================= */

            if (
                BLOCKED_PARTS.includes(
                    className
                )
            ) {

                if (
                    !strongestBlocked ||
                    bestScore >
                    strongestBlocked.probability
                ) {

                    strongestBlocked = {

                        className:
                            className,

                        probability:
                            bestScore,

                        box: [
                            x,
                            y,
                            width,
                            height
                        ]

                    };

                }

            }

        }


        /* ====================================================
           DEBUG OUTPUT
        ==================================================== */

        console.log(
            "🛡️ SPARKD NudeNet detections:",
            parsedPredictions
        );


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

                predictions:
                    parsedPredictions,

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
                parsedPredictions

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
