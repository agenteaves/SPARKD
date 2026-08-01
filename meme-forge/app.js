// ==========================================
// SPARKD MEME FORGE
// CORE CANVAS + IMAGE UPLOAD
// ==========================================


window.addEventListener("load", function(){


if(typeof fabric === "undefined"){

    alert("Fabric.js did not load");

    return;

}


// CREATE CANVAS

const canvas = new fabric.Canvas(
    "memeCanvas",
    {
        backgroundColor:"#ffffff",
        preserveObjectStacking:true
    }
);


// MAKE GLOBAL

window.sparkdCanvas = canvas;



canvas.setWidth(1080);
canvas.setHeight(1080);

canvas.renderAll();



// IMAGE UPLOAD

const uploadButton =
document.getElementById("uploadImageButton");


const imageUpload =
document.getElementById("imageUpload");



if(!uploadButton || !imageUpload){

    alert("Upload controls missing");

    return;

}



uploadButton.addEventListener(
"click",
function(){

    imageUpload.click();

});





imageUpload.addEventListener(
"change",
function(e){


const file =
e.target.files[0];


if(!file){

    return;

}



const reader =
new FileReader();



reader.onload =
function(event){



fabric.Image.fromURL(

event.target.result,

function(img){



img.set({

left:100,

top:100

});



img.scaleToWidth(700);



canvas.add(img);



canvas.setActiveObject(img);



canvas.requestRenderAll();



alert("IMAGE IS ON CANVAS");


}



);



};



reader.readAsDataURL(file);



});



});
