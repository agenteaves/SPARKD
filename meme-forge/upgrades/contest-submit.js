////////////////////////////////////////////////////
// SPARKD CONTEST SUBMISSION
// Submission Preparation Engine v0.4
///////////////////////////////////////////////////



window.SPARKD_CONTEST = {

    ////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////

    REQUIRED_SPARKD:
        2000,

    BUCKET:
        "sparkd-contest-submissions",

    SUPER_HANDLER_URL:
        "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler",


    getSupabaseClient() {

    const client =
        window.SPARKD_CONTEST_SUPABASE;

    if (!client) {

        throw new Error(
            "Supabase client is not available."
        );

    }

    return client;

},


    ////////////////////////////////////////////////////
    // BASIC FILE VALIDATION
    ////////////////////////////////////////////////////

    validateFile(
        file
    ) {

        if (!file) {

            throw new Error(
                "No meme file was provided."
            );

        }


        if (
            file.type !==
            "image/png"
        ) {

            throw new Error(
                "Contest submissions must be PNG images."
            );

        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            throw new Error(
                "PNG is larger than the 10 MB limit."
            );

        }


        return true;

    },


    ////////////////////////////////////////////////////
    // WALLET VALIDATION
    ////////////////////////////////////////////////////

    validateWallet(
        wallet
    ) {

        if (
            typeof wallet !==
                "string" ||
            wallet.length <
                32 ||
            wallet.length >
                50
        ) {

            throw new Error(
                "Invalid wallet address."
            );

        }


        return true;

    },


    ////////////////////////////////////////////////////
    // GET ACTIVE CONTEST
    ////////////////////////////////////////////////////

    async getCurrentContest() {


        const client =
            this.getSupabaseClient();


        const now =
            new Date().toISOString();


        const {
            data,
            error
        } =
            await client

                .from(
                    "meme_week_contests"
                )

                .select(
                    "*"
                )

                .lte(
                    "week_start",
                    now
                )

                .gte(
                    "week_end",
                    now
                )

                .eq(
                    "status",
                    "submission"
                )

                .order(
                    "week_start",
                    {
                        ascending:
                            false
                    }
                )

                .limit(
                    1
                )

                .maybeSingle();


        if (error) {

            console.error(
                "SPARKD contest lookup error:",
                error
            );

            throw new Error(
                "Unable to retrieve the active contest."
            );

        }


        if (!data) {

            throw new Error(
                "There is no active Meme of the Week submission period."
            );

        }


        console.log(
            "🔥 SPARKD active contest found:",
            data.id
        );


        return data;

    },


    ////////////////////////////////////////////////////
    // VERIFY SPARKD BALANCE
    //
    // READ ONLY
    //
    // NO TRANSACTION
    // NO TRANSFER
    // NO BURN
    ////////////////////////////////////////////////////

    async checkBalance(
        wallet
    ) {


        this.validateWallet(
            wallet
        );


        console.log(
            "🪙 SPARKD checking balance..."
        );


        const response =
            await fetch(

                this.SUPER_HANDLER_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            wallet:
                                wallet

                        })

                }

            );


        if (
            !response.ok
        ) {

            throw new Error(
                "SPARKD balance service returned HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(

                result.error ||
                "Unable to retrieve SPARKD balance."

            );

        }


        const balance =
            Number(
                result.balance ||
                0
            );


        if (
            !Number.isFinite(
                balance
            )
        ) {

            throw new Error(
                "SPARKD balance returned an invalid value."
            );

        }


        if (
            balance <
            this.REQUIRED_SPARKD
        ) {

            throw new Error(

                "You need at least " +
                this.REQUIRED_SPARKD.toLocaleString() +
                " SPARKD to enter."

            );

        }


        console.log(
            "🔥 SPARKD balance verified:",
            balance
        );


        return {

            balance:
                balance,

            requiredSparkd:
                this.REQUIRED_SPARKD,

            canSubmit:
                result.canSubmit !== false

        };

    },


    ////////////////////////////////////////////////////
    // VERIFY FORGE DNA
    //
    // SERVER-SIDE VERIFICATION
    //
    // NO DATABASE INSERT
    // NO TOKEN TRANSFER
    // NO TOKEN BURN
    ////////////////////////////////////////////////////

    async verifyForge(
        wallet,
        forgeData
    ) {


        this.validateWallet(
            wallet
        );


        if (
            !forgeData ||
            typeof forgeData !==
                "object"
        ) {

            throw new Error(
                "SPARKD Forge verification data is missing."
            );

        }


        console.log(
            "🧬 SPARKD verifying Forge DNA..."
        );


        const response =
            await fetch(

                this.SUPER_HANDLER_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            wallet:
                                wallet,

                            action:
                                "verify_dna",

                            forgeData:
                                forgeData,

                            mint:
                                "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"

                        })

                }

            );



        if (
            !response.ok
        ) {

            throw new Error(

                "Forge verification service returned HTTP " +
                response.status

            );

        }


        const result =
            await response.json();


        if (
            !result.success ||
            !result.verified
        ) {

            throw new Error(

                result.reason ||
                result.error ||
                "SPARKD Forge verification failed."

            );

        }


        console.log(
            "🔥 SPARKD Forge DNA verified:",
            result
        );


        return result;

    },


    ////////////////////////////////////////////////////
    // CHECK EXISTING SUBMISSION
    //
    // READ ONLY
    ////////////////////////////////////////////////////

    async checkExistingSubmission(
        wallet
    ) {


        this.validateWallet(
            wallet
        );


        console.log(
            "🔎 SPARKD checking existing submission..."
        );


        const response =
            await fetch(

                this.SUPER_HANDLER_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            wallet:
                                wallet,

                            action:
                                "check_submission"

                        })

                }

            );


        if (
            !response.ok
        ) {

            throw new Error(

                "Submission check returned HTTP " +
                response.status

            );

        }


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(

                result.error ||
                "Unable to check existing submission."

            );

        }


        console.log(
            "🔥 SPARKD existing submission check:",
            result
        );


        return result;

    },


    ////////////////////////////////////////////////////
    // UPLOAD VERIFIED MEME
    ////////////////////////////////////////////////////

    async uploadMeme(
        file,
        wallet,
        contestId
    ) {


        const client =
            this.getSupabaseClient();


        this.validateFile(
            file
        );


        this.validateWallet(
            wallet
        );


        if (
            !contestId
        ) {

            throw new Error(
                "Contest ID is missing."
            );

        }


        ////////////////////////////////////////////////////
        // CREATE SAFE STORAGE FILENAME
        ////////////////////////////////////////////////////

        const safeWallet =
            wallet.slice(
                0,
                12
            );


        const filename =

            contestId +
            "/" +
            safeWallet +
            "-" +
            Date.now() +
            ".png";


        console.log(
            "📤 SPARKD uploading verified meme:",
            filename
        );


        ////////////////////////////////////////////////////
        // UPLOAD TO SUPABASE STORAGE
        ////////////////////////////////////////////////////

        const {
            data,
            error
        } =
            await client

                .storage

                .from(
                    this.BUCKET
                )

                .upload(

                    filename,

                    file,

                    {

                        contentType:
                            "image/png",

                        upsert:
                            false

                    }

                );


        if (error) {

            console.error(
                "SPARKD meme upload failed:",
                error
            );

            throw new Error(
                error.message
            );

        }


        console.log(
            "🔥 SPARKD MEME UPLOAD SUCCESS:",
            data
        );


        return {

            path:
                data.path,

            bucket:
                this.BUCKET

        };

    },


    ////////////////////////////////////////////////////
    // PREPARE SUBMISSION
    //
    // DOES NOT INSERT DATABASE ROW
    ////////////////////////////////////////////////////

    async prepareSubmission({

        file,

        wallet,

        forgeData

    }) {


        console.log(
            "🔥 Preparing SPARKD Meme of the Week submission..."
        );


        ////////////////////////////////////////////////////
        // STEP 1 — FILE
        ////////////////////////////////////////////////////

        this.validateFile(
            file
        );


        ////////////////////////////////////////////////////
        // STEP 2 — WALLET
        ////////////////////////////////////////////////////

        this.validateWallet(
            wallet
        );


        ////////////////////////////////////////////////////
        // STEP 3 — CONTEST
        ////////////////////////////////////////////////////

        const contest =
            await this.getCurrentContest();


        console.log(
            "🔥 Contest verified:",
            contest.id
        );


        ////////////////////////////////////////////////////
        // STEP 4 — BALANCE
        ////////////////////////////////////////////////////

        const balance =
            await this.checkBalance(
                wallet
            );


        ////////////////////////////////////////////////////
        // STEP 5 — FORGE DNA
        ////////////////////////////////////////////////////

        const forgeVerification =
            await this.verifyForge(
                wallet,
                forgeData
            );


        console.log(
            "🔥 SPARKD Forge verified."
        );


        ////////////////////////////////////////////////////
        // STEP 6 — UPLOAD
        ////////////////////////////////////////////////////

        const upload =
            await this.uploadMeme(

                file,

                wallet,

                contest.id

            );


        console.log(
            "🔥 Meme uploaded:",
            upload.path
        );


        ////////////////////////////////////////////////////
        // PREPARED SUBMISSION
        ////////////////////////////////////////////////////

        const submission = {

            contestId:
                contest.id,

            wallet:
                wallet,

            balance:
                balance.balance,

            requiredSparkd:
                this.REQUIRED_SPARKD,

            forgeVerification:
                forgeVerification,

            storagePath:
                upload.path

        };


        console.log(
            "🔥 SPARKD submission prepared:",
            submission
        );


        return submission;

    },


    ////////////////////////////////////////////////////
    // REAL TEST SUBMISSION
    //
    // DATABASE INSERT ENABLED
    //
    // STILL NO TOKEN BURN
    // STILL NO SOL TRANSFER
    ////////////////////////////////////////////////////

    async submitMemeTest(
        file,
        forgeData,
        memeTitle
    ) {


        console.log(
            "🧪 SPARKD TEST SUBMISSION STARTING..."
        );


        ////////////////////////////////////////////////////
        // STEP 1 — BASIC FILE CHECK
        ////////////////////////////////////////////////////

        
        this.validateFile(
            file
        );


        ////////////////////////////////////////////////////
        // STEP 2 — CONNECTED PHANTOM WALLET
        //
        // Uses the wallet already connected by
        // the Meme of the Week contest wallet system.
        //
        // NO TOKEN TRANSACTION
        // NO TOKEN BURN
        // NO SOL TRANSFER
        ////////////////////////////////////////////////////

        const wallet =
            typeof currentWallet !==
                "undefined"
                ? currentWallet
                : null;


        if (
            typeof wallet !==
                "string" ||
            !wallet
        ) {

            throw new Error(
                "Please connect your Phantom wallet first."
            );

        }


        this.validateWallet(
            wallet
        );


        console.log(
            "🔑 TEST wallet:",
            wallet
        );


        ////////////////////////////////////////////////////
        // STEP 3 — CONTEST CHECK
        ////////////////////////////////////////////////////

        let contest =
            null;


        if (
            typeof currentContest !==
                "undefined" &&
            currentContest
        ) {

            contest =
                currentContest;

        }
        else {

            contest =
                await this.getCurrentContest();

        }


        if (
            !contest ||
            !contest.id
        ) {

            throw new Error(
                "No active Meme of the Week contest."
            );

        }


        console.log(
            "🔥 TEST contest:",
            contest.id
        );


        ////////////////////////////////////////////////////
        // STEP 4 — CHECK EXISTING SUBMISSION
        ////////////////////////////////////////////////////

        const existing =
            await this.checkExistingSubmission(
                wallet
            );


        if (
            existing.submissionCount >
            0
        ) {

            throw new Error(
                "This wallet already has a submission for the current contest."
            );

        }


        ////////////////////////////////////////////////////
        // STEP 5 — SPARKD BALANCE
        ////////////////////////////////////////////////////

        console.log(
            "🪙 TEST MODE: Checking SPARKD balance..."
        );


        const balance =
            await this.checkBalance(
                wallet
            );


        if (
            !balance.canSubmit
        ) {

            throw new Error(
                "SPARKD balance verification failed."
            );

        }


        console.log(
            "🔥 TEST SPARKD balance verified:",
            balance.balance
        );


        ////////////////////////////////////////////////////
        // STEP 6 — FORGE DATA CHECK
        ////////////////////////////////////////////////////

        if (
            !forgeData ||
            typeof forgeData !==
                "object"
        ) {

            throw new Error(
                "SPARKD Forge verification data is missing."
            );

        }


        ////////////////////////////////////////////////////
        // STEP 7 — SERVER-SIDE FORGE VERIFICATION
        ////////////////////////////////////////////////////

        const forgeVerification =
            await this.verifyForge(

                wallet,

                forgeData

            );


        console.log(
            "🔥 TEST Forge DNA verified."
        );


        ////////////////////////////////////////////////////
        // STEP 8 — UPLOAD IMAGE
        ////////////////////////////////////////////////////

        const upload =
            await this.uploadMeme(

                file,

                wallet,

                contest.id

            );


        console.log(
            "🔥 TEST meme uploaded:",
            upload.path
        );


        ////////////////////////////////////////////////////
        // STEP 9 — CREATE DATABASE SUBMISSION
        ////////////////////////////////////////////////////

        const client =
            this.getSupabaseClient();


        const submissionId =
            crypto.randomUUID();


        const submissionData = {

            id:
                submissionId,

            contest_id:
                contest.id,

            creator_id:
                forgeVerification.creatorID ||
                forgeData.creatorID,

            wallet_address:
                wallet,

            meme_title:
                memeTitle ||
                "Untitled SPARKD Meme",

            meme_image_url:
                upload.path,

            dna_verified:
                true,

            dna_verification_data:
                forgeData,

            burn_amount:
                0,

            burn_transaction:
                null,

            burn_verified:
                false,

            status:
                "pending"

        };


        ////////////////////////////////////////////////////
        // INSERT DATABASE ROW
        ////////////////////////////////////////////////////

        console.log(
            "💾 TEST inserting submission row..."
        );


        const {
            error:
                submissionError
        } =
            await client

                .from(
                    "meme_week_submissions"
                )

                .insert(
                    submissionData
                );


        if (
            submissionError
        ) {

            console.error(
                "SPARKD submission database error:",
                submissionError
            );


            ////////////////////////////////////////////////////
            // CLEAN UP UPLOADED IMAGE
            ////////////////////////////////////////////////////

            console.log(
                "🧹 Removing uploaded image because database insert failed..."
            );


            const {
                error:
                    cleanupError
            } =
                await client

                    .storage

                    .from(
                        this.BUCKET
                    )

                    .remove([
                        upload.path
                    ]);


            if (
                cleanupError
            ) {

                console.error(
                    "⚠️ Image cleanup also failed:",
                    cleanupError
                );

            }


            throw new Error(
                submissionError.message
            );

        }


        ////////////////////////////////////////////////////
        // SUCCESS
        ////////////////////////////////////////////////////

        const submission = {

            id:
                submissionId,

            ...submissionData

        };


        console.log(
            "🔥🔥 SPARKD MEME OF THE WEEK TEST SUBMISSION SUCCESS:",
            submission
        );


        return {

            success:
                true,

            test:
                true,

            submission:
                submission

        };

    },


    ////////////////////////////////////////////////////
    // FIND SPARKD TOKEN-2022 ACCOUNT
    //
    // READ ONLY
    //
    // NO TRANSACTION
    // NO TRANSFER
    // NO BURN
    ////////////////////////////////////////////////////

    async findSparkdTokenAccount(
        wallet
    ) {

        this.validateWallet(
            wallet
        );


        console.log(
            "🔎 Finding SPARKD Token-2022 account..."
        );


        const provider =
            getContestWalletProvider();


        if (!provider) {

            throw new Error(
                "Phantom Wallet was not detected."
            );

        }


        ////////////////////////////////////////////////////
        // PUBLIC SOLANA CONNECTION
        //
        // READ ONLY
        ////////////////////////////////////////////////////

        const connection =
            new solanaWeb3.Connection(

                "https://api.mainnet-beta.solana.com",

                "confirmed"

            );


        const owner =
            new solanaWeb3.PublicKey(
                wallet
            );


        const mint =
            new solanaWeb3.PublicKey(
                "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
            );


        ////////////////////////////////////////////////////
        // TOKEN-2022 ACCOUNT LOOKUP
        ////////////////////////////////////////////////////

        const accounts =
            await connection.getParsedTokenAccountsByOwner(

                owner,

                {

                    mint:
                        mint,

                    programId:
                        splToken.TOKEN_2022_PROGRAM_ID

                }

            );


        console.log(
            "🪙 SPARKD Token-2022 accounts:",
            accounts.value
        );


        if (
            !accounts.value ||
            accounts.value.length === 0
        ) {

            throw new Error(
                "No Token-2022 SPARKD token account was found for this wallet."
            );

        }


        const account =
            accounts.value[0];


        const tokenAccount =
            account.pubkey;


        const parsed =
            account.account.data.parsed;


        const tokenAmount =
            parsed?.info?.tokenAmount;


        const balance =
            Number(
                tokenAmount?.uiAmount || 0
            );


        const decimals =
            Number(
                tokenAmount?.decimals
            );


        if (
            decimals !==
            6
        ) {

            throw new Error(
                "Unexpected SPARKD decimals: " +
                decimals
            );

        }


        console.log(
            "🔥 SPARKD Token-2022 account found:",
            tokenAccount.toString()
        );


        console.log(
            "🪙 SPARKD token balance:",
            balance
        );


        console.log(
            "🔢 SPARKD decimals:",
            decimals
        );


        return {

            tokenAccount:
                tokenAccount.toString(),

            mint:
                mint.toString(),

            balance:
                balance,

            decimals:
                decimals,

            program:
                "Token-2022"

        };

    },



    ////////////////////////////////////////////////////
    // REAL TEST SUBMISSION
    //
    // DATABASE INSERT ENABLED
    //
    // STILL NO TOKEN BURN
    // STILL NO SOL TRANSFER
    ////////////////////////////////////////////////////

    async submitMemeTest(
        file,
        forgeData,
        memeTitle
    ) {


        console.log(
            "🧪 SPARKD TEST SUBMISSION STARTING..."
        );


        ////////////////////////////////////////////////////
        // STEP 1 — BASIC FILE CHECK
        ////////////////////////////////////////////////////

        this.validateFile(
            file
        );


        ////////////////////////////////////////////////////
        // STEP 2 — CONNECTED PHANTOM WALLET
        //
        // Uses the wallet already connected by
        // the Meme of the Week contest wallet system.
        //
        // NO TOKEN TRANSACTION
        // NO TOKEN BURN
        // NO SOL TRANSFER
        ////////////////////////////////////////////////////

        const wallet =
            typeof currentWallet !==
                "undefined"
                ? currentWallet
                : null;


        ////////////////////////////////////////////////////
        // WALLET CHECK
        ////////////////////////////////////////////////////

        if (
            typeof wallet !==
                "string" ||
            !wallet
        ) {

            throw new Error(
                "Please connect your Phantom wallet first."
            );

        }


        ////////////////////////////////////////////////////
        // VALIDATE WALLET
        ////////////////////////////////////////////////////

        this.validateWallet(
            wallet
        );


        console.log(
            "🔑 TEST wallet:",
            wallet
        );


        ////////////////////////////////////////////////////
        // STEP 3 — CONTEST CHECK
        ////////////////////////////////////////////////////

        let contest =
            null;


        if (
            typeof currentContest !==
                "undefined" &&
            currentContest
        ) {

            contest =
                currentContest;

        }
        else {

            contest =
                await this.getCurrentContest();

        }


        if (
            !contest ||
            !contest.id
        ) {

            throw new Error(
                "No active Meme of the Week contest."
            );

        }


        console.log(
            "🔥 TEST contest:",
            contest.id
        );


        ////////////////////////////////////////////////////
        // STEP 4 — CHECK EXISTING SUBMISSION
        ////////////////////////////////////////////////////

        const existing =
            await this.checkExistingSubmission(
                wallet
            );


        if (
            existing.submissionCount >
            0
        ) {

            throw new Error(

                "This wallet already has a submission for the current contest."

            );

        }


        ////////////////////////////////////////////////////
        // STEP 5 — SPARKD BALANCE
        ////////////////////////////////////////////////////

        console.log(
            "🪙 TEST MODE: Checking SPARKD balance..."
        );


        const balance =
            await this.checkBalance(
                wallet
            );


        if (
            !balance.canSubmit
        ) {

            throw new Error(
                "SPARKD balance verification failed."
            );

        }


        console.log(
            "🔥 TEST SPARKD balance verified:",
            balance.balance
        );


        ////////////////////////////////////////////////////
        // STEP 6 — FORGE DATA CHECK
        ////////////////////////////////////////////////////

        if (
            !forgeData ||
            typeof forgeData !==
                "object"
        ) {

            throw new Error(
                "SPARKD Forge verification data is missing."
            );

        }


        ////////////////////////////////////////////////////
        // STEP 7 — SERVER-SIDE FORGE VERIFICATION
        ////////////////////////////////////////////////////

        const forgeVerification =
            await this.verifyForge(

                wallet,

                forgeData

            );


        console.log(
            "🔥 TEST Forge DNA verified."
        );


        ////////////////////////////////////////////////////
        // STEP 8 — UPLOAD IMAGE
        ////////////////////////////////////////////////////

        const upload =
            await this.uploadMeme(

                file,

                wallet,

                contest.id

            );


        console.log(
            "🔥 TEST meme uploaded:",
            upload.path
        );


        ////////////////////////////////////////////////////
        // STEP 9 — CREATE DATABASE SUBMISSION
        ////////////////////////////////////////////////////

        const client =
            this.getSupabaseClient();


        const submissionId =
            crypto.randomUUID();


        const submissionData = {

            id:
                submissionId,

            contest_id:
                contest.id,

            creator_id:
                forgeVerification.creatorID ||
                forgeData.creatorID,

            wallet_address:
                wallet,

            meme_title:
                memeTitle ||
                "Untitled SPARKD Meme",

            meme_image_url:
                upload.path,

            dna_verified:
                true,

            dna_verification_data:
                forgeData,

            burn_amount:
                0,

            burn_transaction:
                null,

            burn_verified:
                false,

            status:
                "pending"

        };


        ////////////////////////////////////////////////////
        // INSERT DATABASE ROW
        ////////////////////////////////////////////////////

        console.log(
            "💾 TEST inserting submission row..."
        );


        const {
            error:
                submissionError
        } =
            await client

                .from(
                    "meme_week_submissions"
                )

                .insert(
                    submissionData
                );


        ////////////////////////////////////////////////////
        // DATABASE ERROR
        ////////////////////////////////////////////////////

        if (
            submissionError
        ) {

            console.error(
                "SPARKD submission database error:",
                submissionError
            );


            ////////////////////////////////////////////////////
            // CLEAN UP UPLOADED IMAGE
            ////////////////////////////////////////////////////

            console.log(
                "🧹 Removing uploaded image because database insert failed..."
            );


            const {
                error:
                    cleanupError
            } =
                await client

                    .storage

                    .from(
                        this.BUCKET
                    )

                    .remove([
                        upload.path
                    ]);


            if (
                cleanupError
            ) {

                console.error(
                    "⚠️ Image cleanup also failed:",
                    cleanupError
                );

            }


            throw new Error(
                submissionError.message
            );

        }


        ////////////////////////////////////////////////////
        // SUCCESS
        ////////////////////////////////////////////////////

        const submission = {

            id:
                submissionId,

            ...submissionData

        };


        console.log(
            "🔥🔥 SPARKD MEME OF THE WEEK TEST SUBMISSION SUCCESS:",
            submission
        );


        return {

            success:
                true,

            test:
                true,

            submission:
                submission

        };

    }

};


