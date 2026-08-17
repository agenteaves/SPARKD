////////////////////////////////////////////////////
// SPARKD CREATOR WALLET
// PHANTOM WALLET CONNECTION
////////////////////////////////////////////////////

(function () {

    "use strict";


    ////////////////////////////////////////////////////
    // INITIALIZE WALLET
    ////////////////////////////////////////////////////

    function initializeWallet() {


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


        ////////////////////////////////////////////////////
        // PHANTOM PROVIDER
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

                    showWallet(
                        response.publicKey
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


        ////////////////////////////////////////////////////
        // WALLET CONNECT EVENT
        ////////////////////////////////////////////////////

        if (provider) {

            provider.on(
                "connect",
                function (publicKey) {

                    if (publicKey) {

                        showWallet(
                            publicKey
                        );

                    }

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

                    holderStatus.innerHTML = `

                        <strong>
                            Wallet Not Connected
                        </strong>

                        <span>
                            Connect your wallet to verify SPARKD ownership.
                        </span>

                    `;


                    connectButton.innerHTML =
                        "🔗 Connect SPARKD Wallet";

                }
            );

        }

    }


    ////////////////////////////////////////////////////
    // WAIT FOR DOM
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
