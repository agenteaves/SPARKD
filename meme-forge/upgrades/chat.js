// ==========================================
// SPARKD CHAT - SUPABASE TEST
// ==========================================

const SUPABASE_URL =
  "https://uxpbgzksfizkyxubctep.supabase.co";

const SUPABASE_ANON_KEY =
  "YOUR_PUBLISHABLE_KEY_HERE";

console.log("SPARKD Chat JS loaded");

if (typeof supabase === "undefined") {
  console.error("Supabase library did not load.");
} else {
  console.log("Supabase library loaded.");

  const supabaseClient =
    supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

  console.log(
    "SPARKD Supabase client created.",
    supabaseClient
  );
}
