////////////////////////////////////////////////////
// SPARKD MEME FORGE
// TEXT COLOR PICKER
////////////////////////////////////////////////////


window.addEventListener("load", function(){



    const colorMenu =
    document.createElement("div");



    colorMenu.id =
    "textColorMenu";



    colorMenu.innerHTML = `

        <div class="colorTitle">
            Text Color
        </div>


        <button data-color="#ffffff">
            White
        </button>


        <button data-color="#000000">
            Black
        </button>


        <button data-color="#ff0000">
            Red
        </button>


        <button data-color="#00ff00">
            Green
        </button>


        <button data-color="#008cff">
            Blue
        </button>


        <button data-color="#ffff00">
            Yellow
        </button>

    `;



    document.body.appendChild(colorMenu);



    colorMenu.style.display =
    "none";





    canvas.on("selection:created", showColorMenu);


    canvas.on("selection:updated", showColorMenu);



    canvas.on("selection:cleared", function(){


        colorMenu.style.display =
        "none";


    });







    function showColorMenu(e){



        const obj =
        e.selected[0];



        if(
            obj &&
            obj.isMemeText === true
        ){



            colorMenu.style.display =
            "block";



            colorMenu.style.left =
            "20px";



            colorMenu.style.top =
            "120px";



        }
        else{


            colorMenu.style.display =
            "none";


        }



    }








    colorMenu.querySelectorAll("button")
    .forEach(function(button){



        button.onclick=function(){



            const obj =
            canvas.getActiveObject();



            if(
                !obj ||
                obj.isMemeText !== true
            ){

                return;

            }





            obj.set({

                fill:
                button.dataset.color

            });



            canvas.renderAll();



        };



    });



});
