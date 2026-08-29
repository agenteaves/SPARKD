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

                this.CONFIG.SUPER_HANDLER_URL,

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
// GET EXISTING BURN RECEIPT
//
// READ ONLY
////////////////////////////////////////////////////

async getBurnReceipt(
    wallet,
    contestId
) {


    this.validateWallet(
        wallet
    );


    if (
        !contestId
    ) {

        throw new Error(
            "Contest ID is required."
        );

    }


    console.log(
        "🔎 SPARKD checking burn receipt..."
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

                        action:
                            "get_burn_receipt",

                        wallet:
                            wallet,

                        contestId:
                            contestId

                    })

            }

        );


    if (
        !response.ok
    ) {

        throw new Error(

            "Burn receipt check returned HTTP " +
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
            "Unable to check burn receipt."

        );

    }


    console.log(
        "🔥 SPARKD burn receipt check:",
        result
    );


    return result;

},
    
////////////////////////////////////////////////////
// RECORD VERIFIED BURN RECEIPT
////////////////////////////////////////////////////

async recordBurnReceipt(
    wallet,
    contestId,
    burnTransaction
) {

    this.validateWallet(
        wallet
    );


    if (
        !contestId ||
        !burnTransaction
    ) {

        throw new Error(
            "Contest ID and burn transaction are required."
        );

    }


    console.log(
        "🔥 Recording verified SPARKD burn receipt..."
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
                        action:
                            "record_burn_receipt",

                        wallet:
                            wallet,

                        contestId:
                            contestId,

                        burnTransaction:
                            burnTransaction
                    })
            }
        );


    const result =
        await response.json();


    if (
        !response.ok ||
        result?.success !== true ||
        result?.recorded !== true ||
        result?.verified !== true
    ) {

        throw new Error(
            result?.error ||
            "Unable to record verified SPARKD burn receipt."
        );

    }


    console.log(
        "🔥 SPARKD burn receipt recorded:",
        result
    );


    return result;

},

////////////////////////////////////////////////////
// FINALIZE VERIFIED SUBMISSION
////////////////////////////////////////////////////

async finalizeSubmission(
    wallet,
    contestId,
    burnTransaction,
    submissionId,
    creatorId,
    memeTitle,
    memeImageUrl,
    dnaVerificationData
) {

    this.validateWallet(
        wallet
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
                        action:
                            "finalize_submission",

                        wallet:
                            wallet,

                        contestId:
                            contestId,

                        burnTransaction:
                            burnTransaction,

                        submissionId:
                            submissionId,

                        creatorId:
                            creatorId,

                        memeTitle:
                            memeTitle,

                        memeImageUrl:
                            memeImageUrl,

                        dnaVerificationData:
                            dnaVerificationData
                    })
            }
        );


    const result =
        await response.json();


    if (
        !response.ok ||
        result?.success !== true ||
        result?.finalized !== true
    ) {

        throw new Error(
            result?.error ||
            "Unable to finalize SPARKD contest submission."
        );

    }


    console.log(
        "💾 SPARKD contest submission finalized:",
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
// REAL PRODUCTION SUBMISSION
//
// VERIFIED TOKEN-2022 BURN + SERVER FINALIZATION
//
// Burns exactly 2,000 SPARKD after validation.
// Includes burn-receipt recovery protection.
////////////////////////////////////////////////////

    async submitMeme(
        file,
        forgeData,
        memeTitle
    ) {

        console.log(
    "🔥 SPARKD REAL PRODUCTION SUBMISSION STARTING..."
);


        ////////////////////////////////////////////////////
        // STEP 1 — FILE
        ////////////////////////////////////////////////////

        this.validateFile(
            file
        );


        ////////////////////////////////////////////////////
        // STEP 2 — CONNECTED PHANTOM WALLET
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
    "🔑 PRODUCTION wallet:",
    wallet
);


        ////////////////////////////////////////////////////
        // STEP 3 — CURRENT CONTEST
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
    "🔥 PRODUCTION contest:",
    contest.id
);


       ////////////////////////////////////////////////////
