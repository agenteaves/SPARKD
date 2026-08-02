////////////////////////////////////////////////////
// SPARKD MEME FORGE
// DAILY MISSION COMPLETION SYSTEM
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const button =
    document.getElementById("completeMissionBtn");


    if(!button){
        return;
    }



    function getToday(){

        const today = new Date();

        return today.toISOString().split("T")[0];

    }



    function checkMissionStatus(){


        const completedDate =
        localStorage.getItem("missionCompleteDate");



        if(completedDate === getToday()){


            button.innerHTML =
            "✅ Mission Completed Today";


            button.disabled = true;


        }
        else{


            button.innerHTML =
            "✅ Complete Mission";


            button.disabled = false;


        }


    }



    checkMissionStatus();




    button.onclick = function(){



        const objects =
        canvas.getObjects();



        if(objects.length === 0){


            alert(
                "🔥 Create your SPARKD meme first!"
            );


            return;


        }




        const completedDate =
        localStorage.getItem("missionCompleteDate");



        if(completedDate === getToday()){


            alert(
                "✅ You already completed today's mission!"
            );


            return;


        }




        window.addSparkPoints(100);



        localStorage.setItem(
            "missionCompleteDate",
            getToday()
        );



        button.innerHTML =
        "✅ Mission Completed Today";


        button.disabled = true;



        alert(
            "🔥 Mission Complete! +100 SPARK Points"
        );



    };


});
