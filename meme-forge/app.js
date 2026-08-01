// ==========================================
// SPARKD MEME FORGE
// WORKING IMAGE LOADER
// ==========================================


window.addEventListener("load", function(){


const canvas = window.sparkdCanvas;



const uploadButton =
document.getElementById("uploadImageButton");


const imageUpload =
document.getElementById("imageUpload");



uploadButton.onclick = function(){

    imageUpload.click();

};




imageUpload.onchange = function(event){


const file =
event.target.files[0];


if(!file){

return;

}



const reader =
new FileReader();



reader.onload = function(e){



const imgElement =
new Image();



imgElement.onload = function(){



const img =
new fabric.Image(imgElement);



img.set({

    left:100,

    top:100,

    originX:"left",

    originY:"top"

});



img.scaleToWidth(600);



canvas.add(img);



canvas.bringToFront(img);



canvas.setActiveObject(img);



canvas.requestRenderAll();



};



imgElement.src =
e.target.result;



};



reader.readAsDataURL(file);



};



});