// STEP 4 — EXISTING SUBMISSION CHECK
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
// STEP 5–7 — BALANCE / TOKEN ACCOUNT
//
// SKIP DURING VERIFIED RECEIPT RECOVERY
////////////////////////////////////////////////////

let balance =
    null;


let tokenAccount =
    null;


const recoveringExistingBurn =
    existingBurnReceipt?.found ===
        true &&
    existingBurnReceipt?.verified ===
        true &&
    existingBurnReceipt?.receipt?.burn_transaction;


if (
    recoveringExistingBurn
) {

    console.log(
        "♻️ Recovery mode: skipping new SPARKD balance and token-account requirements."
    );

}
else {

    ////////////////////////////////////////////////////
    // STEP 5 — SPARKD BALANCE
    ////////////////////////////////////////////////////

    console.log(
        "🪙 Checking SPARKD balance..."
    );


    balance =
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
        "🔥 SPARKD balance:",
        balance.balance
    );


    ////////////////////////////////////////////////////
    // STEP 6 — FIND TOKEN-2022 ACCOUNT
    ////////////////////////////////////////////////////

    console.log(
        "🔎 Finding SPARKD Token-2022 account..."
    );


    tokenAccount =
        await this.findSparkdTokenAccount(
            wallet
        );


    if (
        !tokenAccount ||
        !tokenAccount.tokenAccount
    ) {

        throw new Error(
            "Unable to locate the SPARKD Token-2022 account."
        );

    }


    ////////////////////////////////////////////////////
    // STEP 7 — VERIFY TOKEN INFORMATION
    ////////////////////////////////////////////////////

    if (
        tokenAccount.mint !==
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
    ) {

        throw new Error(
            "SPARKD Token-2022 mint verification failed."
        );

    }


    if (
        tokenAccount.decimals !==
        6
    ) {

        throw new Error(
            "SPARKD Token-2022 decimal verification failed."
        );

    }


    if (
        tokenAccount.balance <
        this.REQUIRED_SPARKD
    ) {

        throw new Error(
            "SPARKD Token-2022 account balance is below the required amount."
        );

    }


    console.log(
        "🔥 SPARKD Token-2022 account verified:",
        tokenAccount.tokenAccount
    );


    console.log(
        "🪙 SPARKD Token-2022 balance:",
        tokenAccount.balance
    );

}


        ////////////////////////////////////////////////////
        // STEP 8 — FORGE DATA
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
        // STEP 9 — SERVER-SIDE FORGE VERIFICATION
        ////////////////////////////////////////////////////

        const forgeVerification =
            await this.verifyForge(

                wallet,

                forgeData

            );


        console.log(
            "🧬 DRY RUN Forge DNA verified:",
            forgeVerification
        );


      ////////////////////////////////////////////////////
// STEP 10 — PREPARE SUBMISSION ID
////////////////////////////////////////////////////

const submissionId =
    crypto.randomUUID();


const creatorId =
    forgeVerification.creatorID ||
    forgeData.creatorID;


////////////////////////////////////////////////////
// STEP 11 — RECOVERY OR NEW BURN
////////////////////////////////////////////////////

let burnTransaction =
    null;


let upload =
    null;


let burnedNow =
    false;


