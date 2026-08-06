////////////////////////////////////////////////////
// SPARKD FORGE EXPORT v0.3
// Hidden Origin Payload Generator + Stable Signature
////////////////////////////////////////////////////


window.SPARKD_EXPORT = {


    attachForgeData:function(canvas, forgeRecord){



        const payload = {


            forge:
            forgeRecord.forge,


            version:
            forgeRecord.version,


            memeID:
            forgeRecord.memeID,


            DNA:
            forgeRecord.DNA,


            imageFingerprint:
            forgeRecord.imageFingerprint,


            created:
            forgeRecord.created,


            contract:
            forgeRecord.contract,


            creatorID:
            forgeRecord.creatorID,


            wallet:
            forgeRecord.wallet,


            reputation:
            forgeRecord.reputation



        };



        // CREATE SIGNATURE AFTER DATA IS READY

        payload.signature =
        createForgeSignature(payload);
        
        
        forgeRecord.signature =
        payload.signature;




        const encoded =
        btoa(
            JSON.stringify(payload)
        );



        console.log(
            "🔥 SPARKD Hidden Payload:",
            encoded
        );



        return encoded;


    }


};





////////////////////////////////////////////////////
// SPARKD STABLE SIGNATURE CREATOR
////////////////////////////////////////////////////


function createForgeSignature(data){



    const copy = {};



    Object.keys(data)
    .sort()
    .forEach(function(key){


        if(
            key !== "signature"
        ){


            copy[key] =
            data[key];


        }


    });



    const text =
    JSON.stringify(copy);



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
