////////////////////////////////////////////////////
// SPARKD MEME FORGE - MOBILE EXPORT COMPATIBILITY
// Keeps the existing desktop exporter untouched.
// Intercepts only the final SPARKD PNG download click
// on mobile/touch browsers that may reject blob downloads.
////////////////////////////////////////////////////

(function () {
    "use strict";

    const originalAnchorClick = HTMLAnchorElement.prototype.click;

    function isMobileLikeBrowser() {
        return (
            /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
            (navigator.maxTouchPoints || 0) > 1
        );
    }

    function isSparkdMemeDownload(anchor) {
        if (!anchor) {
            return false;
        }

        const href = anchor.href || "";

        return (
            anchor.download === "SPARKD-meme.png" &&
            (href.startsWith("blob:") || href.startsWith("data:image/png"))
        );
    }

    async function shareOrOpenImage(href) {
        try {
            const response = await fetch(href);

            if (!response.ok && response.status !== 0) {
                throw new Error("Unable to read exported PNG.");
            }

            const blob = await response.blob();
            const pngBlob = blob.type === "image/png"
                ? blob
                : new Blob([blob], { type: "image/png" });

            const pngFile = new File(
                [pngBlob],
                "SPARKD-meme.png",
                { type: "image/png" }
            );

            const canShareFile =
                typeof navigator.share === "function" &&
                typeof navigator.canShare === "function" &&
                navigator.canShare({ files: [pngFile] });

            if (canShareFile) {
                try {
                    await navigator.share({
                        files: [pngFile],
                        title: "SPARKD Meme"
                    });
                    return;
                }
                catch (shareError) {
                    if (shareError && shareError.name === "AbortError") {
                        console.log("ℹ️ SPARKD mobile export cancelled.");
                        return;
                    }

                    console.warn(
                        "⚠️ SPARKD native share unavailable; opening PNG instead.",
                        shareError
                    );
                }
            }

            // Last-resort mobile fallback: show the generated PNG directly.
            // The user can then Save Image / Download / Share using the browser.
            window.location.href = href;
        }
        catch (error) {
            console.warn(
                "⚠️ SPARKD mobile compatibility path failed; using normal download.",
                error
            );

            const fallback = document.createElement("a");
            fallback.href = href;
            fallback.download = "SPARKD-meme.png";
            fallback.style.display = "none";
            document.body.appendChild(fallback);

            // Call the browser's original method directly so this shim
            // cannot recursively intercept its own fallback.
            originalAnchorClick.call(fallback);
            fallback.remove();
        }
    }

    HTMLAnchorElement.prototype.click = function () {
        if (
            isMobileLikeBrowser() &&
            isSparkdMemeDownload(this)
        ) {
            const href = this.href;

            // Start immediately from the user's Export tap.
            void shareOrOpenImage(href);
            return;
        }

        return originalAnchorClick.call(this);
    };

    console.log("✅ SPARKD mobile PNG export compatibility enabled.");
})();
