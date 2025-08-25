// Auto-intent UI (no category picker)
// Works with FastAPI or Express backends unchanged.

const Api = {
  base: (window.API_BASE && window.API_BASE.trim()) || window.location.origin,
  async health(){ const r = await fetch(`${this.base}/health`); return r.ok ? r.json() : Promise.reject(await r.text()); },
  async agents(){ const r = await fetch(`${this.base}/agents`); return r.ok ? r.json() : Promise.reject(await r.text()); },
  async run(intent, goal){
    const r = await fetch(`${this.base}/run`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ intent, goal }) });
    return r.ok ? r.json() : Promise.reject(await r.json().catch(()=>({error:'Request failed'})));
  },
  async receipts(limit=10){ const r = await fetch(`${this.base}/receipts?limit=${limit}`); return r.ok ? r.json() : Promise.reject(await r.text()); }
};

const $ = (s)=>document.querySelector(s);

const runBtn=$("#runBtn"), clearBtn=$("#clearBtn"), goalInput=$("#goalInput");
const detectedLabel=$("#detectedLabel"), detectedCode=$("#detectedCode");
const result=$("#result"), resultJson=$("#resultJson"), toggleJsonBtn=$("#toggleJson");
const receiptsEl=$("#receipts"), refreshBtn=$("#refreshReceipts"), exportCsvBtn=$("#exportCsv");
const apiStatus=$("#apiStatus"), apiOriginLabel=$("#apiOriginLabel");

let AGENT_LABELS = {
  TA:"IT Agent", SA:"Sales Agent", PA:"Press Agent", FA:"Farming Agent", WA:"Wildlife Agent",
  CA:"Church Agent", JA:"Job Agent", ArA:"Arts Agent", RA:"Recreation Agent"
};

// Keyword map → agent code
// You can tune this list freely.
const INTENT_KEYWORDS = [
  // Press first to catch “press release”
  { code:"PA", words:[ "press release", "press", "media", "newsroom", "announcement draft", "journalist" ] },
  // Jobs
  { code:"JA", words:[ "resume", "cover letter", "job", "hiring", "interview", "career", "applicant", "application" ] },
  // IT
  { code:"TA", words:[ "wifi", "wi‑fi", "printer", "computer", "laptop", "phone", "software", "bug", "error", "troubleshoot", "network", "router" ] },
  // Sales
  { code:"SA", words:[ "sales", "pitch", "outreach", "customers", "lead", "prospect", "marketing", "cta" ] },
  // Farming
  { code:"FA", words:[ "farm", "farming", "crop", "plant", "garden", "soil", "rotation", "fertilizer" ] },
  // Wildlife
  { code:"WA", words:[ "wildlife", "bear", "deer", "raccoon", "coyote", "snake", "animal control", "twra" ] },
  // Church
  { code:"CA", words:[ "church", "vespers", "worship", "outreach", "ministry", "announcements", "sabbath", "service" ] },
  // Arts
  { code:"ArA", words:[ "art", "arts", "gallery", "exhibit", "craft", "showcase", "paint", "sculpt", "illustration" ] },
  // Recreation
  { code:"RA", words:[ "hike", "trail", "camp", "recreation", "kayak", "picnic", "greenway", "overlook", "outdoors" ] },
];

// Optional: power-user override via URL: ?intent=PA (etc)
function getUrlIntentOverride(){
  const u = new URL(window.location.href);
  const val = u.searchParams.get("intent");
  return val && AGENT_LABELS[val] ? val : null;
}

function detectIntent(goal){
  // If user types an explicit prefix like "press: announce ..."
  const m = goal.match(/^\s*([a-z]{2,3}|ara)\s*:\s*/i);
  if(m){
    const maybe = m[1].toUpperCase();
    if(AGENT_LABELS[maybe]) return maybe;
    if(maybe === "ARA") return "ArA";
  }

  const text = goal.toLowerCase();
  // Prefer multi-word phrases first by sorting words desc length
  for(const {code, words} of INTENT_KEYWORDS){
    const sorted = [...words].sort((a,b)=>b.length - a.length);
    for(const w of sorted){
      // word boundary for single words; plain includes for phrases
      if(w.includes(" ")){
        if(text.includes(w.toLowerCase())) return code;
      }else{
        const re = new RegExp(`\\b${escapeRegExp(w.toLowerCase())}\\b`);
        if(re.test(text)) return code;
      }
    }
  }
  // Default to IT if nothing matched
  return "TA";
}

