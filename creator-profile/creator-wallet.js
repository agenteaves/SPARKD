////////////////////////////////////////////////////
// SPARKD CREATOR WALLET
// PHANTOM WALLET CONNECTION
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // SUPABASE CONFIG
    ////////////////////////////////////////////////////

    const SUPABASE_URL =
        "https://uxpbgzksfizkyxubctep.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


    ////////////////////////////////////////////////////
    // WALLET INITIALIZATION
    ////////////////////////////////////////////////////

    async function initializeWallet() {

        ////////////////////////////////////////////////////
        // WAIT FOR PROFILE INTERFACE
        ////////////////////////////////////////////////////

        const waitForWalletInterface =
            function () {

                return new Promise(
                    function (resolve) {

                        const existingButton =
                            document.getElementById(
                                "connectWalletBtn"
                            );

                        const existingStatus =
                            document.getElementById(
                                "holderStatus"
                            );


                        if (
                            existingButton &&
                            existingStatus
                        ) {

                            resolve({
                                button:
                                    existingButton,

                                status:
                                    existingStatus
                            });

                            return;

                        }


                        const observer =
                            new MutationObserver(
                                function () {

                                    const button =
                                        document.getElementById(
                                            "connectWalletBtn"
                                        );

                                    const status =
                                        document.getElementById(
                                            "holderStatus"
                                        );


                                    if (
                                        button &&
                                        status
                                    ) {

                                        observer.disconnect();


                                        resolve({
                                            button:
                                                button,

                                            status:
                                                status
                                        });

                                    }

                                }
                            );


                        observer.observe(
                            document.body,
                            {
                                childList: true,
                                subtree: true
                            }

                        );

                    }
                );

            };


        ////////////////////////////////////////////////////
        // GET WALLET INTERFACE
        ////////////////////////////////////////////////////

        const walletInterface =
            await waitForWalletInterface();


        const connectButton =
            walletInterface.button;


        const holderStatus =
            walletInterface.status;


        console.log(
            "🔗 SPARKD Wallet: Wallet interface detected."
        );


        ////////////////////////////////////////////////////
        // SUPABASE CHECK
        ////////////////////////////////////////////////////

        if (
            typeof window.supabase === "undefined" ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.error(
                "SPARKD Wallet: Supabase is not available."
            );

            return;

        }


        ////////////////////////////////////////////////////
        // CREATE SUPABASE CLIENT
        ////////////////////////////////////////////////////

        const walletSupabase =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );


        ////////////////////////////////////////////////////
        // GET PHANTOM PROVIDER
        ////////////////////////////////////////////////////

        function getProvider() {

            if (
                window.phantom &&
                window.phantom.solana
            ) {

                return window.phantom.solana;

            }


            if (
                window.solana &&
                window.solana.isPhantom
            ) {

                return window.solana;

            }


            return null;

        }


        ////////////////////////////////////////////////////
        // GET CREATOR ID
        ////////////////////////////////////////////////////

        function getCreatorID() {

            return localStorage.getItem(
                "sparkdCreatorID"
            );

        }


        ////////////////////////////////////////////////////
        // DISPLAY CONNECTED WALLET
        ////////////////////////////////////////////////////

        function showWallet(
            publicKey
        ) {

            if (!publicKey) {

                return;

            }


            const address =
                publicKey.toString();


            const shortAddress =
                address.slice(0, 6) +
                "..." +
                address.slice(-6);


            holderStatus.innerHTML = `

                <strong>
                    🟢 Wallet Connected
                </strong>

                <span>
                    ${shortAddress}
                </span>

            `;


            connectButton.innerHTML =
                "🔌 Wallet Connected";


            console.log(
                "🔗 SPARKD Wallet: Connected:",
                address
            );

        }


        ////////////////////////////////////////////////////
        // DISPLAY DISCONNECTED
        ////////////////////////////////////////////////////

        function showDisconnected() {

            holderStatus.innerHTML = `

                <strong>
                    🔌 Wallet Not Connected
                </strong>

                <span>
                    Connect your Phantom wallet to secure your SPARKD creator profile.
                </span>

            `;


            connectButton.innerHTML =
                "🔗 Connect SPARKD Wallet";

        }


        ////////////////////////////////////////////////////
        // SAVE / RECOVER WALLET
        ////////////////////////////////////////////////////

        async function saveWalletToProfile(
            walletAddress
        ) {

            if (!walletAddress) {

                console.error(
                    "SPARKD Wallet: No wallet address provided."
                );

                return false;

            }


            ////////////////////////////////////////////////////
            // GET CREATOR ID
            ////////////////////////////////////////////////////

            let creatorID =
                getCreatorID();


            ////////////////////////////////////////////////////
            // RECOVER CREATOR BY WALLET
            ////////////////////////////////////////////////////

            if (!creatorID) {

                console.log(
                    "🔎 SPARKD Wallet: No local Creator ID. Searching community database by wallet..."
                );


                const {
                    data: walletCreator,
                    error: walletLookupError
                } =
                    await walletSupabase
                        .from("creator_profiles")
                        .select(
                            "creator_id,display_name,username,wallet_address"
                        )
                        .eq(
                            "wallet_address",
                            walletAddress
                        )
                        .maybeSingle();


                if (walletLookupError) {

                    console.error(
                        "SPARKD Wallet: Wallet lookup failed:",
                        walletLookupError
                    );

                    return false;

                }


                if (walletCreator) {

                    creatorID =
                        walletCreator.creator_id;


                    localStorage.setItem(
                        "sparkdCreatorID",
                        creatorID
                    );


                    console.log(
                        "🔥 SPARKD Wallet: Creator ID recovered from wallet:",
                        creatorID
                    );


                    console.log(
                        "👤 SPARKD Wallet: Recovered creator:",
                        walletCreator.display_name,
                        "@",
                        walletCreator.username
                    );

                }

            }


            ////////////////////////////////////////////////////
            // NO CREATOR ID
            ////////////////////////////////////////////////////

            if (!creatorID) {

                console.warn(
                    "SPARKD Wallet: No creator profile is linked to this wallet."
                );


                alert(
                    "⚠️ This Phantom wallet is not linked to an existing SPARKD creator profile."
                );


                return false;

            }


            ////////////////////////////////////////////////////
            // FIND CREATOR PROFILE
            ////////////////////////////////////////////////////

            const {
                data: creator,
                error: creatorError
            } =
                await walletSupabase
                    .from("creator_profiles")
                    .select(
                        "creator_id,wallet_address"
                    )
                    .eq(
                        "creator_id",
                        creatorID
                    )
                    .maybeSingle();


            if (creatorError) {

                console.error(
                    "SPARKD Wallet: Could not find creator profile:",
                    creatorError
                );

                return false;

            }


            if (!creator) {

                console.error(
                    "SPARKD Wallet: Creator profile does not exist:",
                    creatorID
                );

                return false;

            }


            ////////////////////////////////////////////////////
            // CHECK WALLET OWNERSHIP
            ////////////////////////////////////////////////////

            if (
                creator.wallet_address &&
                creator.wallet_address !== walletAddress
            ) {

                console.warn(
                    "SPARKD Wallet: Profile already belongs to another wallet."
                );


                alert(
                    "🔒 This creator profile is already linked to a different wallet."
                );


                return false;

            }


            ////////////////////////////////////////////////////
            // ALREADY LINKED
            ////////////////////////////////////////////////////

            if (
                creator.wallet_address === walletAddress
            ) {

                console.log(
                    "🔐 SPARKD Wallet: Wallet already linked to creator:",
                    creatorID
                );


                return true;

            }


            ////////////////////////////////////////////////////
            // SAVE WALLET
            ////////////////////////////////////////////////////

            const {
                error: updateError
            } =
                await walletSupabase
                    .from("creator_profiles")
                    .update({

                        wallet_address:
                            walletAddress,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq(
                        "creator_id",
                        creatorID
                    );


            if (updateError) {

                console.error(
                    "SPARKD Wallet: Could not save wallet:",
                    updateError
                );


                alert(
                    "⚠️ Wallet connected, but SPARKD could not save the wallet association."
                );


                return false;

            }


            console.log(
                "🔐 SPARKD Wallet: Wallet linked to creator profile:",
                creatorID
            );


            return true;

        }


        ////////////////////////////////////////////////////
        // CONNECT WALLET
        ////////////////////////////////////////////////////

        async function connectWallet() {

            const provider =
                getProvider();


            if (!provider) {

                alert(
                    "👻 Phantom Wallet was not detected. Please install or open Phantom Wallet."
                );

                return;

            }


            try {

                console.log(
                    "🔗 SPARKD Wallet: Connecting to Phantom..."
                );


                const response =
                    await provider.connect();


                const publicKey =
                    response &&
                    response.publicKey
                        ? response.publicKey
                        : provider.publicKey;


                if (!publicKey) {

                    console.warn(
                        "SPARKD Wallet: Phantom connected but no public key was returned."
                    );

                    return;

                }


                showWallet(
                    publicKey
                );


                const walletAddress =
                    publicKey.toString();


                const saved =
                    await saveWalletToProfile(
                        walletAddress
                    );


                if (saved) {

                    console.log(
                        "🔐 SPARKD Wallet: Creator profile secured."
                    );

                }

            }
            catch (error) {

                console.error(
                    "SPARKD Wallet connection failed:",
                    error
                );

            }

        }


        ////////////////////////////////////////////////////
        // CONNECT BUTTON
        ////////////////////////////////////////////////////

        connectButton.addEventListener(
            "click",
            connectWallet
        );


        ////////////////////////////////////////////////////
        // PHANTOM PROVIDER
        ////////////////////////////////////////////////////

        const provider =
            getProvider();


        ////////////////////////////////////////////////////
        // CHECK EXISTING CONNECTION
        ////////////////////////////////////////////////////

        if (
            provider &&
            provider.isConnected &&
            provider.publicKey
        ) {

            console.log(
                "🔗 SPARKD Wallet: Existing Phantom connection detected."
            );


            showWallet(
                provider.publicKey
            );


            const existingWalletAddress =
                provider.publicKey.toString();


            await saveWalletToProfile(
                existingWalletAddress
            );

        }
        else {

            showDisconnected();

        }


        ////////////////////////////////////////////////////
        // PHANTOM CONNECT EVENT
        ////////////////////////////////////////////////////

        if (provider) {

            provider.on(
                "connect",
                async function (
                    publicKey
                ) {

                    if (!publicKey) {

                        return;

                    }


                    showWallet(
                        publicKey
                    );


                    await saveWalletToProfile(
                        publicKey.toString()
                    );

                }
            );


            ////////////////////////////////////////////////////
            // PHANTOM DISCONNECT EVENT
            ////////////////////////////////////////////////////

            provider.on(
                "disconnect",
                function () {

                    console.log(
                        "🔌 SPARKD Wallet: Phantom disconnected."
                    );


                    showDisconnected();

                }
            );

        }


        ////////////////////////////////////////////////////
        // INITIALIZED
        ////////////////////////////////////////////////////

        console.log(
            "🔐 SPARKD Creator Wallet initialized."
        );

    }


    ////////////////////////////////////////////////////
    // START WALLET SYSTEM
    ////////////////////////////////////////////////////

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeWallet
        );

    }
    else {

        initializeWallet();

    }


})();

