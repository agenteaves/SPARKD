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
        
    <div class="devSection">

    <h3>Website</h3>

    <button id="openWebsiteStatsBtn">
        📊 Website Stats
    </button>

</div>

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


        <button id="add1000">
        +1000 SPARK
        </button>


        <button id="scanForgeBtn">
        🔍 Scan Forge PNG
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

    ////////////////////////////////////////////////////
// WEBSITE STATS
////////////////////////////////////////////////////

document.getElementById(
    "openWebsiteStatsBtn"
).onclick = function () {

    if (
        window.SPARKD_WEBSITE_STATS_DASHBOARD
    ) {

        window.SPARKD_WEBSITE_STATS_DASHBOARD.open();

    }
    else {

        alert(
            "Website Stats dashboard is not loaded."
        );

    }

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



////////////////////////////////////////////////////
// SCAN SPARKD FORGE PNG
////////////////////////////////////////////////////

    document.getElementById("scanForgeBtn").onclick =
    function(){


        const input =
        document.createElement("input");


        input.type = "file";


        input.accept =
        ".png,image/png";



        input.onchange =
        function(e){


            const file =
            e.target.files[0];



            if(file && window.SPARKD_SCANNER){


                SPARKD_SCANNER.scan(file);


            }
            else{


                alert(
                "SPARKD Scanner not loaded."
                );


            }


        };



        input.click();


    };



////////////////////////////////////////////////////
// RESET POINTS
////////////////////////////////////////////////////

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

            display.innerHTML="0";

        }


    };



////////////////////////////////////////////////////
// LEVEL BUTTONS
////////////////////////////////////////////////////

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



        };


    });




////////////////////////////////////////////////////
// RESET MISSION
////////////////////////////////////////////////////

    document.getElementById("resetMission").onclick =
    function(){


        localStorage.removeItem(
            "missionCompleteDate"
        );


        alert(
        "Mission reset"
        );


    };




////////////////////////////////////////////////////
// RESET STARTER
////////////////////////////////////////////////////

    document.getElementById("resetStarter").onclick =
    function(){


        localStorage.removeItem(
            "starterPackClaimed"
        );


        alert(
        "Starter Pack reset"
        );


    };




////////////////////////////////////////////////////
// FULL RESET
////////////////////////////////////////////////////

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
