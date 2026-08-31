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
// RECENT-BLOCKHASH SAFETY RULES:
// - NEVER create a second burn while the exact signed
//   transaction can still land.
// - If it landed, recover the receipt.
// - If it failed on-chain, clear the marker.
// - If it is not found and its blockhash has expired,
//   it can no longer land, so a fresh burn is safe.
// - Ambiguous/pending states keep the marker.
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

    let recoveryData;

    try {

        recoveryData =
            JSON.parse(
                savedBurnRecovery
            );

    }
    catch {

        throw new Error(
            "The saved SPARKD burn recovery marker is invalid. DO NOT BURN AGAIN until it is checked."
        );

    }

    const matchingRecovery =
        recoveryData?.contestId === contest.id &&
        recoveryData?.wallet === wallet;

    if (
        !matchingRecovery
    ) {

        localStorage.removeItem(
            burnRecoveryKey
        );

    }
    else if (
        recoveryData?.signedTransaction &&
        recoveryData?.burnTransaction &&
        typeof recoveryData?.lastValidBlockHeight === "number"
    ) {

        const recoverySignature =
            recoveryData.burnTransaction;

        console.log(
            "🔎 Checking exact previously signed SPARKD transaction:",
            recoverySignature
        );

        let transactionStatus =
            await this.checkTransactionStatus(
                wallet,
                recoverySignature
            );

        ////////////////////////////////////////////////////
        // TRANSACTION LANDED
        ////////////////////////////////////////////////////

        if (
            transactionStatus?.found === true &&
            !transactionStatus?.err
        ) {

            console.log(
                "♻️ Previously signed SPARKD transaction landed. Recovering receipt..."
            );

            await this.recordBurnReceipt(
                wallet,
                contest.id,
                recoverySignature
            );

            existingBurnReceipt =
                await this.getBurnReceipt(
                    wallet,
                    contest.id
                );

        }

        ////////////////////////////////////////////////////
        // TRANSACTION FAILED ON-CHAIN
        //
        // A failed finalized transaction cannot later burn.
        ////////////////////////////////////////////////////

        else if (
            transactionStatus?.found === true &&
            transactionStatus?.err
        ) {

            console.warn(
                "⚠️ Previous SPARKD transaction failed on-chain. Clearing recovery marker."
            );

            localStorage.removeItem(
                burnRecoveryKey
            );

        }

        ////////////////////////////////////////////////////
        // NOT FOUND — CHECK BLOCKHASH LIFETIME
        ////////////////////////////////////////////////////

        else {

            const currentBlockHeight =
                await this.getCurrentBlockHeight(
                    wallet
                );

            if (
                currentBlockHeight >
                recoveryData.lastValidBlockHeight
            ) {

                console.log(
                    "♻️ Previous SPARKD transaction expired without landing. A fresh burn is now safe."
                );

                localStorage.removeItem(
                    burnRecoveryKey
                );

            }
            else {

                console.log(
                    "♻️ Previously signed SPARKD transaction is still valid. Resubmitting the exact same bytes..."
                );

                try {

                    const resendResult =
                        await this.resendSignedBurnTransaction(
                            wallet,
                            contest.id,
                            recoveryData.signedTransaction
                        );

                    if (
                        resendResult.transactionSignature !==
                        recoverySignature
                    ) {

                        throw new Error(
                            "Recovered SPARKD transaction signature does not match the saved recovery marker. DO NOT BURN AGAIN."
                        );

                    }

                    await this.recordBurnReceipt(
                        wallet,
                        contest.id,
                        recoverySignature
                    );

                    existingBurnReceipt =
                        await this.getBurnReceipt(
                            wallet,
                            contest.id
                        );

                }
                catch (recoveryError) {

                    if (
                        recoveryError?.result?.expired === true &&
                        recoveryError?.result?.safeToRetry === true
                    ) {

                        localStorage.removeItem(
                            burnRecoveryKey
                        );

                        console.log(
                            "♻️ Signed SPARKD transaction expired before broadcast. Recovery marker cleared."
                        );

                    }
                    else {

                        throw new Error(
                            "The previously signed SPARKD burn is still pending or ambiguous. DO NOT BURN AGAIN. Transaction: " +
                            recoverySignature +
                            ". " +
                            (
                                recoveryError?.message ||
                                recoveryError
                            )
                        );

                    }

                }

            }

        }

    }
    else if (
        recoveryData?.burnTransaction
    ) {

        ////////////////////////////////////////////////////
        // LEGACY / INCOMPLETE MARKER
        //
        // Do not guess whether it can still land.
        ////////////////////////////////////////////////////

        const legacyStatus =
            await this.checkTransactionStatus(
                wallet,
                recoveryData.burnTransaction
            );

        if (
            legacyStatus?.found === true &&
            !legacyStatus?.err
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

        }
        else if (
            legacyStatus?.found === true &&
            legacyStatus?.err
        ) {

            localStorage.removeItem(
                burnRecoveryKey
            );

        }
        else {

            throw new Error(
                "A legacy SPARKD burn recovery marker exists and the transaction is not currently visible on-chain. DO NOT BURN AGAIN until it is checked."
            );

        }

    }

}

