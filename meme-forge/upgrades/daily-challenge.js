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



    // Create a daily number based on date

    const today = new Date();


    const dayNumber =
        today.getFullYear() +
        today.getMonth() +
        today.getDate();



    const challenge =
        challenges[dayNumber % challenges.length];



    // Display challenge information

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
