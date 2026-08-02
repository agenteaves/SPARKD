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



    // =================================
    // GET CREATOR LEVEL
    // =================================


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



    // =================================
    // FILTER CHALLENGES
    // =================================


    const availableChallenges =
    challenges.filter(function(challenge){


        return challenge.difficulty.length <= maxDifficulty;


    });



    if(availableChallenges.length === 0){

        return;

    }



    // =================================
    // DAILY CHALLENGE SELECTION
    // =================================


    const today = new Date();


    const dayNumber =
        today.getFullYear() +
        today.getMonth() +
        today.getDate();



    const challenge =
    availableChallenges[dayNumber % availableChallenges.length];




    // =================================
    // DISPLAY CHALLENGE
    // =================================


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
