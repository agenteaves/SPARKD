/* ============================================================
   SPARKD SERVER NUDENET GUARD
   Client connector for server-hosted NudeNet ONNX inference.
   Version: server-nudenet-v1
   ============================================================ */

(function () {
    "use strict";

    /*
     * SET THIS TO YOUR DEPLOYED SERVER URL.
     *
     * Example:
     * window.SPARKD_NUDENET_ENDPOINT =
     *   "https://your-service.example.com/scan";
     *
     * Define window.SPARKD_NUDENET_ENDPOINT before this script,
     * OR replace the empty string below after deployment.
     */
    const DEFAULT_ENDPOINT = "";

    function endpoint() {
        return (
            window.SPARKD_NUDENET_ENDPOINT ||
            DEFAULT_ENDPOINT
        );
    }

    async function check(file) {

        if (!(file instanceof File)) {
            alert("🚫 SPARKD content protection could not verify this image. Upload blocked.");
            return false;
        }

        if (!file.type || !file.type.startsWith("image/")) {
            alert("🚫 Only image files are allowed.");
            return false;
        }

        const url = endpoint();

        if (!url) {
            console.error("❌ SPARKD_NUDENET_ENDPOINT is not configured.");
            alert("🚫 SPARKD content protection is unavailable. Upload blocked.");
            return false;
        }

        try {
            const form = new FormData();
            form.append("image", file, file.name);

            const response = await fetch(url, {
                method: "POST",
                body: form,
                cache: "no-store",
                credentials: "omit"
            });

            let result = null;

            try {
                result = await response.json();
            } catch (_) {
                result = null;
            }

            if (!response.ok) {
                console.error(
                    "❌ SPARKD NudeNet server rejected safety request:",
                    response.status,
                    result
                );

                alert(
                    "🚫 SPARKD content protection could not verify this image. Upload blocked."
                );

                return false;
            }

            if (
                !result ||
                result.success !== true ||
                result.checked !== true
            ) {
                console.error(
                    "❌ Invalid SPARKD NudeNet server result:",
                    result
                );

                alert(
                    "🚫 SPARKD content protection could not verify this image. Upload blocked."
                );

                return false;
            }

            if (
                result.blocked === true ||
                result.safe !== true
            ) {
                console.warn(
                    "🚫 SPARKD NudeNet blocked image:",
                    result
                );

                alert(
                    "🚫 This image cannot be used in SPARKD Meme Forge."
                );

                return false;
            }

            console.log(
                "✅ SPARKD NudeNet server approved image.",
                result
            );

            return true;

        } catch (error) {

            console.error(
                "❌ SPARKD NudeNet server safety error:",
                error
            );

            alert(
                "🚫 SPARKD content protection could not verify this image. Upload blocked."
            );

            return false;
        }
    }

    window.SPARKD_GUARD = {
        check: check,
        isReady: function () {
            return !!endpoint();
        },
        version: "server-nudenet-v1"
    };

    console.log(
        "🛡️ SPARKD Server NudeNet Guard loaded."
    );
})();
