////////////////////////////////////////////////////
// SPARKD MEME FORGE v1.1
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

        const zoom =
            Math.min(
                window.innerWidth * 0.65,
                window.innerHeight * 0.65
            ) / 1080;

        canvas.setZoom(zoom);
        canvas.calcOffset();
        canvas.renderAll();

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

            if (
                emojiPicker.style.display === "grid"
            ) {

                emojiPicker.style.display = "none";

            }
            else {

                emojiPicker.style.display = "grid";

            }

        };


        document
            .querySelectorAll(".emojiOption")
            .forEach(function (item) {

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

        const file =
            e.target.files[0];


        if (!file) {

            return;

        }


        console.log(
            "🖼️ SPARKD image selected:",
            file.name
        );


        ////////////////////////////////////////////////////
        // CHECK THAT CONTENT GUARD EXISTS
        ////////////////////////////////////////////////////

        if (
            !window.SPARKDContentGuard ||
            typeof window.SPARKDContentGuard.checkImage !== "function"
        ) {

            console.error(
                "❌ SPARKD Content Guard does not exist."
            );

            alert(
                "⚠️ SPARKD Content Guard is not ready. Please wait a moment and try again."
            );

            imageInput.value = "";

            return;

        }


        ////////////////////////////////////////////////////
        // WAIT FOR CONTENT GUARD MODEL
        ////////////////////////////////////////////////////

        if (
            !window.SPARKDContentGuard.isReady()
        ) {

            console.log(
                "⏳ SPARKD Content Guard is still loading..."
            );

            alert(
                "⚠️ SPARKD Content Guard is still loading. Please wait a few seconds and try again."
            );

            imageInput.value = "";

            return;

        }


////////////////////////////////////////////////////
// CREATE IMAGE ELEMENT FOR NSFWJS
////////////////////////////////////////////////////

console.log(
    "🛡️ Preparing selected file for Content Guard:",
    file.name,
    file.type,
    file.size
);

let scanImage = null;
let scanImageURL = null;


try {

    ////////////////////////////////////////////////////
    // CREATE UNIQUE OBJECT URL FOR THIS FILE
    ////////////////////////////////////////////////////

    scanImageURL =
        URL.createObjectURL(file);


    ////////////////////////////////////////////////////
    // LOAD EXACT FILE INTO NEW IMAGE
    ////////////////////////////////////////////////////

    scanImage =
        await new Promise(function (resolve, reject) {

            const img =
                new Image();

            img.onload =
                async function () {

                    try {

                        ////////////////////////////////////////////////////
                        // WAIT UNTIL IMAGE IS FULLY DECODED
                        ////////////////////////////////////////////////////

                        if (
                            typeof img.decode === "function"
                        ) {

                            await img.decode();

                        }


                        ////////////////////////////////////////////////////
                        // VERIFY IMAGE DIMENSIONS
                        ////////////////////////////////////////////////////

                        if (
                            !img.naturalWidth ||
                            !img.naturalHeight
                        ) {

                            reject(
                                new Error(
                                    "Image decoded but has invalid dimensions."
                                )
                            );

                            return;

                        }


                        resolve(img);

                    }
                    catch (error) {

                        reject(error);

                    }

                };


            img.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not load image for safety scan."
                        )
                    );

                };


            ////////////////////////////////////////////////////
            // LOAD THIS EXACT FILE
            ////////////////////////////////////////////////////

            img.src =
                scanImageURL;

        });


    ////////////////////////////////////////////////////
    // VERIFY THE EXACT IMAGE BEING SCANNED
    ////////////////////////////////////////////////////

    console.log(
        "✅ IMAGE READY FOR SPARKD CONTENT GUARD:",
        {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,

            objectURL:
                scanImageURL,

            imageSource:
                scanImage.src,

            width:
                scanImage.naturalWidth,

            height:
                scanImage.naturalHeight
        }
    );


}
catch (error) {

    console.error(
        "❌ Could not prepare image for Content Guard:",
        error
    );


    if (scanImageURL) {

        URL.revokeObjectURL(
            scanImageURL
        );

    }


    alert(
        "⚠️ This image could not be checked."
    );


    imageInput.value = "";

    return;

}



