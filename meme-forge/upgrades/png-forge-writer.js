////////////////////////////////////////////////////
// SPARKD PNG FORGE WRITER v0.4
// PNG Metadata Chunk Injector + Signature Support
////////////////////////////////////////////////////


window.SPARKD_PNG = {


    attach:function(canvas, forgeRecord){


        console.log(
            "🔥 SPARKD PNG Forge embedding DNA"
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
            forgeRecord.contract,


            // NEW: Forge Signature

            signature:
            forgeRecord.signature


        };



        const metadata =
        JSON.stringify(forgeData);



        console.log(
            "🔥 Forge DNA Payload:",
            metadata
        );



        const dataURL =
        canvas.toDataURL(
            "image/png"
        );



        const base64 =
        dataURL.split(",")[1];



        const binary =
        atob(base64);



        const bytes =
        new Uint8Array(
            binary.length
        );



        for(
            let i = 0;
            i < binary.length;
            i++
        ){

            bytes[i] =
            binary.charCodeAt(i);

        }



        const modifiedPNG =
        injectPNGTextChunk(
            bytes,
            "SPARKD-FORGE",
            metadata
        );



        const blob =
        new Blob(
            [
                modifiedPNG
            ],
            {
                type:"image/png"
            }
        );



        return URL.createObjectURL(
            blob
        );


    }


};
