// ==========================================
// SPARKD CHAT - SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
  "https://uxpbgzksfizkyxubctep.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";

console.log("SPARKD Chat JS loaded");


// ==========================================
// CREATE SUPABASE CLIENT
// ==========================================

let supabaseClient = null;

if (typeof supabase === "undefined") {

  console.error(
    "Supabase library did not load."
  );

} else {

  console.log(
    "Supabase library loaded."
  );

  supabaseClient =
    supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

  console.log(
    "SPARKD Supabase client created.",
    supabaseClient
  );

}


// ==========================================
// TEST DATABASE CONNECTION
// ==========================================

async function testSupabaseConnection() {

  if (!supabaseClient) {

    console.error(
      "Supabase client is not available."
    );

    return;
  }

  try {

    const { data, error } =
      await supabaseClient
        .from("messages")
        .select(
          "id, wallet, message, created_at"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(5);


    if (error) {

      console.error(
        "SPARKD database test failed:",
        error
      );

      return;
    }


    console.log(
      "SPARKD database connection successful.",
      data
    );


  } catch (err) {

    console.error(
      "SPARKD database test error:",
      err
    );

  }

}


testSupabaseConnection();
