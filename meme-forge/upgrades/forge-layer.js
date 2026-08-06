////////////////////////////////////////////////////
// SPARKD FORGE LAYER v0.4
// Meme Identity + Creator Identity + Signature System
////////////////////////////////////////////////////


window.SPARKD_FORGE = {


    version:"1.1",


    contract:
    "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump",



    createID:function(){

        const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


        let id="SPK-";


        for(let i=0;i<12;i++){

            id += chars.charAt(
                Math.floor(
                    Math.random()*chars.length
                )
            );

        }


        return id;

    },





    createCreatorID:function(){

        const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


        let id="CREATOR-";


        for(let i=0;i<8;i++){

            id += chars.charAt(
                Math.floor(
                    Math.random()*chars.length
                )
            );

        }


        return id;

    },





    createDNA:function(){

        const time =
        Date.now().toString();


        let hash = 0;


        for(let i=0;i<time.length;i++){

            hash =
            ((hash<<5)-hash)
            +time.charCodeAt(i);


            hash =
            hash & hash;

        }


        return (
            "DNA-" +
            Math.abs(hash)
            .toString(16)
            .toUpperCase()
        );

    },





    ////////////////////////////////////////////////////
    // CREATE SIGNATURE
    ////////////////////////////////////////////////////

    createSignature:function(data){


        const text =
        JSON.stringify(data);


        let hash = 0;


        for(
            let i=0;
            i<text.length;
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


    },





    ////////////////////////////////////////////////////
// CREATE IMAGE FINGERPRINT (PIXEL BASED)
// Ignores PNG metadata
////////////////////////////////////////////////////

createImageFingerprint:function(canvas){


    try{


        const ctx =
        canvas.getContext("2d");


        const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


        const data =
        imageData.data;


        let hash = 0;



        for(
            let i = 0;
            i < data.length;
            i++
        ){


            hash =
            ((hash << 5) - hash)
            + data[i];


            hash =
            hash & hash;


        }



        return (

            "IMG-" +
            Math.abs(hash)
            .toString(16)
            .toUpperCase()

        );


    }

    catch(error){


        console.log(
            "❌ Image fingerprint failed",
            error
        );


        return "IMG-UNKNOWN";


    }


},





    ////////////////////////////////////////////////////
    // CREATE FULL FORGE RECORD
    ////////////////////////////////////////////////////

    createRecord:function(canvas){


        let creatorID =
        localStorage.getItem("sparkdCreatorID");


        if(!creatorID){


            creatorID =
            this.createCreatorID();


            localStorage.setItem(
                "sparkdCreatorID",
                creatorID
            );


        }



        let record = {


            forge:
            "SPARKD Meme Forge",


            version:
            this.version,


            created:
            new Date()
            .toISOString(),



            ////////////////////////////////////////////////////
            // CREATOR IDENTITY LAYER
            ////////////////////////////////////////////////////

            creatorID:
            creatorID,


            wallet:
            "NOT_CONNECTED",


            reputation:
            100,



            memeID:
            this.createID(),


            DNA:
            this.createDNA(),


            imageFingerprint:
            this.createImageFingerprint(canvas),

            imageLock:
            this.createImageFingerprint(canvas),

            contract:
            this.contract


        };



        ////////////////////////////////////////////////////
        // ANTI-TAMPER SIGNATURE
        ////////////////////////////////////////////////////

        record.signature =
        this.createSignature(record);



        return record;


    }


};
