(() => {
  "use strict";

  const STORAGE_KEY = "salaryTrackerData_v2";
  const CONFIG = Object.freeze({
    dailySalary: 600,
    hourlyRate: 50,
    dutyStart: "07:00",
    dutyEnd: "19:00",
    noteMaxLength: 150,
    maxAmount: 1000000000
  });

  const DEFAULT_STATE = () => ({
    settings: { ...CONFIG },
    overtime: [],
    advances: []
  });

  let state = loadState();
  let pendingConfirmation = null;
  let toastTimer = null;

  const $ = (selector) => document.querySelector(selector);

  const refs = {
    periodLabel: $("#periodLabel"),
    liveEarning: $("#liveEarning"),
    normalSalaryEarned: $("#normalSalaryEarned"),
    overtimeTotal: $("#overtimeTotal"),
    advanceTotal: $("#advanceTotal"),
    estimatedSalary: $("#estimatedSalary"),
    totalSalaryBalance: $("#totalSalaryBalance"),
    workingDays: $("#workingDays"),
    historyOvertimeTotal: $("#historyOvertimeTotal"),
    historyAdvanceTotal: $("#historyAdvanceTotal"),
    overtimeHistory: $("#overtimeHistory"),
    advanceHistory: $("#advanceHistory"),
    overtimeForm: $("#overtimeForm"),
    advanceForm: $("#advanceForm"),
    overtimeAmount: $("#overtimeAmount"),
    overtimeDate: $("#overtimeDate"),
    overtimeNote: $("#overtimeNote"),
    advanceAmount: $("#advanceAmount"),
    advanceDate: $("#advanceDate"),
    advanceNote: $("#advanceNote"),
    overtimeError: $("#overtimeError"),
    advanceError: $("#advanceError"),
    modalBackdrop: $("#modalBackdrop"),
    editForm: $("#editForm"),
    editType: $("#editType"),
    editId: $("#editId"),
    editAmount: $("#editAmount"),
    editDate: $("#editDate"),
    editNote: $("#editNote"),
    editError: $("#editError"),
    confirmBackdrop: $("#confirmBackdrop"),
    confirmMessage: $("#confirmMessage"),
    confirmButton: $("#confirmButton"),
    toast: $("#toast")
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STATE();
      const parsed = JSON.parse(raw);
      return sanitizeState(parsed);
    } catch {
      return DEFAULT_STATE();
    }
  }

  function sanitizeState(raw) {
    const clean = DEFAULT_STATE();
    if (!raw || typeof raw !== "object") return clean;

    if (raw.settings && typeof raw.settings === "object") {
      clean.settings = {
        ...clean.settings,
        dailySalary: finitePositive(raw.settings.dailySalary) ? Number(raw.settings.dailySalary) : CONFIG.dailySalary,
        hourlyRate: finitePositive(raw.settings.hourlyRate) ? Number(raw.settings.hourlyRate) : CONFIG.hourlyRate,
        dutyStart: typeof raw.settings.dutyStart === "string" ? raw.settings.dutyStart : CONFIG.dutyStart,
        dutyEnd: typeof raw.settings.dutyEnd === "string" ? raw.settings.dutyEnd : CONFIG.dutyEnd
      };
    }

    clean.overtime = sanitizeEntries(raw.overtime);
    clean.advances = sanitizeEntries(raw.advances);
    return clean;
  }

  function sanitizeEntries(list) {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      if (!item || typeof item !== "object") return null;
      const amount = Number(item.amount);
      const date = String(item.date || "");
      if (!Number.isFinite(amount) || amount <= 0 || amount > CONFIG.maxAmount || !isValidDate(date)) return null;
      return {
        id: typeof item.id === "string" && item.id ? item.id : makeId(),
        amount,
        date,
        note: typeof item.note === "string" ? item.note.slice(0, CONFIG.noteMaxLength) : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString()
      };
    }).filter(Boolean);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast("Could not save data to this browser.");
    }
  }

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function finitePositive(value) {
    return Number.isFinite(Number(value)) && Number(value) > 0;
  }

  function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    );
  }

  function todayISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseTime(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  function currentMonthInfo(now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = now.getDate();
    return {
      year, month, daysInMonth,
      elapsedDays: Math.min(Math.max(day, 0), daysInMonth),
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0)
    };
  }

  function calculateNormalSalaryEarned(now = new Date()) {
    // Before today's duty finishes, only completed previous days are fully earned.
    // Today's earning is represented by the live earning amount.
    const info = currentMonthInfo(now);
    const completedPreviousDays = Math.max(0, info.elapsedDays - 1);
    return completedPreviousDays * state.settings.dailySalary + calculateLiveEarning(now);
  }

  function calculateFullMonthSalary(now = new Date()) {
    return currentMonthInfo(now).daysInMonth * state.settings.dailySalary;
  }

  function calculateLiveEarning(now = new Date()) {
    const start = parseTime(state.settings.dutyStart);
    const end = parseTime(state.settings.dutyEnd);
    const current = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const dutyMinutes = Math.max(0, end - start);
    if (current <= start || dutyMinutes === 0) return 0;
    if (current >= end) return state.settings.dailySalary;
    const progress = (current - start) / dutyMinutes;
    return state.settings.dailySalary * progress;
  }

  function calculateSalarySummary(now = new Date()) {
    const info = currentMonthInfo(now);
    const normalSalaryEarned = calculateNormalSalaryEarned(now);
    const fullMonthSalary = calculateFullMonthSalary(now);
    const overtimeTotal = state.overtime.reduce((sum, entry) => sum + entry.amount, 0);
    const advanceTotal = state.advances.reduce((sum, entry) => sum + entry.amount, 0);

    // Estimated Salary is the projected full-month payable amount.
    // Example: 18,600 - 5,000 + 400 = 14,000.
    const estimatedSalary = fullMonthSalary - advanceTotal + overtimeTotal;

    // Current balance is what has actually been earned so far, adjusted by
    // advances and overtime. Today's live earning is included in this value.
    const totalSalaryBalance = normalSalaryEarned - advanceTotal + overtimeTotal;

    return {
      normalSalaryEarned,
      fullMonthSalary,
      overtimeTotal,
      advanceTotal,
      estimatedSalary,
      totalSalaryBalance,
      workingDays: info.elapsedDays,
      totalDays: info.daysInMonth
    };
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!isValidDate(value)) return "Invalid date";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    }).format(new Date(`${value}T00:00:00`));
  }

  function renderApp() {
    const summary = calculateSalarySummary();
    const info = currentMonthInfo();
    const now = new Date();

    refs.periodLabel.textContent = `${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now)} · ${formatDate(info.start.toISOString().slice(0,10))} → ${formatDate(info.end.toISOString().slice(0,10))}`;
    refs.liveEarning.textContent = money(calculateLiveEarning(now));
    refs.normalSalaryEarned.textContent = money(summary.normalSalaryEarned);
    refs.overtimeTotal.textContent = money(summary.overtimeTotal);
    refs.advanceTotal.textContent = money(summary.advanceTotal);
    refs.estimatedSalary.textContent = money(summary.estimatedSalary);
    refs.totalSalaryBalance.textContent = money(summary.totalSalaryBalance);
    refs.workingDays.textContent = `${summary.workingDays} / ${summary.totalDays}`;
    refs.historyOvertimeTotal.textContent = money(summary.overtimeTotal);
    refs.historyAdvanceTotal.textContent = money(summary.advanceTotal);

    renderHistory(refs.overtimeHistory, state.overtime, "overtime");
    renderHistory(refs.advanceHistory, state.advances, "advance");
  }

  function renderHistory(container, entries, type) {
    const sorted = [...entries].sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      return dateDiff || b.createdAt.localeCompare(a.createdAt);
    });

    if (!sorted.length) {
      container.innerHTML = `<div class="empty-state">No ${type} entries yet.</div>`;
      return;
    }

    container.innerHTML = sorted.map(entry => `
      <article class="entry-row">
        <div class="entry-main">
          <div class="entry-date">${escapeHtml(formatDate(entry.date))}</div>
          <div class="entry-amount">${escapeHtml(money(entry.amount))}</div>
          ${entry.note ? `<div class="entry-note" title="${escapeHtml(entry.note)}">${escapeHtml(entry.note)}</div>` : ""}
        </div>
        <div class="entry-actions">
          <button class="small-btn" data-action="edit" data-type="${type}" data-id="${escapeHtml(entry.id)}">Edit</button>
          <button class="small-btn delete" data-action="delete" data-type="${type}" data-id="${escapeHtml(entry.id)}">Delete</button>
        </div>
      </article>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function validateEntry({ amount, date, note }) {
    const numeric = Number(String(amount).replace(/,/g, "").trim());
    if (!Number.isFinite(numeric) || numeric <= 0) return { ok:false, message:"Enter an amount greater than ₹0." };
    if (numeric > CONFIG.maxAmount) return { ok:false, message:"That amount is too large." };
    if (!isValidDate(date)) return { ok:false, message:"Choose a valid date." };
    if (note.length > CONFIG.noteMaxLength) return { ok:false, message:`Note must be ${CONFIG.noteMaxLength} characters or fewer.` };
    return { ok:true, amount:numeric, date, note };
  }

  function addEntry(type, form, errorEl) {
    const formData = new FormData(form);
    const payload = {
      amount: formData.get("amount"),
      date: formData.get("date"),
      note: String(formData.get("note") || "").trim()
    };
    const result = validateEntry(payload);
    if (!result.ok) {
      errorEl.textContent = result.message;
      return;
    }

    state[type].push({
      id: makeId(),
      amount: result.amount,
      date: result.date,
      note: result.note,
      createdAt: new Date().toISOString()
    });
    saveState();
    form.reset();
    if (type === "overtime") refs.overtimeDate.value = todayISO();
    if (type === "advances") refs.advanceDate.value = todayISO();
    errorEl.textContent = "";
    renderApp();
    showToast(`${type === "overtime" ? "Overtime" : "Advance"} added.`);
  }

  function openEdit(type, id) {
    const entry = state[type].find(item => item.id === id);
    if (!entry) return;
    refs.editType.value = type;
    refs.editId.value = id;
    refs.editAmount.value = entry.amount.toFixed(2);
    refs.editDate.value = entry.date;
    refs.editNote.value = entry.note;
    refs.editError.textContent = "";
    $("#modalTitle").textContent = type === "overtime" ? "Edit Overtime" : "Edit Advance";
    refs.modalBackdrop.hidden = false;
    refs.editAmount.focus();
  }

  function closeModal() {
    refs.modalBackdrop.hidden = true;
    refs.editForm.reset();
    refs.editError.textContent = "";
  }

  function saveEdit(event) {
    event.preventDefault();
    const type = refs.editType.value;
    const id = refs.editId.value;
    const result = validateEntry({
      amount: refs.editAmount.value,
      date: refs.editDate.value,
      note: refs.editNote.value.trim()
    });
    if (!result.ok) {
      refs.editError.textContent = result.message;
      return;
    }

    const entry = state[type].find(item => item.id === id);
    if (!entry) return;
    entry.amount = result.amount;
    entry.date = result.date;
    entry.note = result.note;
    saveState();
    closeModal();
    renderApp();
    showToast("Entry updated.");
  }

  function askDelete(type, id) {
    const entry = state[type].find(item => item.id === id);
    if (!entry) return;
    pendingConfirmation = () => {
      state[type] = state[type].filter(item => item.id !== id);
      saveState();
      renderApp();
      showToast("Entry deleted.");
    };
    refs.confirmMessage.textContent = `Delete ${money(entry.amount)} dated ${formatDate(entry.date)}? This cannot be undone.`;
    refs.confirmBackdrop.hidden = false;
  }

  function closeConfirm() {
    refs.confirmBackdrop.hidden = true;
    pendingConfirmation = null;
  }

  function resetAllData() {
    pendingConfirmation = () => {
      state.overtime = [];
      state.advances = [];
      saveState();
      renderApp();
      showToast("All salary records were reset.");
    };
    refs.confirmMessage.textContent = "Are you sure you want to delete all salary records? Your salary configuration will stay unchanged.";
    refs.confirmBackdrop.hidden = false;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    refs.toast.textContent = message;
    refs.toast.classList.add("show");
    toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 2400);
  }

  function buildReceipt() {
    const summary = calculateSalarySummary();
    const overtime = [...state.overtime].sort((a,b) => b.date.localeCompare(a.date));
    const advances = [...state.advances].sort((a,b) => b.date.localeCompare(a.date));
    const period = currentMonthInfo();
    const monthName = new Intl.DateTimeFormat("en-US", {month:"long", year:"numeric"}).format(new Date());
    const rows = (entries, sign) => entries.length ? entries.map(e =>
      `<tr><td>${escapeHtml(formatDate(e.date))}</td><td>${escapeHtml(money(e.amount))}</td><td>${escapeHtml(e.note || "—")}</td></tr>`
    ).join("") : `<tr><td colspan="3">No entries</td></tr>`;

    return `<!doctype html><html><head><meta charset="utf-8"><title>Salary Receipt — ${monthName}</title>
    <style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172033;margin:0;padding:36px;background:#fff}
      .receipt{max-width:760px;margin:auto}.head{display:flex;justify-content:space-between;border-bottom:2px solid #172033;padding-bottom:18px;margin-bottom:22px}
      h1{margin:0;font-size:25px}p{margin:5px 0;color:#647084}.summary{border:1px solid #dfe4eb;border-radius:12px;padding:18px;margin-bottom:22px}
      .line{display:flex;justify-content:space-between;padding:9px 0}.line.total{border-top:2px solid #172033;margin-top:8px;padding-top:14px;font-size:20px;font-weight:800}
      h2{font-size:16px;margin:26px 0 10px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:9px;border-bottom:1px solid #e7eaf0}th{background:#f6f8fb}
      .plus{color:#13835f}.minus{color:#b23c3c}.footer{margin-top:30px;font-size:11px;color:#7b8492}@media print{body{padding:0}}
    </style></head><body><main class="receipt">
      <div class="head"><div><h1>Salary Receipt</h1><p>${monthName}</p></div><div><p>${formatDate(period.start.toISOString().slice(0,10))} → ${formatDate(period.end.toISOString().slice(0,10))}</p></div></div>
      <section class="summary">
        <div class="line"><span>Full-Month Normal Salary</span><strong>${escapeHtml(money(summary.fullMonthSalary))}</strong></div>
        <div class="line plus"><span>Overtime</span><strong>+${escapeHtml(money(summary.overtimeTotal))}</strong></div>
        <div class="line minus"><span>Advance</span><strong>-${escapeHtml(money(summary.advanceTotal))}</strong></div>
        <div class="line"><span>Salary Earned So Far</span><strong>${escapeHtml(money(summary.normalSalaryEarned))}</strong></div><div class="line"><span>Current Salary Balance</span><strong>${escapeHtml(money(summary.totalSalaryBalance))}</strong></div><div class="line total"><span>Estimated Salary</span><strong>${escapeHtml(money(summary.estimatedSalary))}</strong></div>
      </section>
      <h2>Overtime Entries</h2><table><thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead><tbody>${rows(overtime, "+")}</tbody></table>
      <h2>Advance Entries</h2><table><thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead><tbody>${rows(advances, "-")}</tbody></table>
      <div class="footer">Generated by Salary Tracker · ${new Date().toLocaleString()}</div>
    </main><script>window.onload=()=>window.print();</script></body></html>`;
  }

  function printReceipt() {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      showToast("Please allow pop-ups to print the receipt.");
      return;
    }
    popup.document.write(buildReceipt());
    popup.document.close();
  }

  function wireEvents() {
    refs.overtimeForm.addEventListener("submit", e => { e.preventDefault(); addEntry("overtime", refs.overtimeForm, refs.overtimeError); });
    refs.advanceForm.addEventListener("submit", e => { e.preventDefault(); addEntry("advances", refs.advanceForm, refs.advanceError); });
    refs.editForm.addEventListener("submit", saveEdit);

    refs.overtimeHistory.addEventListener("click", handleHistoryClick);
    refs.advanceHistory.addEventListener("click", handleHistoryClick);

    document.addEventListener("click", event => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) return;
      const action = actionTarget.dataset.action;
      if (action === "close-modal") closeModal();
      if (action === "cancel-confirm") closeConfirm();
    });

    $("#confirmButton").addEventListener("click", () => {
      if (pendingConfirmation) pendingConfirmation();
      closeConfirm();
    });

    $("#resetBtn").addEventListener("click", resetAllData);
    $("#printBtn").addEventListener("click", printReceipt);

    refs.modalBackdrop.addEventListener("click", e => { if (e.target === refs.modalBackdrop) closeModal(); });
    refs.confirmBackdrop.addEventListener("click", e => { if (e.target === refs.confirmBackdrop) closeConfirm(); });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        closeModal();
        closeConfirm();
      }
    });
  }

  function handleHistoryClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, type, id } = button.dataset;
    if (action === "edit") openEdit(type, id);
    if (action === "delete") askDelete(type, id);
  }

  function initialize() {
    const today = todayISO();
    refs.overtimeDate.value = today;
    refs.advanceDate.value = today;
    wireEvents();
    renderApp();
    setInterval(() => {
      refs.liveEarning.textContent = money(calculateLiveEarning(new Date()));
      // Re-render at midnight so working-day/month labels roll over naturally.
      const currentPeriod = currentMonthInfo();
      const currentText = `${currentPeriod.year}-${currentPeriod.month}-${currentPeriod.elapsedDays}`;
      if (initialize.lastPeriod !== currentText) {
        initialize.lastPeriod = currentText;
        renderApp();
      }
    }, 1000);
  }

  initialize();
})();
