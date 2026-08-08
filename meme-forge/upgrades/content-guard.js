// ============================================================
// SPARKD CONTENT GUARD
// Client-side image safety scanner
// Uses NSFWJS bundled MobileNetV2 model
// ============================================================

(() => {
    "use strict";

    console.log("🛡️ SPARKD Content Guard loading...");

    let contentModel = null;
    let modelLoading = null;
    let scannerReady = false;

    // ------------------------------------------------------------
    // SETTINGS
    // ------------------------------------------------------------

    // Explicit sexual content
    const PORN_BLOCK = 0.55;

    // Hentai / explicit anime content
    const HENTAI_BLOCK = 0.45;

    // Sexy content needs a higher confidence because normal
    // photos, swimsuits, fitness images, etc. can score here.
    const SEXY_BLOCK = 0.90;


    // ------------------------------------------------------------
    // LOAD MODEL
    // ------------------------------------------------------------

    async function loadModel() {

        if (scannerReady && contentModel) {
            return contentModel;
        }

        if (modelLoading) {
            return modelLoading;
        }

        modelLoading = (async () => {

            try {

                if (!window.nsfwjs) {
                    throw new Error("NSFWJS library was not loaded.");
                }

                console.log("🛡️ Loading bundled NSFWJS model...");

                // IMPORTANT:
                // No URL is supplied here.
                // This tells NSFWJS to use its bundled model.
                contentModel = await nsfwjs.load();

                scannerReady = true;

                console.log("✅ SPARKD Content Guard ready.");

                return contentModel;

            } catch (error) {

                console.error(
                    "❌ SPARKD Content Guard model failed:",
                    error
                );

                scannerReady = false;
                contentModel = null;

                throw error;
            }

        })();

        return modelLoading;
    }


    // ------------------------------------------------------------
    // CLASSIFICATION
    // ------------------------------------------------------------

    async function scanImage(imageElement) {

        const model = await loadModel();

        const predictions = await model.classify(imageElement, 5);

        console.log("🛡️ SPARKD scan:", predictions);

        const scores = {};

        predictions.forEach(prediction => {

            scores[prediction.className] =
                Number(prediction.probability) || 0;

        });


        const porn =
            scores.Porn || 0;

        const hentai =
            scores.Hentai || 0;

        const sexy =
            scores.Sexy || 0;


        // --------------------------------------------------------
        // BLOCK EXPLICIT CONTENT
        // --------------------------------------------------------

        if (porn >= PORN_BLOCK) {

            return {
                allowed: false,
                reason: "Pornographic content detected.",
                predictions
            };
        }


        // --------------------------------------------------------
        // BLOCK EXPLICIT ANIME / HENTAI
        // --------------------------------------------------------

        if (hentai >= HENTAI_BLOCK) {

            return {
                allowed: false,
                reason: "Explicit anime content detected.",
                predictions
            };
        }


        // --------------------------------------------------------
        // BLOCK VERY HIGH-CONFIDENCE SEXUAL CONTENT
        // --------------------------------------------------------

        if (sexy >= SEXY_BLOCK) {

            return {
                allowed: false,
                reason: "Sexually explicit content detected.",
                predictions
            };
        }


        // --------------------------------------------------------
        // OTHERWISE ALLOW
        // --------------------------------------------------------

        return {
            allowed: true,
            reason: "Image passed the content scan.",
            predictions
        };
    }


    // ------------------------------------------------------------
    // PUBLIC CHECK FUNCTION
    // ------------------------------------------------------------

    window.sparkdCheckImage = async function(imageElement) {

        try {

            if (!imageElement) {
                console.error("❌ SPARKD: No image supplied.");
                return false;
            }

            const result = await scanImage(imageElement);

            if (!result.allowed) {

                console.warn(
                    "🚫 SPARKD BLOCKED:",
                    result.reason,
                    result.predictions
                );

                alert(
                    "🚫 Image blocked\n\n" +
                    "This image appears to contain adult or explicit content."
                );

                return false;
            }

            console.log(
                "✅ SPARKD ALLOWED:",
                result.predictions
            );

            return true;

        } catch (error) {

            console.error(
                "❌ SPARKD Content Guard error:",
                error
            );

            /*
             * IMPORTANT:
             * If the scanner itself fails, DO NOT silently allow
             * the upload. The purpose of this guard is to prevent
             * unsafe images from entering the Forge.
             */

            alert(
                "⚠️ Content scanner unavailable.\n\n" +
                "The image cannot be uploaded until the scanner is ready."
            );

            return false;
        }
    };


    // ------------------------------------------------------------
    // PRELOAD MODEL
    // ------------------------------------------------------------

    window.sparkdContentGuardReady = loadModel();


    // ------------------------------------------------------------
    // DEBUG / STATUS
    // ------------------------------------------------------------

    window.sparkdContentGuardStatus = function() {

        return {
            loaded: scannerReady,
            model: contentModel ? "MobileNetV2" : null
        };

    };


    console.log("🛡️ SPARKD Content Guard installed.");

})();
