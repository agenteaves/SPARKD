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

                await new Promise(r=>setTimeout(r,100));

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
                "Content Guard failed:",
                error
            );


            this.model = null;


        }



        this.loading = false;


        return this.model;


    },





    ////////////////////////////////////////////////////
    // CHECK UPLOADED IMAGE
    ////////////////////////////////////////////////////

    async check(file){



        ////////////////////////////////////////////////////
        // BASIC FILE CHECK
        ////////////////////////////////////////////////////


        const blockedExtensions = [

            ".exe",
            ".js",
            ".html",
            ".svg"

        ];



        const filename =
        file.name.toLowerCase();



        for(let ext of blockedExtensions){


            if(filename.endsWith(ext)){


                this.reject(
                    "File type not allowed."
                );


                return false;

            }


        }





        ////////////////////////////////////////////////////
        // LOAD MODEL
        ////////////////////////////////////////////////////


        const model =
        await this.loadModel();



        if(!model){


            console.warn(
                "Content model unavailable. Allowing image."
            );


            return true;

        }





        ////////////////////////////////////////////////////
        // CREATE IMAGE ELEMENT
        ////////////////////////////////////////////////////


        const image =
        await this.fileToImage(file);





        ////////////////////////////////////////////////////
        // AI PREDICTION
        ////////////////////////////////////////////////////


        const predictions =
        await model.classify(image);



        console.log(
            "🛡️ Content Scan:",
            predictions
        );






        ////////////////////////////////////////////////////
        // BLOCK RULES
        ////////////////////////////////////////////////////


        const blocked = [

            "Porn",
            "Hentai",
            "Sexy"

        ];




        for(let result of predictions){



            if(
                blocked.includes(result.className)
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



    },






    ////////////////////////////////////////////////////
    // FILE TO IMAGE
    ////////////////////////////////////////////////////

    fileToImage(file){


        return new Promise(function(resolve){



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



                img.src =
                e.target.result;


            };



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

