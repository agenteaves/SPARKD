```javascript
////////////////////////////////////////////////////
// SPARKD MEME FORGE
// CONTENT GUARD v2.0
// Browser-Side Image Safety Filter
////////////////////////////////////////////////////

window.SPARKD_GUARD = {

    model: null,
    loading: false,



    ////////////////////////////////////////////////////
    // LOAD AI MODEL
    ////////////////////////////////////////////////////

    async loadModel() {

        if (this.model) {
            return this.model;
        }


        if (this.loading) {

            while (this.loading) {

                await new Promise(
                    r => setTimeout(r, 100)
                );

            }

            return this.model;

        }


        this.loading = true;


        console.log(
            "🛡️ SPARKD Content Guard loading..."
        );


        try {

            /*
             * NSFWJS 4.x includes the model definitions
             * in the browser package.
             *
             * This avoids the broken old CloudFront
             * model used by NSFWJS 2.4.2.
             */

            this.model =
                await nsfwjs.load("MobileNetV2");


            if (!this.model) {

                throw new Error(
                    "NSFWJS model returned no model."
                );

            }


            console.log(
                "🛡️ Content Guard ready"
            );


        }
        catch (error) {

            console.error(
                "🛡️ Content Guard failed:",
                error
            );


            this.model = null;

        }


        this.loading = false;


        return this.model;

    },



    ////////////////////////////////////////////////////
    // CHECK IMAGE
    ////////////////////////////////////////////////////

    async check(file) {

        if (!file) {
            return false;
        }


        ////////////////////////////////////////////////////
        // BASIC FILE SECURITY CHECK
        ////////////////////////////////////////////////////

        const filename =
            file.name.toLowerCase();


        const blockedExtensions = [

            ".exe",
            ".js",
            ".html",
            ".htm",
            ".svg",
            ".bat",
            ".cmd",
            ".scr",
            ".msi"

        ];


        for (
            let ext of blockedExtensions
        ) {

            if (filename.endsWith(ext)) {

                this.reject(
                    "File type not allowed."
                );

                return false;

            }

        }



        ////////////////////////////////////////////////////
        // MIME TYPE CHECK
        ////////////////////////////////////////////////////

        if (
            file.type &&
            !file.type.startsWith("image/")
        ) {

            this.reject(
                "Please upload an image file."
            );

            return false;

        }



        ////////////////////////////////////////////////////
        // LOAD SCANNER
        ////////////////////////////////////////////////////

        const model =
            await this.loadModel();


        /*
         * IMPORTANT:
         *
         * We FAIL CLOSED here.
         *
         * If the AI scanner cannot load,
         * the image is NOT allowed through.
         */

        if (!model) {

            this.reject(
                "The SPARKD Content Guard could not be loaded. Please refresh the page and try again."
            );

            return false;

        }



        ////////////////////////////////////////////////////
        // SCAN IMAGE
        ////////////////////////////////////////////////////

        try {

            const image =
                await this.fileToImage(file);


            const predictions =
                await model.classify(image);


            console.log(
                "🛡️ Content Scan:",
                predictions
            );



            ////////////////////////////////////////////////////
            // CHECK RESTRICTED CATEGORIES
            ////////////////////////////////////////////////////

            for (
                let result of predictions
            ) {

                const category =
                    result.className;


                const probability =
                    result.probability;



                /*
                 * Hentai:
                 * Reject at 50%+
                 *
                 * Porn:
                 * Reject at 50%+
                 *
                 * Sexy:
                 * Reject at 60%+
                 *
                 * The Hentai threshold is intentionally
                 * lower because anime pornography can
                 * otherwise be classified as Drawing.
                 */

                if (

                    category === "Hentai" &&
                    probability >= 0.50

                ) {

                    this.reject(
                        "This image contains restricted content."
                    );

                    return false;

                }


                if (

                    category === "Porn" &&
                    probability >= 0.50

                ) {

                    this.reject(
                        "This image contains restricted content."
                    );

                    return false;

                }


                if (

                    category === "Sexy" &&
                    probability >= 0.60

                ) {

                    this.reject(
                        "This image contains restricted content."
                    );

                    return false;

                }

            }



            ////////////////////////////////////////////////////
            // APPROVED
            ////////////////////////////////////////////////////

            console.log(
                "✅ Content approved"
            );


            return true;

        }


        catch (error) {

            console.error(
                "🛡️ Scan error:",
                error
            );


            /*
             * FAIL CLOSED
             *
             * Never allow an image through if
             * the scanner encounters an error.
             */

            this.reject(
                "The image could not be scanned. Please try another image."
            );


            return false;

        }

    },



    ////////////////////////////////////////////////////
    // FILE TO IMAGE
    ////////////////////////////////////////////////////

    fileToImage(file) {

        return new Promise(
            function(resolve, reject) {

                const reader =
                    new FileReader();


                reader.onload =
                    function(e) {

                        const img =
                            new Image();


                        img.onload =
                            function() {

                                resolve(img);

                            };


                        img.onerror =
                            function() {

                                reject(
                                    new Error(
                                        "Unable to decode image."
                                    )
                                );

                            };


                        img.src =
                            e.target.result;

                    };


                reader.onerror =
                    function() {

                        reject(
                            new Error(
                                "Unable to read image file."
                            )
                        );

                    };


                reader.readAsDataURL(file);

            }
        );

    },



    ////////////////////////////////////////////////////
    // BLOCK MESSAGE
    ////////////////////////////////////////////////////

    reject(message) {

        console.log(
            "🚫 SPARKD BLOCKED:",
            message
        );


        alert(

            "🚫 SPARKD Content Guard\n\n" +
            message

        );

    }

};
```

