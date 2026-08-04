////////////////////////////////////////////////////
// SPARKD FORGE LAYER v0.1
// Hidden Origin Identity System
////////////////////////////////////////////////////


window.SPARKD_FORGE = {


    version:"1.1",


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



    createRecord:function(){


        return {


            forge:
            "SPARKD Meme Forge",


            version:
            this.version,


            created:
            new Date()
            .toISOString(),


            memeID:
            this.createID(),


            DNA:
            this.createDNA(),


            contract:
            "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"


        };


    }


};
