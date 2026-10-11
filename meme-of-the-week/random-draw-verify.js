(() => {
  "use strict";
  const HOST_ID = "randomDrawVerify";
  const REFRESH_MS = 5 * 60 * 1000;
  const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  function shortId(v){const s=String(v||"");return s.length>18?`${s.slice(0,8)}…${s.slice(-8)}`:s;}
  async function load(){
    const host=document.getElementById(HOST_ID); const client=window.SPARKD_CONTEST_SUPABASE; if(!host||!client)return;
    const {data:contest,error:cErr}=await client.from("meme_week_contests").select("id,week_start,week_end,status").eq("status","completed").order("week_end",{ascending:false}).limit(1).maybeSingle();
    if(cErr||!contest){host.hidden=true;return;}
    const {data:audit,error:aErr}=await client.from("meme_week_draw_audits").select("eligible_count,entrant_commitment,random_seed,finalist_submission_ids,placement_submission_ids,drawn_at,algorithm").eq("contest_id",contest.id).maybeSingle();
    if(aErr||!audit){host.hidden=true;return;}
    const places=Array.isArray(audit.placement_submission_ids)?audit.placement_submission_ids:[];
    host.innerHTML=`<div style="font-weight:900;font-size:1.05rem;margin-bottom:8px;">🎲 VERIFY RANDOM DRAW</div><div>Randomly selected from <strong>${Number(audit.eligible_count||0).toLocaleString()}</strong> eligible meme${Number(audit.eligible_count||0)===1?"":"s"}. Every eligible meme received one equal chance.</div><details style="margin-top:10px;"><summary style="cursor:pointer;font-weight:800;">Draw audit record</summary><div style="margin-top:8px;word-break:break-all;font-size:.82rem;line-height:1.6;"><strong>Drawn:</strong> ${esc(new Date(audit.drawn_at).toLocaleString())}<br><strong>Algorithm:</strong> ${esc(audit.algorithm)}<br><strong>Entrant commitment:</strong> ${esc(audit.entrant_commitment)}<br><strong>Random seed:</strong> ${esc(audit.random_seed)}<br><strong>Placement IDs:</strong> ${places.map(shortId).map(esc).join(" → ")||"None"}</div></details>`;
    host.hidden=false;
  }
  function start(){load().catch(console.error);window.setInterval(()=>load().catch(console.error),REFRESH_MS);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