////////////////////////////////////////////////////
// CHECK EXISTING SUBMISSION
////////////////////////////////////////////////////

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
            "🧬 SPARKD Forge DNA verified:",
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
        wallet,
        contest.id
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
    // BUILDS / VALIDATES ONLY ON THE CLIENT.
    // PHANTOM SIGNS FIRST; SERVER ADDS NONCE AUTHORITY AFTERWARD.
    // DOES NOT OPEN PHANTOM.
    // DOES NOT BROADCAST.
    // DOES NOT BURN.
    ////////////////////////////////////////////////////

   async buildSparkdBurnTransaction(
    wallet,
    contestId
) {

        console.log(
            "🔥 Building clean SPARKD Token-2022 BurnChecked transaction..."
        );

        this.validateWallet(
            wallet
        );

        if (
            !window.solanaWeb3
        ) {

            throw new Error(
                "Solana Web3.js is not available."
            );

        }

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
        // REQUEST SERVER-BUILT RECENT-BLOCKHASH TRANSACTION
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
                                wallet,

                            contestId:
                                contestId,

                            tokenAccount:
                                tokenAccountResult.tokenAccount
                        })
                }
            );

        const prepareResult =
            await prepareResponse.json();

        if (
            !prepareResponse.ok ||
            prepareResult?.success !== true ||
            prepareResult?.prepared !== true ||
            prepareResult?.transactionBuilt !== true ||
            prepareResult?.durableNonce !== false ||
            prepareResult?.signerCount !== 1 ||
            prepareResult?.instructionCount !== 1 ||
            typeof prepareResult?.unsignedTransaction !== "string" ||
            !prepareResult.unsignedTransaction ||
            typeof prepareResult?.recentBlockhash !== "string" ||
            !prepareResult.recentBlockhash ||
            typeof prepareResult?.lastValidBlockHeight !== "number"
        ) {

            throw new Error(
                prepareResult?.error ||
                "Unable to prepare the clean SPARKD burn transaction."
            );

        }

        const expectedMint =
            "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";

        const expectedProgram =
            "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

        const expectedRawAmount =
            "2000000000";

        const expectedDecimals =
            6;

        if (
            prepareResult.mint !== expectedMint ||
            prepareResult.tokenProgram !== expectedProgram ||
            String(prepareResult.rawBurnAmount) !== expectedRawAmount ||
            Number(prepareResult.decimals) !== expectedDecimals
        ) {

            throw new Error(
                "Server returned unexpected SPARKD burn parameters."
            );

        }

        ////////////////////////////////////////////////////
        // DESERIALIZE EXACT SERVER-BUILT TRANSACTION
        ////////////////////////////////////////////////////

        let unsignedTransactionBytes;

        try {

            unsignedTransactionBytes =
                Uint8Array.from(
                    atob(
                        prepareResult.unsignedTransaction
                    ),
                    character =>
                        character.charCodeAt(0)
                );

        }
        catch {

            throw new Error(
                "Server returned an invalid SPARKD transaction."
            );

        }

        let transaction;

        try {

            transaction =
                window.solanaWeb3.Transaction.from(
                    unsignedTransactionBytes
                );

        }
        catch {

            throw new Error(
                "Unable to decode the SPARKD burn transaction."
            );

        }

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
        // VALIDATE CLEAN MESSAGE
        ////////////////////////////////////////////////////

        if (
            !transaction.feePayer ||
            !transaction.feePayer.equals(
                walletPublicKey
            )
        ) {

            throw new Error(
                "SPARKD transaction has an unexpected fee payer."
            );

        }

        if (
            transaction.recentBlockhash !==
            prepareResult.recentBlockhash
        ) {

            throw new Error(
                "SPARKD transaction has an unexpected recent blockhash."
            );

        }

        if (
            transaction.instructions.length !== 1
        ) {

            throw new Error(
                "SPARKD transaction must contain exactly one instruction."
            );

        }

        const burnInstruction =
            transaction.instructions[0];

        if (
            !burnInstruction.programId.equals(
                tokenProgramPublicKey
            )
        ) {

            throw new Error(
                "SPARKD transaction has an unexpected program."
            );

        }

        const burnKeys =
            burnInstruction.keys;

        if (
            burnKeys.length !== 3 ||
            !burnKeys[0].pubkey.equals(tokenAccountPublicKey) ||
            burnKeys[0].isSigner !== false ||
            burnKeys[0].isWritable !== true ||
            !burnKeys[1].pubkey.equals(mintPublicKey) ||
            burnKeys[1].isSigner !== false ||
            burnKeys[1].isWritable !== true ||
            !burnKeys[2].pubkey.equals(walletPublicKey) ||
            burnKeys[2].isSigner !== true ||
            burnKeys[2].isWritable !== false
        ) {

            throw new Error(
                "SPARKD BurnChecked instruction has unexpected accounts."
            );

        }

        const expectedInstructionData =
            new Uint8Array(
                10
            );

        expectedInstructionData[0] =
            15;

        const expectedAmount =
            BigInt(
                expectedRawAmount
            );

        for (
            let i = 0;
            i < 8;
            i++
        ) {

            expectedInstructionData[
                1 + i
            ] =
                Number(
                    (
                        expectedAmount >>
                        BigInt(
                            8 * i
                        )
                    ) &
                    255n
                );

        }

        expectedInstructionData[9] =
            expectedDecimals;

        const instructionData =
            burnInstruction.data;

        if (
            instructionData.length !==
                expectedInstructionData.length ||
            !Array.from(
                instructionData
            ).every(
                (value, index) =>
                    value ===
                    expectedInstructionData[index]
            )
        ) {

            throw new Error(
                "SPARKD transaction has unexpected BurnChecked data."
            );

        }

        ////////////////////////////////////////////////////
        // EXACTLY ONE EMPTY SIGNATURE SLOT: WALLET
        ////////////////////////////////////////////////////

        if (
            transaction.signatures.length !== 1 ||
            !transaction.signatures[0].publicKey.equals(
                walletPublicKey
            ) ||
            transaction.signatures[0].signature !== null
        ) {

            throw new Error(
                "SPARKD transaction has an unexpected signer layout."
            );

        }

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

            recentBlockhash:
                prepareResult.recentBlockhash,

            lastValidBlockHeight:
                prepareResult.lastValidBlockHeight,

            instructionData:
                Array.from(
                    instructionData
                ),

            signerCount:
                1,

            instructionCount:
                1,

            durableNonce:
                false,

            signed:
                false,

            sent:
                false,

            burned:
                false

        };

        console.log(
            "🔥 Clean SPARKD BurnChecked transaction BUILT — NOT SENT:",
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

    ////////////////////////////////////////////////////
// BASE58 ENCODER
//
// USED TO DERIVE THE SOLANA TRANSACTION SIGNATURE
// BEFORE THE SIGNED TRANSACTION IS BROADCAST.
////////////////////////////////////////////////////

encodeBase58(bytes) {

    const alphabet =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    if (
        !bytes ||
        bytes.length === 0
    ) {

        return "";

    }

    const digits = [0];

    for (
        let i = 0;
        i < bytes.length;
        i++
    ) {

        let carry =
            bytes[i];

        for (
            let j = 0;
            j < digits.length;
            j++
        ) {

            carry +=
                digits[j] << 8;

            digits[j] =
                carry % 58;

            carry =
                Math.floor(
                    carry / 58
                );

        }

        while (
            carry > 0
        ) {

            digits.push(
                carry % 58
            );

            carry =
                Math.floor(
                    carry / 58
                );

        }

    }

    let result = "";

    for (
        let i = 0;
        i < bytes.length - 1 &&
        bytes[i] === 0;
        i++
    ) {

        result +=
            alphabet[0];

    }

    for (
        let i = digits.length - 1;
        i >= 0;
        i--
    ) {

        result +=
            alphabet[
                digits[i]
            ];

    }

    return result;

},

////////////////////////////////////////////////////
// RECENT-BLOCKHASH RECOVERY HELPERS
//
// STATUS + BLOCK HEIGHT ARE READ ONLY.
// RESEND ONLY REBROADCASTS EXACT ALREADY-SIGNED BYTES.
// IT NEVER CREATES OR SIGNS A NEW BURN.
////////////////////////////////////////////////////

async checkTransactionStatus(
    wallet,
    transactionSignature
) {

    if (
        !transactionSignature
    ) {

        throw new Error(
            "Missing SPARKD transaction signature."
        );

    }

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
                        "check_transaction_status",
            
                    wallet:
                        wallet,
            
                    transactionSignature:
                        transactionSignature
    })
            }
        );

    const result =
        await response.json();

    if (
        !response.ok
    ) {

        throw new Error(
            result?.error ||
            "Unable to check SPARKD transaction status."
        );

    }

    return result;

},

