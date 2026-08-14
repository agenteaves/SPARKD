// ==========================================
// SPARKD TOKEN-GATED CHAT
// SUPABASE + REALTIME
// ==========================================

const SUPABASE_URL =
  "https://uxpbgzksfizkyxubctep.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


// ==========================================
// SUPABASE CLIENT
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
    "SPARKD Supabase client created."
  );

}


// ==========================================
// LOAD EXISTING MESSAGES
// ==========================================

async function loadSupabaseMessages() {

  if (!supabaseClient) {
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
            ascending: true
          }
        )
        .limit(100);


    if (error) {

      console.error(
        "Could not load messages:",
        error
      );

      return;
    }


    console.log(
      "SPARKD messages loaded:",
      data.length
    );


    data.forEach(
      msg => {

        appendMessage(
          shorten(msg.wallet),
          msg.message,
          msg.created_at,
          false
        );

      }
    );


  } catch (err) {

    console.error(
      "Message loading error:",
      err
    );

  }

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage(e) {

  e.preventDefault();


  const input =
    document.getElementById(
      "msgInput"
    );


  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  if (!currentWallet) {

    alert(
      "Please connect your wallet first."
    );

    return;
  }


  if (text.length > 1000) {

    alert(
      "Message is too long. Maximum 1000 characters."
    );

    return;
  }


  if (!supabaseClient) {

    alert(
      "Chat connection is not ready."
    );

    return;
  }


  try {

    const { error } =
      await supabaseClient
        .from("messages")
        .insert({

          wallet:
            currentWallet,

          message:
            text

        });


    if (error) {

      console.error(
        "Message send failed:",
        error
      );

      alert(
        "Could not send message."
      );

      return;
    }


    input.value = "";

    input.focus();


  } catch (err) {

    console.error(
      "Message send error:",
      err
    );

  }

}


// ==========================================
// REALTIME CHAT
// ==========================================

function setupRealtimeChat() {

  if (!supabaseClient) {
    return;
  }


  supabaseClient
    .channel(
      "sparkd-messages"
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages"
      },
      payload => {

        console.log(
          "New SPARKD message:",
          payload.new
        );


        appendMessage(
          shorten(
            payload.new.wallet
          ),
          payload.new.message,
          payload.new.created_at,
          false
        );

      }
    )
    .subscribe(
      status => {

        console.log(
          "SPARKD Realtime status:",
          status
        );

      }
    );

}


// ==========================================
// INITIALIZE
// ==========================================

async function initializeSparkdChat() {

  console.log(
    "SPARKD shared chat initializing..."
  );


  await loadSupabaseMessages();

  setupRealtimeChat();


  console.log(
    "SPARKD shared chat ready."
  );

}


initializeSparkdChat();
