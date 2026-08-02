////////////////////////////////////////////////////
// SPARKD MEME FORGE
// MISSION COMPLETION SYSTEM
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const button =
    document.getElementById("completeMissionBtn");


    if(!button){
        return;
    }



    button.onclick = function(){


        const objects =
        canvas.getObjects();



        if(objects.length === 0){


            alert(
                "🔥 Create your SPARKD meme first!"
            );


            return;

        }



        const completed =
        localStorage.getItem("missionComplete");



        if(completed){


            alert(
                "✅ Today's mission is already complete!"
            );


            return;

        }



        window.addSparkPoints(100);



        localStorage.setItem(
            "missionComplete",
            "true"
        );



        button.innerHTML =
        "✅ Mission Completed";



        button.disabled = true;



        alert(
            "🔥 Mission Complete! +100 SPARK Points"
        );



    };


});
