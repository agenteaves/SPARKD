////////////////////////////////////////////////////
// SPARKD MEME FORGE v1.1
// COMPLETE APP ENGINE
////////////////////////////////////////////////////

window.addEventListener("load", function(){

// ================================
// CONTENT SAFETY FILTER
// ================================

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


    return blockedWords.some(word =>

        cleanText.includes(word)

    );

}


// ================================
// CREATE CANVAS
// ================================

const canvas = new fabric.Canvas(
    "memeCanvas",
    {
        backgroundColor:"#ffffff",
        preserveObjectStacking:true
    }
);


canvas.setWidth(1080);
canvas.setHeight(1080);



// ================================
// RESIZE CANVAS VIEW
// ================================

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



// ================================
// IMAGE UPLOAD - AUTO FIT & CENTER
// ================================

const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageInput");


if(uploadBtn && imageInput){


    uploadBtn.onclick = function(){

        imageInput.value = "";
        imageInput.click();

    };



    imageInput.onchange = function(e){


        const file = e.target.files[0];


        if(!file){

            return;

        }



        const reader = new FileReader();



        reader.onload = function(event){



            fabric.Image.fromURL(

                event.target.result,

                function(img){



                    // Canvas size
                    const canvasSize = 1080;



                    // Scale image to fit canvas
                    const scale = Math.min(

                        canvasSize / img.width,

                        canvasSize / img.height

                    );



                    img.scale(scale);



                    // Center image
                    img.set({

                        left:
                        (canvasSize - img.getScaledWidth()) / 2,


                        top:
                        (canvasSize - img.getScaledHeight()) / 2,


                        cornerColor:"#ff6600",

                        transparentCorners:false

                    });



                    canvas.add(img);



                    canvas.setActiveObject(img);



                    canvas.renderAll();



                }

            );


        };



        reader.readAsDataURL(file);


    };


}


// ================================
// ADD TEXT
// ================================

const addTextBtn = document.getElementById("addTextBtn");
const textInput = document.getElementById("textInput");


if(addTextBtn){


    addTextBtn.onclick = function(){
        
        if(containsUnsafeContent(textInput.value)){


            alert("This content is not allowed.");

            textInput.value = "";

            return;

       }

        const memeText = new fabric.IText(

            textInput.value || "SPARKD",

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



        canvas.add(memeText);


        canvas.setActiveObject(memeText);


        canvas.renderAll();


    };


}



////////////////////////////////////////////////////
// EXPORT PNG - RAW IMAGE ONLY + WATERMARK
////////////////////////////////////////////////////

const downloadBtn = document.getElementById("downloadBtn");


if(downloadBtn){


    downloadBtn.onclick = function(){


        const image = canvas.getObjects().find(
            obj => obj.type === "image"
        );


        if(!image){

            alert("Please upload an image first.");

            return;

        }



        const imgElement = image.getElement();



        const width = image.getScaledWidth();

        const height = image.getScaledHeight();



        const exportCanvas = document.createElement("canvas");


        exportCanvas.width = width;

        exportCanvas.height = height;



        const ctx = exportCanvas.getContext("2d");



        // Draw ONLY the image
        ctx.drawImage(
            imgElement,
            0,
            0,
            width,
            height
        );



        // Add SPARKD watermark
        const contract =
            document.getElementById("contractInput").value;



        ctx.font = "18px Arial";

        ctx.textAlign = "right";
        
        ctx.textBaseline = "bottom";
        
        ctx.lineWidth = 1;
        
        ctx.strokeStyle = "#000000";
        
        ctx.fillStyle = "#ffffff";



        ctx.strokeText(
            contract,
            width - 10,
            height - 10
        );


        ctx.fillText(
            contract,
            width - 10,
            height - 10
        );



        const link = document.createElement("a");


        link.href = exportCanvas.toDataURL("image/png");


        link.download = "SPARKD-meme.png";


        link.click();


    };
}


});
