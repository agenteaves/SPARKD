////////////////////////////////////////////////////
// SPARKD MEME FORGE
// SECRET DEVELOPER MODE
////////////////////////////////////////////////////

window.addEventListener("load", function () {

    // CHANGE THIS IF YOUR LOGO HAS A DIFFERENT ID
    const logo = document.getElementById("logo");

    if (!logo) return;

    let clicks = 0;
    let timer = null;

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

    alert("🛠 Developer Mode Activated!");

}
