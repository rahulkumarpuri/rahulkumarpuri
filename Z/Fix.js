/* ============================================================
   Fix.js
   Safe enhancement layer for Petrol Pump Daily Accounting App

   IMPORTANT:
   Load this AFTER your existing main JavaScript.

   Goals:
   - Quick Entry Edit/Delete
   - Normal Entry Edit/Delete
   - Permanent Short/Excess floating indicator
   - Safe localStorage handling
   - No MutationObserver
   - No recursive rendering
   - No body replacement
   - No infinite loading
   - No duplicate initialization
   ============================================================ */

(() => {
    "use strict";

    /* ------------------------------------------------------------
       GLOBAL SAFETY
       ------------------------------------------------------------ */

    if (window.__PUMP_FIX_JS_LOADED__) return;
    window.__PUMP_FIX_JS_LOADED__ = true;

    const FIX_VERSION = "1.0.0";

    const KEYS = {
        quick: "pumpQuickCollections",
        manual: "pumpManualCollections",
        testing: "pumpTestingOn",
        physical: "pumpPhysicalCash"
    };

    const MONEY = n => {
        const value = Number(n);
        if (!Number.isFinite(value)) return "₹0.00";
        return "₹" + value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const safeNumber = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const escapeHTML = value => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /* ------------------------------------------------------------
       SAFE STORAGE
       ------------------------------------------------------------ */

    function readStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);

            if (raw === null || raw === "") {
                return fallback;
            }

            const parsed = JSON.parse(raw);

            return parsed;
        } catch (error) {
            console.warn("[Fix.js] Storage read failed:", key, error);
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn("[Fix.js] Storage write failed:", key, error);
            return false;
        }
    }

    /* ------------------------------------------------------------
       UNIQUE ID
       ------------------------------------------------------------ */

    function makeID() {
        return (
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 10)
        );
    }

    /* ------------------------------------------------------------
       TIME
       ------------------------------------------------------------ */

    function currentTime() {
        try {
            return new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
        } catch (_) {
            return new Date().toLocaleTimeString();
        }
    }

    /* ------------------------------------------------------------
       NORMALIZE QUICK DATA
       ------------------------------------------------------------ */

    function normalizeQuickData() {
        let data = readStorage(KEYS.quick, {});

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            data = {};
        }

        const categories = [
            "cards",
            "depositedCash",
            "creditVehicles"
        ];

        categories.forEach(category => {
            if (!Array.isArray(data[category])) {
                data[category] = [];
            }

            data[category] = data[category]
                .filter(item => item && typeof item === "object")
                .map(item => ({
                    ...item,
                    id: item.id || makeID(),
                    amount: safeNumber(item.amount),
                    time: item.time || currentTime()
                }));
        });

        writeStorage(KEYS.quick, data);

        return data;
    }

    /* ------------------------------------------------------------
       NORMALIZE MANUAL DATA
       ------------------------------------------------------------ */

    function normalizeManualData() {
        let data = readStorage(KEYS.manual, []);

        if (!Array.isArray(data)) {
            data = [];
        }

        data = data
            .filter(item => item && typeof item === "object")
            .map(item => ({
                ...item,
                id: item.id || makeID(),
                amount: safeNumber(item.amount),
                heading:
                    item.heading ||
                    item.tag ||
                    item.title ||
                    "Normal Entry",
                time: item.time || currentTime()
            }));

        writeStorage(KEYS.manual, data);

        return data;
    }

    /* ------------------------------------------------------------
       TRY TO REFRESH EXISTING MAIN APP
       ------------------------------------------------------------ */

    function refreshMainApp() {
        /*
         * We intentionally DON'T assume a specific function exists.
         *
         * If your main JS exposes one of these, we'll safely call it.
         * Otherwise Fix.js continues normally.
         */

        const possibleFunctions = [
            "calculateDay",
            "calculateTotals",
            "updateTotals",
            "updateUI",
            "renderQuick",
            "renderManual",
            "renderAll",
            "refresh",
            "refreshUI"
        ];

        possibleFunctions.forEach(name => {
            try {
                if (typeof window[name] === "function") {
                    window[name]();
                }
            } catch (error) {
                console.warn(
                    "[Fix.js] Existing function failed:",
                    name,
                    error
                );
            }
        });
    }

    /* ------------------------------------------------------------
       SHORT / EXCESS CALCULATOR
       ------------------------------------------------------------ */

    function findNumberFromStorage(keys) {
        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);

                if (raw === null) continue;

                const value = Number(raw);

                if (Number.isFinite(value)) {
                    return value;
                }
            } catch (_) {}
        }

        return 0;
    }

    function calculateCollectionFallback() {
        let total = 0;

        const quick = normalizeQuickData();

        [
            "cards",
            "depositedCash",
            "creditVehicles"
        ].forEach(category => {
            if (!Array.isArray(quick[category])) return;

            quick[category].forEach(entry => {
                total += safeNumber(entry.amount);
            });
        });

        const manual = normalizeManualData();

        manual.forEach(entry => {
            total += safeNumber(entry.amount);
        });

        /*
         * Physical cash may be represented in different formats
         * depending on the main version.
         *
         * We only use it when we can safely understand it.
         */

        const physical = readStorage(KEYS.physical, null);

        if (physical && typeof physical === "object") {

            if (Number.isFinite(Number(physical.total))) {
                total += Number(physical.total);
            }

            else if (Number.isFinite(Number(physical.amount))) {
                total += Number(physical.amount);
            }

            else {
                const notes = [
                    ["500", 500],
                    ["200", 200],
                    ["100", 100],
                    ["50", 50],
                    ["20", 20],
                    ["10", 10]
                ];

                notes.forEach(([key, value]) => {
                    total +=
                        Math.max(
                            0,
                            Math.floor(
                                safeNumber(physical[key])
                            )
                        ) * value;
                });

                if (Number.isFinite(Number(physical.coin))) {
                    total += Number(physical.coin);
                }

                if (Number.isFinite(Number(physical.coins))) {
                    total += Number(physical.coins);
                }
            }
        }

        return total;
    }

    function getSaleFallback() {

        /*
         * Don't guess fuel calculations if the main app already
         * exposes a calculation function.
         *
         * Instead try common global values first.
         */

        const candidates = [
            window.totalSale,
            window.todaySale,
            window.saleTotal,
            window.totalSales,
            window.currentSale
        ];

        for (const candidate of candidates) {
            if (Number.isFinite(Number(candidate))) {
                return Number(candidate);
            }
        }

        return null;
    }

    /* ------------------------------------------------------------
       FIXED DIFFERENCE BAR
       ------------------------------------------------------------ */

    function createDifferenceBar() {

        if (document.getElementById("pumpFixDifferenceBar")) {
            return;
        }

        const bar = document.createElement("div");

        bar.id = "pumpFixDifferenceBar";

        bar.innerHTML = `
            <span id="pumpFixDifferenceIcon">⚪</span>
            <span id="pumpFixDifferenceText">
                Checking...
            </span>
        `;

        Object.assign(bar.style, {
            position: "fixed",
            left: "50%",
            bottom: "12px",
            transform: "translateX(-50%)",
            zIndex: "2147483647",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "180px",
            maxWidth: "calc(100vw - 24px)",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "#111827",
            color: "#ffffff",
            fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
            fontSize: "14px",
            fontWeight: "800",
            lineHeight: "1",
            boxSizing: "border-box",
            boxShadow:
                "0 8px 30px rgba(0,0,0,.30)",
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap"
        });

        document.body.appendChild(bar);
    }

    function updateDifferenceBar() {

        const bar =
            document.getElementById("pumpFixDifferenceBar");

        if (!bar) return;

        const icon =
            document.getElementById("pumpFixDifferenceIcon");

        const text =
            document.getElementById("pumpFixDifferenceText");

        /*
         * Prefer values exposed by the main app.
         */

        let difference = null;

        const possibleDifferenceNames = [
            "difference",
            "currentDifference",
            "shortExcess",
            "todayDifference",
            "netDifference"
        ];

        for (const name of possibleDifferenceNames) {
            try {
                if (
                    Number.isFinite(
                        Number(window[name])
                    )
                ) {
                    difference = Number(window[name]);
                    break;
                }
            } catch (_) {}
        }

        /*
         * Try common DOM elements used by the main app.
         */

        if (difference === null) {

            const selectors = [
                "#difference",
                "#shortExcess",
                "#liveDifference",
                "#todayDifference",
                ".difference",
                ".short-excess",
                ".shortExcess"
            ];

            for (const selector of selectors) {
                try {

                    const element =
                        document.querySelector(selector);

                    if (!element) continue;

                    const raw =
                        element.textContent
                            .replace(/[₹,\s]/g, "")
                            .replace(/[^0-9.+-]/g, "");

                    const parsed = Number(raw);

                    if (Number.isFinite(parsed)) {
                        difference = parsed;
                        break;
                    }

                } catch (_) {}
            }
        }

        /*
         * If we still cannot safely determine the number,
         * DON'T invent a value.
         */

        if (difference === null) {

            icon.textContent = "⚪";
            text.textContent = "Short / Excess";

            bar.style.background = "#111827";

            return;
        }

        if (Math.abs(difference) < 0.005) {

            icon.textContent = "⚪";
            text.textContent = "BALANCED ₹0.00";

            bar.style.background = "#374151";

        } else if (difference > 0) {

            icon.textContent = "🟢";
            text.textContent =
                "EXCESS " + MONEY(difference);

            bar.style.background = "#047857";

        } else {

            icon.textContent = "🔴";
            text.textContent =
                "SHORT " + MONEY(Math.abs(difference));

            bar.style.background = "#b91c1c";
        }
    }

    /* ------------------------------------------------------------
       ENTRY MANAGER MODAL
       ------------------------------------------------------------ */

    function createModal() {

        if (document.getElementById("pumpFixModal")) {
            return;
        }

        const overlay = document.createElement("div");

        overlay.id = "pumpFixModal";

        overlay.innerHTML = `
            <div id="pumpFixModalBox">

                <div id="pumpFixModalHeader">
                    <strong id="pumpFixModalTitle">
                        Edit Entry
                    </strong>

                    <button
                        type="button"
                        id="pumpFixCloseModal"
                        aria-label="Close"
                    >×</button>
                </div>

                <div id="pumpFixModalBody">

                    <label>
                        Amount
                        <input
                            id="pumpFixEditAmount"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="0.01"
                        >
                    </label>

                    <label id="pumpFixHeadingWrap">
                        Heading
                        <input
                            id="pumpFixEditHeading"
                            type="text"
                            maxlength="100"
                        >
                    </label>

                    <div id="pumpFixModalActions">

                        <button
                            type="button"
                            id="pumpFixCancel"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            id="pumpFixSave"
                        >
                            Save Changes
                        </button>

                    </div>

                </div>
            </div>
        `;

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "2147483646",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,.55)",
            boxSizing: "border-box"
        });

        const style = document.createElement("style");

        style.id = "pumpFixStyles";

        style.textContent = `
            #pumpFixModalBox {
                width: min(420px, 100%);
                background: #ffffff;
                color: #111827;
                border-radius: 18px;
                overflow: hidden;
                box-shadow: 0 25px 80px rgba(0,0,0,.35);
                font-family: system-ui, sans-serif;
            }

            #pumpFixModalHeader {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 16px 18px;
                border-bottom: 1px solid #e5e7eb;
            }

            #pumpFixCloseModal {
                border: 0;
                background: transparent;
                font-size: 28px;
                line-height: 1;
                cursor: pointer;
                padding: 2px 8px;
            }

            #pumpFixModalBody {
                padding: 18px;
            }

            #pumpFixModalBody label {
                display: block;
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 14px;
            }

            #pumpFixModalBody input {
                display: block;
                width: 100%;
                box-sizing: border-box;
                margin-top: 7px;
                padding: 11px 12px;
                border: 1px solid #d1d5db;
                border-radius: 10px;
                outline: none;
                font: inherit;
            }

            #pumpFixModalBody input:focus {
                border-color: #2563eb;
            }

            #pumpFixModalActions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 18px;
            }

            #pumpFixModalActions button {
                border: 0;
                border-radius: 10px;
                padding: 11px 14px;
                font-weight: 800;
                cursor: pointer;
            }

            #pumpFixCancel {
                background: #e5e7eb;
                color: #111827;
            }

            #pumpFixSave {
                background: #2563eb;
                color: #ffffff;
            }

            .pump-fix-entry-actions {
                display: inline-flex !important;
                align-items: center !important;
                gap: 5px !important;
                margin-left: 8px !important;
            }

            .pump-fix-edit,
            .pump-fix-delete {
                border: 0 !important;
                cursor: pointer !important;
                padding: 5px 7px !important;
                border-radius: 7px !important;
                font-size: 13px !important;
                line-height: 1 !important;
            }

            .pump-fix-edit {
                background: #dbeafe !important;
            }

            .pump-fix-delete {
                background: #fee2e2 !important;
            }

            @media (max-width: 480px) {

                #pumpFixDifferenceBar {
                    bottom: 8px !important;
                    font-size: 12px !important;
                    padding: 9px 13px !important;
                    min-width: 155px !important;
                }

                #pumpFixModal {
                    padding: 12px !important;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    let editState = null;

    function openEditor(type, category, id) {

        let entry = null;

        if (type === "quick") {

            const data = normalizeQuickData();

            const list = Array.isArray(data[category])
                ? data[category]
                : [];

            entry = list.find(item => item.id === id);

        } else if (type === "manual") {

            const list = normalizeManualData();

            entry = list.find(item => item.id === id);
        }

        if (!entry) return;

        editState = {
            type,
            category,
            id
        };

        const modal =
            document.getElementById("pumpFixModal");

        const amount =
            document.getElementById("pumpFixEditAmount");

        const heading =
            document.getElementById("pumpFixEditHeading");

        const headingWrap =
            document.getElementById("pumpFixHeadingWrap");

        if (!modal || !amount) return;

        amount.value = safeNumber(entry.amount);

        if (heading) {
            heading.value =
                entry.heading ||
                entry.tag ||
                entry.title ||
                category ||
                "";
        }

        if (headingWrap) {
            headingWrap.style.display =
                type === "manual" ? "block" : "none";
        }

        modal.style.display = "flex";

        setTimeout(() => {
            try {
                amount.focus();
                amount.select();
            } catch (_) {}
        }, 30);
    }

    function closeEditor() {

        const modal =
            document.getElementById("pumpFixModal");

        if (modal) {
            modal.style.display = "none";
        }

        editState = null;
    }

    function saveEditor() {

        if (!editState) return;

        const amountInput =
            document.getElementById("pumpFixEditAmount");

        const headingInput =
            document.getElementById("pumpFixEditHeading");

        if (!amountInput) return;

        const amount =
            Number(amountInput.value);

        if (!Number.isFinite(amount) || amount < 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (editState.type === "quick") {

            const data = normalizeQuickData();

            if (!Array.isArray(data[editState.category])) {
                return;
            }

            const index =
                data[editState.category].findIndex(
                    item => item.id === editState.id
                );

            if (index === -1) return;

            data[editState.category][index].amount =
                amount;

            writeStorage(KEYS.quick, data);

        } else {

            const data = normalizeManualData();

            const index =
                data.findIndex(
                    item => item.id === editState.id
                );

            if (index === -1) return;

            data[index].amount = amount;

            if (headingInput) {
                const heading =
                    headingInput.value.trim();

                if (heading) {
                    data[index].heading = heading;
                }
            }

            writeStorage(KEYS.manual, data);
        }

        closeEditor();

        refreshMainApp();

        /*
         * Give the existing application a moment to finish
         * its own rendering, then update our independent bar.
         */

        setTimeout(updateDifferenceBar, 0);
    }

    /* ------------------------------------------------------------
       DELETE
       ------------------------------------------------------------ */

    function deleteEntry(type, category, id) {

        const question =
            "Delete this entry permanently?";

        if (!window.confirm(question)) {
            return;
        }

        if (type === "quick") {

            const data = normalizeQuickData();

            if (!Array.isArray(data[category])) {
                return;
            }

            const next =
                data[category].filter(
                    item => item.id !== id
                );

            data[category] = next;

            writeStorage(KEYS.quick, data);

        } else {

            const data = normalizeManualData();

            const next =
                data.filter(
                    item => item.id !== id
                );

            writeStorage(KEYS.manual, next);
        }

        refreshMainApp();

        setTimeout(updateDifferenceBar, 0);
    }

    /* ------------------------------------------------------------
       ACTION BUTTON
       ------------------------------------------------------------ */

    function actionButtons(type, category, id) {

        const wrapper =
            document.createElement("span");

        wrapper.className =
            "pump-fix-entry-actions";

        wrapper.innerHTML = `
            <button
                type="button"
                class="pump-fix-edit"
                data-fix-action="edit"
                data-fix-type="${escapeHTML(type)}"
                data-fix-category="${escapeHTML(category || "")}"
                data-fix-id="${escapeHTML(id)}"
                title="Edit"
            >✏️</button>

            <button
                type="button"
                class="pump-fix-delete"
                data-fix-action="delete"
                data-fix-type="${escapeHTML(type)}"
                data-fix-category="${escapeHTML(category || "")}"
                data-fix-id="${escapeHTML(id)}"
                title="Delete"
            >🗑️</button>
        `;

        return wrapper;
    }

    /* ------------------------------------------------------------
       ENTRY BUTTON INJECTION
       ------------------------------------------------------------ */

    function addButtonsToKnownLists() {

        /*
         * We intentionally look only for elements that appear to
         * represent collection entries.
         *
         * We do NOT rewrite their HTML.
         */

        const candidates =
            document.querySelectorAll(
                "[data-entry-id], [data-id], .collection-entry, .manual-entry, .history-entry"
            );

        candidates.forEach(element => {

            if (
                element.dataset.pumpFixProcessed === "1"
            ) {
                return;
            }

            let id =
                element.dataset.entryId ||
                element.dataset.id;

            if (!id) return;

            const type =
                element.dataset.entryType ||
                element.dataset.type ||
                "";

            const category =
                element.dataset.category ||
                "";

            if (
                type !== "quick" &&
                type !== "manual"
            ) {
                return;
            }

            const buttons =
                actionButtons(
                    type,
                    category,
                    id
                );

            element.appendChild(buttons);

            element.dataset.pumpFixProcessed = "1";
        });
    }

    /* ------------------------------------------------------------
       GLOBAL CLICK DELEGATION
       ------------------------------------------------------------ */

    function setupClickHandling() {

        document.addEventListener(
            "click",
            event => {

                const target =
                    event.target.closest(
                        "[data-fix-action]"
                    );

                if (!target) return;

                event.preventDefault();
                event.stopPropagation();

                const action =
                    target.dataset.fixAction;

                const type =
                    target.dataset.fixType;

                const category =
                    target.dataset.fixCategory || "";

                const id =
                    target.dataset.fixId;

                if (!id) return;

                if (action === "edit") {
                    openEditor(
                        type,
                        category,
                        id
                    );
                }

                if (action === "delete") {
                    deleteEntry(
                        type,
                        category,
                        id
                    );
                }
            },
            false
        );
    }

    /* ------------------------------------------------------------
       MODAL EVENTS
       ------------------------------------------------------------ */

    function setupModalEvents() {

        document.addEventListener(
            "click",
            event => {

                const id =
                    event.target &&
                    event.target.id;

                if (id === "pumpFixCloseModal") {
                    closeEditor();
                }

                if (id === "pumpFixCancel") {
                    closeEditor();
                }

                if (id === "pumpFixSave") {
                    saveEditor();
                }
            },
            false
        );

        document.addEventListener(
            "keydown",
            event => {

                const modal =
                    document.getElementById(
                        "pumpFixModal"
                    );

                if (!modal) return;

                if (
                    modal.style.display !== "flex"
                ) {
                    return;
                }

                if (event.key === "Escape") {
                    closeEditor();
                }

                if (
                    event.key === "Enter" &&
                    event.target &&
                    event.target.tagName === "INPUT"
                ) {
                    event.preventDefault();
                    saveEditor();
                }
            },
            false
        );
    }

    /* ------------------------------------------------------------
       SAFE PERIODIC UI SYNC
       ------------------------------------------------------------ */

    let syncTimer = null;

    function startSafeSync() {

        if (syncTimer !== null) {
            return;
        }

        /*
         * This is NOT a MutationObserver and does not render
         * anything. It only refreshes our small fixed indicator.
         *
         * 500ms is deliberately modest and does not touch the
         * application's DOM tree.
         */

        syncTimer = window.setInterval(() => {

            try {
                updateDifferenceBar();
            } catch (error) {
                console.warn(
                    "[Fix.js] Difference update failed:",
                    error
                );
            }

        }, 500);
    }

    /* ------------------------------------------------------------
       INITIALIZATION
       ------------------------------------------------------------ */

    function init() {

        try {

            createDifferenceBar();
            createModal();

            setupClickHandling();
            setupModalEvents();

            normalizeQuickData();
            normalizeManualData();

            addButtonsToKnownLists();

            updateDifferenceBar();

            startSafeSync();

            console.info(
                "[Fix.js] Loaded safely — version",
                FIX_VERSION
            );

        } catch (error) {

            /*
             * Absolute last-resort protection.
             *
             * Fix.js must NEVER stop the main application from
             * running because of an enhancement error.
             */

            console.warn(
                "[Fix.js] Initialization safely aborted:",
                error
            );
        }
    }

    /* ------------------------------------------------------------
       DOM READY
       ------------------------------------------------------------ */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );

    } else {

        init();
    }

})();
