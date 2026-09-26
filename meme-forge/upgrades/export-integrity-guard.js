////////////////////////////////////////////////////
// SPARKD FORGE EXPORT INTEGRITY GUARD v1
// Never allow the Export button to fall back to a plain PNG.
////////////////////////////////////////////////////
(function () {
    function readyForContestExport() {
        return !!(
            window.SPARKD_FORGE &&
            typeof window.SPARKD_FORGE.createRecord === "function" &&
            window.SPARKD_PNG &&
            typeof window.SPARKD_PNG.createBlob === "function"
        );
    }

    function install() {
        const button = document.getElementById("downloadBtn");
        if (!button || button.dataset.integrityGuard === "1") return;
        button.dataset.integrityGuard = "1";

        // Capture runs before the legacy onclick handler. If the DNA writer is
        // unavailable for any reason, stop the export instead of allowing the
        // old canvas.toDataURL fallback to create an ineligible plain PNG.
        button.addEventListener("click", function (event) {
            if (readyForContestExport()) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            delete button.dataset.phoneSave;
            delete button.dataset.exporting;
            button.textContent = "⬇ Export";

            console.error("SPARKD Forge export blocked: DNA writer is not ready.");
            alert(
                "SPARKD Forge export protection is still loading. No file was saved.\n\n" +
                "Refresh Meme Forge and try Export again. This safeguard prevents a PNG without Forge DNA from being created."
            );
        }, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
