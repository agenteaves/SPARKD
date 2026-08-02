////////////////////////////////////////////////////
// SPARKD MEME FORGE
// DAILY CHALLENGE SYSTEM
////////////////////////////////////////////////////


window.addEventListener("load", function(){


    const challenges = window.sparkdChallenges;


    if(!challengeText){
        return;
    }



    const challenges = [

        "🚀 Create a meme about SPARKD going to the moon",

        "💎 Create the ultimate diamond hands meme",

        "🔥 Make a meme that shows SPARKD energy",

        "😂 Create the funniest SPARKD community meme",

        "🌙 Make a meme about reaching the moon",

        "⚡ Create a high-energy SPARKD meme",

        "👑 Create a meme worthy of a SPARKD Legend"

    ];



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
