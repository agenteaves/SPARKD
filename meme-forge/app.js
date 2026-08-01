// SPARKD Meme Forge - Canvas Test


window.addEventListener("load", function(){


    if(typeof fabric === "undefined"){

        document.body.innerHTML += `
        <div style="
        position:fixed;
        top:20px;
        left:20px;
        background:red;
        color:white;
        padding:20px;
        z-index:99999;">
        Fabric.js did not load
        </div>
        `;

        return;

    }



    const canvas = new fabric.Canvas("memeCanvas", {

        backgroundColor:"#ffffff",

        preserveObjectStacking:true

    });



    window.sparkdCanvas = canvas;



    canvas.renderAll();



    document.body.innerHTML += `
    <div style="
    position:fixed;
    top:20px;
    right:20px;
    background:#00aa00;
    color:white;
    padding:15px;
    z-index:99999;
    border-radius:10px;">
    SPARKD CANVAS ONLINE
    </div>
    `;



});
