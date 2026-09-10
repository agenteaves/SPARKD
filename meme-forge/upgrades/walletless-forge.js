////////////////////////////////////////////////////
// SPARKD MEME FORGE - WALLETLESS CREATION MODE
//
// PURPOSE:
// - Users can create and export memes without a wallet.
// - A wallet is only required when submitting to Meme of the Week.
// - If an exported Forge PNG has wallet=NOT_CONNECTED, the
//   connected submission wallet is bound only during verification.
// - If a PNG already contains a real wallet, normal wallet matching
//   remains enforced.
////////////////////////////////////////////////////

(function () {
    "use strict";

    ////////////////////////////////////////////////////
    // EXPORT WITHOUT WALLET PROMPT
    ////////////////////////////////////////////////////

    window.addEventListener("load", function () {
        const downloadBtn = document.getElementById("downloadBtn");

        if (!downloadBtn || typeof downloadBtn.onclick !== "function") {
            return;
        }

        const originalDownloadHandler = downloadBtn.onclick;

        downloadBtn.onclick = function (event) {
            const originalConfirm = window.confirm;

            window.confirm = function (message) {
                const text = String(message || "");

                // The Forge exporter previously warned that a wallet had
                // to be connected before creating a contest-eligible PNG.
                // Wallet identity is now attached at submission time, so
                // this one specific confirmation is no longer needed.
                if (text.includes("NO CONTEST WALLET CONNECTED")) {
                    console.log(
                        "ℹ️ SPARKD Meme Forge: exporting without a wallet. " +
                        "Wallet will be required only when submitting."
                    );
                    return true;
                }

                return originalConfirm.call(window, message);
            };

            try {
                const result = originalDownloadHandler.call(this, event);

                Promise.resolve(result).finally(function () {
                    window.confirm = originalConfirm;
                });

                return result;
            }
            catch (error) {
                window.confirm = originalConfirm;
                throw error;
            }
        };
    });

    ////////////////////////////////////////////////////
    // BIND WALLET ONLY AT CONTEST SUBMISSION
    ////////////////////////////////////////////////////

    function patchContestVerification() {
        if (
            !window.SPARKD_CONTEST ||
            typeof window.SPARKD_CONTEST.verifyForge !== "function" ||
            window.SPARKD_CONTEST.__walletlessForgePatched === true
        ) {
            return false;
        }

        const originalVerifyForge = window.SPARKD_CONTEST.verifyForge;

        window.SPARKD_CONTEST.verifyForge = function (wallet, forgeData) {
            let verificationData = forgeData;

            if (
                forgeData &&
                typeof forgeData === "object" &&
                (
                    !forgeData.wallet ||
                    forgeData.wallet === "NOT_CONNECTED"
                )
            ) {
                // Do not alter the PNG or its embedded signature.
                // This clone exists only for the server-side submission
                // verification request, binding the connected wallet at
                // the moment the user actually submits the meme.
                verificationData = Object.assign({}, forgeData, {
                    wallet: wallet
                });

                console.log(
                    "🔐 SPARKD contest submission: wallet bound at submit time."
                );
            }

            return originalVerifyForge.call(
                this,
                wallet,
                verificationData
            );
        };

        window.SPARKD_CONTEST.__walletlessForgePatched = true;

        console.log(
            "✅ SPARKD walletless Meme Forge creation enabled. " +
            "Wallet required only for contest submission."
        );

        return true;
    }

    // contest-submit.js is loaded later in the page. Try immediately,
    // then again after the page scripts have finished loading.
    if (!patchContestVerification()) {
        window.addEventListener("load", patchContestVerification);
    }

    ////////////////////////////////////////////////////
    // CONTEST-PAGE FORGE INTEGRITY GATE
    ////////////////////////////////////////////////////

    // The walletless compatibility layer is loaded by both the Meme
    // Forge and Meme of the Week pages. On the contest page, load a
    // separate guard that verifies the PNG metadata signature and the
    // pixel image lock BEFORE the normal submission flow can reach the
    // Phantom burn step.
    if (document.getElementById("motmSubmitFinalButton")) {
        const existingGate = document.querySelector(
            'script[data-sparkd-forge-integrity-gate="1"]'
        );

        if (!existingGate) {
            const gateScript = document.createElement("script");
            gateScript.src = "/meme-of-the-week/contest-forge-integrity-gate.js?v=1";
            gateScript.async = false;
            gateScript.dataset.sparkdForgeIntegrityGate = "1";
            document.head.appendChild(gateScript);
        }
    }
})();
