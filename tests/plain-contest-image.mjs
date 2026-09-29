import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {webcrypto} from "node:crypto";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/WQAAAABJRU5ErkJggg==", "base64");
const values = new Map();
let scanned = false;
const context = vm.createContext({
    window: {SPARKD_GUARD: {isReady: () => true, check: async file => {scanned = file.type === "image/png"; return {approved:true};}}},
    document: {createElement: () => ({getContext: () => ({fillRect() {}, drawImage() {}, set fillStyle(_) {}}),
        toBlob: callback => callback(new Blob([imageBytes], {type:"image/png"}))})},
    Image: class {naturalWidth=1; naturalHeight=1; set src(_) {this.onload();}},
    URL: {createObjectURL: () => "blob:test", revokeObjectURL() {}},
    File, Blob, crypto:webcrypto, Uint8Array,
    localStorage: {getItem:k => values.get(k) ?? null, setItem:(k,v) => values.set(k,v)},
    Math
});
vm.runInContext(fs.readFileSync("meme-of-the-week/contest-image.js", "utf8"), context);
const prepared = await context.window.SPARKD_CONTEST_IMAGE.prepare(new File([imageBytes], "phone.jpg", {type:"image/jpeg"}));
assert.equal(prepared.file.type, "image/png");
assert.equal(prepared.file.size, imageBytes.length);
assert.equal(scanned, true);
assert.match(prepared.entry.memeID, /^SPK-[A-F0-9]{12}$/);
assert.equal(Buffer.from(await prepared.file.arrayBuffer()).includes(Buffer.from("SPARKD-FORGE")), false);
console.log("Phone image accepted, inspected, and converted to plain PNG without embedded metadata.");
