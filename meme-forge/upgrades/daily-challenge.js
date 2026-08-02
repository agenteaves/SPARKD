////////////////////////////////////////////////////
// SPARKD MEME FORGE
// DAILY CHALLENGE SYSTEM
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const challenges = window.sparkdChallenges;


    if(!challengeText){
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



    challengeText.innerHTML = challenge;



});
