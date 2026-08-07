```javascript
////////////////////////////////////////////////////
// SPARKD MEME FORGE v1.1
// COMPLETE APP ENGINE
////////////////////////////////////////////////////

window.addEventListener("load", function(){


////////////////////////////////////////////////////
// CONTENT SAFETY FILTER
////////////////////////////////////////////////////

const blockedWords = [

    // Sexual content
    "porn",
    "nude",
    "nudes",
    "sex",
    "sexual",
    "xxx",

    // Harassment / threats
    "kill",
    "murder",
    "die",
    "hurt",
    "attack",
    "threat",

    // Animal harm
    "torture",
    "abuse",
    "animal abuse",
    "animal cruelty"

];


function containsUnsafeContent(text){

    if(!text){

        return false;

    }


    const cleanText = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g,"");


    return blockedWords.some(function(word){

        return cleanText.includes(word);

    });

}


////////////////////////////////////////////////////
// SPARKD OFFICIAL CONTRACT
////////////////////////////////////////////////////

const SPARKD_CONTRACT =
"BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";


////////////////////////////////////////////////////
// EMOJI PICKER
////////////////////////////////////////////////////

const emojiBtn =
document.getElementById("emojiBtn");

const emojiPicker =
document.getElementById("emojiPicker");


if(emojiBtn && emojiPicker){

    emojiBtn.onclick = function(){

        if(
            emojiPicker.style.display === "grid"
        ){

            emojiPicker.style.display = "none";

        }
        else{

            emojiPicker.style.display = "grid";

        }

    };


    document
    .querySelectorAll(".emojiOption")
    .forEach(function(item){

        item.onclick = function(){

            const emoji =
            new fabric.Text(

                item.textContent,

                {

                    left:220,

                    top:220,

                    fontSize:100,

                    selectable:true,

                    evented:true

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
        function(e){

            if(
                !e.target.closest(
                    ".emojiContainer"
                )
            ){

                emojiPicker.style.display =
                "none";

            }

        }
    );

}


////////////////////////////////////////////////////
// CREATE CANVAS
////////////////////////////////////////////////////

window.canvas =
new fabric.Canvas(

    "memeCanvas",

    {

        backgroundColor:"#ffffff",

        preserveObjectStacking:true

    }

);


canvas.setWidth(1080);

canvas.setHeight(1080);


////////////////////////////////////////////////////
// RESIZE CANVAS VIEW
////////////////////////////////////////////////////

function resizeCanvasView(){

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
// IMAGE UPLOAD - AUTO FIT & CENTER
////////////////////////////////////////////////////

const uploadBtn =
document.getElementById("uploadBtn");

const imageInput =
document.getElementById("imageInput");


if(uploadBtn && imageInput){

    uploadBtn.onclick =
    function(){

        imageInput.value = "";

        imageInput.click();

    };


    imageInput.onchange =
    async function(e){

        const file =
        e.target.files[0];


        if(!file){

            return;

        }


        ////////////////////////////////////////////////////
        // BASIC FILENAME SAFETY CHECK
        ////////////////////////////////////////////////////

        if(
            containsUnsafeContent(
                file.name
            )
        ){

            alert(
                "🚫 This image name is not allowed."
            );

            imageInput.value = "";

            return;

        }


        ////////////////////////////////////////////////////
        // SPARKD CONTENT GUARD
        ////////////////////////////////////////////////////

        if(
            window.SPARKD_GUARD &&
            typeof window.SPARKD_GUARD.check === "function"
        ){

            try{

                const allowed =
                await window.SPARKD_GUARD.check(
                    file
                );


                if(!allowed){

                    imageInput.value = "";

                    return;

                }

            }
            catch(error){

                console.error(
                    "SPARKD Content Guard error:",
                    error
                );


                alert(
                    "⚠️ Content Guard could not check this image."
                );


                imageInput.value = "";

                return;

            }

        }


        ////////////////////////////////////////////////////
        // LOAD IMAGE
        ////////////////////////////////////////////////////

        const reader =
        new FileReader();


        reader.onload =
        function(event){

            fabric.Image.fromURL(

                event.target.result,

                function(img){

                    ////////////////////////////////////////////////////
                    // CANVAS SIZE
                    ////////////////////////////////////////////////////

                    const canvasSize = 1080;


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


                        cornerColor:"#ff6600",

                        transparentCorners:false

                    });


                    ////////////////////////////////////////////////////
                    // ADD IMAGE
                    ////////////////////////////////////////////////////

                    canvas.add(img);


                    ////////////////////////////////////////////////////
                    // KEEP IMAGE BEHIND TEXT
                    ////////////////////////////////////////////////////

                    canvas.sendToBack(img);


                    canvas.setActiveObject(img);


                    canvas.renderAll();

                }

            );

        };


        reader.readAsDataURL(file);

    };

}


////////////////////////////////////////////////////
// ADD TEXT
////////////////////////////////////////////////////

const addTextBtn =
document.getElementById("addTextBtn");

const textInput =
document.getElementById("textInput");


if(addTextBtn){

    addTextBtn.onclick =
    function(){

        ////////////////////////////////////////////////////
        // CREATE MEME TEXT
        ////////////////////////////////////////////////////

        const memeText =
        new fabric.IText(

            textInput
            ? textInput.value || "SPARKD"
            : "SPARKD",

            {

                left:150,

                top:50,

                fill:"#ffffff",

                stroke:"#000000",

                strokeWidth:4,

                fontFamily:"Bangers",

                fontSize:80

            }

        );


        ////////////////////////////////////////////////////
        // MARK AS MEME TEXT
        ////////////////////////////////////////////////////

        memeText.isMemeText = true;


        ////////////////////////////////////////////////////
        // ADD TEXT
        ////////////////////////////////////////////////////

        canvas.add(memeText);


        canvas.setActiveObject(
            memeText
        );


        canvas.renderAll();

    };

}


////////////////////////////////////////////////////
// DELETE SELECTED OBJECT
////////////////////////////////////////////////////

const deleteBtn =
document.getElementById("deleteBtn");


if(deleteBtn){

    deleteBtn.onclick =
    function(){

        const activeObject =
        canvas.getActiveObject();


        if(activeObject){

            canvas.remove(
                activeObject
            );


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


if(downloadBtn){

    downloadBtn.onclick =
    function(){

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


        if(!image){

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
        // EXPORT IMAGE + TEXT FIRST
        ////////////////////////////////////////////////////

        const dataURL =
        canvas.toDataURL({

            format:"png",

            left:bounds.left,

            top:bounds.top,

            width:bounds.width,

            height:bounds.height,

            multiplier:2,

            enableRetinaScaling:true

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


        const img =
        new Image();


        img.onload =
        function(){


            ////////////////////////////////////////////////////
            // DRAW EXPORTED MEME
            ////////////////////////////////////////////////////

            ctx.drawImage(

                img,

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


            if(
                window.SPARKD_FORGE &&
                typeof window.SPARKD_FORGE.createRecord === "function"
            ){

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


            if(
                window.SPARKD_EXPORT &&
                forgeRecord &&
                typeof window.SPARKD_EXPORT.attachForgeData === "function"
            ){

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

            if(
                window.SPARKD_PNG &&
                forgeRecord &&
                typeof window.SPARKD_PNG.attach === "function"
            ){

                link.href =
                window.SPARKD_PNG.attach(

                    finalCanvas,

                    forgeRecord

                );

            }
            else{

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


        img.src =
        dataURL;

    };

}

});
```
