////////////////////////////////////////////////////
// SPARKD MEME FORGE
// DAILY CHALLENGE SYSTEM
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const challenges = window.sparkdChallenges;

    const challengeText =
    document.getElementById("challengeText");

    const challengeCategory =
    document.getElementById("challengeCategory");

    const challengeDifficulty =
    document.getElementById("challengeDifficulty");

    const challengeReward =
    document.getElementById("challengeReward");


    if(!challenges || !challengeText){

        return;

    }



    ////////////////////////////////////////
    // CREATOR LEVEL
    ////////////////////////////////////////

    const creatorLevel =
    Number(localStorage.getItem("creatorLevel")) || 1;



    let maxDifficulty = 1;



    if(creatorLevel >= 2){

        maxDifficulty = 2;

    }

    if(creatorLevel >= 3){

        maxDifficulty = 3;

    }

    if(creatorLevel >= 5){

        maxDifficulty = 4;

    }



    ////////////////////////////////////////
    // AVAILABLE CHALLENGES
    ////////////////////////////////////////

    const availableChallenges =
    challenges.filter(function(challenge){

        return challenge.difficultyLevel <= maxDifficulty;

    });



    ////////////////////////////////////////
    // DAILY CHALLENGE
    ////////////////////////////////////////

    const today = new Date();

    const dayNumber =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();



    const challenge =
    availableChallenges[
        dayNumber % availableChallenges.length
    ];



    ////////////////////////////////////////
    // DISPLAY
    ////////////////////////////////////////

    challengeText.innerHTML =
    challenge.text;



    if(challengeCategory){

        challengeCategory.innerHTML =
        "Category: " + challenge.category;

    }



    if(challengeDifficulty){

        challengeDifficulty.innerHTML =
        "Difficulty: " + challenge.difficulty;

    }



    if(challengeReward){

        challengeReward.innerHTML =
        "Reward: +" + challenge.reward + " SPARK Points";

    }

});
