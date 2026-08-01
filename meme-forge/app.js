/* =====================================================
   SPARKD MEME FORGE
   app.js
   Part 1 - Core Canvas Engine
===================================================== */


// ================================
// TOKEN CONFIGURATION
// ================================

const SPARKD_CONFIG = {

    contractAddress:
    "YOUR_TOKEN_CONTRACT_ADDRESS",

    website:
    "sparkdcoin.com"

};


// ================================
// INITIALIZE CANVAS
// ================================


const canvas = new fabric.Canvas(
    "memeCanvas",
    {

        preserveObjectStacking:true,

        selection:true,

        backgroundColor:"#ffffff"

    }
);



canvas.setWidth(1080);
canvas.setHeight(1080);



// ================================
// STATUS UPDATE
// ================================


function updateStatus(message){

    const status =
    document.getElementById("statusText");

    if(status){

        status.innerText = message;

    }

}



function updateObjectCount(){

    const count =
    document.getElementById("objectCount");

    if(count){

        count.innerText =
        canvas.getObjects().length;

    }

}



// ================================
// IMAGE UPLOAD FIXED
// ================================


const uploadButton =
document.getElementById("uploadImageButton");


const imageUpload =
document.getElementById("imageUpload");



if(uploadButton){

    uploadButton.addEventListener("click", function(){

        imageUpload.click();

    });

}



if(imageUpload){

imageUpload.addEventListener("change", function(e){


    const file = e.target.files[0];


    if(!file){

        return;

    }



    const reader = new FileReader();



    reader.onload = function(event){



        fabric.Image.fromURL(

            event.target.result,

            function(img){



                // Scale image to fit canvas

                const maxSize = 900;


                if(img.width > maxSize || img.height > maxSize){

                    img.scaleToWidth(maxSize);

                }



                img.set({

                    left:100,

                    top:100,

                    selectable:true,

                    hasControls:true,

                    hasBorders:true

                });



                canvas.add(img);



                canvas.centerObject(img);



                canvas.setActiveObject(img);



                canvas.renderAll();



                updateStatus(
                    "Image Loaded Successfully"
                );


                updateObjectCount();



            },

            {
                crossOrigin:"anonymous"
            }

        );



    };



    reader.readAsDataURL(file);



});

}



imageUpload.onchange=function(e){


const file =
e.target.files[0];


if(!file)
return;



const reader =
new FileReader();



reader.onload=function(event){


fabric.Image.fromURL(

event.target.result,

function(img){


    img.scaleToWidth(900);


    canvas.add(img);


    canvas.centerObject(img);


    img.set({

        selectable:true

    });


    canvas.setActiveObject(img);


    canvas.renderAll();


    updateStatus(
    "Image Added"
    );


    updateObjectCount();


});


};



reader.readAsDataURL(file);


};



// ================================
// TEXT ENGINE
// ================================


const addTextButton =
document.getElementById(
"addTextButton"
);



if(addTextButton){


addTextButton.onclick=function(){



let text =
document.getElementById(
"topText"
).value;



if(!text){

text="SPARKD TO THE MOON 🚀";

}



let size =
parseInt(
document.getElementById(
"fontSize"
).value
);



let color =
document.getElementById(
"fontColor"
).value;



let font =
document.getElementById(
"fontFamily"
).value;



let textbox =
new fabric.Textbox(

text,

{

    left:100,

    top:100,

    width:800,


    fontSize:size,


    fill:color,


    fontFamily:font,


    fontWeight:"bold",


    stroke:"#000000",


    strokeWidth:3,


    textAlign:"center"


}

);



canvas.add(textbox);


canvas.setActiveObject(textbox);


canvas.renderAll();



updateStatus(
"Text Added"
);


updateObjectCount();



};


}



// ================================
// DELETE OBJECT
// ================================


document.addEventListener(

"keydown",

function(e){


if(
e.key==="Delete"
){

let active =
canvas.getActiveObject();


if(active){

canvas.remove(active);

canvas.renderAll();

updateObjectCount();

updateStatus(
"Object Removed"
);

}


}



}

);



// ================================
// CLEAR CANVAS
// ================================


const clearButton =
document.getElementById(
"clearCanvas"
);



if(clearButton){


clearButton.onclick=function(){


canvas.clear();


canvas.backgroundColor="#ffffff";


canvas.renderAll();


updateStatus(
"Canvas Cleared"
);


updateObjectCount();



};


}



// ================================
// ZOOM SYSTEM
// ================================


const zoomSlider =
document.getElementById(
"zoomSlider"
);



if(zoomSlider){


zoomSlider.oninput=function(){


let zoom =
parseInt(
this.value
)/100;



canvas.setZoom(zoom);



canvas.renderAll();



const display =
document.getElementById(
"zoomStatus"
);



if(display){

display.innerText =
this.value+"%";

}



};


}




// ================================
// ADD WATERMARK
// ================================


function addWatermark(){


let watermark =
new fabric.Text(

SPARKD_CONFIG.contractAddress,

{

    left:850,

    top:1040,


    fontSize:12,


    fill:"rgba(0,0,0,0.45)",


    selectable:false,


    evented:false


}

);



canvas.add(watermark);



let site =
new fabric.Text(

SPARKD_CONFIG.website,

{

    left:900,

    top:1025,


    fontSize:12,


    fill:"rgba(0,0,0,0.45)",


    selectable:false,


    evented:false


}

);



canvas.add(site);


canvas.renderAll();


}



addWatermark();



// ================================
// DOWNLOAD PLACEHOLDER
// ================================


const downloadButton =
document.getElementById(
"downloadBtn"
);



if(downloadButton){


downloadButton.onclick=function(){


canvas.discardActiveObject();


canvas.renderAll();



let image =
canvas.toDataURL({

format:"png",

quality:1

});



let link =
document.createElement("a");


link.href=image;


link.download=
"SPARKD-meme.png";


link.click();



updateStatus(
"Meme Exported"
);



};


}



// ================================
// STARTUP
// ================================


updateStatus(
"SPARKD Meme Forge Ready"
);


updateObjectCount();
