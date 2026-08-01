////////////////////////////////////////////////////
// SPARKD MEME FORGE v1.0
// CORE ENGINE
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

canvas.renderAll();





// ================================
// IMAGE UPLOAD
// ================================


const uploadBtn =
document.getElementById("uploadBtn");


const imageInput =
document.getElementById("imageInput");




uploadBtn.onclick = function(){

    imageInput.click();

};





imageInput.onchange = function(e){


const file =
e.target.files[0];


if(!file){

    return;

}



const reader =
new FileReader();



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






// ================================
// ADD TEXT
// ================================


const addTextBtn =
document.getElementById("addTextBtn");


const textInput =
document.getElementById("textInput");



addTextBtn.onclick=function(){



const text =
new fabric.IText(

textInput.value || "SPARKD",

{

left:150,

top:50,

fill:"#ffffff",

stroke:"#000000",

strokeWidth:3,

fontFamily:"Bangers",

fontSize:80,

shadow:"4px 4px 4px #000"

}

);



canvas.add(text);


canvas.setActiveObject(text);


canvas.renderAll();



};






// ================================
// WATERMARK
// ================================


const watermarkBtn =
document.getElementById("watermarkBtn");


const contractInput =
document.getElementById("contractInput");



watermarkBtn.onclick=function(){



const watermark =
new fabric.Text(

contractInput.value,

{

left:10,

top:1050,

fill:"#888888",

fontSize:18,

opacity:.7,

fontFamily:"Arial"

}

);



canvas.add(watermark);


canvas.renderAll();



};







// ================================
// EXPORT
// ================================


const downloadBtn =
document.getElementById("downloadBtn");



downloadBtn.onclick=function(){



canvas.discardActiveObject();

canvas.renderAll();



const data =
canvas.toDataURL({

format:"png",

quality:1

});



const link =
document.createElement("a");


link.href=data;


link.download="SPARKD-meme.png";


link.click();



};




});