if (
    recoveringExistingBurn
) {

    ////////////////////////////////////////////////////
    // RECOVERY MODE
    //
    // NEVER BURN AGAIN
    ////////////////////////////////////////////////////

    burnTransaction =
        existingBurnReceipt
            .receipt
            .burn_transaction;


    console.log(
        "♻️ Recovering existing verified SPARKD burn:",
        burnTransaction
    );


    ////////////////////////////////////////////////////
    // UPLOAD IMAGE FOR RECOVERY FINALIZATION
    ////////////////////////////////////////////////////

    console.log(
        "🖼️ Uploading SPARKD contest meme for recovery..."
    );


    upload =
        await this.uploadMeme(
            file,
            wallet,
            contest.id
        );


    if (
        !upload ||
        !upload.path
    ) {

        throw new Error(
            "SPARKD meme upload failed during recovery."
        );

    }

}
else {

    ////////////////////////////////////////////////////
    // NEW SUBMISSION
    //
    // UPLOAD BEFORE BURN
    ////////////////////////////////////////////////////

    console.log(
        "🖼️ Uploading SPARKD contest meme..."
    );


    upload =
        await this.uploadMeme(
            file,
            wallet,
            contest.id
        );


    if (
        !upload ||
        !upload.path
    ) {

        throw new Error(
            "SPARKD meme upload failed."
        );

    }


    console.log(
        "🔥 SPARKD meme uploaded:",
        upload.path
    );


    ////////////////////////////////////////////////////
    // REAL TOKEN-2022 BURN
    ////////////////////////////////////////////////////

    console.log(
        "🔥 Requesting REAL 2,000 SPARKD burn..."
    );


    let burnResult;


    try {

        burnResult =
            await this.executeSparkdBurn(
                wallet
            );

    }
    catch (error) {

        ////////////////////////////////////////////////////
        // BURN FAILED — REMOVE UPLOADED IMAGE
        ////////////////////////////////////////////////////

        console.error(
            "❌ SPARKD burn failed:",
            error
        );


        try {

            const cleanupClient =
                this.getSupabaseClient();


            await cleanupClient
                .storage
                .from(
                    this.BUCKET
                )
                .remove([
                    upload.path
                ]);


            console.log(
                "🧹 Uploaded meme removed because burn failed."
            );

        }
        catch (cleanupError) {

            console.error(
                "⚠️ Failed to clean up uploaded meme:",
                cleanupError
            );

        }


        throw error;

    }


    ////////////////////////////////////////////////////
    // VERIFY BURN RESULT
    ////////////////////////////////////////////////////

    if (
        !burnResult ||
        burnResult.success !== true ||
        burnResult.burned !== true ||
        burnResult.verified !== true
    ) {

        throw new Error(
            "SPARKD burn was not successfully verified."
        );

    }


    if (
        burnResult.burnAmount !==
        this.REQUIRED_SPARKD
    ) {

        throw new Error(
            "Verified SPARKD burn amount is incorrect."
        );

    }


    if (
        burnResult.rawBurnAmount !==
        "2000000000"
    ) {

        throw new Error(
            "Verified SPARKD raw burn amount is incorrect."
        );

    }


    if (
        burnResult.mint !==
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
    ) {

        throw new Error(
            "Verified SPARKD burn mint is incorrect."
        );

    }


    if (
        typeof burnResult.burnTransaction !==
            "string" ||
        !burnResult.burnTransaction
    ) {

        throw new Error(
            "Verified SPARKD burn transaction signature is missing."
        );

    }


    burnTransaction =
        burnResult.burnTransaction;


    burnedNow =
        true;


    console.log(
        "✅ REAL SPARKD burn verified:",
        burnTransaction
    );


////////////////////////////////////////////////////
// RECORD BURN RECEIPT IMMEDIATELY
////////////////////////////////////////////////////

////////////////////////////////////////////////////
// SAVE LOCAL BURN RECOVERY MARKER
//
// DO THIS BEFORE RECORDING THE SERVER RECEIPT
////////////////////////////////////////////////////

const burnRecoveryKey =
    `sparkd_burn_recovery_${contest.id}_${wallet}`;

localStorage.setItem(
    burnRecoveryKey,
    JSON.stringify({
        contestId:
            contest.id,
        wallet:
            wallet,
        burnTransaction:
            burnResult.burnTransaction,
        createdAt:
            new Date().toISOString()
    })
);

console.log(
    "🛡️ Local SPARKD burn recovery marker saved:",
    burnResult.burnTransaction
);

try {

    await this.recordBurnReceipt(
        wallet,
        contest.id,
        burnResult.burnTransaction
    );

}
catch (error) {

    throw new Error(
        "The 2,000 SPARKD burn succeeded, but the burn receipt could not be recorded. Burn transaction: " +
        burnResult.burnTransaction +
        ". DO NOT BURN AGAIN. " +
        (
            error?.message ||
            error
        )
    );

}
}    

