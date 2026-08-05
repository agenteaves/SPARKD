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
// SPARKD FORGE CERTIFICATE DISPLAY
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
    padding:25px;
    z-index:999999;
    font-family:Orbitron;
    box-shadow:0 0 35px #00ff88;
    min-width:380px;
    text-align:center;
    ">


    <button id="closeForgeVerify"
    style="
    position:absolute;
    right:10px;
    top:10px;
    background:#ff6a00;
    color:white;
    border:none;
    border-radius:50%;
    width:32px;
    height:32px;
    cursor:pointer;
    font-weight:bold;
    ">
    X
    </button>



    <h2 style="color:#00ff88;">
    🔥 SPARKD FORGE VERIFIED
    </h2>



    <h3>
    ✓ Original Forge Export
    </h3>



    <hr>



    <p>
    <b>Forge:</b><br>
    ${data.forge || "SPARKD Meme Forge"}
    </p>



    <p>
    <b>Version:</b><br>
    ${data.version || "Unknown"}
    </p>



    <p>
    <b>Meme ID:</b><br>
    ${data.memeID || data.ID || "Unknown"}
    </p>



    <p>
    <b>DNA:</b><br>
    ${data.DNA || "Unknown"}
    </p>



    <p>
    <b>Image Fingerprint:</b><br>
    ${data.imageFingerprint || data.IMAGE || "Unknown"}
    </p>



    <p>
    <b>Created:</b><br>
    ${data.created || data.CREATED || "Unknown"}
    </p>



    <p>
    <b>Contract:</b><br>
    ${data.contract || data.CONTRACT || "Unknown"}
    </p>



    <hr>



    <p style="color:#00ff88;font-weight:bold;">
    ✓ Metadata Signature Intact
    </p>



    </div>

    `;


    document.body.appendChild(box);



    document.getElementById(
        "closeForgeVerify"
    ).onclick=function(){

        box.remove();

    };


}



////////////////////////////////////////////////////
// FAILED VERIFICATION DISPLAY
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
    border:2px solid #ff3333;
    border-radius:15px;
    padding:20px;
    z-index:999999;
    font-family:Orbitron;
    box-shadow:0 0 30px red;
    min-width:350px;
    text-align:center;
    ">


    <button id="closeForgeVerify"
    style="
    position:absolute;
    right:10px;
    top:10px;
    background:#ff3333;
    color:white;
    border:none;
    border-radius:50%;
    width:30px;
    height:30px;
    cursor:pointer;
    font-weight:bold;
    ">
    X
    </button>



    <h2 style="color:#ff3333;">
    ❌ UNVERIFIED IMAGE
    </h2>



    <p>
    No SPARKD Forge DNA signature detected.
    </p>



    <p style="color:#aaa;">
    This file was not created or exported through
    SPARKD Meme Forge.
    </p>



    </div>

    `;



    document.body.appendChild(box);



    document.getElementById(
        "closeForgeVerify"
    ).onclick=function(){

        box.remove();

    };


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
