////////////////////////////////////////////////////
// SPARKD CONTEST SUBMISSION
// Storage Upload Test v0.1
//
// PURPOSE:
// - Upload a PNG to the private contest bucket
// - Does NOT create a transaction
// - Does NOT burn SPARKD
// - Does NOT submit a contest entry
////////////////////////////////////////////////////


window.SPARKD_CONTEST = {


    async uploadTest(file) {


        ////////////////////////////////////////////////////
        // BASIC FILE CHECK
        ////////////////////////////////////////////////////

        if (!file) {

            throw new Error(
                "No file was provided."
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


        ////////////////////////////////////////////////////
        // CHECK SUPABASE CLIENT
        ////////////////////////////////////////////////////

        if (
            typeof supabaseClient ===
            "undefined" ||
            !supabaseClient
        ) {

            throw new Error(
                "Supabase client is not available."
            );

        }


        ////////////////////////////////////////////////////
        // CREATE UNIQUE TEST PATH
        ////////////////////////////////////////////////////

        const filename =
            "test-" +
            Date.now() +
            ".png";


        ////////////////////////////////////////////////////
        // UPLOAD TO PRIVATE BUCKET
        ////////////////////////////////////////////////////

        const {
            data,
            error
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


        if (error) {

            console.error(
                "SPARKD Storage upload failed:",
                error
            );

            throw new Error(
                error.message
            );

        }


        console.log(
            "🔥 SPARKD TEST UPLOAD SUCCESS:",
            data
        );


        return data;


    }


};