async getCurrentBlockHeight(
    wallet
) {

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
                            "get_block_height",

                        wallet:
                            wallet
                    })
            }
        );

    const result =
        await response.json();

    if (
        !response.ok ||
        result?.success !== true ||
        typeof result?.blockHeight !== "number"
    ) {

        throw new Error(
            result?.error ||
            "Unable to read current Solana block height."
        );

    }

    return result.blockHeight;

},

async resendSignedBurnTransaction(
    wallet,
    contestId,
    signedTransactionBase64
) {

    if (
        !wallet ||
        !contestId ||
        !signedTransactionBase64
    ) {

        throw new Error(
            "Missing signed SPARKD recovery transaction data."
        );

    }

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
                            "send_signed_transaction",

                        wallet:
                            wallet,

                        contestId:
                            contestId,

                        signedTransaction:
                            signedTransactionBase64
                    })
            }
        );

    const result =
        await response.json();

    if (
        !response.ok ||
        result?.success !== true ||
        result?.sent !== true ||
        !result?.transactionSignature
    ) {

        const error =
            new Error(
                result?.error ||
                result?.rpcError?.message ||
                "Unable to resend the exact signed SPARKD burn transaction."
            );

        error.response =
            response;

        error.result =
            result;

        throw error;

    }

    return result;

},

