////////////////////////////////////////////////////
// SPARKD FORGE SCANNER v2.0
// PNG Forge DNA Certificate Reader
////////////////////////////////////////////////////


window.SPARKD_SCANNER = {


    scan:function(file){


        const reader = new FileReader();


        reader.onload = function(e){


            const bytes =
            new Uint8Array(e.target.result);


            const text =
            new TextDecoder()
            .decode(bytes);



            const marker =
            "SPARKD-FORGE";



            ////////////////////////////////////////////////////
            // NO FORGE DNA FOUND
            ////////////////////////////////////////////////////

            if(!text.includes(marker)){


                console.log(
                    "❌ No SPARKD Forge DNA found"
                );


                showForgeResult(false);


                return;


            }




            ////////////////////////////////////////////////////
            // EXTRACT PAYLOAD
            ////////////////////////////////////////////////////

            console.log(
                "🔥 SPARKD FORGE DETECTED"
            );



            const start =
            text.indexOf(marker);



            const raw =
            text.substring(
                start + marker.length
            );



            let jsonStart =
            raw.indexOf("{");



            let jsonEnd =
            raw.indexOf("}");



            let payload = null;



            try{


                payload =
                JSON.parse(
                    raw.substring(
                        jsonStart,
                        jsonEnd + 1
                    )
                );


            }

            catch(error){


                console.log(
                    "Forge data parse failed",
                    error
                );


                showForgeResult(false);


                return;


            }





            ////////////////////////////////////////////////////
            // VERIFY FORGE CERTIFICATE
            ////////////////////////////////////////////////////


            if(
                payload.forge === "SPARKD Meme Forge" &&
                payload.signature
            ){


                console.log(
                    "🔥 SPARKD FORGE VERIFIED",
                    payload
                );



                showForgeResult(
                    true,
                    payload
                );


            }

            else{


                showForgeResult(false);


            }



        };



        reader.readAsArrayBuffer(file);


    }


};





////////////////////////////////////////////////////
// RESULT DISPLAY
////////////////////////////////////////////////////


function showForgeResult(
    verified,
    data
){



    const old =
    document.getElementById(
        "forgeCertificateBox"
    );


    if(old){

        old.remove();

    }




    const box =
    document.createElement("div");


    box.id =
    "forgeCertificateBox";



    box.style.position =
    "fixed";


    box.style.top =
    "20px";


    box.style.left =
    "50%";


    box.style.transform =
    "translateX(-50%)";



    box.style.zIndex =
    "99999";



    box.style.background =
    "#111";


    box.style.color =
    "white";


    box.style.padding =
    "20px";


    box.style.borderRadius =
    "12px";


    box.style.fontFamily =
    "Arial";



    box.style.boxShadow =
    "0 0 20px black";



    if(verified){



        box.innerHTML = `


        <h2>
        ✅ SPARKD FORGE VERIFIED
        </h2>


        <p>
        <b>Forge:</b>
        ${data.forge}
        </p>


        <p>
        <b>Version:</b>
        ${data.version}
        </p>


        <p>
        <b>Meme ID:</b>
        ${data.memeID}
        </p>


        <p>
        <b>DNA:</b>
        ${data.DNA}
        </p>


        <p>
        <b>Image:</b>
        ${data.imageFingerprint}
        </p>


        <p>
        <b>Signature:</b>
        ${data.signature}
        </p>


        <p>
        ✔ Authentic SPARKD Forge Export
        </p>


        <button id="closeForgeCertificate">
        Close
        </button>


        `;


    }

    else{



        box.innerHTML = `


        <h2>
        ❌ UNVERIFIED IMAGE
        </h2>


        <p>
        No SPARKD Forge DNA signature detected.
        </p>


        <p>
        This file was not created or exported through SPARKD Meme Forge.
        </p>


        <button id="closeForgeCertificate">
        Close
        </button>


        `;


    }




    document.body.appendChild(box);




    document.getElementById(
        "closeForgeCertificate"
    ).onclick =
    function(){


        box.remove();


    };



}
