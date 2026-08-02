////////////////////////////////////////////////////
// SPARKD MEME FORGE
// SECRET DEVELOPER MODE
////////////////////////////////////////////////////


window.addEventListener("load", function () {


    const logo =
    document.getElementById("sparkdLogo");



    if(!logo){

        console.log(
            "SPARKD logo not found"
        );

        return;

    }



    let clicks = 0;

    let timer = null;



    logo.addEventListener("click", function () {



        clicks++;



        clearTimeout(timer);



        timer = setTimeout(function(){


            clicks = 0;


        },4000);




        if(clicks >= 5){



            clicks = 0;



            if(typeof openDeveloperPanel === "function"){


                openDeveloperPanel();


            }
            else{


                console.log(
                    "SPARKD Developer Panel is not loaded"
                );


            }



        }



    });



});
