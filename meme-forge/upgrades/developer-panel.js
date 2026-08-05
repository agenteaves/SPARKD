////////////////////////////////////////////////////
// SPARKD MEME FORGE
// DEVELOPER PANEL
////////////////////////////////////////////////////


function openDeveloperPanel(){


    if(document.getElementById("sparkdDevPanel")){

        return;

    }



    const panel = document.createElement("div");

    panel.id = "sparkdDevPanel";


    panel.innerHTML = `

    <div class="devHeader">

        🛠 SPARKD Developer Console

        <button id="closeDevPanel">
            ✖
        </button>

    </div>



    <div class="devSection">

        <h3>Player Data</h3>


        <p>
        🪙 Points:
        <strong id="devPoints"></strong>
        </p>


        <p>
        ⭐ Level:
        <strong id="devLevel"></strong>
        </p>


    </div>





    <div class="devSection">

        <h3>Points</h3>


        <button id="add100">
        +100 SPARK
        </button>

        <button id="scanForgeBtn">
        🔍 Scan Forge PNG
        </button>

        <button id="add1000">
        +1000 SPARK
        </button>


        <button id="resetPoints">
        Reset Points
        </button>


    </div>





    <div class="devSection">

        <h3>Levels</h3>


        <button class="levelBtn" data-level="1">
        Level 1
        </button>


        <button class="levelBtn" data-level="2">
        Level 2
        </button>


        <button class="levelBtn" data-level="3">
        Level 3
        </button>


        <button class="levelBtn" data-level="4">
        Level 4
        </button>


        <button class="levelBtn" data-level="5">
        Level 5
        </button>


    </div>





    <div class="devSection">

        <h3>Reset Tools</h3>


        <button id="resetMission">
        Reset Daily Mission
        </button>


        <button id="resetStarter">
        Reset Starter Pack
        </button>


        <button id="fullReset">
        Full Player Reset
        </button>


    </div>


    `;



    document.body.appendChild(panel);



    updateDevPanel();





    document.getElementById("closeDevPanel").onclick =
    function(){

        panel.remove();

    };





    document.getElementById("add100").onclick =
    function(){

        window.addSparkPoints(100);

        updateDevPanel();

    };





    document.getElementById("add1000").onclick =
    function(){

        window.addSparkPoints(1000);

        updateDevPanel();

    };





    document.getElementById("resetPoints").onclick =
    function(){


        localStorage.setItem(
            "sparkPoints",
            "0"
        );


        updateDevPanel();


        const display =
        document.getElementById("sparkPointAmount");


        if(display){

            display.innerHTML = "0";

        }


    };






    document.querySelectorAll(".levelBtn")
    .forEach(function(button){


        button.onclick=function(){


            const level =
            button.getAttribute("data-level");



            localStorage.setItem(
                "creatorLevel",
                level
            );



            updateDevPanel();



            const levelDisplay =
            document.getElementById(
                "creatorLevelName"
            );



            if(levelDisplay){


                levelDisplay.innerHTML =
                "Level " + level;


            }



        };


    });






    document.getElementById("resetMission").onclick =
    function(){

        localStorage.removeItem(
            "missionCompleteDate"
        );


        alert(
            "Mission reset"
        );


    };






    document.getElementById("resetStarter").onclick =
    function(){

        localStorage.removeItem(
            "starterPackClaimed"
        );


        alert(
            "Starter Pack reset"
        );


    };






    document.getElementById("fullReset").onclick =
    function(){


        localStorage.clear();


        alert(
            "SPARKD reset complete"
        );


        location.reload();


    };



}






function updateDevPanel(){


    const points =
    document.getElementById("devPoints");


    const level =
    document.getElementById("devLevel");



    if(points){

        points.innerHTML =
        localStorage.getItem("sparkPoints") || "0";

    }




    if(level){

        level.innerHTML =
        localStorage.getItem("creatorLevel") || "1";

    }


}
