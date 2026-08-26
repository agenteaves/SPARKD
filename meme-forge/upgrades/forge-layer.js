////////////////////////////////////////////////////
// SPARKD FORGE LAYER v0.5
// Meme Identity + Creator Identity + Wallet Identity
// + Image Fingerprint + Signature System
//
// IMPORTANT:
// - READ ONLY with respect to blockchain
// - NO TOKEN TRANSFER
// - NO TOKEN BURN
// - NO SOL TRANSFER
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
    // GET CONNECTED WALLET
    //
    // IMPORTANT:
    // This does NOT connect a wallet.
    //
    // It only reads the wallet that the existing
    // SPARKD wallet system has already connected.
    ////////////////////////////////////////////////////

    getConnectedWallet:
        function () {


            let wallet =
                null;


            ////////////////////////////////////////////////////
            // PRIMARY SPARKD WALLET VARIABLE
            ////////////////////////////////////////////////////

            try {


                if (
                    typeof currentWallet !==
                    "undefined"
                ) {

                    wallet =
                        currentWallet;

                }

            }
            catch (
                error
            ) {

                console.warn(
                    "⚠️ Unable to read currentWallet:",
                    error
                );

            }


            ////////////////////////////////////////////////////
            // WINDOW FALLBACK
            ////////////////////////////////////////////////////

            if (
                !wallet &&
                typeof window.currentWallet !==
                "undefined"
            ) {

                wallet =
                    window.currentWallet;

            }


            ////////////////////////////////////////////////////
            // NORMALIZE STRING
            ////////////////////////////////////////////////////

            if (
                typeof wallet ===
                "string"
            ) {

                wallet =
                    wallet.trim();

            }


            ////////////////////////////////////////////////////
            // VALIDATE SOLANA WALLET FORMAT
            //
            // This is intentionally a basic validation.
            // The server performs the authoritative check.
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
                    "⚠️ SPARKD Forge: no valid connected wallet found."
                );


                return null;

            }


            ////////////////////////////////////////////////////
            // WALLET FOUND
            ////////////////////////////////////////////////////

            console.log(
                "🔐 SPARKD Forge connected wallet:",
                wallet
            );


            return wallet;

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
            // GET CONNECTED WALLET
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
            // BUILD RECORD
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
                //
                // THIS IS THE IMPORTANT FIX.
                //
                // Previously this was permanently:
                //
                // wallet: "NOT_CONNECTED"
                //
                // Now it records the wallet that was actually
                // connected when the meme was exported.
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
                // SPARKD CONTRACT
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
            // WARN IF WALLET IS NOT CONNECTED
            ////////////////////////////////////////////////////

            if (
                record.wallet ===
                "NOT_CONNECTED"
            ) {


                console.warn(

                    "⚠️ SPARKD Forge record created without a connected wallet."

                );


                console.warn(

                    "⚠️ Connect Phantom before exporting the final contest meme."

                );

            }



            ////////////////////////////////////////////////////
            // RETURN COMPLETE RECORD
            ////////////////////////////////////////////////////

            return record;

        }


};

