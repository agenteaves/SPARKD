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

    event.target.result,

    function(img){


        alert(
        "IMAGE SIZE: "
        + img.width
        + " x "
        + img.height
        );


        img.set({

            left:100,

            top:100,

            opacity:1,

            visible:true

        });



        img.scaleToWidth(500);



        canvas.add(img);


        canvas.bringToFront(img);


        canvas.setActiveObject(img);



        canvas.renderAll();


        alert(
        "VISIBLE OBJECTS: "
        + canvas.getObjects().length
        );


    }

);

},

{

    crossOrigin:"anonymous"

}


);



};


});
