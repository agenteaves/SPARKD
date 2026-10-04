(() => {
  "use strict";

  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-winner-contacts";
  const status = document.getElementById("status");
  const rows = document.getElementById("winnerRows");
  const keyInput = document.getElementById("adminKey");
  const loadButton = document.getElementById("loadContacts");

  function shortWallet(value) {
    const wallet = String(value || "");
    return wallet.length > 14 ? wallet.slice(0, 7) + "…" + wallet.slice(-5) : wallet || "Unknown";
  }

  function addCell(row, text, className) {
    const cell = document.createElement("td");
    cell.textContent = text || "";
    if (className) cell.className = className;
    row.appendChild(cell);
    return cell;
  }

  function displayDate(value) {
    if (!value) return "Unknown week";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown week" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function render(items) {
    rows.replaceChildren();
    if (!items.length) {
      const row = document.createElement("tr");
      addCell(row, "No finalized winners found.", "muted").colSpan = 4;
      rows.appendChild(row);
      return;
    }

    for (const item of items) {
      const row = document.createElement("tr");
      const week = document.createElement("td");
      week.textContent = displayDate(item.week_start) + " – " + displayDate(item.week_end);
      const place = document.createElement("small");
      place.className = "badge";
      place.textContent = item.place || "";
      week.appendChild(place);
      row.appendChild(week);

      const meme = document.createElement("td");
      meme.textContent = item.meme_title || "Untitled SPARKD Meme";
      if (item.meme_image_url) {
        const image = document.createElement("small");
        image.textContent = "Image: " + item.meme_image_url;
        meme.appendChild(image);
      }
      row.appendChild(meme);

      const walletCell = addCell(row, shortWallet(item.wallet_address));
      walletCell.title = String(item.wallet_address || "");
      const contact = document.createElement("td");
      if (item.x_handle) {
        const link = document.createElement("a");
        link.href = "https://x.com/" + encodeURIComponent(item.x_handle);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "@" + item.x_handle;
        contact.appendChild(link);

        const copyRequest = document.createElement("button");
        copyRequest.type = "button";
        copyRequest.textContent = "Copy celebration request";
        copyRequest.addEventListener("click", async () => {
          const message = "Hi @" + item.x_handle + "! Congratulations on winning " +
            (item.place || "a prize") + " in the SPARKD Meme of the Week contest. " +
            "Would you be willing to share a post on X about your win? It is completely optional; " +
            "we would love to celebrate you. — SPARKD";
          try {
            await navigator.clipboard.writeText(message);
            status.textContent = "Celebration request copied for @" + item.x_handle + ".";
          } catch {
            status.textContent = "Clipboard is unavailable. Open @" + item.x_handle + " and send the congratulations manually.";
          }
        });
        contact.appendChild(copyRequest);
      } else {
        contact.textContent = "No X handle supplied";
        contact.className = "none";
      }
      row.appendChild(contact);
      rows.appendChild(row);
    }
  }

  async function load() {
    const key = keyInput.value.trim();
    if (!key) {
      status.textContent = "Enter the contest admin key.";
      return;
    }
    loadButton.disabled = true;
    status.textContent = "Loading finalized winners…";
    rows.replaceChildren();

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sparkd-admin-key": key
        },
        body: JSON.stringify({ action: "winner_contacts" })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "Unable to load the private winner list.");
      }
      render(Array.isArray(data.winners) ? data.winners : []);
      status.textContent = "Loaded " + (data.winners?.length || 0) + " podium places.";
    } catch (error) {
      status.textContent = error?.message || "Unable to load winner contacts.";
      const row = document.createElement("tr");
      addCell(row, "No winner details were displayed.", "muted").colSpan = 4;
      rows.appendChild(row);
    } finally {
      loadButton.disabled = false;
    }
  }

  loadButton.addEventListener("click", load);
  keyInput.addEventListener("keydown", event => {
    if (event.key === "Enter") load();
  });
})();