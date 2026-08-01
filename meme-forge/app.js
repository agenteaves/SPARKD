////////////////////////////////////////////////////
// SPARKD MEME FORGE v1.1
// COMPLETE APP ENGINE
////////////////////////////////////////////////////

window.addEventListener("load", function(){


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
// IMAGE UPLOAD
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


                    img.scaleToWidth(1000);
                    img.set({



                        left:140,
                        top:140,

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
// EXPORT PNG - IMAGE ONLY (NO CANVAS SPACE)
// WITH SPARKD WATERMARK
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



        // Create temporary canvas
        const tempCanvas = document.createElement("canvas");


        const imgWidth = image.getScaledWidth();

        const imgHeight = image.getScaledHeight();



        tempCanvas.width = imgWidth;

        tempCanvas.height = imgHeight;



        const ctx = tempCanvas.getContext("2d");



        // Create image element
        const imgElement = image.toDataURL();



        const tempImage = new Image();



        tempImage.onload = function(){



            // Draw image only
            ctx.drawImage(
                tempImage,
                0,
                0,
                imgWidth,
                imgHeight
            );



            // Add watermark
            ctx.font = "32px Arial";

            ctx.textAlign = "right";

            ctx.textBaseline = "bottom";

            ctx.lineWidth = 2;

            ctx.strokeStyle = "black";

            ctx.fillStyle = "white";



            const watermark =
                document.getElementById("contractInput").value;



            ctx.strokeText(
                watermark,
                imgWidth - 20,
                imgHeight - 20
            );


            ctx.fillText(
                watermark,
                imgWidth - 20,
                imgHeight - 20
            );



            // Download
            const link = document.createElement("a");


            link.href = tempCanvas.toDataURL("image/png");


            link.download = "SPARKD-meme.png";


            link.click();


        };



        tempImage.src = imgElement;


    };


}


}});
