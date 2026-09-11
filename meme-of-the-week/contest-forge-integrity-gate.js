////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK - FORGE INTEGRITY GATE
//
// Runs BEFORE the contest submission/burn handler.
// Verifies that the selected PNG is an intact SPARKD
// Meme Forge export and that its pixels still match the
// Forge image lock. Edited/re-saved PNGs are blocked
// before Phantom is ever asked to approve a burn.
////////////////////////////////////////////////////

(function () {
    "use strict";

    const OFFICIAL_CONTRACT =
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";

    let approvedFile = null;
    let bypassOnce = false;

    function fail(message) {
        const status = document.getElementById("motmSubmissionStatus");

        if (status) {
            status.textContent = message;
        }

        alert(
            "❌ MEME INTEGRITY CHECK FAILED\n\n" +
            message +
            "\n\nPlease export the final meme directly from SPARKD Meme Forge and submit that original PNG."
        );
    }

    function readUint32(bytes, offset) {
        return (
            ((bytes[offset] << 24) >>> 0) |
            (bytes[offset + 1] << 16) |
            (bytes[offset + 2] << 8) |
            bytes[offset + 3]
        ) >>> 0;
    }

    async function extractForgeData(file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

        if (
            bytes.length < 20 ||
            !pngSignature.every((value, index) => bytes[index] === value)
        ) {
            throw new Error("Selected file is not a valid PNG.");
        }

        const decoder = new TextDecoder("latin1");
        const forgePayloads = [];
        let offset = 8;

        while (offset + 12 <= bytes.length) {
            const length = readUint32(bytes, offset);
            const typeStart = offset + 4;
            const dataStart = offset + 8;
            const dataEnd = dataStart + length;
            const next = dataEnd + 4;

            if (dataEnd > bytes.length || next > bytes.length) {
                throw new Error("PNG chunk structure is damaged.");
            }

            const type = decoder.decode(bytes.slice(typeStart, typeStart + 4));

            if (type === "tEXt") {
                const chunkData = bytes.slice(dataStart, dataEnd);
                const zeroIndex = chunkData.indexOf(0);

                if (zeroIndex > 0) {
                    const keyword = decoder.decode(chunkData.slice(0, zeroIndex));

                    if (keyword === "SPARKD-FORGE") {
                        const jsonText = decoder.decode(chunkData.slice(zeroIndex + 1));
                        forgePayloads.push(jsonText);
                    }
                }
            }

            offset = next;

            if (type === "IEND") {
                break;
            }
        }

        if (forgePayloads.length !== 1) {
            throw new Error(
                forgePayloads.length === 0
                    ? "No SPARKD Forge DNA was found in this PNG."
                    : "This PNG contains conflicting SPARKD Forge DNA records."
            );
        }

        let forgeData;

        try {
            forgeData = JSON.parse(forgePayloads[0]);
        }
        catch {
            throw new Error("SPARKD Forge DNA is corrupted.");
        }

        return forgeData;
    }

    function forgeSignature(forgeData) {
        // forge-export.js is authoritative for the signature embedded
        // in the final PNG. It sorts every metadata key alphabetically
        // (except signature) before hashing. Reproduce that exact rule.
        const sorted = {};

        Object.keys(forgeData)
            .sort()
            .forEach(function (key) {
                if (key !== "signature") {
                    sorted[key] = forgeData[key];
                }
            });

        const text = JSON.stringify(sorted);
        let hash = 0;

        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash = hash & hash;
        }

        return "SIG-" + Math.abs(hash).toString(16).toUpperCase();
    }

    function validateForgeMetadata(forgeData) {
        if (!forgeData || typeof forgeData !== "object") {
            throw new Error("SPARKD Forge DNA is missing.");
        }

        const requiredFields = [
            "forge",
            "version",
            "memeID",
            "DNA",
            "imageFingerprint",
            "imageLock",
            "created",
            "contract",
            "creatorID",
            "wallet",
            "reputation",
            "signature"
        ];

        for (const field of requiredFields) {
            if (forgeData[field] === undefined || forgeData[field] === null || forgeData[field] === "") {
                throw new Error("Missing SPARKD Forge field: " + field + ".");
            }
        }

        if (forgeData.forge !== "SPARKD Meme Forge") {
            throw new Error("Invalid SPARKD Forge identifier.");
        }

        if (forgeData.contract !== OFFICIAL_CONTRACT) {
            throw new Error("This PNG does not contain the official SPARKD contract.");
        }

        if (forgeData.imageFingerprint !== forgeData.imageLock) {
            throw new Error("SPARKD Forge image lock metadata does not match.");
        }

        const expectedSignature = forgeSignature(forgeData);

        if (forgeData.signature !== expectedSignature) {
            throw new Error("SPARKD Forge DNA signature has been altered.");
        }
    }

    function calculatePixelFingerprint(file) {
        return new Promise(function (resolve, reject) {
            const image = new Image();
            const url = URL.createObjectURL(file);

            image.onload = function () {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = image.naturalWidth || image.width;
                    canvas.height = image.naturalHeight || image.height;

                    const context = canvas.getContext("2d", {
                        willReadFrequently: true
                    });

                    context.drawImage(image, 0, 0);

                    const pixels = context.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    ).data;

                    let hash = 0;

                    for (let i = 0; i < pixels.length; i++) {
                        hash = ((hash << 5) - hash) + pixels[i];
                        hash = hash & hash;
                    }

                    URL.revokeObjectURL(url);

                    resolve(
                        "IMG-" +
                        Math.abs(hash).toString(16).toUpperCase()
                    );
                }
                catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };

            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("Unable to decode the selected PNG."));
            };

            image.src = url;
        });
    }

    async function verifySelectedForgePNG(file) {
        if (!file) {
            throw new Error("Choose your SPARKD Forge PNG first.");
        }

        if (file.type && file.type !== "image/png") {
            throw new Error("Contest submissions must be PNG images.");
        }

        const forgeData = await extractForgeData(file);
        validateForgeMetadata(forgeData);

        const pixelFingerprint = await calculatePixelFingerprint(file);

        if (pixelFingerprint !== forgeData.imageLock) {
            throw new Error(
                "The meme image pixels were changed after leaving SPARKD Meme Forge."
            );
        }

        return true;
    }

    document.addEventListener(
        "change",
        function (event) {
            if (event.target && event.target.id === "motmMemeFile") {
                approvedFile = null;
            }
        },
        true
    );

    document.addEventListener(
        "click",
        async function (event) {
            const button = event.target && event.target.closest
                ? event.target.closest("#motmSubmitFinalButton")
                : null;

            if (!button) {
                return;
            }

            if (bypassOnce) {
                bypassOnce = false;
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            const fileInput = document.getElementById("motmMemeFile");
            const file = fileInput?.files?.[0] || null;
            const status = document.getElementById("motmSubmissionStatus");

            if (!file) {
                fail("Choose your SPARKD Forge PNG first.");
                return;
            }

            try {
                if (approvedFile !== file) {
                    button.disabled = true;

                    if (status) {
                        status.textContent = "🔒 Verifying SPARKD Meme Forge DNA and image lock...";
                    }

                    await verifySelectedForgePNG(file);
                    approvedFile = file;
                }

                if (status) {
                    status.textContent = "✅ SPARKD Forge DNA and image integrity verified.";
                }

                bypassOnce = true;
                button.disabled = false;
                button.click();
            }
            catch (error) {
                approvedFile = null;
                button.disabled = false;

                console.error(
                    "❌ SPARKD contest Forge integrity check failed:",
                    error
                );

                fail(
                    error instanceof Error
                        ? error.message
                        : "SPARKD Forge integrity verification failed."
                );
            }
        },
        true
    );

    console.log(
        "🔒 SPARKD contest Forge integrity gate enabled."
    );
})();