async executeSparkdBurn(
    wallet,
    contestId
) {

    console.log(
        "🔥 Preparing REAL 2,000 SPARKD burn..."
    );

    this.validateWallet(
        wallet
    );

    if (
        !window.solana ||
        !window.solana.isPhantom
    ) {

        throw new Error(
            "Phantom wallet is required."
        );

    }

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
    // BUILD FRESH SINGLE-SIGNER TRANSACTION
    ////////////////////////////////////////////////////

    const built =
        await this.buildSparkdBurnTransaction(
            wallet,
            contestId
        );

    if (
        !built ||
        !built.transaction ||
        built.durableNonce !== false ||
        built.signerCount !== 1 ||
        built.instructionCount !== 1
    ) {

        throw new Error(
            "Unable to build the clean SPARKD burn transaction."
        );

    }

    console.log(
        "⚠️ Phantom will now request approval to burn exactly 2,000 SPARKD."
    );

    ////////////////////////////////////////////////////
    // PHANTOM IS THE ONLY SIGNER
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

    if (
        !signedTransaction
    ) {

        throw new Error(
            "Phantom did not return a signed transaction."
        );

    }

    const signedWalletSignatureEntry =
        signedTransaction.signatures.find(
            entry =>
                entry.publicKey.toBase58() === wallet
        );

    if (
        signedTransaction.signatures.length !== 1 ||
        !signedWalletSignatureEntry?.signature
    ) {

        throw new Error(
            "Phantom did not return the expected single wallet signature."
        );

    }

    if (
        signedTransaction.verifySignatures() !== true
    ) {

        throw new Error(
            "Phantom returned an invalid SPARKD transaction signature."
        );

    }

    const serialized =
        signedTransaction.serialize({
            requireAllSignatures:
                true,

            verifySignatures:
                true
        });

    let binary =
        "";

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
        btoa(
            binary
        );

    const preBroadcastSignature =
        this.encodeBase58(
            signedWalletSignatureEntry.signature
        );

    if (
        !preBroadcastSignature
    ) {

        throw new Error(
            "Unable to derive the Phantom-signed SPARKD transaction signature."
        );

    }

    console.log(
        "🧾 SPARKD transaction signature derived before broadcast:",
        preBroadcastSignature
    );

    ////////////////////////////////////////////////////
    // SAVE EXACT SIGNED BYTES BEFORE BROADCAST
    ////////////////////////////////////////////////////

    const pendingBurnRecoveryKey =
        `sparkd_burn_recovery_${contestId}_${wallet}`;

    localStorage.setItem(
        pendingBurnRecoveryKey,
        JSON.stringify({
            contestId:
                contestId,

            wallet:
                wallet,

            signedTransaction:
                signedTransactionBase64,

            burnTransaction:
                preBroadcastSignature,

            recentBlockhash:
                built.recentBlockhash,

            lastValidBlockHeight:
                built.lastValidBlockHeight,

            status:
                "signed_pending_broadcast",

            createdAt:
                new Date().toISOString()
        })
    );

    console.log(
        "🛡️ Pre-broadcast SPARKD recovery marker saved."
    );

    ////////////////////////////////////////////////////
    // BROADCAST EXACT PHANTOM-SIGNED BYTES
    ////////////////////////////////////////////////////

    const sendResponse =
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
                            "send_signed_transaction",

                        wallet:
                            wallet,

                        contestId:
                            contestId,

                        signedTransaction:
                            signedTransactionBase64
                    })
            }
        );

    const sendResult =
        await sendResponse.json();

    if (
        !sendResponse.ok ||
        sendResult?.success !== true ||
        sendResult?.sent !== true ||
        !sendResult?.transactionSignature
    ) {

        ////////////////////////////////////////////////////
        // SERVER PROVED BLOCKHASH EXPIRED AND TX DID NOT LAND
        //
        // This signed transaction can no longer execute.
        // Clearing the marker permits a fresh approval.
        ////////////////////////////////////////////////////

        if (
            sendResult?.expired === true &&
            sendResult?.safeToRetry === true
        ) {

            localStorage.removeItem(
                pendingBurnRecoveryKey
            );

        }

        const error =
            new Error(
                sendResult?.rpcError?.message ||
                sendResult?.error ||
                "Failed to broadcast signed burn transaction."
            );

        error.response =
            sendResponse;

        error.result =
            sendResult;

        throw error;

    }

    const signature =
        sendResult.transactionSignature;

    if (
        signature !==
        preBroadcastSignature
    ) {

        throw new Error(
            "Server returned a transaction signature that does not match the Phantom-signed burn. DO NOT BURN AGAIN."
        );

    }

    ////////////////////////////////////////////////////
    // MARK AS BROADCAST, KEEP EXACT BYTES FOR RECOVERY
    ////////////////////////////////////////////////////

    localStorage.setItem(
        pendingBurnRecoveryKey,
        JSON.stringify({
            contestId:
                contestId,

            wallet:
                wallet,

            burnTransaction:
                signature,

            signedTransaction:
                signedTransactionBase64,

            recentBlockhash:
                built.recentBlockhash,

            lastValidBlockHeight:
                built.lastValidBlockHeight,

            status:
                "broadcast",

            createdAt:
                new Date().toISOString()
        })
    );

    console.log(
        "🔥 SPARKD burn transaction sent through private RPC:",
        signature
    );

    ////////////////////////////////////////////////////
    // SERVER-SIDE ON-CHAIN VERIFICATION
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
            verifyResult?.success === true &&
            verifyResult?.verified === true
        ) {

            verification =
                verifyResult;

            break;

        }

        if (
            verifyResult?.success === true &&
            verifyResult?.verified === false &&
            verifyResult?.transactionFound === true
        ) {

            throw new Error(
                verifyResult?.reason ||
                verifyResult?.error ||
                "The transaction was found but the SPARKD burn could not be verified."
            );

        }

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

    if (
        !verification ||
        verification.verified !== true
    ) {

        throw new Error(
            "The burn transaction was sent, but server verification has not confirmed it yet. Transaction: " +
            signature +
            ". DO NOT BURN AGAIN."
        );

    }

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
    "🛡️ Production submissions use an explicit Phantom-approved 2,000 SPARKD burn; submitMemeTest remains no-burn test-only."
);
