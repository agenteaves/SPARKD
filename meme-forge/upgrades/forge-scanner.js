////////////////////////////////////////////////////
// SPARKD FORGE SCANNER v0.1
// Reads PNG Forge DNA
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



        if(text.includes("SPARKD-FORGE")){


            console.log(
                "🔥 SPARKD FORGE DETECTED"
            );


            const start =
            text.indexOf("SPARKD-FORGE");


            console.log(
                text.substring(
                    start,
                    start + 500
                )
            );


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
