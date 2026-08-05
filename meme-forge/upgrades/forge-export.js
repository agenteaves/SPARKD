////////////////////////////////////////////////////
// SPARKD FORGE EXPORT v0.2
// Hidden Origin Payload Generator
////////////////////////////////////////////////////


window.SPARKD_EXPORT = {


    attachForgeData:function(canvas, forgeRecord){


       const payload = {

    forge: forgeRecord.forge,
    version: forgeRecord.version,
    memeID: forgeRecord.memeID,
    DNA: forgeRecord.DNA,
    imageFingerprint: forgeRecord.imageFingerprint,
    created: forgeRecord.created,
    contract: forgeRecord.contract,
    signature: forgeRecord.signature

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
