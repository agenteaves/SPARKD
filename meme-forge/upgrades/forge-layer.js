////////////////////////////////////////////////////
// SPARKD FORGE LAYER v0.6
// Meme Identity + Creator Identity + Wallet Identity
// + Shared Phantom Wallet + Image Fingerprint
// + Signature System
//
// IMPORTANT:
// - READ ONLY with respect to blockchain
// - NO TOKEN TRANSFER
// - NO TOKEN BURN
// - NO SOL TRANSFER
// - DOES NOT CALL Phantom.connect()
// - USES THE EXISTING CREATOR PROFILE WALLET
////////////////////////////////////////////////////


window.SPARKD_FORGE = {


    ////////////////////////////////////////////////////
    // VERSION
    ////////////////////////////////////////////////////

    version:
        "1.1",



    ////////////////////////////////////////////////////
    // OFFICIAL SPARKD CONTRACT
    ////////////////////////////////////////////////////

    contract:
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump",



    ////////////////////////////////////////////////////
    // GET PHANTOM PROVIDER
    //
    // SAME PROVIDER USED BY CREATOR PROFILE
    //
    // READ ONLY.
    //
    // We NEVER call:
    //
    // provider.connect()
    //
    ////////////////////////////////////////////////////

    getProvider:
        function () {


            ////////////////////////////////////////////////////
            // PRIMARY PHANTOM PROVIDER
            ////////////////////////////////////////////////////

            if (
                window.phantom &&
                window.phantom.solana
            ) {

                return window.phantom.solana;

            }



            ////////////////////////////////////////////////////
            // STANDARD PHANTOM PROVIDER
            ////////////////////////////////////////////////////

            if (
                window.solana &&
                window.solana.isPhantom
            ) {

                return window.solana;

            }



            ////////////////////////////////////////////////////
            // NO PROVIDER
            ////////////////////////////////////////////////////

            return null;

        },



    ////////////////////////////////////////////////////
    // GET CONNECTED WALLET
    //
    // IMPORTANT:
    //
    // This DOES NOT connect Phantom.
    //
    // It only reads the wallet that is already connected
    // through the Creator Profile wallet system.
    ////////////////////////////////////////////////////

    getConnectedWallet:
        function () {


            ////////////////////////////////////////////////////
            // GET SAME PROVIDER AS CREATOR PROFILE
            ////////////////////////////////////////////////////

            const provider =
                this.getProvider();



            if (
                !provider
            ) {

                console.warn(
                    "⚠️ SPARKD Forge: Phantom provider not available."
                );

                return null;

            }



            ////////////////////////////////////////////////////
            // CHECK EXISTING CONNECTION
            ////////////////////////////////////////////////////

            if (
                !provider.isConnected ||
                !provider.publicKey
            ) {

                console.warn(
                    "⚠️ SPARKD Forge: Phantom is not currently connected."
                );

                return null;

            }



            ////////////////////////////////////////////////////
            // READ PUBLIC KEY
            ////////////////////////////////////////////////////

            let wallet =
                null;


            try {

                wallet =
                    provider.publicKey.toString();

            }
            catch (
                error
            ) {

                console.error(
                    "❌ SPARKD Forge: unable to read Phantom publicKey:",
                    error
                );

                return null;

            }



            ////////////////////////////////////////////////////
            // NORMALIZE
            ////////////////////////////////////////////////////

            if (
                typeof wallet ===
                "string"
            ) {

                wallet =
                    wallet.trim();

            }



            ////////////////////////////////////////////////////
            // BASIC VALIDATION
            //
            // Server remains authoritative.
            ////////////////////////////////////////////////////

            if (
                typeof wallet !==
                    "string" ||
                wallet.length <
                    32 ||
                wallet.length >
                    50
            ) {

                console.warn(
                    "⚠️ SPARKD Forge: Phantom returned an invalid wallet address."
                );

                return null;

            }



            ////////////////////////////////////////////////////
            // SUCCESS
            ////////////////////////////////////////////////////

            console.log(
                "🔐 SPARKD Forge connected wallet:",
                wallet
            );


            return wallet;

        },



    ////////////////////////////////////////////////////
    // CREATE MEME ID
    ////////////////////////////////////////////////////

    createID:
        function () {


            const chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


            let id =
                "SPK-";


            for (
                let i = 0;
                i < 12;
                i++
            ) {


                id +=
                    chars.charAt(
                        Math.floor(
                            Math.random() *
                            chars.length
                        )
                    );

            }


            return id;

        },



    ////////////////////////////////////////////////////
    // CREATE CREATOR ID
    ////////////////////////////////////////////////////

    createCreatorID:
        function () {


            const chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


            let id =
                "CREATOR-";


            for (
                let i = 0;
                i < 8;
                i++
            ) {


                id +=
                    chars.charAt(
                        Math.floor(
                            Math.random() *
                            chars.length
                        )
                    );

            }


            return id;

        },



    ////////////////////////////////////////////////////
    // CREATE DNA
    ////////////////////////////////////////////////////

    createDNA:
        function () {


            const time =
                Date.now().toString();


            let hash =
                0;


            for (
                let i = 0;
                i < time.length;
                i++
            ) {


                hash =
                    ((hash << 5) - hash) +
                    time.charCodeAt(i);


                hash =
                    hash & hash;

            }


            return (

                "DNA-" +
                Math.abs(hash)
                    .toString(16)
                    .toUpperCase()

            );

        },



    ////////////////////////////////////////////////////
    // CREATE SIGNATURE
    ////////////////////////////////////////////////////

    createSignature:
        function (
            data
        ) {


            const text =
                JSON.stringify(data);


            let hash =
                0;


            for (
                let i = 0;
                i < text.length;
                i++
            ) {


                hash =
                    ((hash << 5) - hash) +
                    text.charCodeAt(i);


                hash =
                    hash & hash;

            }


            return (

                "SIG-" +
                Math.abs(hash)
                    .toString(16)
                    .toUpperCase()

            );

        },



    ////////////////////////////////////////////////////
    // CREATE IMAGE FINGERPRINT
    //
    // PIXEL BASED
    //
    // Ignores PNG metadata.
    ////////////////////////////////////////////////////

    createImageFingerprint:
        function (
            canvas
        ) {


            try {


                const ctx =
                    canvas.getContext(
                        "2d"
                    );


                const imageData =
                    ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );


                const data =
                    imageData.data;


                let hash =
                    0;


                for (
                    let i = 0;
                    i < data.length;
                    i++
                ) {


                    hash =
                        ((hash << 5) - hash) +
                        data[i];


                    hash =
                        hash & hash;

                }


                return (

                    "IMG-" +
                    Math.abs(hash)
                        .toString(16)
                        .toUpperCase()

                );

            }

            catch (
                error
            ) {


                console.error(
                    "❌ SPARKD Image fingerprint failed:",
                    error
                );


                return "IMG-UNKNOWN";

            }

        },



    ////////////////////////////////////////////////////
    // CREATE FULL FORGE RECORD
    ////////////////////////////////////////////////////

    createRecord:
        function (
            canvas
        ) {


            ////////////////////////////////////////////////////
            // CREATOR ID
            ////////////////////////////////////////////////////

            let creatorID =
                localStorage.getItem(
                    "sparkdCreatorID"
                );


            if (
                !creatorID
            ) {


                creatorID =
                    this.createCreatorID();


                localStorage.setItem(
                    "sparkdCreatorID",
                    creatorID
                );

            }



            ////////////////////////////////////////////////////
            // GET EXISTING CONNECTED WALLET
            ////////////////////////////////////////////////////

            const connectedWallet =
                this.getConnectedWallet();



            ////////////////////////////////////////////////////
            // IMAGE FINGERPRINT
            ////////////////////////////////////////////////////

            const imageFingerprint =
                this.createImageFingerprint(
                    canvas
                );



            ////////////////////////////////////////////////////
            // BUILD FORGE RECORD
            ////////////////////////////////////////////////////

            const record = {


                forge:
                    "SPARKD Meme Forge",


                version:
                    this.version,


                created:
                    new Date()
                        .toISOString(),



                ////////////////////////////////////////////////////
                // CREATOR IDENTITY
                ////////////////////////////////////////////////////

                creatorID:
                    creatorID,



                ////////////////////////////////////////////////////
                // WALLET IDENTITY
                ////////////////////////////////////////////////////

                wallet:
                    connectedWallet ||
                    "NOT_CONNECTED",



                ////////////////////////////////////////////////////
                // CREATOR REPUTATION
                ////////////////////////////////////////////////////

                reputation:
                    100,



                ////////////////////////////////////////////////////
                // MEME IDENTITY
                ////////////////////////////////////////////////////

                memeID:
                    this.createID(),



                ////////////////////////////////////////////////////
                // DNA
                ////////////////////////////////////////////////////

                DNA:
                    this.createDNA(),



                ////////////////////////////////////////////////////
                // IMAGE FINGERPRINT
                ////////////////////////////////////////////////////

                imageFingerprint:
                    imageFingerprint,



                ////////////////////////////////////////////////////
                // IMAGE LOCK
                ////////////////////////////////////////////////////

                imageLock:
                    imageFingerprint,



                ////////////////////////////////////////////////////
                // CONTRACT
                ////////////////////////////////////////////////////

                contract:
                    this.contract

            };



            ////////////////////////////////////////////////////
            // ANTI-TAMPER SIGNATURE
            ////////////////////////////////////////////////////

            record.signature =
                this.createSignature(
                    record
                );



            ////////////////////////////////////////////////////
            // DEBUG OUTPUT
            ////////////////////////////////////////////////////

            console.log(
                "🔥 SPARKD FORGE RECORD CREATED:",
                record
            );


            console.log(
                "🔐 SPARKD Forge wallet:",
                record.wallet
            );


            console.log(
                "🧬 SPARKD Forge DNA:",
                record.DNA
            );


            console.log(
                "🆔 SPARKD Forge Meme ID:",
                record.memeID
            );


            console.log(
                "🔒 SPARKD Forge Image Lock:",
                record.imageLock
            );


            console.log(
                "✍️ SPARKD Forge Signature:",
                record.signature
            );



            ////////////////////////////////////////////////////
            // WALLET WARNING
            ////////////////////////////////////////////////////

            if (
                record.wallet ===
                "NOT_CONNECTED"
            ) {


                console.warn(
                    "⚠️ SPARKD Forge record created without a connected wallet."
                );


                console.warn(
                    "⚠️ Connect Phantom through Creator Profile before exporting the final contest meme."
                );

            }
            else {


                console.log(
                    "✅ SPARKD Forge wallet identity attached."
                );

            }



            ////////////////////////////////////////////////////
            // RETURN RECORD
            ////////////////////////////////////////////////////

            return record;

        }


};



////////////////////////////////////////////////////
// READY
////////////////////////////////////////////////////

console.log(
    "🔥 SPARKD Forge Layer v0.6 loaded."
);


console.log(
    "🔗 SPARKD Forge is using the shared Creator Profile Phantom provider."
);


console.log(
    "🛡️ Forge wallet access is READ ONLY."
);

