(() => {
  "use strict";
  const ENDPOINT = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/contest-moderation";
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const fmt = (v) => v ? new Date(v).toLocaleString() : "—";

  async function call(body) {
    const key = $("adminKey").value.trim();
    if (!key) throw new Error("Enter the admin access key.");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sparkd-admin-key": key },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  function render(items) {
    const queue = $("queue");
    queue.innerHTML = "";
    if (!items.length) {
      queue.innerHTML = '<div class="empty">No submissions are currently waiting for moderation.</div>';
      return;
    }
    for (const s of items) {
      const pending = s.status === "pending";
      const card = document.createElement("div");
      card.className = "item";
      card.innerHTML = `
        <div><img src="${esc(s.meme_image_url)}" alt="${esc(s.meme_title || "Contest submission")}" loading="lazy"></div>
        <div class="meta">
          <div class="title">${esc(s.meme_title || "Untitled SPARKD Meme")}</div>
          <div><span class="pill">${esc(s.status)}</span><span class="pill">Contest: ${esc(s.contest_status)}</span></div>
          <div class="small">Submitted: ${esc(fmt(s.submitted_at))}</div>
          <div class="small">Wallet: ${esc(s.wallet_address)}</div>
          <div class="small">DNA verified: ${s.dna_verified ? "Yes" : "No"} · Burn verified: ${s.burn_verified ? "Yes" : "No"}</div>
          ${s.rejection_reason ? `<div class="small">Reason: ${esc(s.rejection_reason)}</div>` : ""}
          ${pending ? `
            <textarea class="reason" placeholder="Rejection reason (required only when rejecting)"></textarea>
            <div class="actions">
              <button class="approve" data-action="approve">Approve</button>
              <button class="reject" data-action="reject">Reject</button>
            </div>` : ""}
        </div>`;

      if (pending) {
        const reason = card.querySelector(".reason");
        for (const btn of card.querySelectorAll("button[data-action]")) {
          btn.addEventListener("click", async () => {
            const decision = btn.dataset.action;
            if (decision === "reject" && reason.value.trim().length < 3) {
              $("status").textContent = "❌ Enter a rejection reason of at least 3 characters.";
              return;
            }
            if (!confirm(`${decision === "approve" ? "Approve" : "Reject"} this submission? This moderation decision is final.`)) return;
            btn.disabled = true;
            $("status").textContent = `${decision === "approve" ? "Approving" : "Rejecting"}…`;
            try {
              await call({ action: "moderate", submissionId: s.id, decision, reason: reason.value.trim() || null });
              await load();
            } catch (err) {
              $("status").textContent = `❌ ${err.message || err}`;
              btn.disabled = false;
            }
          });
        }
      }
      queue.appendChild(card);
    }
  }

  async function load() {
    $("status").textContent = "Loading moderation queue…";
    try {
      const data = await call({ action: "list" });
      const items = Array.isArray(data?.submissions) ? data.submissions : [];
      render(items);
      const pending = items.filter(x => x.status === "pending").length;
      $("status").textContent = `Loaded ${items.length} current-contest submission${items.length === 1 ? "" : "s"}. ${pending} pending review.`;
    } catch (err) {
      $("status").textContent = `❌ ${err.message || err}`;
      $("queue").innerHTML = "";
    }
  }

  $("loadBtn").addEventListener("click", load);
  $("adminKey").addEventListener("keydown", e => { if (e.key === "Enter") load(); });
  console.log("🛡️ SPARKD admin-moderation.js v1.0 loaded.");
})();
