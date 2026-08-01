// Proof of Deeds System
// SPARKD Version 2.0
// Connected to live backend


fetch("http://localhost:3000/api/deeds")

.then(response => response.json())

.then(data => {


    let deeds = data;


    let verifiedCount = 0;
    let meals = 0;
    let hours = 0;


    const deedList = document.getElementById("deed-list");



    deedList.innerHTML = "";



    deeds.forEach(deed => {


        if (deed.status === "Verified") {


            verifiedCount++;



            let card = document.createElement("div");


            card.className = "card";



            card.innerHTML = `

            <h3>
            Deed #${deed.id}
            </h3>


            <p>
            <strong>Category:</strong>
            ${deed.category}
            </p>


            <p>
            <strong>Description:</strong>
            ${deed.description}
            </p>


            <p>
            <strong>Status:</strong>
            ✓ Verified
            </p>


            <p>
            <a href="history.html?id=${deed.id}">
            View Verification History
            </a>
            </p>


            `;



            deedList.appendChild(card);



        }


    });



    document.getElementById("verified-count").innerText =
        verifiedCount;


    document.getElementById("meal-count").innerText =
        meals;


    document.getElementById("hours-count").innerText =
        hours;



})


.catch(error => {


    console.error(

        "Proof of Deeds live data error:",

        error

    );


});