////////////////////////////////////////////////////
// RUN SPARKD CONTENT GUARD
////////////////////////////////////////////////////

let guardResult;


try {

    console.log(
        "🔎 SCANNING THIS EXACT FILE:",
        {
            fileName:
                file.name,

            fileSize:
                file.size,

            fileType:
                file.type,

            objectURL:
                scanImageURL,

            imageSource:
                scanImage.src,

            width:
                scanImage.naturalWidth,

            height:
                scanImage.naturalHeight
        }
    );


    ////////////////////////////////////////////////////
    // SEND THE EXACT DECODED IMAGE TO NSFWJS
    ////////////////////////////////////////////////////

    guardResult =
        await window.SPARKDContentGuard.checkImage(
            scanImage
        );


    console.log(
        "🛡️ SPARKD Content Guard result:",
        guardResult
    );


}
catch (error) {

    console.error(
        "❌ SPARKD Content Guard error:",
        error
    );


    if (scanImageURL) {

        URL.revokeObjectURL(
            scanImageURL
        );

    }


    alert(
        "⚠️ Content Guard could not check this image."
    );


    imageInput.value = "";

    return;

}



////////////////////////////////////////////////////
// CLEAN UP SCAN IMAGE
////////////////////////////////////////////////////

if (scanImageURL) {

    URL.revokeObjectURL(
        scanImageURL
    );

}


////////////////////////////////////////////////////
// BLOCK IMAGE
////////////////////////////////////////////////////

