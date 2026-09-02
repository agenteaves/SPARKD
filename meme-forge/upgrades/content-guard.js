/* ============================================================
   SPARKD SERVER CONTENT GUARD
   Supabase server-side image moderation client
   Version: v1
============================================================ */

(function () {

    "use strict";


    const ENDPOINT =
        "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/forge-content-safety";


    async function check(
        file
    ) {

        try {

            if (
                !file ||
                typeof file.type !==
                    "string" ||
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "🚫 Please select a valid image."
                );

                return false;

            }


            const formData =
                new FormData();


            formData.append(
                "image",
                file,
                file.name ||
                    "sparkd-upload.png"
            );


            const response =
                await fetch(
                    ENDPOINT,
                    {
                        method:
                            "POST",

                        body:
                            formData,

                        cache:
                            "no-store"
                    }
                );


            const result =
                await response
                    .json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            /*
             * FAIL CLOSED:
             * Anything except an explicit safe=true response
             * is rejected.
             */
            if (
                !response.ok ||
                result?.success !== true ||
                result?.checked !== true ||
                result?.safe !== true ||
                result?.blocked === true
            ) {

                console.warn(
                    "🚫 SPARKD server safety rejected image:",
                    result
                );


                alert(
                    result?.blocked === true &&
                    result?.success === true
                        ? "🚫 SPARKD blocked this image because it contains prohibited content."
                        : "🚫 SPARKD content protection could not verify this image. Upload blocked."
                );


                return false;

            }


            console.log(
                "✅ SPARKD server safety approved image."
            );


            return true;

        }
        catch (error) {

            console.error(
                "❌ SPARKD server safety request failed:",
                error
            );


            alert(
                "🚫 SPARKD content protection is unavailable. Upload blocked."
            );


            return false;

        }

    }


    window.SPARKD_GUARD = {

        check:
            check,

        isReady:
            function () {
                return true;
            },

        version:
            "server-v1"

    };


    console.log(
        "🛡️ SPARKD Server Content Guard v1 loaded."
    );

})();
