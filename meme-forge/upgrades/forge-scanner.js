////////////////////////////////////////////////////
// SPARKD FORGE SCANNER v1.1
// DNA Detection + Signature Verification
////////////////////////////////////////////////////


window.SPARKD_SCANNER = {


    scan:function(file){


        const reader =
        new FileReader();



        reader.onload =
        function(e){


            const bytes =
            new Uint8Array(
                e.target.result
            );


            const text =
            new TextDecoder()
            .decode(bytes);



            const marker =
            "SPARKD-FORGE";



            if(!text.includes(marker)){


                console.log(
                    "❌ No SPARKD Forge DNA found"
                );


                showForgeResult(
                    false,
                    "❌ UNVERIFIED IMAGE\n\nNo SPARKD Forge DNA signature detected."
                );


                return;


            }




            const start =
            text.indexOf(marker)
            + marker.length
            + 1;



            const end =
            text.indexOf(
                "\0",
                start
            );



            ////////////////////////////////////////////////////
// EXTRACT JSON PAYLOAD FROM PNG TEXT CHUNK
////////////////////////////////////////////////////

const jsonStart =
text.indexOf(
    "{",
    start
);


const jsonEnd =
text.indexOf(
    "}",
    jsonStart
);


if(
    jsonStart === -1 ||
    jsonEnd === -1
){

    console.log(
        "❌ Forge JSON not found"
    );


    showForgeResult(
        false,
        "❌ FORGE DATA CORRUPTED"
    );


    return;

}



let jsonText =
text.substring(
    jsonStart,
    jsonEnd + 1
);



let forgeData;


try{


    forgeData =
    JSON.parse(
        jsonText
    );


}
catch(error){


    console.log(
        "❌ JSON parse failed",
        jsonText
    );


    showForgeResult(
        false,
        "❌ FORGE DATA CORRUPTED"
    );


    return;


}



            console.log(
                "🔥 SPARKD FORGE DATA:",
                forgeData
            );





            ////////////////////////////////////////////////////
            // VERIFY SIGNATURE
            ////////////////////////////////////////////////////


            const originalSignature =
            forgeData.signature;



            delete forgeData.signature;



            const calculatedSignature =
            createVerificationSignature(
                forgeData
            );



            if(
                originalSignature &&
                originalSignature === calculatedSignature
            ){


                console.log(
                    "🔥 SIGNATURE VERIFIED"
                );


                showForgeResult(
                    true,
                    `
🔥 SPARKD FORGE VERIFIED

Creator:
${forgeData.creatorID}

Meme ID:
${forgeData.memeID}

DNA:
${forgeData.DNA}

Signature:
${originalSignature}

Integrity:
PASS
                    `
                );


            }
            else{


                console.log(
                    "⚠️ SIGNATURE FAILED"
                );


                showForgeResult(
                    false,
                    `
⚠️ SPARKD FORGE ALTERED

DNA Found

Signature mismatch.

Image or metadata may have been modified.
                    `
                );


            }



        };



        reader.readAsArrayBuffer(
            file
        );


    }


};





////////////////////////////////////////////////////
// STABLE SIGNATURE VERIFICATION
////////////////////////////////////////////////////

function createVerificationSignature(data){


    const sorted = {};


    Object.keys(data)
    .sort()
    .forEach(function(key){


        sorted[key] =
        data[key];


    });



    const text =
    JSON.stringify(sorted);



    let hash = 0;



    for(
        let i = 0;
        i < text.length;
        i++
    ){


        hash =
        ((hash<<5)-hash)
        +text.charCodeAt(i);



        hash =
        hash & hash;


    }



    return (

        "SIG-" +
        Math.abs(hash)
        .toString(16)
        .toUpperCase()

    );


}




////////////////////////////////////////////////////
// RESULT DISPLAY
////////////////////////////////////////////////////


function showForgeResult(
    success,
    message
){


    let box =
    document.getElementById(
        "sparkdForgeResult"
    );



    if(box){

        box.remove();

    }



    box =
    document.createElement(
        "div"
    );


    box.id =
    "sparkdForgeResult";



    box.style.position =
    "fixed";


    box.style.top =
    "20px";


    box.style.left =
    "50%";


    box.style.transform =
    "translateX(-50%)";


    box.style.background =
    success
    ? "#0b6623"
    : "#8b0000";


    box.style.color =
    "white";


    box.style.padding =
    "20px";


    box.style.borderRadius =
    "10px";


    box.style.zIndex =
    "99999";


    box.style.whiteSpace =
    "pre-line";



    box.innerHTML =
    message +
    `<br><br>
    <button onclick="this.parentElement.remove()">
    ✖ Close
    </button>`;



    document.body.appendChild(
        box
    );


}
