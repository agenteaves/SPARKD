// SPARKD Website Scripts

console.log("SPARKD website loaded 🚀");


// Copy contract address

function copyContract(){

    const contract =
    document.getElementById("contract").innerText;


    navigator.clipboard.writeText(contract)
    .then(()=>{

        const button =
        event.target;

        button.innerText = "Copied!";

        setTimeout(()=>{

            button.innerText="Copy";

        },2000);


    })
    .catch(()=>{

        alert("Copy failed. Please copy manually.");

    });

}





// Scroll reveal animation

const sections =
document.querySelectorAll(".section, .card, .road-card, .faq-item");


const observer =
new IntersectionObserver((entries)=>{


entries.forEach(entry=>{


if(entry.isIntersecting){

entry.target.style.opacity="1";

entry.target.style.transform="translateY(0)";


}


});


},{

threshold:0.15

});





sections.forEach(section=>{


section.style.opacity="0";

section.style.transform="translateY(40px)";

section.style.transition="all .8s ease";


observer.observe(section);


});






// Add floating particles

function createParticle(){


const particle =
document.createElement("div");


particle.className="particle";


particle.style.left =
Math.random()*100+"vw";


particle.style.animationDuration =
(5 + Math.random()*10)+"s";


document.body.appendChild(particle);



setTimeout(()=>{

particle.remove();

},15000);


}


setInterval(createParticle,700);
