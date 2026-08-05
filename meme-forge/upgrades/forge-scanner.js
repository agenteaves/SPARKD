////////////////////////////////////////////////////
// SPARKD FORGE SCANNER v2.0
// PNG DNA Verification System
////////////////////////////////////////////////////


window.SPARKD_SCANNER = {


scan:function(file){


    const reader = new FileReader();


    reader.onload = function(e){


        const bytes =
        new Uint8Array(e.target.result);


        const text =
        new TextDecoder().decode(bytes);



        const marker = "SPARKD-FORGE";


        if(text.includes(marker)){


            console.log(
                "🔥 SPARKD FORGE DETECTED"
            );


            const start =
            text.indexOf(marker);



            const raw =
            text.substring(
                start,
                start + 1000
            );



            console.log(raw);



            // Try to find embedded JSON payload

            const jsonStart =
            raw.indexOf("{");


            const jsonEnd =
            raw.indexOf("}");



            if(
                jsonStart !== -1 &&
                jsonEnd !== -1
            ){


                try{


                    const json =
                    raw.substring(
                        jsonStart,
                        jsonEnd + 1
                    );


                    const data =
                    JSON.parse(json);



                    console.log(
                        "🔥 SPARKD DNA:",
                        data
                    );



                    showForgeVerification(data);



                }
                catch(err){


                    console.log(
                        "Forge data found but JSON decode failed"
                    );


                }


            }



        }


        else{


            console.log(
                "❌ No SPARKD Forge DNA found"
            );


            showForgeFailed();


        }



    };



    reader.readAsArrayBuffer(file);



}


};



////////////////////////////////////////////////////
// VERIFICATION DISPLAY
////////////////////////////////////////////////////


function showForgeVerification(data){


    removeForgeNotice();



    const box =
    document.createElement("div");


    box.id =
    "forgeVerificationBox";



    box.innerHTML = `

    <div style="
    position:fixed;
    top:20px;
    left:50%;
    transform:translateX(-50%);
    background:#111;
    color:white;
    border:2px solid #00ff88;
    border-radius:15px;
    padding:20px;
    z-index:999999;
    font-family:Orbitron;
    box-shadow:0 0 30px #00ff88;
    min-width:320px;
    text-align:center;
    ">


    <h2 style="color:#00ff88;">
    🔥 SPARKD FORGE VERIFIED
    </h2>


    <p>
    ✓ Authentic SPARKD Meme
    </p>


    <p>
    Forge:
    <b>${data.forge || "SPARKD Meme Forge"}</b>
    </p>


    <p>
    Version:
    <b>${data.version || "Unknown"}</b>
    </p>


    <p>
    Meme ID:
    <b>${data.memeID || data.ID || "Unknown"}</b>
    </p>


    <p>
    DNA:
    <b>${data.DNA || "Unknown"}</b>
    </p>


    <p>
    Image:
    <b>${data.imageFingerprint || data.IMAGE || "Unknown"}</b>
    </p>


    </div>

    `;



    document.body.appendChild(box);



}



////////////////////////////////////////////////////
// FAILED MESSAGE
////////////////////////////////////////////////////


function showForgeFailed(){


    removeForgeNotice();



    const box =
    document.createElement("div");


    box.id =
    "forgeVerificationBox";



    box.innerHTML = `

    <div style="
    position:fixed;
    top:20px;
    left:50%;
    transform:translateX(-50%);
    background:#111;
    color:white;
    border:2px solid red;
    border-radius:15px;
    padding:20px;
    z-index:999999;
    font-family:Orbitron;
    box-shadow:0 0 30px red;
    ">


    ❌ NO SPARKD FORGE DNA FOUND


    </div>

    `;



    document.body.appendChild(box);


}



////////////////////////////////////////////////////
// REMOVE OLD MESSAGE
////////////////////////////////////////////////////


function removeForgeNotice(){


    const old =
    document.getElementById(
        "forgeVerificationBox"
    );


    if(old){

        old.remove();

    }


}



////////////////////////////////////////////////////
// DEV PANEL BUTTON
////////////////////////////////////////////////////


window.addEventListener(
"load",
function(){


    const btn =
    document.getElementById(
        "scanForgeBtn"
    );


    if(!btn) return;



    btn.onclick=function(){


        const picker =
        document.createElement("input");



        picker.type="file";

        picker.accept=".png,image/png";



        picker.onchange=function(e){


            const file =
            e.target.files[0];



            if(file){

                SPARKD_SCANNER.scan(file);

            }


        };



        picker.click();



    };


});
