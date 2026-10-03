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
- Normal salary earned through the current day: elapsed calendar days × daily salary
- Live earning is proportional to duty time and capped at the daily salary
- Estimated salary = Total Salary − Advances + Overtime

## Run

Open `index.html` in a modern browser. No server or build step is required.

## Notes

The app uses the browser's localStorage, so records stay on that browser/device. The receipt opens a print-friendly document; the browser's print dialog can save it as PDF.
