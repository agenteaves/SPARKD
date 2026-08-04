////////////////////////////////////////////////////
// SPARKD PNG FORGE WRITER v0.2
// Hidden Metadata Injection Prototype
////////////////////////////////////////////////////


window.SPARKD_PNG = {


    attach:function(canvas, forgeRecord){


        console.log(
            "🔥 SPARKD PNG Forge injecting identity"
        );


        const forgeData = {


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


        const metadata =
        JSON.stringify(forgeData);



        console.log(
            "🔥 SPARKD PNG Metadata:",
            forgeData
        );



        /*
            Prototype stage:

            Create PNG normally.

            Next stage will insert
            custom PNG chunk data.
        */


        const png =
        canvas.toDataURL(
            "image/png"
        );


        return png;


    }


};
