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


                    img.scaleToWidth(800);


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
// EXPORT PNG - SQUARE MEME ONLY
////////////////////////////////////////////////////

const downloadBtn = document.getElementById("downloadBtn");


if(downloadBtn){


    downloadBtn.onclick = function(){


        canvas.discardActiveObject();
        canvas.renderAll();



        const objects = canvas.getObjects();



        if(objects.length === 0){

            alert("Please create a meme first.");

            return;

        }



        // Find total meme area
        let bounds = {

            left: Infinity,
            top: Infinity,
            right: -Infinity,
            bottom: -Infinity

        };



        objects.forEach(obj => {


            const rect = obj.getBoundingRect(true,true);


            bounds.left = Math.min(bounds.left, rect.left);

            bounds.top = Math.min(bounds.top, rect.top);


            bounds.right = Math.max(
                bounds.right,
                rect.left + rect.width
            );


            bounds.bottom = Math.max(
                bounds.bottom,
                rect.top + rect.height
            );


        });



        const padding = 20;



        let width =
            (bounds.right - bounds.left) + padding * 2;


        let height =
            (bounds.bottom - bounds.top) + padding * 2;



        // Force square dimensions
        const size = Math.max(width, height);



        const centerX =
            bounds.left + (width / 2);


        const centerY =
            bounds.top + (height / 2);



        const crop = {

            left: centerX - (size / 2),

            top: centerY - (size / 2),

            width: size,

            height: size

        };



        const data = canvas.toDataURL({

            format:"png",

            left:crop.left,

            top:crop.top,

            width:crop.width,

            height:crop.height,

            multiplier:1

        });



        const link = document.createElement("a");


        link.href = data;


        link.download = "SPARKD-meme.png";


        link.click();


    };


}


});
