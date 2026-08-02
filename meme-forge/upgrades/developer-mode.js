////////////////////////////////////////////////////
// SPARKD MEME FORGE
// SECRET DEVELOPER MODE
////////////////////////////////////////////////////

window.addEventListener("load", function () {

    const logo = document.getElementById("sparkdLogo");

    if (!logo) return;

    let clicks = 0;
    let timer = null;

    logo.style.cursor = "pointer";

    logo.addEventListener("click", function () {

        clicks++;

        clearTimeout(timer);

        timer = setTimeout(function () {

            clicks = 0;

        }, 2000);

        if (clicks >= 5) {

            clicks = 0;

            openDeveloperPanel();

        }

    });

});


function openDeveloperPanel() {

    alert("🛠 SPARKD Developer Mode Activated!");

}
