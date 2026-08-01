// ==========================================
// SPARKD MEME FORGE
// IMAGE DEBUG VERSION
// ==========================================


window.addEventListener("load", function(){


const canvas = window.sparkdCanvas;


const uploadButton = document.getElementById("uploadImageButton");

const imageUpload = document.getElementById("imageUpload");



if(!uploadButton){

alert("Upload button not found");

return;

}



if(!imageUpload){

alert("File input not found");

return;

}



uploadButton.onclick = function(){

alert("Upload button works");

imageUpload.click();

};




imageUpload.onchange = function(event){


alert("File selected");


const file = event.target.files[0];


if(!file){

alert("No file detected");

return;

}



const reader = new FileReader();



reader.onload = function(e){


alert("File converted");


const imgElement = new Image();



imgElement.onload = function(){


alert("Browser image loaded");



const img = new fabric.Image(imgElement);



img.scaleToWidth(700);


img.set({

left:190,

top:190

});


canvas.add(img);


canvas.renderAll();



alert("Image added to canvas");


};



imgElement.src = e.target.result;



};



reader.readAsDataURL(file);



};



});