////////////////////////////////////////////////////
// STEP 12 — FINALIZE THROUGH SERVER
////////////////////////////////////////////////////

console.log(
    "💾 Finalizing verified SPARKD contest submission..."
);


let finalized;


try {

    finalized =
        await this.finalizeSubmission(
            wallet,
            contest.id,
            burnTransaction,
            submissionId,
            creatorId,
            memeTitle ||
                "Untitled SPARKD Meme",
            upload.path,
            forgeData
        );

}
catch (error) {

    ////////////////////////////////////////////////////
    // DO NOT REMOVE IMAGE AFTER VERIFIED BURN
    //
    // RECOVERY NEEDS THE SAME IMAGE PATH
    ////////////////////////////////////////////////////

    throw new Error(
        "SPARKD burn is already verified, but submission finalization failed. Burn transaction: " +
        burnTransaction +
        ". DO NOT BURN AGAIN. " +
        (
            error?.message ||
            error
        )
    );

}


////////////////////////////////////////////////////
// STEP 13 — SUCCESS
////////////////////////////////////////////////////

console.log(
    "🔥🔥 SPARKD REAL CONTEST SUBMISSION SUCCESS:",
    finalized.submission
);
        
////////////////////////////////////////////////////
// CLEAR LOCAL BURN RECOVERY MARKER
//
// ONLY AFTER FINALIZATION SUCCEEDS
////////////////////////////////////////////////////

localStorage.removeItem(
    `sparkd_burn_recovery_${contest.id}_${wallet}`
);

console.log(
    "🧹 SPARKD burn recovery marker cleared."
);

return {

    success:
        true,

    test:
        false,

    burned:
        burnedNow,

    recovered:
        recoveringExistingBurn,

    burnVerified:
        true,

    burnTransaction:
        burnTransaction,

    submission:
        finalized.submission

};

},

////////////////////////////////////////////////////
// FIND SPARKD TOKEN-2022 ACCOUNT
//
// READ ONLY
//
// Uses the SPARKD super-handler and the private
// Solana RPC configured server-side.
//
// NO TRANSACTION
// NO TRANSFER
// NO BURN
////////////////////////////////////////////////////

