////////////////////////////////////////////////////
// SPARKD MEME FORGE v1.1 - SERVER CONTENT GUARD
// COMPLETE APP ENGINE
////////////////////////////////////////////////////

window.addEventListener("load", function () {

  
////////////////////////////////////////////////////
// CONTENT SAFETY FILTER
////////////////////////////////////////////////////

const blockedWords = [

    ////////////////////////////////////////////////////
    // SEXUAL / EXPLICIT CONTENT
    ////////////////////////////////////////////////////

    "porn",
    "porno",
    "pornography",
    "nude",
    "nudes",
    "nudity",
    "sex",
    "sexual",
    "xxx",
    "nsfw",

    // Common explicit profanity
    "fuck",
    "fucking",
    "fucked",
    "fucker",
    "fuckers",
    "motherfucker",
    "motherfuckers",
    "shit",
    "shitty",
    "bullshit",
    "bitch",
    "bitches",
    "bitching",
    "asshole",
    "assholes",
    "dick",
    "dicks",
    "dickhead",
    "pussy",
    "cock",
    "cocks",
    "cocksucker",
    "cocksuckers",
    "cunt",
    "twat",
    "whore",
    "whores",
    "slut",
    "sluts",
    "slutty",

    ////////////////////////////////////////////////////
    // SEXUAL ACTIVITY / EXPLICIT TERMS
    ////////////////////////////////////////////////////

    "blowjob",
    "blowjobs",
    "handjob",
    "handjobs",
    "orgasm",
    "orgasms",
    "masturbate",
    "masturbation",
    "dildo",
    "dildos",
    "anal",
    "cum",
    "semen",

    ////////////////////////////////////////////////////
    // VIOLENCE / THREATS
    ////////////////////////////////////////////////////

    "kill",
    "killing",
    "killed",
    "murder",
    "murderer",
    "murdering",
    "die",
    "death",
    "dead",
    "hurt",
    "attack",
    "attacking",
    "attacked",
    "threat",
    "threaten",
    "threatening",

    ////////////////////////////////////////////////////
    // ABUSE / TORTURE
    ////////////////////////////////////////////////////

    "torture",
    "torturing",
    "abuse",
    "abusing",
    "abused",
    "animal abuse",
    "animal cruelty",

    ////////////////////////////////////////////////////
    // EXTREME HARASSMENT
    ////////////////////////////////////////////////////

    "rapist",
    "rapists",
    "rape",
    "raped",
    "raping",

];

  
function containsUnsafeContent(text) {

    if (!text) {
        return false;
    }


    ////////////////////////////////////////////////////
    // NORMALIZE TEXT
    ////////////////////////////////////////////////////

    const normalizedText =
        text
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "");


    ////////////////////////////////////////////////////
    // CREATE TWO VERSIONS
    //
    // spacedText:
    // Keeps word boundaries for normal matching.
    //
    // compactText:
    // Removes punctuation and spaces so simple
    // character-separation tricks are detected.
    ////////////////////////////////////////////////////

    const spacedText =
        normalizedText
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();


    const compactText =
        normalizedText
            .replace(/[^a-z0-9]/g, "");


    ////////////////////////////////////////////////////
    // CHECK BLOCKED WORDS
    ////////////////////////////////////////////////////

    return blockedWords.some(function (word) {

        const normalizedWord =
            word
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");


        if (!normalizedWord) {
            return false;
        }


        ////////////////////////////////////////////////////
        // NORMAL WHOLE-WORD MATCH
        ////////////////////////////////////////////////////

        const wholeWordPattern =
            new RegExp(
                "(^|\\s)" +
                normalizedWord.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                ) +
                "(?=\\s|$)"
            );


        if (
            wholeWordPattern.test(
                spacedText
            )
        ) {

            return true;

        }


        ////////////////////////////////////////////////////
        // COMPACT MATCH
        //
        // Detects simple attempts such as:
        //
        // p.o.r.n
        // p-o-r-n
        // p o r n
        //
        // while the normal whole-word check above
        // handles ordinary text.
        ////////////////////////////////////////////////////

        if (
            compactText.includes(
                normalizedWord
            )
        ) {

            return true;

        }


        return false;

    });

}


    ////////////////////////////////////////////////////
    // SPARKD OFFICIAL CONTRACT
    ////////////////////////////////////////////////////

    const SPARKD_CONTRACT =
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";


    ////////////////////////////////////////////////////
    // CREATE CANVAS
    ////////////////////////////////////////////////////

    window.canvas = new fabric.Canvas(
        "memeCanvas",
        {
            backgroundColor: "#ffffff",
            preserveObjectStacking: true
        }
    );

    canvas.setWidth(1080);
    canvas.setHeight(1080);


    ////////////////////////////////////////////////////
    // RESIZE CANVAS VIEW
    ////////////////////////////////////////////////////

    function resizeCanvasView() {

        const canvasBox =
            document.getElementById(
                "canvasBox"
            );


        if (!canvasBox) {

            return;

        }


        const padding =
            window.innerWidth <= 700
                ? 20
                : 40;


        const displaySize =
            Math.max(
                220,
                Math.min(
                    canvasBox.clientWidth - padding,
                    window.innerHeight * 0.72
                )
            );


        canvas.setZoom(
            1
        );


        canvas.setDimensions(
            {
                width:
                    displaySize + "px",

                height:
                    displaySize + "px"
            },
            {
                cssOnly:
                    true
            }
        );


        canvas.calcOffset();
        canvas.requestRenderAll();

    }

    resizeCanvasView();

    window.addEventListener(
        "resize",
        resizeCanvasView
    );


    ////////////////////////////////////////////////////
    // EMOJI PICKER
    ////////////////////////////////////////////////////

    const emojiBtn =
        document.getElementById("emojiBtn");

    const emojiPicker =
        document.getElementById("emojiPicker");

    if (emojiBtn && emojiPicker) {

        emojiBtn.onclick = function () {

            const opening =
                emojiPicker.style.display !==
                    "grid";


            emojiPicker.style.display =
                opening
                    ? "grid"
                    : "none";


            emojiBtn.setAttribute(
                "aria-expanded",
                String(
                    opening
                )
            );

        };


        document
            .querySelectorAll(".emojiOption")
            .forEach(function (item) {

                item.setAttribute(
                    "role",
                    "button"
                );

                item.setAttribute(
                    "tabindex",
                    "0"
                );

                item.setAttribute(
                    "aria-label",
                    "Add emoji " +
                    item.textContent
                );


                item.addEventListener(
                    "keydown",
                    function (event) {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();
                            item.click();

                        }

                    }
                );


                item.onclick = function () {

                    const emoji =
                        new fabric.Text(
                            item.textContent,
                            {
                                left: 220,
                                top: 220,
                                fontSize: 100,
                                selectable: true,
                                evented: true
                            }
                        );

                    canvas.add(emoji);

                    canvas.setActiveObject(emoji);

                    canvas.renderAll();

                    emojiPicker.style.display = "none";

                };

            });


        document.addEventListener(
            "click",
            function (e) {

                if (
                    !e.target.closest(
                        ".emojiContainer"
                    )
                ) {

                    emojiPicker.style.display =
                        "none";

                }

            }
        );

    }


