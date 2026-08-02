////////////////////////////////////////////////////
// SPARKD MEME FORGE
// OBJECT TOOLS
// Lock / Unlock + Clear All
////////////////////////////////////////////////////


window.addEventListener("load", function(){

    if(typeof canvas === "undefined"){

        console.log("SPARKD Object Tools: Canvas not found");
        return;

    }


    // ================================
    // LOCK / UNLOCK OBJECT
    // ================================

    const lockBtn = document.getElementById("lockBtn");


    if(lockBtn){


        lockBtn.onclick = function(){


            const activeObject = canvas.getActiveObject();


            if(!activeObject){

                alert("Select an object first.");

                return;

            }


            const locked = activeObject.lockMovementX;


            activeObject.set({

                lockMovementX: !locked,
                lockMovementY: !locked,
                lockScalingX: !locked,
                lockScalingY: !locked,
                lockRotation: !locked,

                hasControls: locked,
                selectable: true

            });


            canvas.renderAll();


            if(locked){

                lockBtn.innerHTML = "🔒 Lock";

            }else{

                lockBtn.innerHTML = "🔓 Unlock";

            }


        };


    }




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


            canvas.clear();


            canvas.backgroundColor = "#ffffff";


            canvas.renderAll();


        };


    }



});
