(() => {
  "use strict";
  const STORAGE_KEY = "infernalLedger_november2026_v1";
  const CONFIG = Object.freeze({ dailySalary: 600, hourlyRate: 50, dutyStart: "07:00", dutyEnd: "19:00", maxAmount: 1000000000, noteMaxLength: 150, periodStart: "2026-11-01", periodEnd: "2026-11-25", workingDays: 25 });
  const DEFAULT_STATE = () => ({ settings: { ...CONFIG }, overtime: [], advances: [] });
  let state = loadState(), pendingConfirmation = null, toastTimer = null;
  const $ = s => document.querySelector(s);
  const refs = {
    periodLabel: $("#periodLabel"), liveEarning: $("#liveEarning"), liveClock: $("#liveClock"),
    normalSalaryEarned: $("#normalSalaryEarned"), overtimeTotal: $("#overtimeTotal"), advanceTotal: $("#advanceTotal"),
    estimatedSalary: $("#estimatedSalary"), totalSalaryBalance: $("#totalSalaryBalance"), workingDays: $("#workingDays"),
    historyOvertimeTotal: $("#historyOvertimeTotal"), historyAdvanceTotal: $("#historyAdvanceTotal"),
    overtimeHistory: $("#overtimeHistory"), advanceHistory: $("#advanceHistory"),
    overtimeForm: $("#overtimeForm"), advanceForm: $("#advanceForm"), overtimeDate: $("#overtimeDate"), advanceDate: $("#advanceDate"),
    overtimeError: $("#overtimeError"), advanceError: $("#advanceError"),
    modalBackdrop: $("#modalBackdrop"), editForm: $("#editForm"), editType: $("#editType"), editId: $("#editId"),
    editAmount: $("#editAmount"), editDate: $("#editDate"), editNote: $("#editNote"), editError: $("#editError"),
    confirmBackdrop: $("#confirmBackdrop"), confirmMessage: $("#confirmMessage"), confirmButton: $("#confirmButton"), toast: $("#toast")
  };
  const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
  function localISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function isValidDate(v) { if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false; const [y,m,d]=v.split("-").map(Number); const dt=new Date(y,m-1,d); return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d; }
  function formatDate(v) { if(!isValidDate(v)) return "Unrecorded date"; return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${v}T00:00:00`)); }
  function makeId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }
  function sanitizeEntries(list) {
    if(!Array.isArray(list)) return [];
    return list.map(x => {
      if(!x || typeof x!=="object") return null;
      const amount=Number(x.amount), date=String(x.date||"");
      if(!Number.isFinite(amount)||amount<=0||amount>CONFIG.maxAmount||!isValidDate(date)||date<CONFIG.periodStart||date>CONFIG.periodEnd) return null;
      return {id:typeof x.id==="string"&&x.id?x.id:makeId(),amount,date,note:typeof x.note==="string"?x.note.slice(0,CONFIG.noteMaxLength):"",createdAt:typeof x.createdAt==="string"?x.createdAt:new Date().toISOString()};
    }).filter(Boolean);
  }
  function sanitizeState(raw) { const s=DEFAULT_STATE(); if(!raw||typeof raw!=="object") return s; s.overtime=sanitizeEntries(raw.overtime); s.advances=sanitizeEntries(raw.advances); return s; }
  function loadState() { try { const raw=localStorage.getItem(STORAGE_KEY); return raw?sanitizeState(JSON.parse(raw)):DEFAULT_STATE(); } catch { return DEFAULT_STATE(); } }
  function saveState() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch { showToast("The archives rejected the offering. Browser storage may be unavailable."); } }
  function minutes(t) { const [h,m]=t.split(":").map(Number); return h*60+m; }
  function isInPeriod(now) { const day=localISO(now); return day>=CONFIG.periodStart&&day<=CONFIG.periodEnd; }
  function calculateDayProgress(now=new Date()) {
    const today=localISO(now);
    if(today<CONFIG.periodStart) return 0;
    if(today>CONFIG.periodEnd) return CONFIG.workingDays;
    const day=Number(today.slice(-2));
    const start=minutes(CONFIG.dutyStart), end=minutes(CONFIG.dutyEnd);
    const current=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
    let todayFraction=0;
    if(current>=end) todayFraction=1;
    else if(current>start) todayFraction=(current-start)/(end-start);
    return Math.max(0,Math.min(CONFIG.workingDays,(day-1)+todayFraction));
  }
  function calculateLiveEarning(now=new Date()) {
    if(!isInPeriod(now)) return 0;
    const current=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
    const start=minutes(CONFIG.dutyStart), end=minutes(CONFIG.dutyEnd);
    if(current<=start) return 0;
    if(current>=end) return CONFIG.dailySalary;
    return CONFIG.dailySalary*((current-start)/(end-start));
  }
  function calculateSummary(now=new Date()) {
    const progress=calculateDayProgress(now), normal=progress*CONFIG.dailySalary;
    const overtime=state.overtime.reduce((sum,x)=>sum+x.amount,0), advances=state.advances.reduce((sum,x)=>sum+x.amount,0);
    return {progress,normal,overtime,advances,estimated:CONFIG.workingDays*CONFIG.dailySalary+overtime-advances,balance:normal+overtime-advances};
  }
  function renderApp() {
    const now=new Date(), s=calculateSummary(now), pct=s.progress/CONFIG.workingDays*100, circumference=2*Math.PI*94;
    refs.periodLabel.textContent = localISO(now)<CONFIG.periodStart ? "COUNTDOWN TO 01 NOV 2026" : localISO(now)>CONFIG.periodEnd ? "RECKONING COMPLETE · 25 NOV 2026" : "NOVEMBER 2026 · THE RECKONING";
    refs.liveEarning.textContent=money(calculateLiveEarning(now));
    refs.liveClock.textContent=now.toLocaleTimeString("en-GB",{hour12:false});
    $("#progressPercent").textContent=`${pct.toFixed(2)}%`;
    $("#progressDays").textContent=`${s.progress.toFixed(2)} / 25 days`;
    $("#ringProgress").style.strokeDasharray=String(circumference);
    $("#ringProgress").style.strokeDashoffset=String(circumference*(1-pct/100));
    refs.workingDays.textContent=`${Math.floor(s.progress)} / 25`;
    refs.earnedToDate.textContent=money(s.normal);
    refs.daysRemaining.textContent=`${Math.max(0,CONFIG.workingDays-s.progress).toFixed(2)} days remain`;
    refs.normalSalaryEarned.textContent=money(s.normal);
    refs.overtimeTotal.textContent=money(s.overtime); refs.advanceTotal.textContent=money(s.advances);
    refs.estimatedSalary.textContent=money(s.estimated); refs.totalSalaryBalance.textContent=money(s.balance);
    refs.historyOvertimeTotal.textContent=money(s.overtime); refs.historyAdvanceTotal.textContent=money(s.advances);
    renderHistory(refs.overtimeHistory,state.overtime,"overtime"); renderHistory(refs.advanceHistory,state.advances,"advance");
  }
  function escapeHtml(v) { return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
  function renderHistory(container,entries,type) {
    const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
    if(!sorted.length){container.innerHTML=`<div class="empty-state">${type==="overtime"?"The chronicles remain untouched. No bounty has been claimed.":"The debt ledger is silent. No blood debts recorded."}</div>`;return;}
    container.innerHTML=sorted.map(e=>`<article class="entry-row"><div class="entry-main"><div class="entry-date">${escapeHtml(formatDate(e.date))}</div><div class="entry-amount">${escapeHtml(money(e.amount))}</div>${e.note?`<div class="entry-note" title="${escapeHtml(e.note)}">${escapeHtml(e.note)}</div>`:""}</div><div class="entry-actions"><button class="small-btn" data-action="edit" data-type="${type}" data-id="${escapeHtml(e.id)}">Alter</button><button class="small-btn delete" data-action="delete" data-type="${type}" data-id="${escapeHtml(e.id)}">Banish</button></div></article>`).join("");
  }
  function validateEntry(p) {
    const amount=Number(String(p.amount).replace(/,/g,"").trim());
    if(!Number.isFinite(amount)||amount<=0) return {ok:false,message:"The offering is unacceptable. Enter an amount greater than ₹0."};
    if(amount>CONFIG.maxAmount) return {ok:false,message:"That offering exceeds the permitted limit."};
    if(!isValidDate(p.date)||p.date<CONFIG.periodStart||p.date>CONFIG.periodEnd) return {ok:false,message:"Choose a valid date between 1 and 25 November 2026."};
    if(String(p.note||"").length>CONFIG.noteMaxLength) return {ok:false,message:"Inscription must be 150 characters or fewer."};
    return {ok:true,amount,date:p.date,note:String(p.note||"").trim()};
  }
  function addEntry(type,form,errorEl) {
    const fd=new FormData(form), result=validateEntry({amount:fd.get("amount"),date:fd.get("date"),note:fd.get("note")||""});
    if(!result.ok){errorEl.textContent=result.message;return;}
    state[type].push({id:makeId(),amount:result.amount,date:result.date,note:result.note,createdAt:new Date().toISOString()});
    saveState();form.reset();const dateField=type==="overtime"?refs.overtimeDate:refs.advanceDate;dateField.value=localISO()>=CONFIG.periodStart&&localISO()<=CONFIG.periodEnd?localISO():CONFIG.periodStart;errorEl.textContent="";renderApp();showToast(type==="overtime"?"The bounty has been claimed. ✦":"The blood debt has been inscribed. †");
  }
  function openEdit(type,id) {
    const entry=state[type].find(x=>x.id===id);if(!entry)return;
    refs.editType.value=type;refs.editId.value=id;refs.editAmount.value=entry.amount.toFixed(2);refs.editDate.value=entry.date;refs.editNote.value=entry.note;refs.editError.textContent="";
    $("#modalTitle").textContent=type==="overtime"?"Alter Forbidden Bounty":"Alter Blood Debt";refs.modalBackdrop.hidden=false;refs.editAmount.focus();
  }
  function closeModal(){refs.modalBackdrop.hidden=true;refs.editForm.reset();refs.editError.textContent="";}
  function saveEdit(e) {
    e.preventDefault();const type=refs.editType.value,id=refs.editId.value;
    const result=validateEntry({amount:refs.editAmount.value,date:refs.editDate.value,note:refs.editNote.value.trim()});
    if(!result.ok){refs.editError.textContent=result.message;return;}
    const entry=state[type].find(x=>x.id===id);if(!entry)return;
    Object.assign(entry,{amount:result.amount,date:result.date,note:result.note});saveState();closeModal();renderApp();showToast("The pact has been altered and resealed.");
  }
  function askDelete(type,id) {
    const entry=state[type].find(x=>x.id===id);if(!entry)return;
    pendingConfirmation=()=>{state[type]=state[type].filter(x=>x.id!==id);saveState();renderApp();showToast("The record has been banished.");};
    refs.confirmMessage.textContent=`Banish ${money(entry.amount)} dated ${formatDate(entry.date)} from the archives? This cannot be undone.`;
    refs.confirmBackdrop.hidden=false;
  }
  function resetAllData() {
    pendingConfirmation=()=>{state.overtime=[];state.advances=[];saveState();renderApp();showToast("The ledger has been purged. The covenant remains.");};
    refs.confirmMessage.textContent="Purge every overtime and blood-debt record? The fixed November covenant will remain. This cannot be undone.";
    refs.confirmBackdrop.hidden=false;
  }
  function closeConfirm(){refs.confirmBackdrop.hidden=true;pendingConfirmation=null;}
  function showToast(message){clearTimeout(toastTimer);refs.toast.textContent=message;refs.toast.classList.add("show");toastTimer=setTimeout(()=>refs.toast.classList.remove("show"),2800);}
  function buildReceipt() {
    const s=calculateSummary(new Date()), overtime=[...state.overtime].sort((a,b)=>b.date.localeCompare(a.date)), advances=[...state.advances].sort((a,b)=>b.date.localeCompare(a.date));
    const rows=entries=>entries.length?entries.map(e=>`<tr><td>${escapeHtml(formatDate(e.date))}</td><td>${escapeHtml(money(e.amount))}</td><td>${escapeHtml(e.note||"—")}</td></tr>`).join(""):`<tr><td colspan="3">No records inscribed</td></tr>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>The Crimson Reckoning · November 2026</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#241822;margin:0;padding:34px;background:#fff}.receipt{max-width:760px;margin:auto}.head{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #74152e;padding-bottom:18px;margin-bottom:22px}h1{font-family:Georgia,serif;letter-spacing:.08em;margin:0;font-size:27px;color:#74152e}p{margin:6px 0;color:#786875}.summary{border:1px solid #e3d5de;border-radius:10px;padding:17px;margin-bottom:22px;background:#fbf8fa}.line{display:flex;justify-content:space-between;gap:12px;padding:9px 0}.line.total{border-top:2px solid #74152e;margin-top:8px;padding-top:14px;font-size:20px;font-weight:800;color:#74152e}h2{font-family:Georgia,serif;color:#74152e;font-size:17px;margin:24px 0 10px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:9px;border-bottom:1px solid #e9e0e7}th{background:#f5edf2;color:#5c1b36}.footer{margin-top:30px;font-size:10px;color:#8c7c89}@media print{body{padding:0}}</style></head><body><main class="receipt"><div class="head"><div><h1>THE CRIMSON RECKONING</h1><p>Infernal Ledger · November 2026</p></div><div><p>01 Nov — 25 Nov 2026</p><p>25 working days · ₹600/day</p></div></div><section class="summary"><div class="line"><span>Full Covenant · Normal Salary</span><strong>${escapeHtml(money(15000))}</strong></div><div class="line"><span>Tribute Claimed to Date</span><strong>${escapeHtml(money(s.normal))}</strong></div><div class="line"><span>Forbidden Bounty · Overtime</span><strong>+${escapeHtml(money(s.overtime))}</strong></div><div class="line"><span>Blood Debt · Advances</span><strong>−${escapeHtml(money(s.advances))}</strong></div><div class="line"><span>Remaining Hoard</span><strong>${escapeHtml(money(s.balance))}</strong></div><div class="line total"><span>Prophecy of Fortune</span><strong>${escapeHtml(money(s.estimated))}</strong></div></section><h2>Chronicles of the Hunt</h2><table><thead><tr><th>Date</th><th>Bounty</th><th>Inscription</th></tr></thead><tbody>${rows(overtime)}</tbody></table><h2>The Debt Ledger</h2><table><thead><tr><th>Date</th><th>Debt</th><th>Inscription</th></tr></thead><tbody>${rows(advances)}</tbody></table><div class="footer">Generated by Infernal Ledger · ${new Date().toLocaleString()} · Let the accounts be settled.</div></main><script>window.onload=()=>window.print();</script></body></html>`;
  }
  function printReceipt() {
    const popup=window.open("","_blank");
    if(!popup){showToast("The portal is sealed. Allow pop-ups to summon the scroll.");return;}
    popup.document.open();popup.document.write(buildReceipt());popup.document.close();
  }
  function wireEvents() {
    refs.overtimeForm.addEventListener("submit",e=>{e.preventDefault();addEntry("overtime",refs.overtimeForm,refs.overtimeError);});
    refs.advanceForm.addEventListener("submit",e=>{e.preventDefault();addEntry("advances",refs.advanceForm,refs.advanceError);});
    refs.editForm.addEventListener("submit",saveEdit);
    refs.overtimeHistory.addEventListener("click",handleHistoryClick);refs.advanceHistory.addEventListener("click",handleHistoryClick);
    document.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;if(t.dataset.action==="close-modal")closeModal();if(t.dataset.action==="cancel-confirm")closeConfirm();});
    refs.confirmButton.addEventListener("click",()=>{if(pendingConfirmation)pendingConfirmation();closeConfirm();});
    $("#resetBtn").addEventListener("click",resetAllData);$("#printBtn").addEventListener("click",printReceipt);
    refs.modalBackdrop.addEventListener("click",e=>{if(e.target===refs.modalBackdrop)closeModal();});
    refs.confirmBackdrop.addEventListener("click",e=>{if(e.target===refs.confirmBackdrop)closeConfirm();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeConfirm();}});
  }
  function handleHistoryClick(e){const b=e.target.closest("[data-action]");if(!b)return;const {action,type,id}=b.dataset;if(action==="edit")openEdit(type,id);if(action==="delete")askDelete(type,id);}
  function initialize() {
    const today=localISO(), defaultDate=today>=CONFIG.periodStart&&today<=CONFIG.periodEnd?today:CONFIG.periodStart;
    refs.overtimeDate.value=defaultDate;refs.advanceDate.value=defaultDate;
    wireEvents();renderApp();
    setInterval(()=>renderApp(),1000);
  }
  initialize();
})();
