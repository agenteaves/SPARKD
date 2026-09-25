import fs from "node:fs";
import vm from "node:vm";

const read = file => fs.readFileSync(file, "utf8");
const source = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/WQAAAABJRU5ErkJggg==",
    "base64"
);
const png = Buffer.concat([
    source.subarray(0, 56),
    Buffer.from("0000000049454e44ae426082", "hex")
]);
const context = vm.createContext({
    window: {}, Blob, TextEncoder, TextDecoder, Uint8Array, DataView, Math,
    console: { log() {} },
    atob: value => Buffer.from(value, "base64").toString("binary"),
    document: { addEventListener() {} }
});

vm.runInContext(read("meme-forge/upgrades/forge-export.js") +
    read("meme-forge/upgrades/png-forge-writer.js"), context);

const record = {
    forge: "SPARKD Meme Forge", version: "1", memeID: "x", DNA: "x",
    imageFingerprint: "IMG-PRE-EXPORT", imageLock: "IMG-PRE-EXPORT",
    created: "now", contract: "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump",
    creatorID: "x", wallet: "x", reputation: 100, signature: "old"
};
record.signature = vm.runInContext("createForgeSignature", context)(record);
const canvas = { toDataURL: () => "data:image/png;base64," + png.toString("base64") };
const bytes = new Uint8Array(await context.window.SPARKD_PNG.createBlob(canvas, record).arrayBuffer());

vm.runInContext(read("meme-of-the-week/contest-forge-integrity-gate.js")
    .replace("})();", "window.verifySelectedForgePNG = verifySelectedForgePNG;})();"), context);

const file = data => ({
    type: "image/png",
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
});

await context.window.verifySelectedForgePNG(file(bytes));

const changed = bytes.slice();
changed[42] ^= 1;
let rejected = false;
try {
    await context.window.verifySelectedForgePNG(file(changed));
} catch (error) {
    rejected = /changed/.test(error.message);
}
if (!rejected) throw new Error("Modified PNG image bytes were accepted");

console.log("Forge PNG integrity: original accepted, changed image bytes rejected.");
