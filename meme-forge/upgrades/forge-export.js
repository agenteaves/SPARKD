////////////////////////////////////////////////////
// SPARKD FORGE EXPORT v0.2
// Hidden Origin Payload Generator
////////////////////////////////////////////////////


window.SPARKD_EXPORT = {


    attachForgeData:function(canvas, forgeRecord){


        const payload = {


            SPARKD:
            "Meme Forge",


            VERSION:
            forgeRecord.version,


            ID:
            forgeRecord.memeID,


            DNA:
            forgeRecord.DNA,


            IMAGE:
            forgeRecord.imageFingerprint,


            CREATED:
            forgeRecord.created,


            CONTRACT:
            forgeRecord.contract


        };


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
