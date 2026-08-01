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



// ================================
// WATERMARK
// ================================

const watermarkBtn = document.getElementById("watermarkBtn");
const contractInput = document.getElementById("contractInput");


if(watermarkBtn){


    watermarkBtn.onclick = function(){


        const watermark = new fabric.Text(

            contractInput.value,

            {

                left:10,

                top:1045,

                fontSize:18,

                fill:"#777777",

                opacity:0.8

            }

        );



        canvas.add(watermark);


        canvas.renderAll();


    };


}



////////////////////////////////////////////////////
// EXPORT PNG - SPARKD WATERMARK INCLUDED
////////////////////////////////////////////////////

const downloadBtn = document.getElementById("downloadBtn");


if(downloadBtn){


    downloadBtn.onclick = function(){


        canvas.discardActiveObject();
        canvas.renderAll();



        const contract = document.getElementById("contractInput").value;



        // Find uploaded image
        const image = canvas.getObjects().find(
            obj => obj.type === "image"
        );



        if(!image){

            alert("Please upload an image first.");

            return;

        }



        // Get image position and size
        const imgBounds = image.getBoundingRect(true,true);



        // Create permanent export watermark
        const watermark = new fabric.Text(

            contract,

            {

                fontSize:32,

                fontFamily:"Arial",

                fill:"#ffffff",

                stroke:"#000000",

                strokeWidth:1.5,

                opacity:0.9,

                selectable:false,

                evented:false

            }

        );



        watermark.set({

            left: imgBounds.left + imgBounds.width - 25,

            top: imgBounds.top + imgBounds.height - 25,

            originX:"right",

            originY:"bottom"

        });



        canvas.add(watermark);

        canvas.renderAll();




        // Calculate export area including watermark
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;



        canvas.getObjects().forEach(function(obj){


            const rect = obj.getBoundingRect(true,true);



            minX = Math.min(minX, rect.left);

            minY = Math.min(minY, rect.top);


            maxX = Math.max(
                maxX,
                rect.left + rect.width
            );


            maxY = Math.max(
                maxY,
                rect.top + rect.height
            );


        });



        const padding = 30;



        const data = canvas.toDataURL({

            format:"png",

            left:minX - padding,

            top:minY - padding,

            width:(maxX - minX) + (padding * 2),

            height:(maxY - minY) + (padding * 2),

            multiplier:1

        });



        // Remove temporary watermark
        canvas.remove(watermark);

        canvas.renderAll();



        // Download
        const link = document.createElement("a");

        link.href = data;

        link.download = "SPARKD-meme.png";

        link.click();


    };


}
});