async findSparkdTokenAccount(
    wallet
) {

    ////////////////////////////////////////////////////
    // VALIDATE WALLET
    ////////////////////////////////////////////////////

    this.validateWallet(
        wallet
    );


    console.log(
        "🔎 Finding SPARKD Token-2022 account..."
    );


 
////////////////////////////////////////////////////
// CALL SUPER-HANDLER
////////////////////////////////////////////////////

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

                    action:
                        "find_token_account",

                    wallet:
                        wallet

                })

        }

    );



    ////////////////////////////////////////////////////
    // HTTP ERROR
    ////////////////////////////////////////////////////

    if (
        !response.ok
    ) {

        let errorMessage =
            "SPARKD token account lookup failed.";


        try {

            const errorData =
                await response.json();


            if (
                errorData?.error
            ) {

                errorMessage =
                    errorData.error;

            }

        }
        catch {
            // Keep default error message.
        }


        throw new Error(
            errorMessage
        );

    }


    ////////////////////////////////////////////////////
    // PARSE RESULT
    ////////////////////////////////////////////////////

    const result =
        await response.json();


    ////////////////////////////////////////////////////
    // VALIDATE SERVER RESPONSE
    ////////////////////////////////////////////////////

    if (
        !result ||
        result.success !==
            true ||
        result.found !==
            true
    ) {

        throw new Error(
            result?.error ||
            "SPARKD Token-2022 account was not found."
        );

    }


    ////////////////////////////////////////////////////
    // VERIFY MINT
    ////////////////////////////////////////////////////

    if (
        result.mint !==
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
    ) {

        throw new Error(
            "SPARKD mint verification failed."
        );

    }


    ////////////////////////////////////////////////////
    // VERIFY TOKEN-2022 PROGRAM
    ////////////////////////////////////////////////////

    if (
        result.program !==
        "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    ) {

        throw new Error(
            "SPARKD Token-2022 program verification failed."
        );

    }


    ////////////////////////////////////////////////////
    // VERIFY DECIMALS
    ////////////////////////////////////////////////////

    if (
        Number(
            result.decimals
        ) !==
        6
    ) {

        throw new Error(
            "Unexpected SPARKD decimals: " +
            result.decimals
        );

    }


    ////////////////////////////////////////////////////
    // FINAL READ-ONLY RESULT
    ////////////////////////////////////////////////////

    const tokenAccountResult = {

        tokenAccount:
            result.tokenAccount,

        mint:
            result.mint,

        balance:
            Number(
                result.balance ||
                0
            ),

        rawAmount:
            result.rawAmount,

        decimals:
            Number(
                result.decimals
            ),

        program:
            result.program,

        sufficientBalance:
            result.sufficientBalance ===
            true

    };


    console.log(
        "🔥 SPARKD Token-2022 READ-ONLY ACCOUNT RESULT:",
        tokenAccountResult
    );


    return tokenAccountResult;

},
    

    ////////////////////////////////////////////////////
    // BUILD SPARKD TOKEN-2022 BURN TRANSACTION
    //
    // IMPORTANT:
    // BUILDS ONLY.
    // DOES NOT SIGN.
    // DOES NOT SEND.
    // DOES NOT BURN.
    ////////////////////////////////////////////////////

    async buildSparkdBurnTransaction(wallet) {

        console.log(
            "🔥 Building SPARKD Token-2022 BurnChecked transaction..."
        );


        ////////////////////////////////////////////////////
        // VALIDATE WALLET
        ////////////////////////////////////////////////////

        if (
            typeof wallet !== "string" ||
            !wallet
        ) {

            throw new Error(
                "A connected wallet is required."
            );

        }


        ////////////////////////////////////////////////////
        // REQUIRE SOLANA WEB3
        ////////////////////////////////////////////////////

        if (
            !window.solanaWeb3
        ) {

            throw new Error(
                "Solana Web3.js is not available."
            );

        }


        ////////////////////////////////////////////////////
        // GET VERIFIED SPARKD TOKEN ACCOUNT
        ////////////////////////////////////////////////////

        const tokenAccountResult =
            await this.findSparkdTokenAccount(
                wallet
            );


        if (
            !tokenAccountResult ||
            !tokenAccountResult.tokenAccount
        ) {

            throw new Error(
                "Unable to find the SPARKD Token-2022 account."
            );

        }


        if (
            tokenAccountResult.sufficientBalance !== true
        ) {

            throw new Error(
                "Wallet does not have enough SPARKD to burn 2,000 tokens."
            );

        }


        ////////////////////////////////////////////////////
        // GET FRESH BLOCKHASH + SERVER BURN PARAMETERS
        ////////////////////////////////////////////////////

        const prepareResponse =
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

                            action:
                                "prepare_burn",

                            wallet:
                                wallet

                        })

                }

            );


        const prepareResult =
            await prepareResponse.json();


        if (
            !prepareResponse.ok ||
            prepareResult.success !== true ||
            prepareResult.prepared !== true
        ) {

            throw new Error(

                prepareResult?.error ||
                "Unable to prepare SPARKD burn transaction."

            );

        }


        ////////////////////////////////////////////////////
        // EXPECTED SPARKD VALUES
        ////////////////////////////////////////////////////

        const expectedMint =
            "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";


        const expectedProgram =
            "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";


        const expectedRawAmount =
            "2000000000";


        const expectedDecimals =
            6;


        ////////////////////////////////////////////////////
        // VERIFY SERVER VALUES BEFORE BUILDING
        ////////////////////////////////////////////////////

        if (
            prepareResult.mint !== expectedMint
        ) {

            throw new Error(
                "Server returned an unexpected SPARKD mint."
            );

        }


        if (
            prepareResult.tokenProgram !== expectedProgram
        ) {

            throw new Error(
                "Server returned an unexpected Token-2022 program."
            );

        }


        if (
            String(
                prepareResult.rawBurnAmount
            ) !== expectedRawAmount
        ) {

            throw new Error(
                "Server returned an unexpected SPARKD burn amount."
            );

        }


        if (
            Number(
                prepareResult.decimals
            ) !== expectedDecimals
        ) {

            throw new Error(
                "Server returned unexpected SPARKD decimals."
            );

        }


        ////////////////////////////////////////////////////
        // PUBLIC KEYS
        ////////////////////////////////////////////////////

        const walletPublicKey =
            new window.solanaWeb3.PublicKey(
                wallet
            );


        const tokenAccountPublicKey =
            new window.solanaWeb3.PublicKey(
                tokenAccountResult.tokenAccount
            );


        const mintPublicKey =
            new window.solanaWeb3.PublicKey(
                expectedMint
            );


        const tokenProgramPublicKey =
            new window.solanaWeb3.PublicKey(
                expectedProgram
            );


        ////////////////////////////////////////////////////
        // BUILD BURN CHECKED DATA
        //
        // Byte 0:
        // Token instruction discriminator = 15
        //
        // Bytes 1-8:
        // u64 little-endian raw amount
        //
        // Byte 9:
        // decimals = 6
        ////////////////////////////////////////////////////

        const instructionData =
            new Uint8Array(10);


        instructionData[0] =
            15;


        const amount =
            BigInt(
                expectedRawAmount
            );


        for (
            let i = 0;
            i < 8;
            i++
        ) {

            instructionData[
                1 + i
            ] =
                Number(
                    (
                        amount >>
                        BigInt(
                            8 * i
                        )
                    ) &
                    255n
                );

        }


        instructionData[9] =
            expectedDecimals;


        ////////////////////////////////////////////////////
        // BUILD TOKEN-2022 BURN CHECKED INSTRUCTION
        ////////////////////////////////////////////////////

        const burnInstruction =
            new window.solanaWeb3.TransactionInstruction({

                programId:
                    tokenProgramPublicKey,

                keys: [

                    {
                        pubkey:
                            tokenAccountPublicKey,

                        isSigner:
                            false,

                        isWritable:
                            true
                    },

                    {
                        pubkey:
                            mintPublicKey,

                        isSigner:
                            false,

                        isWritable:
                            true
                    },

                    {
                        pubkey:
                            walletPublicKey,

                        isSigner:
                            true,

                        isWritable:
                            false
                    }

                ],

                data:
                    instructionData

            });


        ////////////////////////////////////////////////////
        // BUILD TRANSACTION
        ////////////////////////////////////////////////////

        const transaction =
            new window.solanaWeb3.Transaction();


        transaction.add(
            burnInstruction
        );


        transaction.feePayer =
            walletPublicKey;


        transaction.recentBlockhash =
            prepareResult.blockhash;


        ////////////////////////////////////////////////////
        // LOG EVERYTHING BEFORE ANY SIGNING
        ////////////////////////////////////////////////////

        const result = {

            transaction:
                transaction,

            tokenAccount:
                tokenAccountResult.tokenAccount,

            mint:
                expectedMint,

            wallet:
                wallet,

            tokenProgram:
                expectedProgram,

            burnAmount:
                2000,

            rawBurnAmount:
                expectedRawAmount,

            decimals:
                expectedDecimals,

            blockhash:
                prepareResult.blockhash,

            lastValidBlockHeight:
                prepareResult.lastValidBlockHeight,

            instructionData:
                Array.from(
                    instructionData
                ),

            signed:
                false,

            sent:
                false,

            burned:
                false

        };


        console.log(
            "🔥 SPARKD BurnChecked transaction BUILT — NOT SENT:",
            result
        );


        return result;

    },

        ////////////////////////////////////////////////////
    // EXECUTE + VERIFY SPARKD TOKEN-2022 BURN
    //
    // WARNING:
    // Phantom approval WILL send a REAL transaction.
    // Successful execution burns 2,000 SPARKD.
    ////////////////////////////////////////////////////

    async executeSparkdBurn(wallet) {

        console.log(
            "🔥 Preparing REAL 2,000 SPARKD burn..."
        );


        ////////////////////////////////////////////////////
        // VALIDATE WALLET
        ////////////////////////////////////////////////////

        this.validateWallet(
            wallet
        );


        ////////////////////////////////////////////////////
        // REQUIRE PHANTOM
        ////////////////////////////////////////////////////

        if (
            !window.solana ||
            !window.solana.isPhantom
        ) {

            throw new Error(
                "Phantom wallet is required."
            );

        }


        ////////////////////////////////////////////////////
        // VERIFY PHANTOM WALLET MATCHES
        ////////////////////////////////////////////////////

        if (
            !window.solana.publicKey
        ) {

            throw new Error(
                "Please connect Phantom first."
            );

        }


        const phantomWallet =
            window.solana.publicKey.toString();


        if (
            phantomWallet !== wallet
        ) {

            throw new Error(
                "Connected Phantom wallet does not match the contest wallet."
            );

        }


        ////////////////////////////////////////////////////
        // BUILD FRESH BURN TRANSACTION
        ////////////////////////////////////////////////////

        const built =
            await this.buildSparkdBurnTransaction(
                wallet
            );


        if (
            !built ||
            !built.transaction
        ) {

            throw new Error(
                "Unable to build SPARKD burn transaction."
            );

        }


        console.log(
            "⚠️ Phantom will now request approval to burn exactly 2,000 SPARKD."
        );


       ////////////////////////////////////////////////////
// PHANTOM SIGN — SERVER SENDS THROUGH PRIVATE RPC
////////////////////////////////////////////////////

let signedTransaction;


try {

    signedTransaction =
        await window.solana.signTransaction(
            built.transaction
        );

}
catch (error) {

    console.error(
        "❌ Phantom rejected or failed to sign the SPARKD burn:",
        error
    );

    throw error;

}


////////////////////////////////////////////////////
// SERIALIZE SIGNED TRANSACTION
////////////////////////////////////////////////////

if (!signedTransaction) {

    throw new Error(
        "Phantom did not return a signed transaction."
    );

}


const serialized =
    signedTransaction.serialize();


let binary = "";

for (
    let i = 0;
    i < serialized.length;
    i++
) {

    binary +=
        String.fromCharCode(
            serialized[i]
        );

}


const signedTransactionBase64 =
    btoa(binary);


console.log(
    "✍️ SPARKD burn transaction signed by Phantom."
);


////////////////////////////////////////////////////
// SEND THROUGH PRIVATE SOLANA RPC
////////////////////////////////////////////////////

const sendResponse =
    await fetch(
        this.SUPER_HANDLER_URL,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                action: "send_signed_transaction",
                wallet,
                signedTransaction:
                    signedTransactionBase64
            })
        }
    );


