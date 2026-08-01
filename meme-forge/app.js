// ==========================================
// SPARKD MEME FORGE
// CANVAS + IMAGE UPLOAD
// ==========================================

window.addEventListener("load", function(){


if(typeof fabric === "undefined"){

    alert("Fabric.js missing");

    return;

}



const canvas = new fabric.Canvas("memeCanvas", {

    backgroundColor:"#ffffff",

    preserveObjectStacking:true

});


canvas.setWidth(1080);
canvas.setHeight(1080);

canvas.renderAll();





const uploadButton =
document.getElementById("uploadImageButton");


const imageUpload =
document.getElementById("imageUpload");




uploadButton.onclick = function(){

    imageUpload.click();

};





imageUpload.onchange = function(e){


const file = e.target.files[0];


if(!file){

    return;

}



const url = URL.createObjectURL(file);



fabric.Image.fromURL(

url,

function(img){



    // FORCE KNOWN SIZE/POSITION

    img.set({

        left:100,

        top:100,

        opacity:1,

        visible:true

    });



    img.scale(0.5);



    canvas.add(img);



    canvas.setActiveObject(img);



    canvas.bringToFront(img);



    canvas.renderAll();



    alert(
    "IMAGE ADDED - OBJECTS: "
    + canvas.getObjects().length
    );


},

{

    crossOrigin:"anonymous"

}


);



};


});
