////////////////////////////////////////////////////
// SPARKD FORGE SCANNER v1.1
// Reads SPARKD PNG Forge DNA
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



        if(text.includes(marker)){


            console.log(
                "🔥 SPARKD FORGE VERIFIED"
            );



            const start =
            text.indexOf(marker);



            const raw =
            text.substring(
                start,
                start + 1000
            );



            console.log(
                "RAW FORGE DATA:",
                raw
            );



            // Look for JSON payload

            const jsonStart =
            raw.indexOf("{");



            const jsonEnd =
            raw.indexOf("}");



            if(
                jsonStart !== -1 &&
                jsonEnd !== -1
            ){


                const jsonText =
                raw.substring(
                    jsonStart,
                    jsonEnd + 1
                );



                try{


                    const data =
                    JSON.parse(jsonText);



                    console.log(
                        "🔥 FORGE DNA RECORD:",
                        data
                    );



                    alert(
`🔥 SPARKD FORGE VERIFIED

Forge:
${data.forge}

Version:
${data.version}

Meme ID:
${data.memeID}

DNA:
${data.DNA}

Image:
${data.imageFingerprint}

Created:
${data.created}`
                    );


                }
                catch(err){


                    console.log(
                        "Forge JSON found but could not decode"
                    );


                }


            }


        }
        else{


            console.log(
                "❌ No SPARKD Forge DNA found"
            );


        }


    };



    reader.readAsArrayBuffer(file);


}


};
