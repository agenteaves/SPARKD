////////////////////////////////////////////////////
// SPARKD FORGE EXPORT INTEGRITY GUARD v3
// Capture-phase authoritative export. Prevents legacy/plain PNG handlers.
////////////////////////////////////////////////////
(function () {
    "use strict";

    const CONTRACT = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";

    function hasForgeChunk(bytes) {
        if (!bytes || bytes.length < 20) return false;
        let offset = 8, count = 0;
        while (offset + 12 <= bytes.length) {
            const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
            if (offset + 12 + length > bytes.length) return false;
            const type = String.fromCharCode(bytes[offset+4], bytes[offset+5], bytes[offset+6], bytes[offset+7]);
            if (type === "tEXt") {
                const data = bytes.slice(offset + 8, offset + 8 + length);
                const zero = data.indexOf(0);
                if (zero > 0 && new TextDecoder().decode(data.slice(0, zero)) === "SPARKD-FORGE") count++;
            }
            offset += 12 + length;
            if (type === "IEND") break;
        }
        return count === 1;
    }

    function ready() {
        return !!(window.canvas && window.SPARKD_FORGE &&
            typeof window.SPARKD_FORGE.createRecord === "function" &&
            window.SPARKD_PNG && typeof window.SPARKD_PNG.createBlob === "function");
    }

    async function authoritativeExport(button) {
        if (button.dataset.exporting === "1") return;
        button.dataset.exporting = "1";
        const oldText = button.textContent;
        button.textContent = "⏳ Exporting...";
        try {
            if (!ready()) throw new Error("Forge DNA exporter is not ready. Refresh the Forge and try again.");
            const canvas = window.canvas;
            canvas.discardActiveObject();
            canvas.renderAll();
            const image = canvas.getObjects().find(obj => obj.type === "image");
            if (!image) throw new Error("Please upload an image first.");
            const bounds = image.getBoundingRect(false, true);
            const finalCanvas = canvas.toCanvasElement(2, {left:bounds.left, top:bounds.top, width:bounds.width, height:bounds.height, enableRetinaScaling:true});
            const ctx = finalCanvas.getContext("2d");
            ctx.font = "8px Arial"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
            ctx.lineWidth = 2; ctx.strokeStyle = "#000000"; ctx.fillStyle = "#ffffff";
            ctx.strokeText(CONTRACT, finalCanvas.width - 10, finalCanvas.height - 10);
            ctx.fillText(CONTRACT, finalCanvas.width - 10, finalCanvas.height - 10);

            const forgeRecord = window.SPARKD_FORGE.createRecord(finalCanvas);
            if (!forgeRecord || !forgeRecord.memeID) throw new Error("Forge DNA record could not be created");
            const blob = window.SPARKD_PNG.createBlob(finalCanvas, forgeRecord);
            if (!(blob instanceof Blob) || blob.type !== "image/png") throw new Error("Forge PNG writer returned an invalid file");
            const bytes = new Uint8Array(await blob.arrayBuffer());
            if (!hasForgeChunk(bytes)) throw new Error("Forge DNA verification failed before download");

            const filename = "SPARKD-" + forgeRecord.memeID + ".png";
            const phoneSave = button.dataset.phoneSave === "1";
            delete button.dataset.phoneSave;
            if (phoneSave && typeof navigator.share === "function") {
                const file = new File([blob], filename, {type:"image/png"});
                const canShare = typeof navigator.canShare !== "function" || navigator.canShare({files:[file]});
                if (canShare) { await navigator.share({files:[file], title:"SPARKD Meme"}); return; }
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url; link.download = filename; link.style.display = "none";
            document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            console.log("✅ SPARKD Forge DNA verified in downloaded bytes:", filename, forgeRecord);
        } catch (error) {
            delete button.dataset.phoneSave;
            console.error("❌ SPARKD Forge export blocked:", error);
            alert("SPARKD Forge export was blocked because a contest-valid DNA PNG could not be verified.\n\n" + (error && error.message ? error.message : "Please refresh and try again."));
        } finally {
            button.dataset.exporting = "0";
            button.textContent = oldText;
        }
    }

    // Capture phase is intentional: stop every legacy onclick/bubble handler
    // before it can create a plain PNG. This remains authoritative regardless
    // of script registration order.
    document.addEventListener("click", function (event) {
        const button = event.target && event.target.closest ? event.target.closest("#downloadBtn") : null;
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        authoritativeExport(button);
    }, true);

    const button = document.getElementById("downloadBtn");
    if (button) button.dataset.integrityGuard = "3";
    console.log("🛡️ SPARKD authoritative DNA-only exporter v3 installed (capture phase).");
})();
