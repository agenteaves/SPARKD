////////////////////////////////////////////////////
// SPARKD MEME FORGE
// CREATOR STARTER PACK
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const claimed =
    localStorage.getItem("starterPackClaimed");



    if(claimed){

        return;

    }



    // Give starter rewards

    let points =
    Number(localStorage.getItem("sparkPoints")) || 0;



    points += 100;



    localStorage.setItem(
        "sparkPoints",
        points
    );



    localStorage.setItem(
        "starterPackClaimed",
        "true"
    );



    if(window.updateCreatorLevel){

        window.updateCreatorLevel();

    }



    const display =
    document.getElementById("sparkPointAmount");


    if(display){

        display.innerHTML = points;

    }



    alert(
`🎁 SPARKD Creator Starter Pack!

+100 SPARK Points

🏷️ New Creator Badge
🔥 First Mission Unlocked

Welcome to SPARKD Meme Forge!`
    );


});
