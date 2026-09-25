////////////////////////////////////////////////////
// SPARKD PNG FORGE WRITER v0.4
// PNG Metadata Chunk Injector + Signature Support
////////////////////////////////////////////////////


window.SPARKD_PNG = {


    createBlob:function(canvas, forgeRecord){


        console.log(
            "🔥 SPARKD PNG Forge embedding DNA"
        );


        const forgeData = {


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
            
            imageLock:
            forgeRecord.imageLock,

            created:
            forgeRecord.created,


            contract:
            forgeRecord.contract,


            creatorID:
            forgeRecord.creatorID,


            wallet:
            forgeRecord.wallet,


            reputation:
            forgeRecord.reputation,


            signature:
            forgeRecord.signature,


        };


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

        // Lock the encoded PNG that the user actually receives. Reading the
        // pre-export canvas and decoding the PNG can yield different RGBA
        // values on Android even when the file has not been changed.
        forgeData.pngFingerprint = fingerprintPNGBytes(bytes);
        forgeData.pngSignature = fingerprintSignature(
            forgeData.memeID, forgeData.pngFingerprint
        );
        // The contest service signs the original fixed Forge fields.
        // Keep that signature compatible while adding a separate PNG lock.
        forgeRecord.pngFingerprint = forgeData.pngFingerprint;
        forgeRecord.pngSignature = forgeData.pngSignature;

        const metadata = JSON.stringify(forgeData);



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


        console.log(
            "🔥 FINAL PNG SIZE:",
            blob.size
        );


        return blob;


    },


    attach:function(canvas, forgeRecord){

        return URL.createObjectURL(
            this.createBlob(
                canvas,
                forgeRecord
            )
        );

    }


};

// Hash the complete PNG before the Forge tEXt chunk is inserted. The
// validator removes that one chunk and hashes the same byte sequence.
function fingerprintPNGBytes(bytes) {
    let first = 2166136261;
    let second = 0;

    for (let i = 0; i < bytes.length; i++) {
        first = Math.imul(first ^ bytes[i], 16777619) >>> 0;
        second = (Math.imul(second, 31) + bytes[i]) >>> 0;
    }

    return "PNG-" + bytes.length.toString(16).toUpperCase() + "-" +
        first.toString(16).toUpperCase().padStart(8, "0") + "-" +
        second.toString(16).toUpperCase().padStart(8, "0");
}

function fingerprintSignature(memeID, fingerprint) {
    const text = memeID + ":" + fingerprint;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return "SIG-" + Math.abs(hash).toString(16).toUpperCase();
}




////////////////////////////////////////////////////
// PNG TEXT CHUNK CREATOR
////////////////////////////////////////////////////


function injectPNGTextChunk(
    pngBytes,
    keyword,
    text
){


    console.log(
        "🔥 Injecting PNG chunk:",
        keyword
    );



    // PNG signature
    const signature =
    pngBytes.slice(
        0,
        8
    );



    // Put chunk before IEND
    let position =
    pngBytes.length - 12;



    const encoder =
    new TextEncoder();



    const chunkData =
    encoder.encode(
        keyword +
        "\0" +
        text
    );



    const chunk =
    createPNGChunk(
        "tEXt",
        chunkData
    );



    const output =
    new Uint8Array(
        pngBytes.length +
        chunk.length
    );



    output.set(
        pngBytes.slice(
            0,
            position
        ),
        0
    );


    output.set(
        chunk,
        position
    );


    output.set(
        pngBytes.slice(
            position
        ),
        position +
        chunk.length
    );



    return output;


}





////////////////////////////////////////////////////
// PNG CHUNK BUILDER
////////////////////////////////////////////////////


function createPNGChunk(
    type,
    data
){


    const encoder =
    new TextEncoder();


    const typeBytes =
    encoder.encode(
        type
    );



    const chunk =
    new Uint8Array(
        12 +
        data.length
    );



    const view =
    new DataView(
        chunk.buffer
    );



    view.setUint32(
        0,
        data.length
    );



    chunk.set(
        typeBytes,
        4
    );



    chunk.set(
        data,
        8
    );



    const crc =
    crc32(
        chunk.slice(
            4,
            8 + data.length
        )
    );



    view.setUint32(
        8 + data.length,
        crc
    );



    return chunk;


}




////////////////////////////////////////////////////
// CRC32 FOR PNG CHUNKS
////////////////////////////////////////////////////


function crc32(bytes){


    let table =
    [];



    for(
        let n=0;
        n<256;
        n++
    ){

        let c=n;


        for(
            let k=0;
            k<8;
            k++
        ){

            c =
            (
                c & 1
            )
            ?
            0xEDB88320 ^
            (c >>> 1)
            :
            c >>> 1;

        }


        table[n]=c;

    }



    let crc =
    0xffffffff;



    for(
        let i=0;
        i<bytes.length;
        i++
    ){

        crc =
        table[
            (crc ^ bytes[i]) & 0xff
        ]
        ^
        (crc >>> 8);

    }



    return (
        crc ^
        0xffffffff
    ) >>> 0;


}
