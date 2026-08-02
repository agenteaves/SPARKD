////////////////////////////////////////////////////
// SPARKD MEME FORGE
// SPARK POINT SYSTEM
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const pointsDisplay =
    document.getElementById("sparkPointAmount");


    if(!pointsDisplay){
        return;
    }



    let points =
    localStorage.getItem("sparkPoints");



    if(points === null){

        points = 0;

        localStorage.setItem(
            "sparkPoints",
            points
        );

    }



    pointsDisplay.innerHTML = points;



});



// =================================
// GLOBAL REWARD FUNCTION
// =================================

window.addSparkPoints = function(amount){


    let points =
    Number(localStorage.getItem("sparkPoints")) || 0;



    points += amount;



    localStorage.setItem(
        "sparkPoints",
        points
    );



    const display =
    document.getElementById("sparkPointAmount");



    if(display){

        display.innerHTML = points;

    }


};



// =================================
// COMPLETE MISSION BUTTON
// =================================

window.addEventListener("load", function(){


    const button =
    document.getElementById("completeMissionBtn");



    if(button){


        button.onclick = function(){


            window.addSparkPoints(100);


            alert(
                "🔥 Mission Complete! +100 SPARK Points"
            );


        };


    }


});