const sendResult =
    await sendResponse.json();


if (
    !sendResponse.ok ||
    !sendResult?.success ||
    !sendResult?.sent ||
    !sendResult?.transactionSignature
) {

    console.error(
        "❌ SPARKD private-RPC send failed:",
        sendResult
    );

    throw new Error(
        sendResult?.rpcError?.message ||
        sendResult?.error ||
        "Failed to broadcast signed burn transaction."
    );

}


////////////////////////////////////////////////////
// GET TRANSACTION SIGNATURE
////////////////////////////////////////////////////

const signature =
    sendResult.transactionSignature;


console.log(
    "🔥 SPARKD burn transaction sent through private RPC:",
    signature
);

        ////////////////////////////////////////////////////
        // SERVER-SIDE ON-CHAIN VERIFICATION
        //
        // Transaction may take a moment to reach
        // confirmed status, so retry read-only verification.
        ////////////////////////////////////////////////////

        let verification =
            null;


        const maxAttempts =
            15;


        for (
            let attempt = 1;
            attempt <= maxAttempts;
            attempt++
        ) {

            console.log(
                "🔎 Verifying SPARKD burn on-chain... attempt",
                attempt,
                "of",
                maxAttempts
            );


            const verifyResponse =
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

                                action:
                                    "verify_burn",

                                wallet:
                                    wallet,

                                burnTransaction:
                                    signature

                            })

                    }

                );


            const verifyResult =
                await verifyResponse.json();


            if (
                verifyResponse.ok &&
                verifyResult.success === true &&
                verifyResult.verified === true
            ) {

                verification =
                    verifyResult;

                break;

            }


            ////////////////////////////////////////////////////
            // HARD FAILURE
            //
            // If server explicitly says the transaction
            // exists but does not contain our valid burn,
            // stop instead of retrying.
            ////////////////////////////////////////////////////

            if (
                verifyResult.success === true &&
                verifyResult.verified === false &&
                verifyResult.transactionFound === true
            ) {

                throw new Error(

                    verifyResult.reason ||
                    verifyResult.error ||
                    "The transaction was found but the SPARKD burn could not be verified."

                );

            }


            ////////////////////////////////////////////////////
            // WAIT 1 SECOND BEFORE NEXT READ-ONLY CHECK
            ////////////////////////////////////////////////////

            if (
                attempt <
                maxAttempts
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1000
                        )
                );

            }

        }


        ////////////////////////////////////////////////////
        // VERIFICATION FAILED / NOT CONFIRMED
        ////////////////////////////////////////////////////

        if (
            !verification ||
            verification.verified !== true
        ) {

            throw new Error(

                "The burn transaction was sent, but server verification has not confirmed it yet. Transaction: " +
                signature

            );

        }


        ////////////////////////////////////////////////////
        // FINAL VERIFIED RESULT
        ////////////////////////////////////////////////////

        const result = {

            success:
                true,

            burned:
                true,

            verified:
                true,

            wallet:
                wallet,

            tokenAccount:
                built.tokenAccount,

            mint:
                built.mint,

            burnAmount:
                2000,

            rawBurnAmount:
                "2000000000",

            decimals:
                6,

            burnTransaction:
                signature,

            verification:
                verification

        };


        console.log(
            "🔥🔥 SPARKD REAL BURN VERIFIED:",
            result
        );


        return result;

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
// STEP 4 — RECOVERY STATE CHECK
//
// CHECK BURN RECEIPT BEFORE ANY NEW BURN
////////////////////////////////////////////////////