if (
    guardResult &&
    guardResult.blocked === true
) {

    console.warn(
        "🚫 IMAGE BLOCKED BY SPARKD CONTENT GUARD",
        guardResult
    );


    alert(
        "🚫 This image cannot be used in SPARKD Meme Forge."
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


        ////////////////////////////////////////////////////
        // LOAD APPROVED IMAGE INTO CANVAS
        ////////////////////////////////////////////////////

        const reader =
            new FileReader();


        reader.onload =
            function (event) {


                fabric.Image.fromURL(
                    event.target.result,
                    function (img) {


                        ////////////////////////////////////////////////////
                        // CANVAS SIZE
                        ////////////////////////////////////////////////////

                        const canvasSize =
                            1080;


                        ////////////////////////////////////////////////////
                        // SCALE IMAGE TO FIT
                        ////////////////////////////////////////////////////

                        const scale =
                            Math.min(
                                canvasSize / img.width,
                                canvasSize / img.height
                            );


                        img.scale(scale);


                        ////////////////////////////////////////////////////
                        // CENTER IMAGE
                        ////////////////////////////////////////////////////

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


                        ////////////////////////////////////////////////////
                        // ADD IMAGE
                        ////////////////////////////////////////////////////

                        canvas.add(img);


                        ////////////////////////////////////////////////////
                        // KEEP IMAGE BEHIND TEXT
                        ////////////////////////////////////////////////////

                        canvas.sendToBack(img);


                        ////////////////////////////////////////////////////
                        // SELECT IMAGE
                        ////////////////////////////////////////////////////

                        canvas.setActiveObject(
                            img
                        );


                        ////////////////////////////////////////////////////
                        // REFRESH CANVAS
                        ////////////////////////////////////////////////////

                        canvas.renderAll();


                        console.log(
                            "✅ APPROVED IMAGE LOADED INTO SPARKD MEME FORGE"
                        );

                    }
                );

            };


        reader.readAsDataURL(file);

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

    ////////////////////////////////////////////////////
    // EXPORT PNG
    // IMAGE + TEXT + SHARP CONTRACT
    ////////////////////////////////////////////////////

    const downloadBtn =
        document.getElementById("downloadBtn");

    if (downloadBtn) {

        downloadBtn.onclick = function () {

            ////////////////////////////////////////////////////
            // CLEAR ACTIVE SELECTION
            ////////////////////////////////////////////////////

            canvas.discardActiveObject();

            canvas.renderAll();


            ////////////////////////////////////////////////////
            // FIND UPLOADED IMAGE
            ////////////////////////////////////////////////////

            const image =
                canvas
                    .getObjects()
                    .find(
                        obj => obj.type === "image"
                    );


            if (!image) {

                alert(
                    "Please upload an image first."
                );

                return;

            }


            ////////////////////////////////////////////////////
            // GET IMAGE BOUNDS
            ////////////////////////////////////////////////////

            const bounds =
                image.getBoundingRect(
                    false,
                    true
                );


            ////////////////////////////////////////////////////
            // EXPORT IMAGE + TEXT
            ////////////////////////////////////////////////////

            const dataURL =
                canvas.toDataURL({

                    format: "png",

                    left: bounds.left,

                    top: bounds.top,

                    width: bounds.width,

                    height: bounds.height,

                    multiplier: 2,

                    enableRetinaScaling: true

                });


            ////////////////////////////////////////////////////
            // CREATE FINAL IMAGE CANVAS
            ////////////////////////////////////////////////////

            const finalCanvas =
                document.createElement(
                    "canvas"
                );


            finalCanvas.width =
                bounds.width * 2;

            finalCanvas.height =
                bounds.height * 2;


            const ctx =
                finalCanvas.getContext(
                    "2d"
                );


            const exportedImage =
                new Image();


            exportedImage.onload =
                function () {

                    ////////////////////////////////////////////////////
                    // DRAW EXPORTED MEME
                    ////////////////////////////////////////////////////

                    ctx.drawImage(

                        exportedImage,

                        0,

                        0,

                        finalCanvas.width,

                        finalCanvas.height

                    );


                    ////////////////////////////////////////////////////
                    // ADD SPARKD CONTRACT
                    ////////////////////////////////////////////////////

                    ctx.font =
                        "8px Arial";

                    ctx.textAlign =
                        "right";

                    ctx.textBaseline =
                        "bottom";

                    ctx.lineWidth =
                        2;

                    ctx.strokeStyle =
                        "#000000";

                    ctx.fillStyle =
                        "#ffffff";


                    ctx.strokeText(

                        SPARKD_CONTRACT,

                        finalCanvas.width - 10,

                        finalCanvas.height - 10

                    );


                    ctx.fillText(

                        SPARKD_CONTRACT,

                        finalCanvas.width - 10,

                        finalCanvas.height - 10

                    );


                    ////////////////////////////////////////////////////
                    // CREATE SPARKD FORGE BIRTH RECORD
                    // FROM FINAL IMAGE
                    ////////////////////////////////////////////////////

                    let forgeRecord =
                        null;


                    if (
                        window.SPARKD_FORGE &&
                        typeof window.SPARKD_FORGE.createRecord === "function"
                    ) {

                        forgeRecord =
                            window.SPARKD_FORGE.createRecord(
                                finalCanvas
                            );


                        console.log(
                            "🔥 SPARKD Forge Birth:",
                            forgeRecord
                        );

                    }


                    ////////////////////////////////////////////////////
                    // CREATE HIDDEN FORGE DATA
                    ////////////////////////////////////////////////////

                    let hiddenForgeData =
                        null;


                    if (
                        window.SPARKD_EXPORT &&
                        forgeRecord &&
                        typeof window.SPARKD_EXPORT.attachForgeData === "function"
                    ) {

                        hiddenForgeData =
                            window.SPARKD_EXPORT.attachForgeData(

                                finalCanvas,

                                forgeRecord

                            );

                    }


                    ////////////////////////////////////////////////////
                    // CREATE DOWNLOAD LINK
                    ////////////////////////////////////////////////////

                    const link =
                        document.createElement(
                            "a"
                        );


                    ////////////////////////////////////////////////////
                    // INJECT SPARKD FORGE PNG DATA
                    ////////////////////////////////////////////////////

                    if (
                        window.SPARKD_PNG &&
                        forgeRecord &&
                        typeof window.SPARKD_PNG.attach === "function"
                    ) {

                        link.href =
                            window.SPARKD_PNG.attach(

                                finalCanvas,

                                forgeRecord

                            );

                    }
                    else {

                        link.href =
                            finalCanvas.toDataURL(
                                "image/png"
                            );

                    }


                    ////////////////////////////////////////////////////
                    // DOWNLOAD
                    ////////////////////////////////////////////////////

                    link.download =
                        "SPARKD-meme.png";

                    link.click();

                };


            exportedImage.src =
                dataURL;

        };

    }

});
