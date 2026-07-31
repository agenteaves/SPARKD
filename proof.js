// Proof of Deeds System
// SPARKD Version 1.0


fetch("proof-data.json")

.then(response => response.json())

.then(data => {


    let deeds = data.deeds;


    let verifiedCount = 0;
    let meals = 0;
    let hours = 0;


    const deedList = document.getElementById("deed-list");



    if (deeds.length > 0) {


        deedList.innerHTML = "";


        deeds.forEach(deed => {


            if (deed.status === "Verified") {


                verifiedCount++;


                if (deed.type === "Meals") {

                    meals += deed.amount;

                }


                if (deed.type === "Volunteer") {

                    hours += deed.amount;

                }



                let card = document.createElement("div");


                card.className = "card";


                card.innerHTML = `

                <h3>
                ${deed.id}
                </h3>

                <p>
                <strong>Action:</strong>
                ${deed.description}
                </p>

                <p>
                <strong>Status:</strong>
                ✓ Verified
                </p>

                <p>
                <strong>Identity:</strong>
                ${deed.identity}
                </p>

                `;


                deedList.appendChild(card);


            }


        });


    }



    document.getElementById("verified-count").innerText = verifiedCount;

    document.getElementById("meal-count").innerText = meals;

    document.getElementById("hours-count").innerText = hours;



})



.catch(error => {

    console.error(
        "Proof of Deeds data loading error:",
        error
    );

});