function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function updateDetected(goal){
  const urlOverride = getUrlIntentOverride();
  const code = urlOverride || detectIntent(goal);
  detectedCode.textContent = code;
  detectedLabel.textContent = AGENT_LABELS[code] || code;
  return code;
}

function setBusy(b){ runBtn.disabled=b; runBtn.querySelector(".spinner").classList.toggle("hidden",!b); }
function escapeHtml(s){ return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

function showResultPretty(resp){
  const { success, summary, data, receipt } = resp||{};
  let html=`<div class="kv">
    <dt>Status</dt><dd>${success ? "✅ Success" : "❌ Failed"}</dd>
    <dt>Summary</dt><dd>${escapeHtml(summary||"")}</dd>
    <dt>Agent</dt><dd>${escapeHtml(receipt?.agent_label||"")}</dd>
    <dt>Goal</dt><dd>${escapeHtml(receipt?.user_goal||"")}</dd>
  </div>`;
  if(data){
    if(Array.isArray(data.checklist)){ html+=`<h3>Checklist</h3><ul class="clean">${data.checklist.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
    if(data.pitch){
      html+=`<h3>Sales Pitch</h3><div><strong>${escapeHtml(data.pitch.headline||"")}</strong></div>${
        Array.isArray(data.pitch.value_props)?`<ul class="clean">${data.pitch.value_props.map(p=>`<li>${escapeHtml(p)}`).join("")}</ul>`:""
      }${data.pitch.cta?`<div><em>Call to action:</em> ${escapeHtml(data.pitch.cta)}</div>`:""}`;
    }
    if(data.press_release){
      const pr=data.press_release;
      html+=`<h3>Press Release</h3><div><strong>${escapeHtml(pr.title||"Community Update")}</strong></div><p>${escapeHtml(pr.lead||"")}</p>${
        Array.isArray(pr.bullet_points)?`<ul class="clean">${pr.bullet_points.map(b=>`<li>${escapeHtml(b)}`).join("")}</ul>`:""
      }`;
    }
    if(data.plan){
      const p=data.plan; html+=`<h3>Plan</h3>`;
      if(Array.isArray(p.crop_rotation)){ html+=`<div><strong>Crop rotation:</strong></div><ul class="clean">${p.crop_rotation.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
      if(p.soil_test){ html+=`<div><strong>Soil test:</strong> ${escapeHtml(p.soil_test)}</div>`; }
      if(p.goal_note){ html+=`<div><strong>Note:</strong> ${escapeHtml(p.goal_note)}</div>`; }
    }
    if(data.guidance){
      const g=data.guidance; html+=`<h3>Guidance</h3>`;
      if(Array.isArray(g.safety)){ html+=`<div><strong>Safety:</strong></div><ul class="clean">${g.safety.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
      if(Array.isArray(g.contacts)){ html+=`<div><strong>Contacts:</strong></div><ul class="clean">${g.contacts.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
      if(g.goal_note){ html+=`<div><strong>Note:</strong> ${escapeHtml(g.goal_note)}</div>`; }
    }
    if(data.outline){
      const o=data.outline; html+=`<h3>Announcements</h3>`;
      if(o.announcement){ html+=`<div><strong>${escapeHtml(o.announcement)}</strong></div>`; }
      if(Array.isArray(o.schedule)){ html+=`<div><strong>Schedule:</strong></div><ul class="clean">${o.schedule.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
      if(o.goal_note){ html+=`<div><strong>Note:</strong> ${escapeHtml(o.goal_note)}</div>`; }
    }
    if(Array.isArray(data.steps)){ html+=`<h3>Next Steps</h3><ul class="clean">${data.steps.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`; }
    if(data.itinerary){
      const it=data.itinerary; html+=`<h3>Itinerary</h3>`;
      if(Array.isArray(it.half_day)){ html+=`<div><strong>Half-day plan:</strong></div><ul class="clean">${it.half_day.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
      if(Array.isArray(it.gear)){ html+=`<div><strong>Gear:</strong></div><ul class="clean">${it.gear.map(x=>`<li>${escapeHtml(x)}`).join("")}</ul>`; }
      if(it.goal_note){ html+=`<div><strong>Note:</strong> ${escapeHtml(it.goal_note)}</div>`; }
    }
  }
  result.innerHTML=html;
  resultJson.textContent=JSON.stringify(resp,null,2);
}

function renderReceipts(items){
  receiptsEl.innerHTML="";
  for(const r of items){
    const div=document.createElement("div"); div.className="receipt";
    div.innerHTML=`<div class="meta">${new Date(r.timestamp).toLocaleString()} • ${r.app} (${r.alias})</div>
      <div class="title">${r.agent_label} — ${escapeHtml(r.result_summary)}</div>
      <div class="goal">Goal: ${escapeHtml(r.user_goal)}</div>`;
    receiptsEl.appendChild(div);
  }
}

async function bootstrap(){
  $("#apiOriginLabel").textContent=Api.base; $("#apiOriginLabel").href=Api.base;

  try{ await Api.health(); apiStatus.textContent="API Connected"; apiStatus.classList.remove("badge--err","badge--muted"); apiStatus.classList.add("badge--ok"); }
  catch{ apiStatus.textContent="API Unreachable"; apiStatus.classList.remove("badge--ok","badge--muted"); apiStatus.classList.add("badge--err"); }

  // Try to get labels from API (optional)
  try{
    const list = await Api.agents();
    const map = {};
    for(const a of list){ map[a.code]=a.label; }
    // Keep ArA casing
    if(map["ARA"] && !map["ArA"]) { map["ArA"] = map["ARA"]; delete map["ARA"]; }
    AGENT_LABELS = { ...AGENT_LABELS, ...map };
  }catch{/* ignore */ }

  // Prime detection display
  updateDetected(goalInput.value || "");

  await refreshReceipts();
}

async function refreshReceipts(){
  try{ renderReceipts(await Api.receipts(12)); }
  catch{ receiptsEl.innerHTML = "<p>Could not load receipts.</p>"; }
}

runBtn.addEventListener("click", async ()=>{
  const goal = goalInput.value.trim();
  if(!goal){ goalInput.focus(); goalInput.setAttribute("aria-invalid","true"); return; }
  goalInput.removeAttribute("aria-invalid");

  const code = updateDetected(goal);
  setBusy(true);
  try{
    const resp = await Api.run(code, goal);
    showResultPretty(resp);
    await refreshReceipts();
  }catch(e){
    showResultPretty({ success:false, summary:"Request failed", data:{ error: e?.error || "Unknown error"} });
  }finally{
    setBusy(false);
  }
});

goalInput.addEventListener("input", ()=> updateDetected(goalInput.value));

clearBtn.addEventListener("click", ()=>{
  goalInput.value="";
  updateDetected("");
  result.innerHTML="";
  resultJson.textContent="";
  goalInput.focus();
});

refreshBtn.addEventListener("click", refreshReceipts);

exportCsvBtn.addEventListener("click", ()=>{
  const cards = receiptsEl.querySelectorAll(".receipt");
  if(!cards.length){ alert("Nothing to export yet."); return; }
  // Fetch from API for accurate data
  Api.receipts(100).then(items=>{
    const header=["timestamp","app","alias","agent_code","agent_label","user_goal","result_summary"];
    const rows=items.map(r=>header.map(h=>String(r[h]??"").replace(/"/g,'""')));
    const csv=[header.join(","),...rows.map(r=>r.map(v=>`"${v}"`).join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="mytn_receipts.csv"; a.click(); URL.revokeObjectURL(url);
  });
});

toggleJsonBtn.addEventListener("click", ()=>{
  const pressed=toggleJsonBtn.getAttribute("aria-pressed")==="true";
  toggleJsonBtn.setAttribute("aria-pressed", String(!pressed));
  toggleJsonBtn.textContent = pressed ? "Show JSON" : "Hide JSON";
  resultJson.classList.toggle("hidden", pressed);
});

bootstrap();
