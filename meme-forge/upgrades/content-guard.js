////////////////////////////////////////////////////
// SPARKD MEME FORGE
// CONTENT GUARD v1.0
// Client Side Image Safety Filter
////////////////////////////////////////////////////

window.SPARKD_GUARD = {


    model:null,

    loading:false,


////////////////////////////////////////////////////
// LOAD AI MODEL
////////////////////////////////////////////////////

async loadModel(){


    if(this.model){

        return this.model;

    }


    if(this.loading){

        while(this.loading){

            await new Promise(
                r=>setTimeout(r,100)
            );

        }

        return this.model;

    }



    this.loading = true;


    console.log(
        "🛡️ SPARKD Content Guard loading..."
    );



    try{


        this.model =
        await nsfwjs.load();



        console.log(
            "🛡️ Content Guard ready"
        );


    }
    catch(error){


        console.error(
            "🛡️ Content Guard failed:",
            error
        );


        this.model = null;


    }



    this.loading = false;


    return this.model;


},




////////////////////////////////////////////////////
// CHECK IMAGE
////////////////////////////////////////////////////

async check(file){



    if(!file){

        return false;

    }




    const filename =
    file.name.toLowerCase();



    const blockedExtensions = [

        ".exe",
        ".js",
        ".html",
        ".svg"

    ];



    for(
        let ext of blockedExtensions
    ){

        if(filename.endsWith(ext)){


            this.reject(
                "File type not allowed."
            );


            return false;

        }

    }




    const model =
    await this.loadModel();



    if(!model){


        console.warn(
            "🛡️ Scanner unavailable. Allowing upload."
        );


        return true;


    }




    try{


        const image =
        await this.fileToImage(file);



        const predictions =
        await model.classify(image);



        console.log(
            "🛡️ Content Scan:",
            predictions
        );



        for(
            let result of predictions
        ){


            if(

                (
                result.className === "Porn" ||
                result.className === "Hentai" ||
                result.className === "Sexy"
                )

                &&

                result.probability > 0.60

            ){


                this.reject(
                    "This image contains restricted content."
                );


                return false;


            }


        }



        console.log(
            "✅ Content approved"
        );


        return true;


    }
    catch(error){


        console.error(
            "🛡️ Scan error:",
            error
        );


        // fail open during testing
        return true;


    }


},





////////////////////////////////////////////////////
// FILE TO IMAGE
////////////////////////////////////////////////////

fileToImage(file){


    return new Promise(function(resolve,reject){


        const reader =
        new FileReader();



        reader.onload =
        function(e){


            const img =
            new Image();



            img.onload =
            function(){

                resolve(img);

            };


            img.onerror =
            reject;



            img.src =
            e.target.result;


        };



        reader.onerror =
        reject;



        reader.readAsDataURL(file);



    });


},





////////////////////////////////////////////////////
// BLOCK MESSAGE
////////////////////////////////////////////////////

reject(message){


    console.log(
        "🚫 SPARKD BLOCKED:",
        message
    );



    alert(

        "🚫 SPARKD Content Guard\n\n" +
        message

    );


}


};
