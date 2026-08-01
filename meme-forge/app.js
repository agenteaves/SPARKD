// ==========================================
// SPARKD MEME FORGE
// IMAGE UPLOAD TEST
// ==========================================


window.addEventListener("load", function(){


const canvas = window.sparkdCanvas;



const uploadButton =
document.getElementById("uploadImageButton");


const imageUpload =
document.getElementById("imageUpload");



if(!uploadButton || !imageUpload){

    document.body.innerHTML += `
    <div style="
    position:fixed;
    top:20px;
    left:20px;
    background:red;
    color:white;
    padding:20px;
    z-index:99999;">
    Upload button or file input missing
    </div>
    `;

    return;

}




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



fabric.Image.fromURL(

e.target.result,

function(img){



    img.scaleToWidth(700);


    img.set({

        left:190,

        top:190

    });



    canvas.add(img);



    canvas.centerObject(img);


    canvas.setActiveObject(img);



    canvas.renderAll();



    document.body.innerHTML += `
    <div style="
    position:fixed;
    bottom:20px;
    right:20px;
    background:#00aa00;
    color:white;
    padding:15px;
    z-index:99999;">
    IMAGE LOADED
    </div>
    `;



}



);



};



reader.readAsDataURL(file);



};



});
