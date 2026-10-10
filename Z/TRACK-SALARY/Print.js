
(() => {
  "use strict";

  const STORAGE_KEY = "salaryTrackerData_v2";
  const $ = (selector) => document.querySelector(selector);

  const style = document.createElement("style");
  style.textContent = `
    #salaryReceiptPrint {
      display: none;
      font-family: Arial, sans-serif;
      color: #172033;
      background: white;
    }

    #salaryReceiptPrint h1 { font-size: 28px; margin: 0 0 8px; }
    #salaryReceiptPrint h2 { font-size: 18px; margin: 24px 0 10px; }
    #salaryReceiptPrint .receipt-muted { color: #687386; }
    #salaryReceiptPrint .receipt-summary {
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 16px;
    }
    #salaryReceiptPrint .receipt-line {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      padding: 9px 0;
      border-bottom: 1px solid #eee;
    }
    #salaryReceiptPrint .receipt-line:last-child { border-bottom: 0; }
    #salaryReceiptPrint .receipt-line strong { text-align: right; }
    #salaryReceiptPrint .receipt-total { color: #1d4ed8; font-weight: bold; }
    #salaryReceiptPrint table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    #salaryReceiptPrint th,
    #salaryReceiptPrint td {
      border-bottom: 1px solid #ddd;
      padding: 8px 5px;
      text-align: left;
      overflow-wrap: anywhere;
    }
    #salaryReceiptPrint th { background: #f4f6f9; }
    #salaryReceiptPrint .receipt-plus { color: #13835f; }
    #salaryReceiptPrint .receipt-minus { color: #b23c3c; }

    @media print {
      body.salary-receipt-printing > * {
        display: none !important;
      }

      body.salary-receipt-printing > #salaryReceiptPrint {
        display: block !important;
        position: absolute !important;
        inset: 0 auto auto 0 !important;
        width: 100% !important;
        padding: 12mm !important;
        margin: 0 !important;
        background: white !important;
        color: #172033 !important;
        z-index: 2147483647 !important;
      }

      #salaryReceiptPrint .receipt-page-break {
        break-before: page;
      }

      #salaryReceiptPrint tr {
        break-inside: avoid;
      }

      @page {
        size: auto;
        margin: 8mm;
      }
    }
  `;
  document.head.appendChild(style);

  function readData() {
    let data;

    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      throw new Error(
        "Cannot read salary data. Your saved LocalStorage data may be damaged."
      );
    }

    return {
      settings: {
        dailySalary: 600,
        dutyStart: "07:00",
        dutyEnd: "19:00",
        ...(data.settings || {})
      },
      overtime: Array.isArray(data.overtime) ? data.overtime : [],
      advances: Array.isArray(data.advances) ? data.advances : []
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value + "T00:00:00"));
  }

  function calculate(data) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const days = new Date(year, month + 1, 0).getDate();
    const daily = Number(data.settings.dailySalary) || 600;

    function parseTime(value, fallback) {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
      return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
    }

    const start = parseTime(data.settings.dutyStart, 420);
    const end = parseTime(data.settings.dutyEnd, 1140);
    const current =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const dutyLength = Math.max(0, end - start);
    let live = 0;

    if (current >= end) {
      live = daily;
    } else if (current > start && dutyLength > 0) {
      live = daily * ((current - start) / dutyLength);
    }

    const normal = Math.max(0, day - 1) * daily + live;
    const overtimeTotal = data.overtime.reduce(
      (sum, entry) => sum + (Number(entry.amount) || 0), 0
    );
    const advanceTotal = data.advances.reduce(
      (sum, entry) => sum + (Number(entry.amount) || 0), 0
    );
    const fullMonth = days * daily;

    return {
      monthName: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric"
      }).format(now),
      periodStart: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      periodEnd: `${year}-${String(month + 1).padStart(2, "0")}-${String(days).padStart(2, "0")}`,
      normal,
      fullMonth,
      overtimeTotal,
      advanceTotal,
      balance: normal - advanceTotal + overtimeTotal,
      estimated: fullMonth - advanceTotal + overtimeTotal
    };
  }

  function addText(parent, tag, value, className) {
    const element = document.createElement(tag);
    element.textContent = String(value ?? "");

    if (className) element.className = className;

    parent.appendChild(element);
    return element;
  }

  function makeReceipt() {
    const data = readData();
    const summary = calculate(data);

    let receipt = $("#salaryReceiptPrint");

    if (!receipt) {
      receipt = document.createElement("section");
      receipt.id = "salaryReceiptPrint";
      document.body.appendChild(receipt);
    }

    receipt.replaceChildren();

    addText(receipt, "h1", "Salary Receipt");
    addText(receipt, "p", summary.monthName, "receipt-muted");
    addText(
      receipt,
      "p",
      `${formatDate(summary.periodStart)} – ${formatDate(summary.periodEnd)}`,
      "receipt-muted"
    );

    const summaryBox = document.createElement("section");
    summaryBox.className = "receipt-summary";
    receipt.appendChild(summaryBox);

    const rows = [
      ["Full-Month Normal Salary", summary.fullMonth, ""],
      ["Normal Salary Earned", summary.normal, ""],
      ["Overtime", summary.overtimeTotal, "receipt-plus"],
      ["Advance", -summary.advanceTotal, "receipt-minus"],
      ["Total Salary Balance", summary.balance, ""],
      ["Estimated Salary", summary.estimated, "receipt-total"]
    ];

    rows.forEach(([label, amount, className]) => {
      const row = document.createElement("div");
      row.className = "receipt-line";
      addText(row, "span", label);
      addText(row, "strong", money(amount), className);
      summaryBox.appendChild(row);
    });

    function addHistory(title, entries, type) {
      addText(receipt, "h2", title);

      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const header = document.createElement("tr");

      ["Date", "Amount", "Note"].forEach(label => {
        addText(header, "th", label);
      });

      thead.appendChild(header);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      const sorted = [...entries].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );

      if (!sorted.length) {
        const tr = document.createElement("tr");
        const td = addText(tr, "td", "No entries");
        td.colSpan = 3;
        tbody.appendChild(tr);
      } else {
        sorted.forEach(entry => {
          const tr = document.createElement("tr");

          addText(tr, "td", formatDate(entry.date));
          addText(
            tr,
            "td",
            money(entry.amount),
            type === "overtime" ? "receipt-plus" : "receipt-minus"
          );
          addText(tr, "td", entry.note || "—");

          tbody.appendChild(tr);
        });
      }

      table.appendChild(tbody);
      receipt.appendChild(table);
    }

    addHistory("Overtime History", data.overtime, "overtime");
    addHistory("Advance History", data.advances, "advance");

    addText(
      receipt,
      "p",
      `Generated by Salary Tracker · ${new Date().toLocaleString()}`,
      "receipt-muted"
    );

    return receipt;
  }

  // PRINT WITHOUT OPENING A NEW TAB OR POPUP.
  function printReceipt() {
    try {
      makeReceipt();

      document.body.classList.add("salary-receipt-printing");

      // Print directly from the current page.
      window.print();

      // Restore the original website after printing or cancelling.
      const restore = () => {
        document.body.classList.remove("salary-receipt-printing");
        window.removeEventListener("afterprint", restore);
      };

      window.addEventListener("afterprint", restore);

      // Fallback for mobile browsers that do not fire afterprint.
      setTimeout(restore, 60000);
    } catch (error) {
      document.body.classList.remove("salary-receipt-printing");
      console.error("Salary receipt error:", error);
      alert(error.message || "Could not create the salary receipt.");
    }
  }

  // CREATE AND DOWNLOAD A PNG RECEIPT.
  function downloadReceiptImage() {
    let data;
    let summary;

    try {
      data = readData();
      summary = calculate(data);
    } catch (error) {
      alert(error.message || "Could not read salary data.");
      return;
    }

    const width = 1000;
    const padding = 55;
    const rowHeight = 44;

    const overtime = [...data.overtime].sort(
      (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
    );

    const advances = [...data.advances].sort(
      (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
    );

    const height = Math.max(
      1000,
      500 + 10 * rowHeight + (overtime.length + advances.length) * rowHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      alert("Your browser could not create the receipt image.");
      return;
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    let y = 75;

    function text(value, x, baseline, size = 20, color = "#172033", weight = "400") {
      ctx.font = `${weight} ${size}px Arial`;
      ctx.fillStyle = color;
      ctx.fillText(String(value), x, baseline);
    }

    function line() {
      ctx.strokeStyle = "#e3e7ee";
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    function heading(value) {
      y += 25;
      text(value, padding, y, 25, "#172033", "700");
      y += 20;
      line();
      y += 30;
    }

    text("SALARY RECEIPT", padding, y, 34, "#172033", "700");
    y += 42;
    text(summary.monthName, padding, y, 21, "#687386");
    y += 35;
    text(
      `${formatDate(summary.periodStart)} - ${formatDate(summary.periodEnd)}`,
      padding,
      y,
      16,
      "#687386"
    );

    y += 25;
    line();
    heading("Salary Summary");

    const summaryRows = [
      ["Full-Month Normal Salary", summary.fullMonth],
      ["Normal Salary Earned", summary.normal],
      ["Overtime", summary.overtimeTotal],
      ["Advance", -summary.advanceTotal],
      ["Total Salary Balance", summary.balance],
      ["Estimated Salary", summary.estimated]
    ];

    summaryRows.forEach(([label, amount]) => {
      text(label, padding, y, 19);

      ctx.textAlign = "right";
      text(
        money(amount),
        width - padding,
        y,
        19,
        label === "Estimated Salary" ? "#1d4ed8" : "#172033",
        "700"
      );
      ctx.textAlign = "left";

      y += rowHeight;
      line();
    });

    function drawHistory(title, entries, color) {
      heading(title);

      text("Date", padding, y, 16, "#687386", "700");
      text("Amount", 280, y, 16, "#687386", "700");
      text("Note", 520, y, 16, "#687386", "700");

      y += 18;
      line();

      if (!entries.length) {
        y += 30;
        text("No entries", padding, y, 17, "#687386");
        y += 30;
        return;
      }

      entries.forEach(entry => {
        y += 30;

        text(formatDate(entry.date), padding, y, 15);
        text(money(entry.amount), 280, y, 15, color, "700");

        let note = String(entry.note || "—");
        if (note.length > 35) note = note.slice(0, 32) + "...";

        text(note, 520, y, 15, "#687386");

        y += 14;
        line();
      });

      y += 20;
    }

    drawHistory("Overtime History", overtime, "#13835f");
    drawHistory("Advance History", advances, "#b23c3c");

    text("Generated by Salary Tracker", padding, y + 20, 14, "#687386");

    canvas.toBlob(blob => {
      if (!blob) {
        alert("Could not generate the PNG image.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `salary-receipt-${new Date().toISOString().slice(0, 10)}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, "image/png");
  }

  // Connect buttons and create the download button automatically.
  function attachButtons() {
    const printButton = $("#printBtn");

    if (printButton && !printButton.dataset.printJsBound) {
      printButton.dataset.printJsBound = "true";
      printButton.addEventListener("click", printReceipt);
    }

    let downloadButton = $("#downloadReceiptBtn");

    if (!downloadButton && printButton) {
      downloadButton = document.createElement("button");
      downloadButton.id = "downloadReceiptBtn";
      downloadButton.type = "button";
      downloadButton.className = printButton.className;
      downloadButton.textContent = "📥 Download Receipt Image";

      printButton.insertAdjacentElement("afterend", downloadButton);
    }

    if (downloadButton && !downloadButton.dataset.printJsBound) {
      downloadButton.dataset.printJsBound = "true";
      downloadButton.addEventListener("click", downloadReceiptImage);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachButtons, { once: true });
  } else {
    attachButtons();
  }
})();
