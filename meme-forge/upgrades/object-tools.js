////////////////////////////////////////////////////
// SPARKD MEME FORGE
// OBJECT TOOLS
// Clear All
////////////////////////////////////////////////////


window.addEventListener("load", function(){



    // ================================
    // CLEAR ALL OBJECTS
    // ================================

    const clearBtn = document.getElementById("clearBtn");


    if(clearBtn){


        clearBtn.onclick = function(){


            const confirmClear = confirm(
                "Clear all images, text, and emojis?"
            );


            if(!confirmClear){

                return;

            }


            window.canvas.clear();


            window.canvas.backgroundColor = "#ffffff";


            window.canvas.renderAll();


        };


    }



});
