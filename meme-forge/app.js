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
// SPARKD OFFICIAL CONTRACT
// ================================

const SPARKD_CONTRACT =
"BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";

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



            if(containsUnsafeContent(file.name)){


                alert("This image name is not allowed.");

                imageInput.value = "";

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


                   // Keep uploaded images behind text
                   canvas.sendToBack(img);
                    
                    
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

// ================================
// SPARKD OFFICIAL SOLANA CONTRACT
// ================================



////////////////////////////////////////////////////
// EXPORT PNG - IMAGE + TEXT + WATERMARK
////////////////////////////////////////////////////

const downloadBtn = document.getElementById("downloadBtn");


if(downloadBtn){


    downloadBtn.onclick = function(){


        canvas.discardActiveObject();

        canvas.renderAll();



        const image = canvas.getObjects().find(
            obj => obj.type === "image"
        );



        if(!image){

            alert("Please upload an image first.");

            return;

        }



        const bounds = image.getBoundingRect(true, true);



        const objects = canvas.getObjects().filter(obj => {


            const objBounds = obj.getBoundingRect(true, true);


            return (

                objBounds.left >= bounds.left - 5 &&

                objBounds.top >= bounds.top - 5 &&

                objBounds.left + objBounds.width <= bounds.left + bounds.width + 5 &&

                objBounds.top + objBounds.height <= bounds.top + bounds.height + 5

            );


        });



        const group = new fabric.Group(objects);



        const data = group.toDataURL({

            format:"png",

            multiplier:1

        });



        group.destroy();



        const link = document.createElement("a");


        link.href = data;


        link.download = "SPARKD-meme.png";


        link.click();


    };


}


});
