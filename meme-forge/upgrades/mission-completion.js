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


            button.disabled = false;


        }
        else{


            button.innerHTML =
            "🔥 Complete Mission";


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




        // ================================
        // GET TODAY'S CHALLENGE REWARD
        // ================================


        const challenges =
        window.sparkdChallenges;



        const today =
        new Date();



        const dayNumber =
            today.getFullYear() +
            today.getMonth() +
            today.getDate();



        const currentChallenge =
        challenges[dayNumber % challenges.length];



        const reward =
        currentChallenge?.reward || 100;




        // Award SPARK Points

        window.addSparkPoints(reward);




        // Save today's completion

        localStorage.setItem(
            "missionCompleteDate",
            getToday()
        );




        button.innerHTML =
        "✅ Mission Completed Today";



        alert(
            "🔥 Mission Complete! +" + reward + " SPARK Points"
        );



    };


});
