// ==========================================
// SPARKD MEME FORGE
// CANVAS + IMAGE UPLOAD ENGINE
// ==========================================


window.addEventListener("load", function(){


    if(typeof fabric === "undefined"){

        alert("Fabric.js failed to load");

        return;

    }



    const canvas = new fabric.Canvas(
        "memeCanvas",
        {
            backgroundColor:"#ffffff",
            preserveObjectStacking:true
        }
    );



    canvas.setWidth(1080);
    canvas.setHeight(1080);



    canvas.calcOffset();

    canvas.requestRenderAll();



    const uploadButton =
    document.getElementById("uploadImageButton");



    const imageUpload =
    document.getElementById("imageUpload");



    if(!uploadButton || !imageUpload){

        alert("Upload controls missing");

        return;

    }




    uploadButton.onclick = function(){

        imageUpload.click();

    };





    imageUpload.onchange = function(e){


        const file =
        e.target.files[0];



        if(!file){

            return;

        }




        const reader =
        new FileReader();




        reader.onload = function(event){



            const imgElement =
            new Image();



            imgElement.onload = function(){



                const img =
                new fabric.Image(imgElement);



                img.set({

                    left:200,

                    top:200,

                    originX:"left",

                    originY:"top"

                });



                img.scaleToWidth(300);



                canvas.add(img);



                canvas.setActiveObject(img);



                canvas.bringToFront(img);



                canvas.calcOffset();



                canvas.requestRenderAll();



            };



            imgElement.src =
            event.target.result;



        };



        reader.readAsDataURL(file);



    };



});
