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
