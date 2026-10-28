// The 12-click shortcut is discoverable, so require server-verified PIN.
// No admin key is persisted in localStorage, sessionStorage, or source code.
let sparkdDeveloperAuthPending = false;
async function openDeveloperPanel(){
    if (document.getElementById("sparkdDevPanel") || sparkdDeveloperAuthPending) return;
    const key = window.prompt("Enter your 6-digit SPARKD developer PIN:");
    if (key === null) return;
    if (!/^\d{6}$/.test(key.trim())) { window.alert("Enter a 6-digit PIN."); return; }
    sparkdDeveloperAuthPending = true;
    try {
        const response = await fetch("https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/meme-forge-admin-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: key.trim() }),
            cache: "no-store"
        });
        if (!response.ok) throw new Error("PIN verification failed.");
        const result = await response.json();
        if (result?.success !== true) throw new Error("Admin verification failed.");
        showAuthenticatedDeveloperPanel();
    } catch (error) {
        window.alert("Access denied. Check your PIN and connection.");
    } finally {
        sparkdDeveloperAuthPending = false;
    }
}

////////////////////////////////////////////////////
// SPARKD MEME FORGE
// DEVELOPER PANEL
////////////////////////////////////////////////////

function showAuthenticatedDeveloperPanel(){
    if(document.getElementById("sparkdDevPanel")) return;
    const panel=document.createElement("div");
    panel.id="sparkdDevPanel";
    panel.innerHTML=`
    <div class="devHeader">🛠 SPARKD Developer Console <button id="closeDevPanel">✖</button></div>
    <div class="devSection"><h3>Player Data</h3><div class="devSection"><h3>Website</h3><button id="openWebsiteStatsBtn">📊 Website Stats</button></div><p>🪙 Points: <strong id="devPoints"></strong></p><p>⭐ Level: <strong id="devLevel"></strong></p></div>
    <div class="devSection"><h3>Points</h3><button id="add100">+100 SPARK</button><button id="add1000">+1000 SPARK</button><button id="resetPoints">Reset Points</button></div>
    <div class="devSection"><h3>Levels</h3><button class="levelBtn" data-level="1">Level 1</button><button class="levelBtn" data-level="2">Level 2</button><button class="levelBtn" data-level="3">Level 3</button><button class="levelBtn" data-level="4">Level 4</button><button class="levelBtn" data-level="5">Level 5</button></div>
    <div class="devSection"><h3>Next Week Contest</h3><p id="contestPauseStatus">Enter your PIN to manage the next contest.</p><button id="pauseNextContest" type="button">⏸ Pause Next Week</button><button id="resumeNextContest" type="button">▶ Resume Next Week</button></div>\n    <div class="devSection"><h3>Reset Tools</h3><button id="resetMission">Reset Daily Mission</button><button id="resetStarter">Reset Starter Pack</button><button id="fullReset">Full Player Reset</button></div>`;
    document.body.appendChild(panel);
    updateDevPanel();
    setupContestPauseControls(panel);
    document.getElementById("closeDevPanel").onclick=function(){panel.remove();};
    document.getElementById("openWebsiteStatsBtn").onclick=function(){if(window.SPARKD_WEBSITE_STATS_DASHBOARD){window.SPARKD_WEBSITE_STATS_DASHBOARD.open();}else{alert("Website Stats dashboard is not loaded.");}};

    document.getElementById("add100").onclick=function(){window.addSparkPoints(100);updateDevPanel();};
    document.getElementById("add1000").onclick=function(){window.addSparkPoints(1000);updateDevPanel();};
    document.getElementById("resetPoints").onclick=function(){localStorage.setItem("sparkPoints","0");updateDevPanel();const display=document.getElementById("sparkPointAmount");if(display)display.innerHTML="0";};
    document.querySelectorAll(".levelBtn").forEach(function(button){button.onclick=function(){localStorage.setItem("creatorLevel",button.getAttribute("data-level"));updateDevPanel();};});
    document.getElementById("resetMission").onclick=function(){localStorage.removeItem("missionCompleteDate");alert("Mission reset");};
    document.getElementById("resetStarter").onclick=function(){localStorage.removeItem("starterPackClaimed");alert("Starter Pack reset");};
    document.getElementById("fullReset").onclick=function(){localStorage.clear();alert("SPARKD reset complete");location.reload();};
}

function updateDevPanel(){
    const points=document.getElementById("devPoints");
    const level=document.getElementById("devLevel");
    if(points)points.innerHTML=localStorage.getItem("sparkPoints")||"0";
    if(level)level.innerHTML=localStorage.getItem("creatorLevel")||"1";
}

async function setupContestPauseControls(panel) {
    const status=panel.querySelector("#contestPauseStatus");
    const pause=panel.querySelector("#pauseNextContest");
    const resume=panel.querySelector("#resumeNextContest");
    const endpoint="https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/meme-week-pause-control";
    async function request(action) {
        const pin=window.prompt("Enter your 6-digit SPARKD developer PIN:");
        if(pin===null)return;
        if(!/^\d{6}$/.test(pin.trim())) { status.textContent="Enter a valid 6-digit PIN.";return; }
        pause.disabled=true;resume.disabled=true;status.textContent="Contacting contest server…";
        try {
            const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,pin:pin.trim()}),cache:"no-store"});
            const data=await response.json().catch(()=>({}));
            if(!response.ok||!data.success)throw new Error(data.error||"Contest server unavailable");
            const c=data.contest;
            status.textContent="Next contest ("+new Date(c.week_start).toLocaleDateString()+"): "+(c.submissions_paused?"PAUSED — no entries accepted":"Not paused");
        } catch(e) {status.textContent="Unable to change contest: "+e.message;}
        finally {pause.disabled=false;resume.disabled=false;}
    }
    pause.onclick=()=>request("pause");
    resume.onclick=()=>request("resume");
}
