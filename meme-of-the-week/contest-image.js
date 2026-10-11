/* Accept a normal phone image, inspect it, and encode a plain contest PNG. */
(function () {
    "use strict";
    const LIMIT = 10 * 1024 * 1024;

    function decode(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
            image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be displayed by your browser. Try a PNG or JPEG.")); };
            image.src = url;
        });
    }

    async function prepare(file) {
        if (!(file instanceof File) || !file.type.startsWith("image/")) {
            throw new Error("Choose an image to submit.");
        }
        const image = await decode(file);
        const edge = Math.max(image.naturalWidth, image.naturalHeight);
        if (!edge) throw new Error("The selected image is empty.");
        const scale = Math.min(1, 2048 / edge);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This device cannot prepare the image.");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve, reject) => canvas.toBlob(
            value => value ? resolve(value) : reject(new Error("Could not encode the contest image.")), "image/png"
        ));
        if (blob.size > LIMIT) throw new Error("The image is over the 10 MB contest limit. Choose a smaller image.");
        const png = new File([blob], "SPARKD-contest-meme.png", {type:"image/png"});
        if (!window.SPARKD_GUARD?.isReady()) throw new Error("Image content inspection is unavailable. Please try again later.");
        const verdict = await window.SPARKD_GUARD.check(png);
        if (!verdict?.approved) throw new Error("The image did not pass content inspection.");

        // This ID only links the burn receipt to the same image on retry.
        // It is not embedded in the PNG or used as an image-origin test.
        const bytes = await blob.arrayBuffer();
        const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
        const memeID = "SPK-" + Array.from(digest.slice(0, 6), b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
        let creatorID = localStorage.getItem("sparkdCreatorID");
        if (!creatorID) {
            creatorID = "CREATOR-" + Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, "0");
            localStorage.setItem("sparkdCreatorID", creatorID);
        }
        return {file:png, entry:{memeID, creatorID}};
    }

    window.SPARKD_CONTEST_IMAGE = {prepare};
})();
