////////////////////////////////////////////////////
// SPARKD PNG FORGE WRITER v0.1
// Metadata Container Prototype
////////////////////////////////////////////////////


window.SPARKD_PNG = {


    attach:function(canvas, forgeRecord){


        console.log(
            "🔥 SPARKD PNG Forge preparing file"
        );


        const payload = {


            forge:
            "SPARKD Meme Forge",


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
            forgeRecord.contract


        };


        console.log(
            "🔥 PNG Metadata Payload:",
            payload
        );


        /*
            Temporary version:

            Returns normal PNG.

            Next version will inject
            this payload into PNG chunks.
        */


        return canvas.toDataURL(
            "image/png"
        );


    }


};
