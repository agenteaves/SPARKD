/* Preserve burn-receipt recovery for both website and Android entries. */
(function () {
    "use strict";
    function patch() {
        if (!window.SPARKD_CONTEST || window.SPARKD_CONTEST.__receiptPatched) return;
        const original = window.SPARKD_CONTEST.getBurnReceipt;
        if (typeof original !== "function") return;
        window.SPARKD_CONTEST.getBurnReceipt = async function (wallet, contestId, memeID) {
            const result = await original.call(this, wallet, contestId, memeID);
            if (!result || typeof result !== "object") return result;
            const receipt = result.receipt && typeof result.receipt === "object" ? result.receipt : {};
            const transaction = receipt.burn_transaction || receipt.burnTransaction ||
                receipt.transaction_signature || receipt.transactionSignature ||
                result.burn_transaction || result.burnTransaction ||
                result.transaction_signature || result.transactionSignature;
            if (transaction) {
                result.receipt = Object.assign({}, receipt, {burn_transaction: transaction});
                if (typeof result.found !== "boolean") result.found = true;
                if (typeof result.verified !== "boolean") result.verified = true;
            }
            return result;
        };
        window.SPARKD_CONTEST.__receiptPatched = true;
    }
    patch();
    window.addEventListener("load", patch);
})();
