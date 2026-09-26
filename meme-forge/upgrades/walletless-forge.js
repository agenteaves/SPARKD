////////////////////////////////////////////////////
// SPARKD MEME FORGE - WALLETLESS CREATION MODE
////////////////////////////////////////////////////

(function () {
    "use strict";

    window.addEventListener("load", function () {
        const downloadBtn = document.getElementById("downloadBtn");
        if (!downloadBtn || typeof downloadBtn.onclick !== "function") return;
        const originalDownloadHandler = downloadBtn.onclick;
        downloadBtn.onclick = function (event) {
            const originalConfirm = window.confirm;
            window.confirm = function (message) {
                const text = String(message || "");
                if (text.includes("NO CONTEST WALLET CONNECTED")) {
                    console.log("ℹ️ SPARKD Meme Forge: exporting without a wallet. Wallet will be required only when submitting.");
                    return true;
                }
                return originalConfirm.call(window, message);
            };
            try {
                const result = originalDownloadHandler.call(this, event);
                Promise.resolve(result).finally(function () { window.confirm = originalConfirm; });
                return result;
            } catch (error) {
                window.confirm = originalConfirm;
                throw error;
            }
        };
    });

    function patchContestVerification() {
        if (!window.SPARKD_CONTEST || typeof window.SPARKD_CONTEST.verifyForge !== "function" || window.SPARKD_CONTEST.__walletlessForgePatched === true) return false;

        const originalVerifyForge = window.SPARKD_CONTEST.verifyForge;
        window.SPARKD_CONTEST.verifyForge = function (wallet, forgeData) {
            let verificationData = forgeData;
            if (forgeData && typeof forgeData === "object" && (!forgeData.wallet || forgeData.wallet === "NOT_CONNECTED")) {
                verificationData = Object.assign({}, forgeData, { wallet: wallet });
                console.log("🔐 SPARKD contest submission: wallet bound at submit time.");
            }
            return originalVerifyForge.call(this, wallet, verificationData);
        };

        // Normalize the burn-receipt response used by the recovery engine.
        // A burn belongs to wallet + contest, not to one particular Forge image.
        // This lets a user replace/delete a previous image, select another valid
        // Forge export, and finalize it with the already-verified contest burn.
        if (typeof window.SPARKD_CONTEST.getBurnReceipt === "function") {
            const originalGetBurnReceipt = window.SPARKD_CONTEST.getBurnReceipt;
            window.SPARKD_CONTEST.getBurnReceipt = async function (wallet, contestId) {
                const result = await originalGetBurnReceipt.call(this, wallet, contestId);
                if (!result || typeof result !== "object") return result;

                const receipt = result.receipt && typeof result.receipt === "object" ? result.receipt : {};
                const burnTransaction =
                    receipt.burn_transaction || receipt.burnTransaction || receipt.transaction_signature || receipt.transactionSignature ||
                    result.burn_transaction || result.burnTransaction || result.transaction_signature || result.transactionSignature || null;

                if (burnTransaction) {
                    result.receipt = Object.assign({}, receipt, { burn_transaction: burnTransaction });
                    if (typeof result.found !== "boolean") result.found = true;
                    if (typeof result.verified !== "boolean") result.verified = true;
                }
                return result;
            };
        }

        window.SPARKD_CONTEST.__walletlessForgePatched = true;
        console.log("✅ SPARKD walletless Forge + burn-receipt recovery enabled.");
        return true;
    }

    if (!patchContestVerification()) window.addEventListener("load", patchContestVerification);

    if (document.getElementById("motmSubmitFinalButton")) {
        const existingGate = document.querySelector('script[data-sparkd-forge-integrity-gate="1"]');
        if (!existingGate) {
            const gateScript = document.createElement("script");
            gateScript.src = "/meme-of-the-week/contest-forge-integrity-gate.js?v=2";
            gateScript.async = false;
            gateScript.dataset.sparkdForgeIntegrityGate = "1";
            document.head.appendChild(gateScript);
        }
    }
})();