console.log(
    "🔎 Checking for an existing SPARKD burn receipt..."
);

let existingBurnReceipt =
    await this.getBurnReceipt(
        wallet,
        contest.id
    );

        ////////////////////////////////////////////////////
// LOCAL BURN RECOVERY
//
// IF A BURN SUCCEEDED BUT THE SERVER RECEIPT
// WAS NOT SAVED, RECOVER IT BEFORE ANY NEW BURN.
////////////////////////////////////////////////////

const burnRecoveryKey =
    `sparkd_burn_recovery_${contest.id}_${wallet}`;

const savedBurnRecovery =
    localStorage.getItem(
        burnRecoveryKey
    );

if (
    existingBurnReceipt?.found !== true &&
    savedBurnRecovery
) {

    console.log(
        "🛡️ Local SPARKD burn recovery marker found."
    );

    const recoveryData =
        JSON.parse(
            savedBurnRecovery
        );

    if (
        recoveryData?.burnTransaction
    ) {

        await this.recordBurnReceipt(
            wallet,
            contest.id,
            recoveryData.burnTransaction
        );

        existingBurnReceipt =
            await this.getBurnReceipt(
                wallet,
                contest.id
            );

        console.log(
            "♻️ SPARKD burn receipt recovered from local marker."
        );

    }

}

const existing =
    await this.checkExistingSubmission(
        wallet
    );

////////////////////////////////////////////////////
// VERIFIED RECEIPT EXISTS
//
// NEVER BURN AGAIN FOR THIS CONTEST
////////////////////////////////////////////////////

if (
    existingBurnReceipt?.found === true &&
    existingBurnReceipt?.verified === true &&
    existingBurnReceipt?.receipt?.burn_transaction
) {

    console.log(
        "♻️ Verified SPARKD burn receipt found. Recovery mode enabled:",
        existingBurnReceipt.receipt.burn_transaction
    );

}
else if (
    existing.submissionCount > 0
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

       
      

