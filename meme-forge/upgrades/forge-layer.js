////////////////////////////////////////////////////
// SPARKD FORGE LAYER v0.3
// Meme Identity + Creator Identity System
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
    // CREATE IMAGE FINGERPRINT
    ////////////////////////////////////////////////////

    createImageFingerprint:function(canvas){


        try{


            const data =
            canvas.toDataURL("image/png");


            let hash = 0;


            for(let i=0;i<data.length;i++){


                hash =
                ((hash<<5)-hash)
                +data.charCodeAt(i);


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


            return "IMG-UNKNOWN";


        }


    },



    ////////////////////////////////////////////////////
    // CREATE FULL FORGE RECORD
    ////////////////////////////////////////////////////

    createRecord:function(canvas){


        return {


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
            this.createCreatorID(),


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


            contract:
            this.contract


        };


    }


};
