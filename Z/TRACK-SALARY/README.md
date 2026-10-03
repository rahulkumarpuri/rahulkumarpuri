# Salary Tracker

A clean vanilla HTML/CSS/JavaScript salary tracker rebuilt from scratch.

## Files

- `index.html` — semantic UI and modal structure
- `style.css` — light-only responsive design
- `app.js` — state, storage, calculations, rendering, forms, history, editing, deletion and printing

## Architecture

- One central `state`
- One localStorage key: `salaryTrackerData_v2`
- One shared `calculateSalarySummary()` calculation engine
- One `renderApp()` UI update cycle after mutations
- Event delegation for history actions
- No frameworks, MutationObserver, cloned buttons, monkey-patching, or legacy code

## Salary rules

- Daily salary: ₹600
- Hourly rate: ₹50
- Duty: 07:00–19:00
- **Normal Salary Earned** = completed previous days × daily salary + today's live earning
- **Total Salary Balance** = Normal Salary Earned − Advance + Overtime
- **Estimated Salary** = full-month salary − Advance + Overtime
- Full-month salary uses the actual number of days in the current month, so October = 31 × ₹600 = ₹18,600.

Example:

- Full-month salary: ₹18,600
- Advance: ₹5,000
- Overtime: ₹400
- Estimated Salary: ₹14,000

## Date handling

Dates are validated using local calendar components rather than UTC ISO conversion. This avoids the common India-timezone bug where a valid `<input type="date">` value can incorrectly become the previous day when checked with `toISOString()`.

## Run

Open `index.html` in a modern browser. No server or build step is required.

## Receipt

The receipt uses the same calculation engine as the main UI and opens a print-friendly document. The browser's print dialog can save it as PDF.
