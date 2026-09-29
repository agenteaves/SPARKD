/* ============================================================
   SPARKD SERVER NUDENET GUARD
   Client connector for server-hosted NudeNet ONNX inference.
   Version: server-nudenet-v3
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
    const MAX_INSPECTION_BYTES = 2.5 * 1024 * 1024;

    function endpoint() {
        return (
            window.SPARKD_NUDENET_ENDPOINT ||
            DEFAULT_ENDPOINT
        );
    }

    async function prepareInspectionFile(file) {
        if (file.size <= MAX_INSPECTION_BYTES) return file;

        // Resize only the inspection copy. The original remains in the Forge.
        const image = await new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const candidate = new Image();
            candidate.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(candidate);
            };
            candidate.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("The selected image could not be prepared for inspection."));
            };
            candidate.src = objectUrl;
        });

        const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image inspection could not start on this device.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const resized = await new Promise((resolve, reject) => {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image inspection copy could not be created.")), "image/jpeg", 0.82);
        });
        if (resized.size > MAX_INSPECTION_BYTES) {
            throw new Error("The selected image is too large to inspect. Please choose a smaller image.");
        }
        return new File([resized], "SPARKD-inspection.jpg", { type: "image/jpeg" });
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
            const inspectionFile = await prepareInspectionFile(file);
            form.append("image", inspectionFile, inspectionFile.name);

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

                alert("🚫 " + (result?.error || "SPARKD content protection could not verify this image. Upload blocked."));

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

            // The caller must display these same inspected bytes. In
            // particular, mobile file providers may give the original Blob
            // an unusable MIME label, and large images are resized above.
            return { approved: true, file: inspectionFile };

        } catch (error) {

            console.error(
                "❌ SPARKD NudeNet server safety error:",
                error
            );

            alert("🚫 " + (error.message || "SPARKD content protection could not verify this image. Upload blocked."));

            return false;
        }
    }

    window.SPARKD_GUARD = {
        check: check,
        isReady: function () {
            return !!endpoint();
        },
        version: "server-nudenet-v3"
    };

    console.log(
        "🛡️ SPARKD Server NudeNet Guard loaded."
    );
})();
