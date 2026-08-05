////////////////////////////////////////////////////
// SPARKD FORGE SCANNER v1.0
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

                console.log("🔥 SPARKD FORGE DETECTED");

                const start =
                text.indexOf(marker);

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


window.addEventListener("load",function(){

    const btn =
    document.getElementById("scanForgeBtn");

    if(!btn) return;

    btn.onclick=function(){

        const picker =
        document.createElement("input");

        picker.type = "file";
        picker.accept = ".png,image/png";

        picker.onchange = function(e){

            const file =
            e.target.files[0];

            if(file){

                SPARKD_SCANNER.scan(file);

            }

        };

        picker.click();

    };

});