////////////////////////////////////////////////////
// IMAGE UPLOAD - AUTO FIT & CENTER
// SPARKD CONTENT GUARD CHECKS IMAGE BEFORE UPLOAD
////////////////////////////////////////////////////

const uploadBtn =
    document.getElementById("uploadBtn");

const imageInput =
    document.getElementById("imageInput");


if (uploadBtn && imageInput) {


    ////////////////////////////////////////////////////
    // OPEN FILE SELECTOR
    ////////////////////////////////////////////////////

    uploadBtn.onclick = function () {

        imageInput.value = "";

        imageInput.click();

    };


    ////////////////////////////////////////////////////
    // IMAGE SELECTED
    ////////////////////////////////////////////////////

    imageInput.onchange = async function (e) {

        let file =
            e.target.files[0];


        if (!file) {

            return;

        }


        ////////////////////////////////////////////////////
        // ALLOW ONLY JPG / JPEG / PNG
        ////////////////////////////////////////////////////

        let headerBytes;

        try {
            headerBytes =
                new Uint8Array(
                    await file.slice(0, 12).arrayBuffer()
                );
        }
        catch (error) {
            console.error(
                "❌ SPARKD could not read the selected image:",
                error
            );

            alert(
                "⚠️ This image could not be read. Please choose a JPG or PNG image."
            );

            imageInput.value = "";
            return;
        }

        const isJpeg =
            headerBytes.length >= 3 &&
            headerBytes[0] === 0xff &&
            headerBytes[1] === 0xd8 &&
            headerBytes[2] === 0xff;

        const isPng =
            headerBytes.length >= 8 &&
            headerBytes[0] === 0x89 &&
            headerBytes[1] === 0x50 &&
            headerBytes[2] === 0x4e &&
            headerBytes[3] === 0x47 &&
            headerBytes[4] === 0x0d &&
            headerBytes[5] === 0x0a &&
            headerBytes[6] === 0x1a &&
            headerBytes[7] === 0x0a;

        if (!isJpeg && !isPng) {
            alert(
                "⚠️ Unsupported image type. Please upload a JPG or PNG image only."
            );

            imageInput.value = "";
            return;
        }

        ////////////////////////////////////////////////////
        // NORMALIZE PHONE FILE LABELS
        //
        // Some mobile browsers provide a genuine JPG/PNG
        // with a missing or nonstandard MIME type/extension.
        // After verifying the real file signature above,
        // give the safety scanner a standard label.
        ////////////////////////////////////////////////////

        const canonicalType =
            isPng
                ? "image/png"
                : "image/jpeg";

        const canonicalExtension =
            isPng
                ? ".png"
                : ".jpg";

        const baseName =
            (file.name || "SPARKD-upload")
                .replace(/\.[^.]*$/, "");

        const hasCanonicalExtension =
            isPng
                ? /\.png$/i.test(file.name)
                : /\.jpe?g$/i.test(file.name);

        if (
            file.type !== canonicalType ||
            !hasCanonicalExtension
        ) {
            file = new File(
                [file],
                baseName + canonicalExtension,
                {
                    type: canonicalType,
                    lastModified: file.lastModified
                }
            );
        }


        console.log(
            "🖼️ SPARKD image selected:",
            file.name
        );


        ////////////////////////////////////////////////////
        // SERVER-SIDE SPARKD CONTENT GUARD
        //
        // Uses window.SPARKD_GUARD.check(file), which sends
        // a labelled image (resized if necessary) to the
        // configured server-side moderation endpoint.
        //
        // No browser model readiness check is required.
        ////////////////////////////////////////////////////

        if (
            !window.SPARKD_GUARD ||
            typeof window.SPARKD_GUARD.check !== "function"
        ) {

            console.error(
                "❌ SPARKD Server Content Guard is unavailable."
            );

            alert(
                "🚫 SPARKD content protection is unavailable. Upload blocked."
            );

            imageInput.value = "";

            return;

        }


        let allowedByServer =
            false;

        let verifiedImageFile = null;


        try {

            console.log(
                "🛡️ Sending image to SPARKD server safety check:",
                {
                    fileName:
                        file.name,

                    fileType:
                        file.type,

                    fileSize:
                        file.size
                }
            );


            const inspection =
                await window.SPARKD_GUARD.check(file);

            allowedByServer = inspection === true || (inspection?.approved === true && inspection.file instanceof File);
            verifiedImageFile = inspection?.approved === true ? inspection.file : file;


        }
        catch (error) {

            console.error(
                "❌ SPARKD server safety check failed:",
                error
            );

            allowedByServer =
                false;

        }


        /*
         * FAIL CLOSED:
         * The image is only accepted when the server
         * explicitly returns true.
         */
        if (
            allowedByServer !== true
        ) {

            console.warn(
                "🚫 IMAGE REJECTED BY SPARKD SERVER CONTENT GUARD"
            );

            imageInput.value = "";

            return;

        }


        ////////////////////////////////////////////////////
        // IMAGE PASSED CONTENT CHECK
        ////////////////////////////////////////////////////

        console.log(
            "✅ IMAGE PASSED SPARKD CONTENT GUARD"
        );

        // Use the file that actually passed inspection. This also gives
        // mobile decoders a correctly labelled, manageable image Blob.
        const displayFile = verifiedImageFile instanceof File ? verifiedImageFile : file;


        ////////////////////////////////////////////////////
        // LOAD APPROVED IMAGE INTO CANVAS
        ////////////////////////////////////////////////////

        function placeImageOnCanvas(imageSource) {

            const img =
                new fabric.Image(imageSource);

            const canvasSize =
                1080;

            const scale =
                Math.min(
                    canvasSize / img.width,
                    canvasSize / img.height
                );

            img.scale(scale);

            img.set({
                left:
                    (
                        canvasSize -
                        img.getScaledWidth()
                    ) / 2,

                top:
                    (
                        canvasSize -
                        img.getScaledHeight()
                    ) / 2,

                cornerColor:
                    "#ff6600",

                transparentCorners:
                    false
            });

            canvas.add(img);
            canvas.sendToBack(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();

            console.log(
                "✅ APPROVED IMAGE LOADED INTO SPARKD MEME FORGE"
            );
        }

        async function loadApprovedImage() {

            ////////////////////////////////////////////////////
            // ANDROID / MODERN MOBILE DECODER
            ////////////////////////////////////////////////////

            if (typeof createImageBitmap === "function") {
                try {
                    const bitmap =
                        await createImageBitmap(displayFile);

                    placeImageOnCanvas(bitmap);
                    return;
                }
                catch (bitmapError) {
                    console.warn(
                        "⚠️ Direct bitmap decoding failed; trying compatible image loader.",
                        bitmapError
                    );
                }
            }

            ////////////////////////////////////////////////////
            // COMPATIBILITY FALLBACK
            ////////////////////////////////////////////////////

            const objectUrl =
                URL.createObjectURL(displayFile);

            const imageElement =
                new Image();

            imageElement.onload = function () {
                URL.revokeObjectURL(objectUrl);
                placeImageOnCanvas(imageElement);
            };

            imageElement.onerror = function (error) {
                URL.revokeObjectURL(objectUrl);

                console.error(
                    "❌ SPARKD could not decode the approved image:",
                    error
                );

                alert(
                    "⚠️ This JPG or PNG could not be displayed by the browser. Please try a different image."
                );

                imageInput.value = "";
            };

            imageElement.src = objectUrl;
        }

        await loadApprovedImage();

    };

}

  
////////////////////////////////////////////////////
// ADD TEXT
// SPARKD TEXT CONTENT GUARD
////////////////////////////////////////////////////

const addTextBtn =
    document.getElementById("addTextBtn");

const textInput =
    document.getElementById("textInput");


if (addTextBtn) {

    addTextBtn.onclick = function () {

        ////////////////////////////////////////////////////
        // GET USER TEXT
        ////////////////////////////////////////////////////

        const text =
            textInput
                ? textInput.value.trim()
                : "";


        ////////////////////////////////////////////////////
        // EMPTY TEXT
        ////////////////////////////////////////////////////

        if (!text) {

            alert(
                "⚠️ Please enter some text first."
            );

            return;

        }


        ////////////////////////////////////////////////////
        // CHECK TEXT FOR UNSAFE CONTENT
        ////////////////////////////////////////////////////

        if (
            containsUnsafeContent(text)
        ) {

            console.warn(
                "🚫 SPARKD blocked unsafe meme text:",
                text
            );

            alert(
                "🚫 That text cannot be used in SPARKD Meme Forge."
            );

            return;

        }


        ////////////////////////////////////////////////////
        // CREATE SAFE MEME TEXT
        ////////////////////////////////////////////////////

        const memeText =
            new fabric.IText(
                text,
                {
                    left: 150,
                    top: 50,
                    fill: "#ffffff",
                    stroke: "#000000",
                    strokeWidth: 4,
                    fontFamily: "Bangers",
                    fontSize: 80
                }
            );


        ////////////////////////////////////////////////////
        // MARK AS MEME TEXT
        ////////////////////////////////////////////////////

        memeText.isMemeText = true;


        ////////////////////////////////////////////////////
        // ADD TEXT
        ////////////////////////////////////////////////////

        canvas.add(
            memeText
        );


        ////////////////////////////////////////////////////
        // SELECT TEXT
        ////////////////////////////////////////////////////

        canvas.setActiveObject(
            memeText
        );


        ////////////////////////////////////////////////////
        // REFRESH CANVAS
        ////////////////////////////////////////////////////

        canvas.renderAll();


        ////////////////////////////////////////////////////
        // CLEAR INPUT AFTER SUCCESSFUL ADD
        ////////////////////////////////////////////////////

        if (textInput) {

            textInput.value = "";

        }


        console.log(
            "✅ SPARKD safe text added:",
            text
        );

    };

}

  // ================================
// DELETE SELECTED OBJECT
// ================================

const deleteBtn = document.getElementById("deleteBtn");

if (deleteBtn) {

    deleteBtn.onclick = function () {

        const activeObject = canvas.getActiveObject();

        if (activeObject) {

            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.renderAll();

        }

    };

}

    ////////////////////////////////////////////////////
    // EXPORT PNG
    // IMAGE + TEXT + SHARP CONTRACT
    ////////////////////////////////////////////////////

    const downloadBtn =
        document.getElementById("downloadBtn");

    const mobileSaveBtn =
        document.getElementById("mobileSaveBtn");

    const isMobileDevice =
        navigator.userAgentData
            ? navigator.userAgentData.mobile
            : /Android|iPhone|iPad|iPod|Mobile/i.test(
                navigator.userAgent
            );

    if (
        mobileSaveBtn &&
        downloadBtn &&
        isMobileDevice
    ) {
        mobileSaveBtn.hidden = false;
        mobileSaveBtn.textContent = "📱 Download Meme PNG";

        mobileSaveBtn.onclick = function () {
            downloadBtn.click();
        };
    }

    if (downloadBtn) {

        downloadBtn.onclick = async function () {
            if (downloadBtn.dataset.exporting === "1") return;
            downloadBtn.dataset.exporting = "1";
            const previousText = downloadBtn.textContent;
            downloadBtn.textContent = "⏳ Exporting...";
            try {
                canvas.discardActiveObject();
                canvas.renderAll();
                const image = canvas.getObjects().find(object => object.type === "image");
                if (!image) throw new Error("Please upload an image first.");
                const bounds = image.getBoundingRect(false, true);
                const finalCanvas = canvas.toCanvasElement(2, {
                    left: bounds.left, top: bounds.top,
                    width: bounds.width, height: bounds.height,
                    enableRetinaScaling: true
                });
                const ctx = finalCanvas.getContext("2d");
                ctx.font = "8px Arial";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#000000";
                ctx.fillStyle = "#ffffff";
                ctx.strokeText(SPARKD_CONTRACT, finalCanvas.width - 10, finalCanvas.height - 10);
                ctx.fillText(SPARKD_CONTRACT, finalCanvas.width - 10, finalCanvas.height - 10);
                const blob = await new Promise((resolve, reject) => finalCanvas.toBlob(
                    result => result ? resolve(result) : reject(new Error("Could not export the meme.")), "image/png"
                ));
                if (blob.size > 10 * 1024 * 1024) throw new Error("This PNG is over the 10 MB contest limit.");
                const filename = "SPARKD-meme.png";
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                if (window.SPARKD_FORGE_HANDOFF) {
                    try { await window.SPARKD_FORGE_HANDOFF.save(blob, filename); }
                    catch (error) { console.warn("Meme handoff unavailable; downloaded PNG remains usable.", error); }
                }
            } catch (error) {
                console.error("SPARKD Meme Forge export failed:", error);
                alert(error.message || "Could not export the meme.");
            } finally {
                downloadBtn.dataset.exporting = "0";
                downloadBtn.textContent = previousText;
            }
        };

    }

});
