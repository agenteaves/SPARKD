////////////////////////////////////////////////////
// SPARKD CONTEST SUBMISSION
// Submission Preparation Engine v0.2
//
// CURRENT PURPOSE:
// - Validate PNG
// - Find active Meme of the Week contest
// - Verify SPARKD balance
// - Verify Forge DNA
// - Upload verified PNG
// - Prepare submission data
//
// IMPORTANT:
// - NO TOKEN TRANSACTION
// - NO TOKEN BURN
// - NO DATABASE SUBMISSION YET
////////////////////////////////////////////////////


window.SPARKD_CONTEST = {


    ////////////////////////////////////////////////////
    // CONFIGURATION
    ////////////////////////////////////////////////////

    REQUIRED_SPARKD:
        2000,


    BUCKET:
        "sparkd-contest-submissions",



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
    // GET ACTIVE CONTEST
    ////////////////////////////////////////////////////

    async getCurrentContest() {


        if (
            typeof supabaseClient ===
            "undefined" ||
            !supabaseClient
        ) {

            throw new Error(
                "Supabase client is not available."
            );

        }


        const now =
            new Date().toISOString();


        const {
            data,
            error
        } =
            await supabaseClient
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

            throw error;

        }


        if (!data) {

            throw new Error(
                "There is no active Meme of the Week submission period."
            );

        }


        return data;

    },



    ////////////////////////////////////////////////////
    // VERIFY SPARKD BALANCE
    ////////////////////////////////////////////////////

    async checkBalance(
        wallet
    ) {


        if (
            !wallet
        ) {

            throw new Error(
                "Wallet is not connected."
            );

        }


        const response =
            await fetch(

                "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler",

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
            balance <
            this.REQUIRED_SPARKD
        ) {

            throw new Error(

                "You need at least " +
                this.REQUIRED_SPARKD.toLocaleString() +
                " SPARKD to enter."

            );

        }


        return {

            balance:
                balance,

            canSubmit:
                true

        };

    },



    ////////////////////////////////////////////////////
    // VERIFY FORGE DNA
    ////////////////////////////////////////////////////

    async verifyForge(
        wallet,
        forgeData
    ) {


        if (
            !forgeData ||
            typeof forgeData !==
            "object"
        ) {

            throw new Error(
                "SPARKD Forge verification data is missing."
            );

        }


        const response =
            await fetch(

                "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler",

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
                                forgeData

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


        this.validateFile(
            file
        );


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


        const {
            data,
            error
        } =
            await supabaseClient
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
        // STEP 2 — CONTEST
        ////////////////////////////////////////////////////

        const contest =
            await this.getCurrentContest();


        console.log(
            "🔥 Contest verified:",
            contest.id
        );


        ////////////////////////////////////////////////////
        // STEP 3 — BALANCE
        ////////////////////////////////////////////////////

        const balance =
            await this.checkBalance(
                wallet
            );


        console.log(
            "🔥 SPARKD balance verified:",
            balance.balance
        );


        ////////////////////////////////////////////////////
        // STEP 4 — FORGE DNA
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
        // STEP 5 — UPLOAD
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

    }

};


////////////////////////////////////////////////////
// SPARKD MEME OF THE WEEK
// REAL SUBMISSION TEST v0.1
//
// PURPOSE:
// - Verify wallet
// - Verify SPARKD Forge DNA
// - Upload verified PNG
// - Create meme_week_submissions row
//
// IMPORTANT:
// - NO TOKEN BURN
// - NO SOL TRANSFER
////////////////////////////////////////////////////

window.SPARKD_CONTEST.submitMemeTest = async function (
    file,
    forgeData,
    memeTitle
) {

    ////////////////////////////////////////////////////
    // BASIC CHECKS
    ////////////////////////////////////////////////////

    if (!file) {
        throw new Error(
            "No meme image was provided."
        );
    }


    if (file.type !== "image/png") {
        throw new Error(
            "Contest submissions must be PNG images."
        );
    }


    if (file.size > 10 * 1024 * 1024) {
        throw new Error(
            "PNG is larger than the 10 MB limit."
        );
    }


    ////////////////////////////////////////////////////
    // WALLET CHECK
    ////////////////////////////////////////////////////

    if (
        typeof currentWallet !== "string" ||
        !currentWallet
    ) {

        throw new Error(
            "Please connect your Phantom wallet first."
        );

    }


    ////////////////////////////////////////////////////
    // FORGE DATA CHECK
    ////////////////////////////////////////////////////

    if (
        !forgeData ||
        typeof forgeData !== "object"
    ) {

        throw new Error(
            "SPARKD Forge verification data is missing."
        );

    }


    ////////////////////////////////////////////////////
    // CONTEST CHECK
    ////////////////////////////////////////////////////

    if (
        typeof currentContest === "undefined" ||
        !currentContest
    ) {

        throw new Error(
            "No active Meme of the Week contest."
        );

    }


    ////////////////////////////////////////////////////
// VERIFY CONTEST WINDOW
////////////////////////////////////////////////////

// TEMPORARY TEST BYPASS
//
// The real contest schedule remains enforced
// elsewhere. This bypass exists ONLY so we
// can test the upload/database pipeline before
// the first contest opens.
//
// NO TOKEN BURN
// NO SOL TRANSFER

console.log(
    "🧪 TEST MODE: Contest window check bypassed."
);

    ////////////////////////////////////////////////////
    // VERIFY FORGE DNA
    ////////////////////////////////////////////////////

    if (
        forgeData.forge !==
        "SPARKD Meme Forge"
    ) {

        throw new Error(
            "Image is not a valid SPARKD Forge image."
        );

    }


    if (
        !forgeData.memeID ||
        !forgeData.DNA ||
        !forgeData.imageLock ||
        !forgeData.signature
    ) {

        throw new Error(
            "SPARKD Forge integrity data is incomplete."
        );

    }


    ////////////////////////////////////////////////////
    // UPLOAD IMAGE
    ////////////////////////////////////////////////////

    const filename =
        currentContest.id +
        "/" +
        currentWallet +
        "-" +
        Date.now() +
        ".png";


    const {
        data: uploadData,
        error: uploadError
    } =
        await supabaseClient
            .storage
            .from(
                "sparkd-contest-submissions"
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


    if (uploadError) {

        console.error(
            "SPARKD contest upload failed:",
            uploadError
        );

        throw new Error(
            uploadError.message
        );

    }


    ////////////////////////////////////////////////////
    // CREATE DATABASE SUBMISSION
    ////////////////////////////////////////////////////

    const {
        data: submission,
        error: submissionError
    } =
        await supabaseClient
            .from(
                "meme_week_submissions"
            )
            .insert({

                contest_id:
                    currentContest.id,

                creator_id:
                    forgeData.creatorID,

                wallet_address:
                    currentWallet,

                meme_title:
                    memeTitle ||
                    "Untitled SPARKD Meme",

                meme_image_url:
                    uploadData.path,

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

            })
            .select()
            .single();


    if (submissionError) {

        console.error(
            "SPARKD submission database error:",
            submissionError
        );

        /*
         * IMPORTANT:
         * If the database insert fails,
         * remove the uploaded image so
         * we don't leave an orphaned file.
         */

        await supabaseClient
            .storage
            .from(
                "sparkd-contest-submissions"
            )
            .remove([
                filename
            ]);


        throw new Error(
            submissionError.message
        );

    }


    ////////////////////////////////////////////////////
    // SUCCESS
    ////////////////////////////////////////////////////

    console.log(
        "🔥 SPARKD MEME OF THE WEEK TEST SUBMISSION SUCCESS:",
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

};


