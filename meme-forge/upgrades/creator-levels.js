////////////////////////////////////////////////////
// SPARKD MEME FORGE
// CREATOR LEVEL SYSTEM
////////////////////////////////////////////////////


function updateCreatorLevel(){


    const levelDisplay =
    document.getElementById("creatorLevelName");



    const points =
    Number(localStorage.getItem("sparkPoints")) || 0;



    let level = 1;
    let title = "Meme Rookie";



    if(points >= 500){

        level = 2;
        title = "Rising Creator";

    }


    if(points >= 1500){

        level = 3;
        title = "Meme Master";

    }


    if(points >= 5000){

        level = 4;
        title = "Viral Architect";

    }


    if(points >= 10000){

        level = 5;
        title = "SPARKD Legend";

    }



    localStorage.setItem(
        "creatorLevel",
        level
    );



    if(levelDisplay){

        levelDisplay.innerHTML =
        "Level " + level + " - " + title;

    }


}



// Run immediately

updateCreatorLevel();
