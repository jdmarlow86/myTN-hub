
const Api = {
    base: (window.API_BASE && window.API_BASE.trim()) || window.location.origin,
    async health() { const r = await fetch(`${this.base}/health`); return r.ok ? r.json() : Promise.reject(await r.text()); },
    async agents() { const r = await fetch(`${this.base}/agents`); return r.ok ? r.json() : Promise.reject(await r.text()); },
    async run(intent, goal) {
        const r = await fetch(`${this.base}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent, goal }) });
        return r.ok ? r.json() : Promise.reject(await r.json().catch(() => ({ error: 'Request failed' })));
    },
    async receipts(limit = 10) { const r = await fetch(`${this.base}/receipts?limit=${limit}`); return r.ok ? r.json() : Promise.reject(await r.text()); }
};

const $ = (s) => document.querySelector(s);
const agentGrid = $("#agentGrid"), runBtn = $("#runBtn"), clearBtn = $("#clearBtn"), goalInput = $("#goalInput");
const result = $("#result"), resultJson = $("#resultJson"), toggleJsonBtn = $("#toggleJson");
const receiptsEl = $("#receipts"), refreshBtn = $("#refreshReceipts"), exportCsvBtn = $("#exportCsv");
const apiStatus = $("#apiStatus"), apiOriginLabel = $("#apiOriginLabel");
let agentsCache = [], selectedIntent = null, lastReceipts = [], lastResponse = null;

function renderAgents(agents) {
    agentsCache = agents; agentGrid.innerHTML = "";
    const ICONS = { "IT Agent": "??", "Sales Agent": "??", "Press Agent": "??", "Farming Agent": "??", "Wildlife Agent": "??", "Church Agent": "?", "Job Agent": "?????", "Arts Agent": "??", "Recreation Agent": "???" };
    const DESCS = { "IT Agent": "Tech help & troubleshooting", "Sales Agent": "Pitch & outreach ideas", "Press Agent": "Press notes & releases", "Farming Agent": "Planting & planning", "Wildlife Agent": "Safety & contacts", "Church Agent": "Announcements & schedule", "Job Agent": "Resume & next steps", "Arts Agent": "Showcase & materials", "Recreation Agent": "Outings & gear" };
    for (const a of agents) {
        const btn = document.createElement("button");
        btn.className = "agent-btn"; btn.type = "button";
        btn.setAttribute("data-code", a.code);
        btn.setAttribute("data-selected", selectedIntent === a.code ? "true" : "false");
        btn.innerHTML = `<span class="agent-emoji">${ICONS[a.label] || "?"}</span><span><div class="agent-label">${a.label}</div><div class="agent-desc">${DESCS[a.label] || ""}</div></span>`;
        btn.addEventListener("click", () => { selectedIntent = a.code;[...agentGrid.querySelectorAll(".agent-btn")].forEach(x => x.setAttribute("data-selected", "false")); btn.setAttribute("data-selected", "true"); goalInput.focus(); });
        agentGrid.appendChild(btn);
    }
    if (!selectedIntent && agents.length) { selectedIntent = agents[0].code; agentGrid.querySelector(".agent-btn")?.setAttribute("data-selected", "true"); }
}
function setBusy(b) { runBtn.disabled = b; runBtn.querySelector(".spinner").classList.toggle("hidden", !b); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function showResultPretty(resp) {
    lastResponse = resp;
    const { success, summary, data, receipt } = resp || {};
    let html = `<div class="kv">
    <dt>Status</dt><dd>${success ? "? Success" : "? Failed"}</dd>
    <dt>Summary</dt><dd>${escapeHtml(summary || "")}</dd>
    <dt>Agent</dt><dd>${escapeHtml(receipt?.agent_label || "")}</dd>
    <dt>Goal</dt><dd>${escapeHtml(receipt?.user_goal || "")}</dd>
  </div>`;
    if (data) {
        if (Array.isArray(data.checklist)) { html += `<h3>Checklist</h3><ul class="clean">${data.checklist.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
        if (data.pitch) {
            html += `<h3>Sales Pitch</h3><div><strong>${escapeHtml(data.pitch.headline || "")}</strong></div>${Array.isArray(data.pitch.value_props) ? `<ul class="clean">${data.pitch.value_props.map(p => `<li>${escapeHtml(p)}`).join("")}</ul>` : ""
                }${data.pitch.cta ? `<div><em>Call to action:</em> ${escapeHtml(data.pitch.cta)}</div>` : ""}`;
        }
        if (data.press_release) {
            const pr = data.press_release;
            html += `<h3>Press Release</h3><div><strong>${escapeHtml(pr.title || "Community Update")}</strong></div><p>${escapeHtml(pr.lead || "")}</p>${Array.isArray(pr.bullet_points) ? `<ul class="clean">${pr.bullet_points.map(b => `<li>${escapeHtml(b)}`).join("")}</ul>` : ""
                }`;
        }
        if (data.plan) {
            const p = data.plan; html += `<h3>Plan</h3>`;
            if (Array.isArray(p.crop_rotation)) { html += `<div><strong>Crop rotation:</strong></div><ul class="clean">${p.crop_rotation.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
            if (p.soil_test) { html += `<div><strong>Soil test:</strong> ${escapeHtml(p.soil_test)}</div>`; }
            if (p.goal_note) { html += `<div><strong>Note:</strong> ${escapeHtml(p.goal_note)}</div>`; }
        }
        if (data.guidance) {
            const g = data.guidance; html += `<h3>Guidance</h3>`;
            if (Array.isArray(g.safety)) { html += `<div><strong>Safety:</strong></div><ul class="clean">${g.safety.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
            if (Array.isArray(g.contacts)) { html += `<div><strong>Contacts:</strong></div><ul class="clean">${g.contacts.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
            if (g.goal_note) { html += `<div><strong>Note:</strong> ${escapeHtml(g.goal_note)}</div>`; }
        }
        if (data.outline) {
            const o = data.outline; html += `<h3>Announcements</h3>`;
            if (o.announcement) { html += `<div><strong>${escapeHtml(o.announcement)}</strong></div>`; }
            if (Array.isArray(o.schedule)) { html += `<div><strong>Schedule:</strong></div><ul class="clean">${o.schedule.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
            if (o.goal_note) { html += `<div><strong>Note:</strong> ${escapeHtml(o.goal_note)}</div>`; }
        }
        if (Array.isArray(data.steps)) { html += `<h3>Next Steps</h3><ul class="clean">${data.steps.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`; }
        if (data.itinerary) {
            const it = data.itinerary; html += `<h3>Itinerary</h3>`;
            if (Array.isArray(it.half_day)) { html += `<div><strong>Half-day plan:</strong></div><ul class="clean">${it.half_day.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
            if (Array.isArray(it.gear)) { html += `<div><strong>Gear:</strong></div><ul class="clean">${it.gear.map(x => `<li>${escapeHtml(x)}`).join("")}</ul>`; }
            if (it.goal_note) { html += `<div><strong>Note:</strong> ${escapeHtml(it.goal_note)}</div>`; }
        }
    }
    result.innerHTML = html;
    resultJson.textContent = JSON.stringify(resp, null, 2);
}
function renderReceipts(items) {
    receiptsEl.innerHTML = "";
    for (const r of items) {
        const div = document.createElement("div"); div.className = "receipt";
        div.innerHTML = `<div class="meta">${new Date(r.timestamp).toLocaleString()} • ${r.app} (${r.alias})</div>
      <div class="title">${r.agent_label} — ${escapeHtml(r.result_summary)}</div>
      <div class="goal">Goal: ${escapeHtml(r.user_goal)}</div>`;
        receiptsEl.appendChild(div);
    }
}
async function bootstrap() {
    $("#apiOriginLabel").textContent = Api.base; $("#apiOriginLabel").href = Api.base;
    try { await Api.health(); apiStatus.textContent = "API Connected"; apiStatus.classList.remove("badge--err", "badge--muted"); apiStatus.classList.add("badge--ok"); }
    catch { apiStatus.textContent = "API Unreachable"; apiStatus.classList.remove("badge--ok", "badge--muted"); apiStatus.classList.add("badge--err"); }
    try { renderAgents(await Api.agents()); } catch { agentGrid.innerHTML = "<p>Could not load categories.</p>"; }
    await refreshReceipts();
}
async function refreshReceipts() { try { lastReceipts = await Api.receipts(12); renderReceipts(lastReceipts); } catch { receiptsEl.innerHTML = "<p>Could not load receipts.</p>"; } }
runBtn.addEventListener("click", async () => {
    if (!selectedIntent) { alert("Choose a category first."); return; }
    const goal = goalInput.value.trim();
    if (!goal) { goalInput.focus(); goalInput.setAttribute("aria-invalid", "true"); return; }
    goalInput.removeAttribute("aria-invalid");
    setBusy(true);
    try { const resp = await Api.run(selectedIntent, goal); showResultPretty(resp); await refreshReceipts(); }
    catch (e) { showResultPretty({ success: false, summary: "Request failed", data: { error: e?.error || "Unknown error" } }); }
    finally { setBusy(false); }
});
clearBtn.addEventListener("click", () => { goalInput.value = ""; result.innerHTML = ""; resultJson.textContent = ""; goalInput.focus(); });
refreshBtn.addEventListener("click", refreshReceipts);
exportCsvBtn.addEventListener("click", () => {
    if (!lastReceipts?.length) { alert("Nothing to export yet."); return; }
    const header = ["timestamp", "app", "alias", "agent_code", "agent_label", "user_goal", "result_summary"];
    const rows = lastReceipts.map(r => header.map(h => String(r[h] ?? "").replace(/"/g, '""')));
    const csv = [header.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mytn_receipts.csv"; a.click(); URL.revokeObjectURL(url);
});
toggleJsonBtn.addEventListener("click", () => {
    const pressed = toggleJsonBtn.getAttribute("aria-pressed") === "true";
    toggleJsonBtn.setAttribute("aria-pressed", String(!pressed));
    toggleJsonBtn.textContent = pressed ? "Show JSON" : "Hide JSON";
    resultJson.classList.toggle("hidden", pressed);
});
bootstrap();

