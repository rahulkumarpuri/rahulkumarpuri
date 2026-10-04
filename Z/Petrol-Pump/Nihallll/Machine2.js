/* =========================================================
   MACHINE 2 — OPTIONAL 2-NOZZLE DIESEL MACHINE
   FIXED VERSION
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_OPENING = "pumpMachine2Opening";
    const STORAGE_CLOSING = "pumpMachine2Closing";
    const STORAGE_DAY = "pumpMachine2Day";

    const MACHINE2_ID = "machine2UI";

    // Machine 2 has ONLY 2 DIESEL nozzles
    const MACHINE2_NOZZLES = 2;

    // Fallback diesel rate
    const DIESEL_RATE_FALLBACK = 103.19;

    let uiCreated = false;
    let calcSaleWrapped = false;
    let observer = null;


    /* =========================================================
       HELPERS
       ========================================================= */

    function num(value) {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : 0;
    }

    function todayKey() {
        const d = new Date();

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    }

    function getDieselRate() {
        try {
            if (
                Array.isArray(window.RATES) &&
                window.RATES.length >= 2 &&
                Number.isFinite(Number(window.RATES[1]))
            ) {
                return Number(window.RATES[1]);
            }
        } catch (e) {}

        return DIESEL_RATE_FALLBACK;
    }


    /* =========================================================
       DAILY RESET
       ========================================================= */

    function checkNewDay() {

        const today = todayKey();
        const savedDay = localStorage.getItem(STORAGE_DAY);

        if (savedDay !== today) {

            localStorage.removeItem(STORAGE_OPENING);
            localStorage.removeItem(STORAGE_CLOSING);

            localStorage.setItem(STORAGE_DAY, today);
        }
    }


    /* =========================================================
       STORAGE
       ========================================================= */

    function getMachine2Opening() {
        try {
            return JSON.parse(
                localStorage.getItem(STORAGE_OPENING) || "null"
            );
        } catch (e) {
            return null;
        }
    }

    function getMachine2Closing() {
        try {
            return JSON.parse(
                localStorage.getItem(STORAGE_CLOSING) || "null"
            );
        } catch (e) {
            return null;
        }
    }


    function saveMachine2Opening() {

        const inputs = document.querySelectorAll(
            "#machine2Opening input"
        );

        const values = Array.from(inputs).map(input => num(input.value));

        if (values.length !== MACHINE2_NOZZLES) {
            return;
        }

        localStorage.setItem(
            STORAGE_OPENING,
            JSON.stringify({
                values: values,
                timestamp: Date.now()
            })
        );

        renderMachine2();

        updateMainTotals();
    }


    function saveMachine2Closing() {

        const inputs = document.querySelectorAll(
            "#machine2Closing input"
        );

        const values = Array.from(inputs).map(input => num(input.value));

        if (values.length !== MACHINE2_NOZZLES) {
            return;
        }

        localStorage.setItem(
            STORAGE_CLOSING,
            JSON.stringify({
                values: values,
                timestamp: Date.now()
            })
        );

        renderMachine2();

        updateMainTotals();
    }


    /* =========================================================
       CALCULATION
       ========================================================= */

    function calculateMachine2() {

        const opening = getMachine2Opening();
        const closing = getMachine2Closing();

        // Machine 2 is OPTIONAL.
        // Unless BOTH opening and closing exist,
        // Machine 2 contributes ₹0.

        if (
            !opening ||
            !closing ||
            !Array.isArray(opening.values) ||
            !Array.isArray(closing.values) ||
            opening.values.length !== 2 ||
            closing.values.length !== 2
        ) {
            return {
                ready: false,
                dieselVolume: 0,
                dieselSale: 0
            };
        }

        let volume1 =
            num(closing.values[0]) -
            num(opening.values[0]);

        let volume2 =
            num(closing.values[1]) -
            num(opening.values[1]);

        // Never allow negative sale volume
        volume1 = Math.max(0, volume1);
        volume2 = Math.max(0, volume2);

        const dieselVolume = volume1 + volume2;

        const dieselSale =
            dieselVolume * getDieselRate();

        return {
            ready: true,
            volume1: volume1,
            volume2: volume2,
            dieselVolume: dieselVolume,
            dieselSale: dieselSale
        };
    }


    /* =========================================================
       MAIN CALCULATION INTEGRATION
       ========================================================= */

    function updateMainTotals() {

        try {

            if (typeof window.renderTotals === "function") {
                window.renderTotals();
            }

        } catch (error) {

            console.error(
                "Machine 2: renderTotals error",
                error
            );

        }
    }


    function wrapCalcSale() {

        // Do not wrap more than once
        if (calcSaleWrapped) {
            return;
        }

        if (typeof window.calcSale !== "function") {
            return;
        }

        const originalCalcSale = window.calcSale;

        window.calcSale = function () {

            const base = originalCalcSale();

            const machine2 = calculateMachine2();

            // Machine 2 not completed → return Machine 1 exactly as before
            if (!machine2.ready) {
                return base;
            }

            return {
                ...base,

                // Add Machine 2 diesel to Machine 1 diesel
                diesel:
                    num(base.diesel) +
                    machine2.dieselSale,

                // Add Machine 2 to overall sale
                sale:
                    num(base.sale) +
                    machine2.dieselSale,

                machine2: machine2
            };
        };

        calcSaleWrapped = true;
    }


    /* =========================================================
       UI
       ========================================================= */

    function machine2HTML() {

        const opening = getMachine2Opening();
        const closing = getMachine2Closing();

        const openingValues =
            opening && Array.isArray(opening.values)
                ? opening.values
                : ["", ""];

        const closingValues =
            closing && Array.isArray(closing.values)
                ? closing.values
                : ["", ""];

        return `
            <div id="${MACHINE2_ID}" class="machine2-section">

                <div class="machine2-title">
                    <span>⚙️</span>
                    <span>Machine 2</span>
                    <small>2 Diesel Nozzles</small>
                </div>


                <!-- OPENING -->

                <div class="machine2-card">

                    <div class="machine2-card-title">
                        Opening CumVolume
                    </div>

                    <div id="machine2Opening"
                         class="machine2-input-grid">

                        <input
                            type="number"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="Nozzle 1"
                            value="${openingValues[0] ?? ""}"
                        >

                        <input
                            type="number"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="Nozzle 2"
                            value="${openingValues[1] ?? ""}"
                        >

                    </div>

                    <button
                        type="button"
                        class="machine2-save-btn"
                        onclick="saveMachine2Opening()"
                    >
                        Save Opening
                    </button>

                </div>


                <!-- CLOSING -->

                <div class="machine2-card">

                    <div class="machine2-card-title">
                        Closing CumVolume
                    </div>

                    <div id="machine2Closing"
                         class="machine2-input-grid">

                        <input
                            type="number"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="Nozzle 1"
                            value="${closingValues[0] ?? ""}"
                        >

                        <input
                            type="number"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="Nozzle 2"
                            value="${closingValues[1] ?? ""}"
                        >

                    </div>

                    <button
                        type="button"
                        class="machine2-save-btn"
                        onclick="saveMachine2Closing()"
                    >
                        Save Closing
                    </button>

                </div>


                <!-- RESULT -->

                <div class="machine2-result">

                    <div>
                        <span>Diesel Volume</span>
                        <strong id="machine2DieselVolume">
                            0.00 L
                        </strong>
                    </div>

                    <div>
                        <span>Diesel Sale</span>
                        <strong id="machine2DieselSale">
                            ₹ 0.00
                        </strong>
                    </div>

                </div>

                <div class="machine2-note">
                    ℹ️ Machine 2 is optional. If Opening + Closing
                    are not both saved, it adds nothing to today's sale.
                </div>

            </div>
        `;
    }


    /* =========================================================
       CSS
       ========================================================= */

    function injectCSS() {

        if (document.getElementById("machine2CSS")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "machine2CSS";

        style.textContent = `

            #machine2UI {
                margin: 16px 0;
                width: 100%;
                box-sizing: border-box;
            }

            .machine2-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 14px;
            }

            .machine2-title small {
                margin-left: auto;
                font-size: 12px;
                font-weight: 600;
                opacity: .6;
            }

            .machine2-card {
                background: rgba(255,255,255,.9);
                border: 1px solid rgba(0,0,0,.08);
                border-radius: 18px;
                padding: 15px;
                margin-bottom: 12px;
                box-shadow: 0 5px 18px rgba(0,0,0,.06);
            }

            .machine2-card-title {
                font-size: 15px;
                font-weight: 800;
                margin-bottom: 10px;
            }

            .machine2-input-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .machine2-input-grid input {
                width: 100%;
                box-sizing: border-box;
                padding: 13px;
                border-radius: 12px;
                border: 1px solid #d5d8df;
                font-size: 16px;
                outline: none;
                background: #fff;
            }

            .machine2-input-grid input:focus {
                border-color: #2864dc;
                box-shadow: 0 0 0 3px rgba(40,100,220,.12);
            }

            .machine2-save-btn {
                width: 100%;
                margin-top: 12px;
                border: 0;
                border-radius: 12px;
                padding: 12px;
                font-size: 15px;
                font-weight: 800;
                color: white;
                background: linear-gradient(
                    135deg,
                    #2563eb,
                    #4f46e5
                );
                cursor: pointer;
            }

            .machine2-result {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 12px;
            }

            .machine2-result > div {
                padding: 14px;
                border-radius: 15px;
                background: rgba(255,255,255,.9);
                border: 1px solid rgba(0,0,0,.07);
            }

            .machine2-result span {
                display: block;
                font-size: 12px;
                opacity: .65;
                margin-bottom: 5px;
            }

            .machine2-result strong {
                font-size: 16px;
            }

            .machine2-note {
                margin-top: 10px;
                font-size: 12px;
                opacity: .65;
                line-height: 1.5;
            }

            @media(max-width:480px) {

                .machine2-input-grid {
                    grid-template-columns: 1fr;
                }

                .machine2-result {
                    grid-template-columns: 1fr;
                }

            }

        `;

        document.head.appendChild(style);
    }


    /* =========================================================
       RENDER
       ========================================================= */

    function renderMachine2() {

        checkNewDay();

        injectCSS();

        wrapCalcSale();

        const menuContent =
            document.querySelector(
                "#pumpMenu .pump-menu-content"
            ) ||
            document.querySelector(
                "#pumpMenu"
            );

        if (!menuContent) {
            return false;
        }

        let ui = document.getElementById(MACHINE2_ID);

        // Create ONLY if it doesn't already exist
        if (!ui) {

            ui = document.createElement("div");

            ui.id = MACHINE2_ID;

            ui.innerHTML = machine2HTML();

            menuContent.appendChild(ui);

            uiCreated = true;

        } else {

            // Update result only.
            // DO NOT rebuild the whole UI every mutation.
            updateMachine2Result();

        }

        updateMachine2Result();

        return true;
    }


    /* =========================================================
       RESULT UPDATE
       ========================================================= */

    function updateMachine2Result() {

        const result = calculateMachine2();

        const volumeElement =
            document.getElementById(
                "machine2DieselVolume"
            );

        const saleElement =
            document.getElementById(
                "machine2DieselSale"
            );

        if (!volumeElement || !saleElement) {
            return;
        }

        volumeElement.textContent =
            result.dieselVolume.toFixed(2) + " L";

        saleElement.textContent =
            "₹ " +
            result.dieselSale.toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
    }


    /* =========================================================
       SAFE MENU WATCHER
       ========================================================= */

    function startSafeObserver() {

        // IMPORTANT:
        // We do NOT render on every DOM mutation.
        // We only look for the menu if it doesn't exist yet.

        if (observer) {
            return;
        }

        observer = new MutationObserver(function () {

            if (document.getElementById(MACHINE2_ID)) {
                return;
            }

            const menu =
                document.querySelector(
                    "#pumpMenu .pump-menu-content"
                ) ||
                document.querySelector("#pumpMenu");

            if (menu) {

                renderMachine2();

                // Stop watching once Machine 2 is installed.
                if (document.getElementById(MACHINE2_ID)) {

                    observer.disconnect();
                    observer = null;
                }
            }

        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    function initMachine2() {

        checkNewDay();

        injectCSS();

        wrapCalcSale();

        // Try immediately
        renderMachine2();

        // If hamburger menu is created later,
        // safely wait for it.
        if (!document.getElementById(MACHINE2_ID)) {
            startSafeObserver();
        }
    }


    /* =========================================================
       GLOBAL FUNCTIONS
       ========================================================= */

    window.saveMachine2Opening =
        saveMachine2Opening;

    window.saveMachine2Closing =
        saveMachine2Closing;

    window.calculateMachine2 =
        calculateMachine2;


    /* =========================================================
       START
       ========================================================= */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initMachine2
        );

    } else {

        initMachine2();

    }

})();
