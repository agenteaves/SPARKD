(() => {
  "use strict";

  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-winner-contacts";

  function getWalletProvider() {
    return window.phantom?.solana?.isPhantom
      ? window.phantom.solana
      : window.solana?.isPhantom
        ? window.solana
        : null;
  }

  function toBase64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  async function saveWinnerContact({ submissionId, wallet, xHandle }) {
    const handle = String(xHandle || "").trim().replace(/^@/, "");
    if (!handle) return false;
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
      throw new Error("Enter a valid X username.");
    }

    const provider = getWalletProvider();
    if (!provider?.signMessage) {
      throw new Error("Your wallet cannot sign the private contact confirmation. Please contact @deedsparks on X with your wallet address.");
    }

    const timestamp = Date.now();
    const message = [
      "SPARKD-CONTEST-CONTACT-v1",
      String(submissionId),
      String(wallet),
      handle,
      String(timestamp)
    ].join("\n");

    const signed = await provider.signMessage(
      new TextEncoder().encode(message),
      "utf8"
    );
    const signatureBytes = signed?.signature || signed;
    if (!signatureBytes || signatureBytes.length !== 64) {
      throw new Error("The wallet did not return a valid contact confirmation signature.");
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_contact",
        submissionId,
        wallet,
        xHandle: handle,
        timestamp,
        signature: toBase64(signatureBytes)
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || "Unable to save your private winner contact.");
    }
    return true;
  }

  window.SPARKD_CONTEST_CONTACT = { saveWinnerContact };
})();