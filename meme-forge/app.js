// ==========================================
// SPARKD MEME FORGE
// BASIC CANVAS + UPLOAD CHECK
// ==========================================

window.addEventListener("load", function(){


const canvas = new fabric.Canvas("memeCanvas", {

    backgroundColor:"#ffffff",

    preserveObjectStacking:true

});


canvas.setWidth(1080);
canvas.setHeight(1080);
canvas.renderAll();



const uploadButton = document.getElementById("uploadImageButton");
const imageUpload = document.getElementById("imageUpload");



if (!uploadButton) {

    alert("NO UPLOAD BUTTON FOUND");

    return;

}


if (!imageUpload) {

    alert("NO FILE INPUT FOUND");

    return;

}



uploadButton.onclick = function(){

    alert("UPLOAD CLICKED");

    imageUpload.click();

};



imageUpload.onchange = function(e){


    alert("FILE SELECTED");


    const file = e.target.files[0];


    if(!file){

        return;

    }



    const reader = new FileReader();



    reader.onload = function(event){


        fabric.Image.fromURL(

            event.target.result,

            function(img){


                img.set({

                    left:100,

                    top:100

                });



                img.scaleToWidth(400);



                canvas.add(img);

canvas.setActiveObject(img);

canvas.bringToFront(img);


alert(
    "IMAGE POSITION: X="
    + img.left
    + " Y="
    + img.top
    + " WIDTH="
    + img.width
    + " HEIGHT="
    + img.height
);



canvas.renderAll();


            }

        );


    };


    reader.readAsDataURL(file);


};


});