////////////////////////////////////////////////////
// OPTIONAL GLOBAL TEST HELPER
////////////////////////////////////////////////////

window.SPARKD_CONTEST_TEST =
    async function (
        file,
        forgeData,
        memeTitle
    ) {

        return await window.SPARKD_CONTEST.submitMemeTest(

            file,

            forgeData,

            memeTitle

        );

    };


////////////////////////////////////////////////////
// READ-ONLY TOKEN-2022 ACCOUNT TEST
////////////////////////////////////////////////////

window.SPARKD_TOKEN2022_TEST =
    async function () {

        try {

            if (
                typeof currentWallet ===
                    "undefined" ||
                !currentWallet
            ) {

                throw new Error(
                    "Please connect your Phantom wallet first."
                );

            }


            const result =
                await window.SPARKD_CONTEST.findSparkdTokenAccount(

                    currentWallet

                );


            console.log(
                "🔥 SPARKD Token-2022 READ-ONLY TEST RESULT:",
                result
            );


            return result;

        }
        catch (error) {

            console.error(
                "❌ SPARKD Token-2022 read-only test failed:",
                error
            );


            throw error;

        }

    };


////////////////////////////////////////////////////
// INITIALIZATION LOG
////////////////////////////////////////////////////

console.log(
    "🔥 SPARKD Contest Submission Engine v0.4 loaded."
);

console.log(
    "🧪 Test submission function:",
    "SPARKD_CONTEST.submitMemeTest(file, forgeData, memeTitle)"
);

console.log(
    "🔎 Token-2022 read-only test:",
    "SPARKD_TOKEN2022_TEST()"
);

console.log(
    "🛡️ TEST MODE: No token burns. No SOL transfers."
);

       
      

