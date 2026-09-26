////////////////////////////////////////////////////
// SPARKD PNG FORGE WRITER v0.5
// Final PNG metadata + deterministic integrity locks
////////////////////////////////////////////////////

window.SPARKD_PNG = {
    createBlob:function(canvas, forgeRecord){
        const forgeData = {
            forge: forgeRecord.forge,
            version: forgeRecord.version,
            memeID: forgeRecord.memeID,
            DNA: forgeRecord.DNA,
            imageFingerprint: forgeRecord.imageFingerprint,
            imageLock: forgeRecord.imageLock,
            created: forgeRecord.created,
            contract: forgeRecord.contract,
            creatorID: forgeRecord.creatorID,
            wallet: forgeRecord.wallet,
            reputation: forgeRecord.reputation
        };

        // The PNG writer is the final authority for the bytes that leave the
        // Forge. Recompute the DNA signature from the exact metadata being
        // embedded instead of copying a possibly stale signature from an
        // earlier export stage.
        forgeData.signature = createFinalForgeSignature(forgeData);
        forgeRecord.signature = forgeData.signature;

        const dataURL = canvas.toDataURL("image/png");
        const binary = atob(dataURL.split(",")[1]);
        const bytes = new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);

        // Lock the actual encoded PNG bytes before the Forge tEXt chunk is
        // inserted. The contest removes that chunk and hashes the same bytes.
        forgeData.pngFingerprint = fingerprintPNGBytes(bytes);
        forgeData.pngSignature = fingerprintSignature(forgeData.memeID, forgeData.pngFingerprint);
        forgeRecord.pngFingerprint = forgeData.pngFingerprint;
        forgeRecord.pngSignature = forgeData.pngSignature;

        const modifiedPNG = injectPNGTextChunk(bytes,"SPARKD-FORGE",JSON.stringify(forgeData));
        return new Blob([modifiedPNG],{type:"image/png"});
    },

    attach:function(canvas, forgeRecord){
        return URL.createObjectURL(this.createBlob(canvas,forgeRecord));
    }
};

function createFinalForgeSignature(data){
    const copy={};
    Object.keys(data).sort().forEach(function(key){
        if(key!=="signature" && key!=="pngFingerprint" && key!=="pngSignature") copy[key]=data[key];
    });
    const text=JSON.stringify(copy);
    let hash=0;
    for(let i=0;i<text.length;i++){
        hash=((hash<<5)-hash)+text.charCodeAt(i);
        hash=hash&hash;
    }
    return "SIG-"+Math.abs(hash).toString(16).toUpperCase();
}

function fingerprintPNGBytes(bytes){
    let first=2166136261;
    let second=0;
    for(let i=0;i<bytes.length;i++){
        first=Math.imul(first^bytes[i],16777619)>>>0;
        second=(Math.imul(second,31)+bytes[i])>>>0;
    }
    return "PNG-"+bytes.length.toString(16).toUpperCase()+"-"+
        first.toString(16).toUpperCase().padStart(8,"0")+"-"+
        second.toString(16).toUpperCase().padStart(8,"0");
}

function fingerprintSignature(memeID,fingerprint){
    const text=memeID+":"+fingerprint;
    let hash=0;
    for(let i=0;i<text.length;i++) hash=((hash<<5)-hash+text.charCodeAt(i))|0;
    return "SIG-"+Math.abs(hash).toString(16).toUpperCase();
}

function injectPNGTextChunk(pngBytes,keyword,text){
    const position=pngBytes.length-12;
    const encoder=new TextEncoder();
    const chunkData=encoder.encode(keyword+"\0"+text);
    const chunk=createPNGChunk("tEXt",chunkData);
    const output=new Uint8Array(pngBytes.length+chunk.length);
    output.set(pngBytes.slice(0,position),0);
    output.set(chunk,position);
    output.set(pngBytes.slice(position),position+chunk.length);
    return output;
}

function createPNGChunk(type,data){
    const encoder=new TextEncoder();
    const typeBytes=encoder.encode(type);
    const chunk=new Uint8Array(12+data.length);
    const view=new DataView(chunk.buffer);
    view.setUint32(0,data.length);
    chunk.set(typeBytes,4);
    chunk.set(data,8);
    view.setUint32(8+data.length,crc32(chunk.slice(4,8+data.length)));
    return chunk;
}

function crc32(bytes){
    const table=[];
    for(let n=0;n<256;n++){
        let c=n;
        for(let k=0;k<8;k++) c=(c&1)?0xEDB88320^(c>>>1):c>>>1;
        table[n]=c;
    }
    let crc=0xffffffff;
    for(let i=0;i<bytes.length;i++) crc=table[(crc^bytes[i])&0xff]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
}
