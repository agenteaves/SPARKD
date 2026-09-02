/* ============================================================
   SPARKD CONTENT GUARD v30 BRIDGE
   Waits for NudeNet v30 to finish loading before checking files.
   Standalone module — does not modify Meme Forge core.
============================================================ */

(function () {
    "use strict";

    const READY_TIMEOUT_MS = 30000;

    function getGuard() {
        return window.SPARKDContentGuard || null;
    }

    async function waitForGuardReady() {
        const guard = getGuard();

        if (
            guard &&
            typeof guard.isReady === "function" &&
            guard.isReady()
        ) {
            return guard;
        }

        return await new Promise(function (resolve, reject) {
            let finished = false;

            const timeout = setTimeout(function () {
                cleanup();
                reject(
                    new Error(
                        "SPARKD Content Guard did not finish loading in time."
                    )
                );
            }, READY_TIMEOUT_MS);

            function cleanup() {
                if (finished) return;
                finished = true;

                clearTimeout(timeout);

                window.removeEventListener(
                    "sparkd-content-guard-ready",
                    onReady
                );

                window.removeEventListener(
                    "sparkd-content-guard-error",
                    onError
                );
            }

            function onReady() {
                const readyGuard = getGuard();

                if (
                    readyGuard &&
                    typeof readyGuard.isReady === "function" &&
                    readyGuard.isReady()
                ) {
                    cleanup();
                    resolve(readyGuard);
                    return;
                }

                cleanup();
                reject(
                    new Error(
                        "SPARKD Content Guard reported ready but is unavailable."
                    )
                );
            }

            function onError(event) {
                cleanup();

                reject(
                    event?.detail instanceof Error
                        ? event.detail
                        : new Error(
                            "SPARKD Content Guard failed to initialize."
                        )
                );
            }

            window.addEventListener(
                "sparkd-content-guard-ready",
                onReady
            );

            window.addEventListener(
                "sparkd-content-guard-error",
                onError
            );

            /*
             * Guard could become ready between the first check
             * and event listener registration.
             */
            const recheck = getGuard();

            if (
                recheck &&
                typeof recheck.isReady === "function" &&
                recheck.isReady()
            ) {
                cleanup();
                resolve(recheck);
            }
        });
    }

    async function fileToImage(file) {
        if (
            !file ||
            typeof file.type !== "string" ||
            !file.type.startsWith("image/")
        ) {
            throw new Error(
                "A valid image file is required."
            );
        }

        const objectUrl = URL.createObjectURL(file);

        try {
            return await new Promise(function (resolve, reject) {
                const image = new Image();

                image.onload = function () {
                    resolve(image);
                };

                image.onerror = function () {
                    reject(
                        new Error(
                            "Uploaded image could not be decoded."
                        )
                    );
                };

                image.src = objectUrl;
            });
        } finally {
            /*
             * Revoking immediately after load is safe because
             * decoded image pixels remain available to the Image object.
             */
            setTimeout(function () {
                URL.revokeObjectURL(objectUrl);
            }, 0);
        }
    }

    async function check(file) {
        try {
            const guard =
                await waitForGuardReady();

            const image =
                await fileToImage(file);

            const result =
                await guard.checkImage(image);

            if (
                !result ||
                result.checked !== true ||
                result.safe !== true ||
                result.blocked === true
            ) {
                const reason =
                    result?.reason ||
                    "Image failed SPARKD content verification.";

                console.warn(
                    "🚫 SPARKD image blocked:",
                    reason,
                    result
                );

                alert(
                    "🚫 SPARKD blocked this image because it contains prohibited content."
                );

                return false;
            }

            return true;
        }
        catch (error) {
            /*
             * FAIL CLOSED:
             * if the model cannot initialize or the image
             * cannot be checked, the Forge must not accept it.
             */
            console.error(
                "❌ SPARKD Content Guard check unavailable:",
                error
            );

            alert(
                "🚫 SPARKD content protection could not verify this image. Upload blocked."
            );

            return false;
        }
    }

    window.SPARKD_GUARD = {
        check,
        isReady: function () {
            const guard = getGuard();

            return Boolean(
                guard &&
                typeof guard.isReady === "function" &&
                guard.isReady()
            );
        },
        version: "30-bridge-1"
    };

    console.log(
        "🛡️ SPARKD Content Guard v30 bridge loaded."
    );
})();
