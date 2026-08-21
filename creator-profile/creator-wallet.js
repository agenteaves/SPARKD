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
    // INITIALIZE WALLET
    ////////////////////////////////////////////////////

    async function initializeWallet() {


        ////////////////////////////////////////////////////
        // ELEMENTS
        ////////////////////////////////////////////////////

        const connectButton =
            document.getElementById(
                "connectWalletBtn"
            );


        const holderStatus =
            document.getElementById(
                "holderStatus"
            );


        if (!connectButton) {

            console.warn(
                "SPARKD Wallet: Connect button not found."
            );

            return;

        }


        if (!holderStatus) {

            console.warn(
                "SPARKD Wallet: Holder status element not found."
            );

            return;

        }


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
        // GET CURRENT CREATOR ID
        ////////////////////////////////////////////////////

        function getCreatorID() {

            return localStorage.getItem(
                "sparkdCreatorID"
            );

        }


        ////////////////////////////////////////////////////
        // DISPLAY WALLET
        ////////////////////////////////////////////////////

        function showWallet(publicKey) {

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

        }


        ////////////////////////////////////////////////////
        // DISPLAY NOT CONNECTED
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
// SAVE / RECOVER WALLET TO CREATOR PROFILE
////////////////////////////////////////////////////

async function saveWalletToProfile(
    walletAddress
) {

    ////////////////////////////////////////////////////
    // VALIDATE WALLET
    ////////////////////////////////////////////////////

    if (!walletAddress) {

        console.error(
            "SPARKD Wallet: No wallet address provided."
        );

        return false;

    }


    ////////////////////////////////////////////////////
    // CHECK FOR EXISTING CREATOR ID
    ////////////////////////////////////////////////////

    let creatorID =
        getCreatorID();


    ////////////////////////////////////////////////////
    // IF NO CREATOR ID, RECOVER BY WALLET
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


        ////////////////////////////////////////////////////
        // WALLET LOOKUP ERROR
        ////////////////////////////////////////////////////

        if (walletLookupError) {

            console.error(
                "SPARKD Wallet: Wallet-based creator lookup failed:",
                walletLookupError
            );


            return false;

        }


        ////////////////////////////////////////////////////
        // CREATOR FOUND BY WALLET
        ////////////////////////////////////////////////////

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
    // NO CREATOR FOUND
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
    // CHECK EXISTING WALLET
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
    // SAVE / CONFIRM WALLET
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


    ////////////////////////////////////////////////////
    // SUCCESS
    ////////////////////////////////////////////////////

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

                const response =
                    await provider.connect();


                if (
                    response &&
                    response.publicKey
                ) {

                    const walletAddress =
                        response.publicKey.toString();


                    showWallet(
                        response.publicKey
                    );


                    ////////////////////////////////////////////////////
                    // LINK WALLET TO CREATOR
                    ////////////////////////////////////////////////////

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
        // EXISTING CONNECTION
        ////////////////////////////////////////////////////

        const provider =
            getProvider();


        if (
            provider &&
            provider.isConnected &&
            provider.publicKey
        ) {

            showWallet(
                provider.publicKey
            );

        }
        else {

            showDisconnected();

        }


        ////////////////////////////////////////////////////
        // WALLET CONNECT EVENT
        ////////////////////////////////////////////////////

        if (provider) {

            provider.on(
                "connect",
                async function (publicKey) {

                    if (!publicKey) {

                        return;

                    }


                    showWallet(
                        publicKey
                    );


                    const walletAddress =
                        publicKey.toString();


                    await saveWalletToProfile(
                        walletAddress
                    );

                }
            );

        }


        ////////////////////////////////////////////////////
        // WALLET DISCONNECT EVENT
        ////////////////////////////////////////////////////

        if (provider) {

            provider.on(
                "disconnect",
                function () {

                    showDisconnected();

                }
            );

        }


        console.log(
            "🔐 SPARKD Creator Wallet initialized."
        );

    }


    ////////////////////////////////////////////////////
    // WAIT FOR DOM
    ////////////////////////////////////////////////////

    if (
        document.readyState ===
        "loading"
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

