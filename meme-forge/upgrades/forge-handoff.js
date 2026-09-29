/* Keep the exact verified Forge PNG available to the contest on this origin. */
(function () {
    "use strict";
    const DB_NAME = "sparkd-forge-handoff";
    const STORE = "exports";
    const MAX_AGE_MS = 24 * 60 * 60 * 1000;

    function open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(STORE)) {
                    request.result.createObjectStore(STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function useStore(mode, work) {
        const db = await open();
        try {
            return await new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE, mode);
                const request = work(transaction.objectStore(STORE));
                let value;
                request.onsuccess = () => { value = request.result; };
                request.onerror = () => reject(request.error);
                transaction.onabort = () => reject(transaction.error);
                transaction.oncomplete = () => resolve(value);
            });
        } finally {
            db.close();
        }
    }

    window.SPARKD_FORGE_HANDOFF = {
        async save(blob, name) {
            if (!(blob instanceof Blob) || blob.type !== "image/png") {
                throw new Error("Only verified Forge PNGs can be retained.");
            }
            await useStore("readwrite", store => store.put({blob, name, savedAt: Date.now()}, "latest"));
        },
        async load() {
            const entry = await useStore("readonly", store => store.get("latest"));
            if (!entry || !(entry.blob instanceof Blob) ||
                Date.now() - entry.savedAt > MAX_AGE_MS || entry.savedAt > Date.now()) return null;
            return new File([entry.blob], entry.name || "SPARKD-Forge.png", {type: "image/png"});
        }
    };
})();
