/* ============================================================
   SPARKD CONTENT GUARD
   NudeNet + ONNX Runtime Web
   Browser-side nudity detector
   Version: v24
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
   MODEL
============================================================ */

const MODEL_URL =
    "./upgrades/nudenet/nudenet.onnx";


/* ============================================================
   MODEL SETTINGS
============================================================ */

const MODEL_SIZE = 320;


/*
 * NudeNet detection confidence.
 *
 * Start conservatively.
 * We will tune this AFTER seeing real
 * NudeNet predictions from your images.
 */

const DETECTION_THRESHOLD = 0.35;


/* ============================================================
   NUDE NET LABELS
============================================================ */

const NUDE_CLASSES = [

    "FEMALE_GENITALIA_EXPOSED",

    "MALE_GENITALIA_EXPOSED",

    "FEMALE_BREAST_EXPOSED",

    "BUTTOCKS_EXPOSED",

    "ANUS_EXPOSED",

    "PUBIC_AREA_EXPOSED"

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


        /*
         * Use WASM.
         *
         * This gives us the broadest browser
         * compatibility.
         */

        ort.env.wasm.wasmPaths =
            "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";


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
                "ONNX Runtime returned no session."
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

    }
    catch (error) {

        guardReady = false;

        session = null;


        window.SPARKD_CONTENT_GUARD_READY =
            false;


        console.error(
            "❌ SPARKD NudeNet Content Guard failed:",
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
        MODEL_SIZE;

    canvas.height =
        MODEL_SIZE;


    const ctx =
        canvas.getContext(
            "2d"
        );


    if (!ctx) {

        throw new Error(
            "Could not create scan canvas."
        );

    }


    /*
     * Draw image directly into the
     * 320 x 320 model input.
     */

    ctx.drawImage(
        image,
        0,
        0,
        MODEL_SIZE,
        MODEL_SIZE
    );


    const imageData =
        ctx.getImageData(
            0,
            0,
            MODEL_SIZE,
            MODEL_SIZE
        );


    const pixels =
        imageData.data;


    /*
     * NudeNet YOLO models use
     * RGB floating point input.
     *
     * Shape:
     *
     * [1, 3, 320, 320]
     */

    const input =
        new Float32Array(
            3 *
            MODEL_SIZE *
            MODEL_SIZE
        );


    const channelSize =
        MODEL_SIZE *
        MODEL_SIZE;


    for (
        let y = 0;
        y < MODEL_SIZE;
        y++
    ) {

        for (
            let x = 0;
            x < MODEL_SIZE;
            x++
        ) {

            const pixelIndex =
                (
                    y *
                    MODEL_SIZE +
                    x
                ) * 4;


            const tensorIndex =
                y *
                MODEL_SIZE +
                x;


            input[
                tensorIndex
            ] =
                pixels[
                    pixelIndex
                ] / 255;


            input[
                channelSize +
                tensorIndex
            ] =
                pixels[
                    pixelIndex + 1
                ] / 255;


            input[
                channelSize * 2 +
                tensorIndex
            ] =
                pixels[
                    pixelIndex + 2
                ] / 255;

        }

    }


    return {
        canvas: canvas,
        tensor: new ort.Tensor(
            "float32",
            input,
            [
                1,
                3,
                MODEL_SIZE,
                MODEL_SIZE
            ]
        )
    };

}


/* ============================================================
   CHECK IMAGE
============================================================ */

async function checkImage(image) {

    /*
     * FAIL CLOSED
     */

    if (
        !guardReady ||
        !session
    ) {

        return {

            checked: false,

            safe: false,

            blocked: true,

            reason:
                "NudeNet safety model is unavailable."

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

        const prepared =
            createModelInput(
                image
            );


        console.log(
            "🧠 SPARKD running NudeNet..."
        );


        console.log(
            "🔬 NudeNet scan:",
            {
                width:
                    prepared.canvas.width,

                height:
                    prepared.canvas.height
            }
        );


        /*
         * Use the first model input.
         */

        const inputName =
            session.inputNames[0];


        const feeds = {};


        feeds[inputName] =
            prepared.tensor;


        /*
         * RUN MODEL
         */

        const results =
            await session.run(
                feeds
            );


        console.log(
            "🔬 NudeNet raw output:",
            results
        );


        /*
         * Get first output tensor.
         */

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
         * IMPORTANT:
         *
         * We are NOT going to guess the
         * output format or thresholds yet.
         *
         * First we expose the actual model
         * output so we can verify that this
         * model is behaving correctly.
         */

        const rawOutput =
            Array.from(
                output.data
            );


        console.log(
            "🧪 SPARKD NudeNet RAW PREDICTIONS:",
            rawOutput
        );


        /*
         * TEMPORARY SAFETY BEHAVIOR
         *
         * Until we confirm the exact output
         * tensor format, fail closed rather
         * than accidentally allowing content.
         */

        return {

            checked: true,

            safe: false,

            blocked: true,

            predictions:
                rawOutput,

            reason:
                "NudeNet model executed successfully. Output format verification required."

        };

    }
    catch (error) {

        console.error(
            "⚠️ SPARKD NudeNet scan failed:",
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

