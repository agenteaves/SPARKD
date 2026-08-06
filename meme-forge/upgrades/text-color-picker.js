////////////////////////////////////////////////////
// SPARKD MEME FORGE
// TEXT COLOR PICKER - MOVABLE VERSION
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const colorMenu =
    document.createElement("div");


    colorMenu.id =
    "textColorMenu";


    colorMenu.innerHTML = `

        <div class="colorTitle" id="colorDragHandle">
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


    colorMenu.style.position =
    "fixed";



    ////////////////////////////////////////////////////
    // MAKE COLOR MENU DRAGGABLE
    ////////////////////////////////////////////////////

    const dragHandle =
    document.getElementById(
        "colorDragHandle"
    );


    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;



    dragHandle.style.cursor =
    "move";



    dragHandle.onmousedown =
    function(e){


        dragging = true;


        offsetX =
        e.clientX -
        colorMenu.offsetLeft;


        offsetY =
        e.clientY -
        colorMenu.offsetTop;


        e.preventDefault();

    };



    document.onmousemove =
    function(e){


        if(!dragging){
            return;
        }


        colorMenu.style.left =
        (e.clientX - offsetX) + "px";


        colorMenu.style.top =
        (e.clientY - offsetY) + "px";


    };



    document.onmouseup =
    function(){

        dragging = false;

    };






    ////////////////////////////////////////////////////
    // SHOW / HIDE MENU
    ////////////////////////////////////////////////////


    canvas.on(
        "selection:created",
        showColorMenu
    );


    canvas.on(
        "selection:updated",
        showColorMenu
    );



    canvas.on(
        "selection:cleared",
        function(){

            colorMenu.style.display =
            "none";

        }
    );







    function showColorMenu(e){


        const obj =
        e.selected[0];



        if(
            obj &&
            obj.isMemeText === true
        ){


            colorMenu.style.display =
            "block";


            // Only set starting position once
            if(!colorMenu.dataset.positioned){

                colorMenu.style.left =
                "20px";


                colorMenu.style.top =
                "120px";


                colorMenu.dataset.positioned =
                "true";

            }


        }
        else{


            colorMenu.style.display =
            "none";


        }


    }








    ////////////////////////////////////////////////////
    // COLOR BUTTONS
    ////////////////////////////////////////////////////


    colorMenu.querySelectorAll("button")
    .forEach(function(button){



        button.onclick =
        function(){



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
