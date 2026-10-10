
(() => {
  "use strict";

  const STORAGE_KEY = "salaryTrackerData_v2";

  const DEFAULTS = {
    dailySalary: 600,
    hourlyRate: 50,
    dutyStart: "07:00",
    dutyEnd: "19:00"
  };

  const $ = (selector) => document.querySelector(selector);

  // Read existing salary data without modifying LocalStorage.
  function readData() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );

      return {
        settings: { ...DEFAULTS, ...(data.settings || {}) },
        overtime: Array.isArray(data.overtime) ? data.overtime : [],
        advances: Array.isArray(data.advances) ? data.advances : []
      };
    } catch {
      throw new Error("Could not read saved salary data.");
    }
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function todayISO() {
    const date = new Date();

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      return "—";
    }

    const date = new Date(`${value}T00:00:00`);

    if (!Number.isFinite(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function monthInfo(now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const monthString = String(month + 1).padStart(2, "0");

    return {
      year,
      month,
      day: now.getDate(),
      days,
      start: `${year}-${monthString}-01`,
      end: `${year}-${monthString}-${String(days).padStart(2, "0")}`
    };
  }

  // Keep the same salary formulas as the existing app.js.
  function calculate(data, now = new Date()) {
    const info = monthInfo(now);
    const settings = data.settings;

    function parseTime(value, fallback) {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
        String(value || "")
      );

      return match
        ? Number(match[1]) * 60 + Number(match[2])
        : fallback;
    }

    const start = parseTime(settings.dutyStart, 420);
    const end = parseTime(settings.dutyEnd, 1140);

    const current =
      now.getHours() * 60 +
      now.getMinutes() +
      now.getSeconds() / 60;

    const dailySalary = Number(settings.dailySalary) || 0;
    const dutyLength = Math.max(0, end - start);

    let live = 0;

    if (current >= end) {
      live = dailySalary;
    } else if (current > start && dutyLength > 0) {
      live = dailySalary * ((current - start) / dutyLength);
    }

    const normal =
      Math.max(0, info.day - 1) * dailySalary + live;

    const overtimeTotal = data.overtime.reduce(
      (sum, entry) => sum + (Number(entry.amount) || 0),
      0
    );

    const advanceTotal = data.advances.reduce(
      (sum, entry) => sum + (Number(entry.amount) || 0),
      0
    );

    const fullMonth = info.days * dailySalary;

    return {
      info,
      live,
      normal,
      fullMonth,
      overtimeTotal,
      advanceTotal,
      balance: normal - advanceTotal + overtimeTotal,
      estimated: fullMonth - advanceTotal + overtimeTotal
    };
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  // Build a printable salary receipt.
  function buildReceiptHTML(data, summary) {
    const monthName = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric"
    }).format(new Date());

    function historyTable(entries, title, color) {
      const sorted = [...entries].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || "")) ||
        String(b.createdAt || "").localeCompare(
          String(a.createdAt || "")
        )
      );

      const rows = sorted.length
        ? sorted.map(entry => `
            <tr>
              <td>${escapeHTML(formatDate(entry.date))}</td>
              <td class="${color}">
                ${escapeHTML(money(entry.amount))}
              </td>
              <td>${escapeHTML(entry.note || "—")}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="3">No entries</td></tr>`;

      return `
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    const rows = [
      ["Full-Month Normal Salary", summary.fullMonth, ""],
      ["Normal Salary Earned", summary.normal, ""],
      ["Overtime", summary.overtimeTotal, "plus"],
      ["Advance", -summary.advanceTotal, "minus"],
      ["Total Salary Balance", summary.balance, ""],
      ["Estimated Salary", summary.estimated, "total"]
    ];

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>Salary Receipt - ${escapeHTML(monthName)}</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 32px;
  font: 15px/1.5 Arial, sans-serif;
  color: #172033;
  background: #fff;
}

main {
  max-width: 800px;
  margin: auto;
}

header {
  border-bottom: 2px solid #172033;
  padding-bottom: 18px;
  margin-bottom: 22px;
}

h1 {
  font-size: 30px;
  margin: 0;
}

h2 {
  font-size: 18px;
  margin: 28px 0 10px;
}

.muted {
  color: #687386;
}

.summary {
  border: 1px solid #e3e7ee;
  border-radius: 12px;
  padding: 18px;
}

.line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #edf0f4;
}

.line:last-child {
  border-bottom: 0;
}

.line strong {
  text-align: right;
}

.total {
  font-size: 19px;
  font-weight: bold;
  color: #1d4ed8;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  text-align: left;
  padding: 10px 7px;
  border-bottom: 1px solid #e3e7ee;
  overflow-wrap: anywhere;
}

th {
  background: #f6f8fb;
}

.plus {
  color: #13835f;
}

.minus {
  color: #b23c3c;
}

footer {
  margin-top: 28px;
  color: #687386;
  font-size: 12px;
}

@media(max-width:520px) {
  body {
    padding: 15px;
  }

  h1 {
    font-size: 24px;
  }

  th, td {
    padding: 7px 4px;
    font-size: 12px;
  }
}

@media print {
  body {
    padding: 0;
  }

  main {
    max-width: none;
  }
}
</style>
</head>

<body>
<main>

<header>
  <h1>Salary Receipt</h1>
  <p class="muted">${escapeHTML(monthName)}</p>
  <p class="muted">
    ${formatDate(summary.info.start)}
    – ${formatDate(summary.info.end)}
  </p>
</header>

<section class="summary">
  ${rows.map(([label, amount, cls]) => `
    <div class="line ${cls}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(money(amount))}</strong>
    </div>
  `).join("")}
</section>

${historyTable(data.overtime, "Overtime History", "plus")}
${historyTable(data.advances, "Advance History", "minus")}

<footer>
  Generated by Salary Tracker ·
  ${escapeHTML(new Date().toLocaleString())}
</footer>

</main>
</body>
</html>`;
  }

  // PRINT RECEIPT
  function printReceipt() {
    let popup;

    try {
      popup = window.open("", "_blank");
    } catch {
      popup = null;
    }

    if (!popup) {
      alert(
        "Pop-up blocked. Allow pop-ups for this website, then try again."
      );
      return;
    }

    try {
      const data = readData();
      const summary = calculate(data);

      popup.document.open();
      popup.document.write(buildReceiptHTML(data, summary));
      popup.document.close();

      let printed = false;

      function doPrint() {
        if (printed || popup.closed) return;

        printed = true;

        try {
          popup.focus();
          popup.print();
        } catch (error) {
          console.error("Print error:", error);
          alert("The receipt opened, but printing was blocked.");
        }
      }

      popup.addEventListener("load", doPrint, { once: true });

      // Fallback for browsers where document.write() doesn't trigger load.
      setTimeout(doPrint, 900);

    } catch (error) {
      console.error("Receipt error:", error);

      try {
        popup.close();
      } catch {}

      alert("Could not generate the salary receipt.");
    }
  }

  // DOWNLOAD RECEIPT AS PNG IMAGE
  function downloadReceiptImage() {
    let data;
    let summary;

    try {
      data = readData();
      summary = calculate(data);
    } catch (error) {
      alert(error.message || "Could not read saved salary data.");
      return;
    }

    const width = 1000;
    const padding = 55;
    const rowHeight = 42;

    const overtime = [...data.overtime].sort(
      (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
    );

    const advances = [...data.advances].sort(
      (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
    );

    const height = Math.max(
      950,
      480 +
      6 * rowHeight +
      (overtime.length + advances.length + 4) * rowHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      alert("This browser could not create the receipt image.");
      return;
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    let y = 65;

    function drawText(
      value,
      x,
      baseline,
      size = 20,
      color = "#172033",
      weight = "400"
    ) {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Arial`;
      ctx.fillText(String(value), x, baseline);
    }

    function drawLine() {
      ctx.strokeStyle = "#e3e7ee";
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    function heading(value) {
      y += 28;

      drawText(value, padding, y, 25, "#172033", "700");

      y += 18;
      drawLine();
      y += 25;
    }

    function drawHistory(entries, title, color) {
      heading(title);

      drawText("Date", padding, y, 16, "#687386", "700");
      drawText("Amount", 265, y, 16, "#687386", "700");
      drawText("Note", 510, y, 16, "#687386", "700");

      y += 15;
      drawLine();

      if (!entries.length) {
        y += 32;
        drawText("No entries", padding, y, 17, "#687386");
        y += 28;
        return;
      }

      for (const entry of entries) {
        y += 30;

        drawText(formatDate(entry.date), padding, y, 15);
        drawText(money(entry.amount), 265, y, 15, color, "700");

        let note = String(entry.note || "—");

        if (note.length > 36) {
          note = note.slice(0, 33) + "...";
        }

        drawText(note, 510, y, 14, "#687386");

        y += 12;
        drawLine();
      }

      y += 20;
    }

    const monthName = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric"
    }).format(new Date());

    drawText("SALARY RECEIPT", padding, y, 34, "#172033", "700");

    y += 40;
    drawText(monthName, padding, y, 20, "#687386");

    y += 30;

    drawText(
      `Generated on ${new Date().toLocaleDateString("en-IN")}`,
      padding,
      y,
      15,
      "#687386"
    );

    y += 25;
    drawLine();

    heading("Salary Summary");

    const rows = [
      ["Full-Month Normal Salary", summary.fullMonth],
      ["Normal Salary Earned", summary.normal],
      ["Overtime", summary.overtimeTotal],
      ["Advance", -summary.advanceTotal],
      ["Total Salary Balance", summary.balance],
      ["Estimated Salary", summary.estimated]
    ];

    for (const [label, amount] of rows) {
      drawText(label, padding, y, 18);

      ctx.textAlign = "right";

      drawText(
        money(amount),
        width - padding,
        y,
        18,
        label === "Estimated Salary" ? "#1d4ed8" : "#172033",
        "700"
      );

      ctx.textAlign = "left";

      y += rowHeight;
      drawLine();
    }

    y += 10;

    drawHistory(overtime, "Overtime History", "#13835f");
    drawHistory(advances, "Advance History", "#b23c3c");

    drawText(
      "Generated by Salary Tracker",
      padding,
      y + 15,
      14,
      "#687386"
    );

    canvas.toBlob(blob => {
      if (!blob) {
        alert("Could not generate the receipt PNG.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `salary-receipt-${todayISO()}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, "image/png");
  }

  // AUTOMATICALLY CONNECT BOTH BUTTONS.
  // The download button is created if it doesn't already exist.
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

      downloadButton.addEventListener(
        "click",
        downloadReceiptImage
      );
    }

    if (!printButton) {
      console.warn("Salary Tracker: #printBtn was not found.");
    }
  }

  // Works whether this script loads before or after DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      attachButtons,
      { once: true }
    );
  } else {
    attachButtons();
  }
})();
