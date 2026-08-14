// ==========================================
// SPARKD TOKEN-GATED CHAT
// Supabase + Realtime
// ==========================================

const SUPABASE_URL =
  "https://uxpbgzksfizkyxubctep.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J";


// ==========================================
// SUPABASE
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
// LOAD MESSAGES
// ==========================================

async function loadMessages() {

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
      "Messages loaded:",
      data
    );


    displayMessages(data);


  } catch (err) {

    console.error(
      "Message loading error:",
      err
    );

  }

}


// ==========================================
// DISPLAY MESSAGES
// ==========================================

function displayMessages(messages) {

  const chatMessages =
    document.getElementById(
      "messages"
    );


  if (!chatMessages) {

    console.error(
      "chatMessages element not found."
    );

    return;
  }


  chatMessages.innerHTML = "";


  messages.forEach(
    message => {

      addMessageToChat(
        message
      );

    }
  );


  scrollChatToBottom();

}


// ==========================================
// ADD ONE MESSAGE
// ==========================================

function addMessageToChat(message) {

  const chatMessages =
    document.getElementById(
      "messages"
    );


  if (!chatMessages) {
    return;
  }


  const messageElement =
    document.createElement(
      "div"
    );


  const wallet =
    message.wallet || "Unknown";


  const shortWallet =
    wallet.length > 12
      ? wallet.slice(0, 6) +
        "..." +
        wallet.slice(-4)
      : wallet;


  const time =
    message.created_at
      ? new Date(
          message.created_at
        ).toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit"
          }
        )
      : "";


  messageElement.className =
    "mb-3";


  messageElement.innerHTML = `
    <div class="text-xs text-green-500 mb-1">
      ${escapeHTML(shortWallet)}
      <span class="text-gray-600 ml-2">
        ${escapeHTML(time)}
      </span>
    </div>

    <div class="text-sm text-gray-200 break-words">
      ${escapeHTML(message.message)}
    </div>
  `;


  chatMessages.appendChild(
    messageElement
  );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value ?? "");


  return div.innerHTML;

}


// ==========================================
// SCROLL
// ==========================================

function scrollChatToBottom() {

  const chatMessages =
    document.getElementById(
      "messages"
    );


  if (!chatMessages) {
    return;
  }


  chatMessages.scrollTop =
    chatMessages.scrollHeight;

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage(event) {

  event.preventDefault();


  if (!supabaseClient) {

    alert(
      "Chat connection is not ready."
    );

    return;
  }


  if (!currentWallet) {

    alert(
      "Please connect your wallet first."
    );

    return;
  }


  const input =
    document.getElementById(
      "messages"
    );


  if (!input) {
    return;
  }


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  if (message.length > 1000) {

    alert(
      "Message is too long. Maximum 1000 characters."
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
            message

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
// REALTIME
// ==========================================

function setupRealtime() {

  if (!supabaseClient) {
    return;
  }


  supabaseClient
    .channel(
      "sparkd-chat"
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
          "New chat message:",
          payload.new
        );


        addMessageToChat(
          payload.new
        );


        scrollChatToBottom();

      }
    )
    .subscribe(
      status => {

        console.log(
          "SPARKD Realtime:",
          status
        );

      }
    );

}


// ==========================================
// START CHAT
// ==========================================

function initializeChat() {

  console.log(
    "SPARKD chat initializing..."
  );


  loadMessages();

  setupRealtime();

}


initializeChat();
