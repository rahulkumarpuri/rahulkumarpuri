/* =========================================================
   MACHINE 2
   OPTIONAL 2-NOZZLE DIESEL MACHINE
   FINAL SAFE VERSION
   ========================================================= */

(function () {
    "use strict";

    const OPENING_KEY = "pumpMachine2Opening";
    const CLOSING_KEY = "pumpMachine2Closing";
    const DAY_KEY = "pumpMachine2Day";

    const UI_ID = "machine2UI";

    const DIESEL_RATE = 103.19;

    let mounted = false;
    let calcWrapped = false;


    /* =========================================================
       HELPERS
       ========================================================= */

    function num(v) {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
    }

    function today() {
        const d = new Date();

        return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0")
        );
    }


    function checkDay() {

        const currentDay = today();
        const savedDay = localStorage.getItem(DAY_KEY);

        if (savedDay !== currentDay) {

            localStorage.removeItem(OPENING_KEY);
            localStorage.removeItem(CLOSING_KEY);

            localStorage.setItem(
                DAY_KEY,
                currentDay
            );
        }
    }


    function getOpening() {

        try {
            return JSON.parse(
                localStorage.getItem(OPENING_KEY)
            );
        } catch (e) {
            return null;
        }
    }


    function getClosing() {

        try {
            return JSON.parse(
                localStorage.getItem(CLOSING_KEY)
            );
        } catch (e) {
            return null;
        }
    }


    /* =========================================================
       MACHINE 2 CALCULATION
       ========================================================= */

    function calculateMachine2() {

        const opening = getOpening();
        const closing = getClosing();

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
                volume: 0,
                sale: 0
            };
        }


        let nozzle1 =
            num(closing.values[0]) -
            num(opening.values[0]);

        let nozzle2 =
            num(closing.values[1]) -
            num(opening.values[1]);


        nozzle1 = Math.max(0, nozzle1);
        nozzle2 = Math.max(0, nozzle2);


        const volume =
            nozzle1 + nozzle2;


        const sale =
            volume * DIESEL_RATE;


        return {
            ready: true,
            nozzle1: nozzle1,
            nozzle2: nozzle2,
            volume: volume,
            sale: sale
        };
    }


    /* =========================================================
       SAVE OPENING
       ========================================================= */

    window.saveMachine2Opening = function () {

        const box =
            document.getElementById(
                "machine2Opening"
            );

        if (!box) return;


        const inputs =
            box.querySelectorAll("input");


        const values =
            Array.from(inputs).map(
                input => num(input.value)
            );


        if (values.length !== 2) return;


        localStorage.setItem(
            OPENING_KEY,
            JSON.stringify({
                values: values,
                time: Date.now()
            })
        );


        updateMachine2Display();
        updateMainSale();
    };


    /* =========================================================
       SAVE CLOSING
       ========================================================= */

    window.saveMachine2Closing = function () {

        const box =
            document.getElementById(
                "machine2Closing"
            );

        if (!box) return;


        const inputs =
            box.querySelectorAll("input");


        const values =
            Array.from(inputs).map(
                input => num(input.value)
            );


        if (values.length !== 2) return;


        localStorage.setItem(
            CLOSING_KEY,
            JSON.stringify({
                values: values,
                time: Date.now()
            })
        );


        updateMachine2Display();
        updateMainSale();
    };


    /* =========================================================
       HTML
       ========================================================= */

    function getMachine2HTML() {

        const opening = getOpening();
        const closing = getClosing();


        const ov =
            opening &&
            Array.isArray(opening.values)
                ? opening.values
                : ["", ""];


        const cv =
            closing &&
            Array.isArray(closing.values)
                ? closing.values
                : ["", ""];


        return `

        <section id="${UI_ID}" class="machine2-wrapper">

            <div class="machine2-heading">
                <div>
                    ⚙️ Machine 2
                </div>

                <span>
                    2 Diesel Nozzles
                </span>
            </div>


            <!-- OPENING -->

            <div class="machine2-card">

                <div class="machine2-label">
                    ⛽ Opening CumVolume
                </div>

                <div
                    id="machine2Opening"
                    class="machine2-inputs"
                >

                    <input
                        type="number"
                        step="0.01"
                        inputmode="decimal"
                        placeholder="Nozzle 1"
                        value="${ov[0] ?? ""}"
                    >

                    <input
                        type="number"
                        step="0.01"
                        inputmode="decimal"
                        placeholder="Nozzle 2"
                        value="${ov[1] ?? ""}"
                    >

                </div>


                <button
                    type="button"
                    onclick="saveMachine2Opening()"
                    class="machine2-save"
                >
                    Save Opening
                </button>

            </div>


            <!-- CLOSING -->

            <div class="machine2-card">

                <div class="machine2-label">
                    ⛽ Closing CumVolume
                </div>

                <div
                    id="machine2Closing"
                    class="machine2-inputs"
                >

                    <input
                        type="number"
                        step="0.01"
                        inputmode="decimal"
                        placeholder="Nozzle 1"
                        value="${cv[0] ?? ""}"
                    >

                    <input
                        type="number"
                        step="0.01"
                        inputmode="decimal"
                        placeholder="Nozzle 2"
                        value="${cv[1] ?? ""}"
                    >

                </div>


                <button
                    type="button"
                    onclick="saveMachine2Closing()"
                    class="machine2-save"
                >
                    Save Closing
                </button>

            </div>


            <!-- RESULT -->

            <div class="machine2-result">

                <div>

                    <small>
                        Diesel Volume
                    </small>

                    <strong
                        id="machine2Volume"
                    >
                        0.00 L
                    </strong>

                </div>


                <div>

                    <small>
                        Diesel Sale
                    </small>

                    <strong
                        id="machine2Sale"
                    >
                        ₹ 0.00
                    </strong>

                </div>

            </div>


            <div class="machine2-info">
                ℹ️ Machine 2 is optional.
                It contributes to today's sale only
                when both Opening and Closing are saved.
            </div>

        </section>

        `;
    }


    /* =========================================================
       CSS
       ========================================================= */

    function addCSS() {

        if (
            document.getElementById(
                "machine2FinalCSS"
            )
        ) return;


        const style =
            document.createElement("style");


        style.id =
            "machine2FinalCSS";


        style.textContent = `

        .machine2-wrapper {
            width: calc(100% - 28px);
            margin: 18px auto;
            box-sizing: border-box;
        }


        .machine2-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 18px;

            border-radius: 18px;

            background:
                linear-gradient(
                    135deg,
                    #eef4ff,
                    #ffffff
                );

            border: 1px solid
                rgba(30,60,120,.12);

            margin-bottom: 14px;

            font-size: 20px;
            font-weight: 800;
        }


        .machine2-heading span {
            font-size: 11px;
            font-weight: 700;
            opacity: .55;
        }


        .machine2-card {

            background: #ffffff;

            border: 1px solid
                rgba(20,30,50,.10);

            border-radius: 18px;

            padding: 16px;

            margin-bottom: 12px;

            box-shadow:
                0 5px 20px
                rgba(20,40,80,.07);

            box-sizing: border-box;
        }


        .machine2-label {

            font-size: 16px;
            font-weight: 800;

            margin-bottom: 12px;
        }


        .machine2-inputs {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 10px;
        }


        .machine2-inputs input {

            width: 100%;

            box-sizing: border-box;

            padding: 14px;

            border-radius: 13px;

            border: 1px solid #d5d9e0;

            background: #fff;

            font-size: 16px;

            outline: none;
        }


        .machine2-inputs input:focus {

            border-color: #2563eb;

            box-shadow:
                0 0 0 3px
                rgba(37,99,235,.12);
        }


        .machine2-save {

            width: 100%;

            border: none;

            margin-top: 12px;

            padding: 13px;

            border-radius: 13px;

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #4f46e5
                );

            color: white;

            font-size: 15px;

            font-weight: 800;
        }


        .machine2-result {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 10px;

            margin-top: 12px;
        }


        .machine2-result > div {

            background: white;

            border-radius: 16px;

            padding: 15px;

            border: 1px solid
                rgba(20,30,50,.10);
        }


        .machine2-result small {

            display: block;

            opacity: .55;

            margin-bottom: 5px;
        }


        .machine2-result strong {

            font-size: 17px;
        }


        .machine2-info {

            font-size: 12px;

            line-height: 1.5;

            opacity: .60;

            padding: 8px 4px;
        }


        @media(max-width:500px) {

            .machine2-inputs {
                grid-template-columns: 1fr;
            }

            .machine2-result {
                grid-template-columns: 1fr;
            }

            .machine2-heading span {
                font-size: 10px;
            }

        }

        `;


        document.head.appendChild(style);
    }


    /* =========================================================
       FIND CURRENT MENU
       ========================================================= */

    function findMenu() {

        // Your original menu
        let menu =
            document.getElementById(
                "pumpMenu"
            );


        if (menu) return menu;


        // Backup selectors
        menu =
            document.querySelector(
                ".pump-menu"
            );

        if (menu) return menu;


        menu =
            document.querySelector(
                ".pump-menu-content"
            );

        if (menu) return menu;


        return null;
    }


    /* =========================================================
       MOUNT MACHINE 2
       ========================================================= */

    function mountMachine2() {

        if (
            document.getElementById(
                UI_ID
            )
        ) {
            mounted = true;
            return true;
        }


        const menu = findMenu();


        if (!menu) {
            return false;
        }


        addCSS();


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.innerHTML =
            getMachine2HTML();


        const machine2 =
            wrapper.firstElementChild;


        if (!machine2) {
            return false;
        }


        /*
         * Put Machine 2 at the bottom
         * of the current Petrol Pump Menu.
         *
         * This is intentional.
         *
         * It will appear after Testing
         * and before anything else that
         * may be added later.
         */

        menu.appendChild(
            machine2
        );


        mounted = true;


        updateMachine2Display();


        return true;
    }


    /* =========================================================
       UPDATE RESULT
       ========================================================= */

    function updateMachine2Display() {

        const result =
            calculateMachine2();


        const volume =
            document.getElementById(
                "machine2Volume"
            );


        const sale =
            document.getElementById(
                "machine2Sale"
            );


        if (!volume || !sale) {
            return;
        }


        volume.textContent =
            result.volume.toFixed(2)
            + " L";


        sale.textContent =
            "₹ " +
            result.sale.toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
    }


    /* =========================================================
       ADD MACHINE 2 TO MAIN SALE
       ========================================================= */

    function wrapCalculation() {

        if (calcWrapped) {
            return;
        }


        if (
            typeof window.calcSale !==
            "function"
        ) {

            // Main JS may not have loaded yet.
            return;
        }


        const originalCalcSale =
            window.calcSale;


        window.calcSale =
            function () {

                const base =
                    originalCalcSale();


                const machine2 =
                    calculateMachine2();


                if (
                    !machine2.ready
                ) {
                    return base;
                }


                return {

                    ...base,

                    diesel:
                        num(base.diesel) +
                        machine2.sale,

                    sale:
                        num(base.sale) +
                        machine2.sale,

                    machine2:
                        machine2
                };
            };


        calcWrapped = true;
    }


    /* =========================================================
       REFRESH MAIN APP
       ========================================================= */

    function updateMainSale() {

        wrapCalculation();


        try {

            if (
                typeof window.renderTotals ===
                "function"
            ) {

                window.renderTotals();

            }

        } catch (error) {

            console.error(
                "Machine 2 render error:",
                error
            );
        }
    }


    /* =========================================================
       WATCH FOR HAMBURGER MENU
       ========================================================= */

    function startMenuWatcher() {

        const observer =
            new MutationObserver(
                function () {

                    /*
                     * IMPORTANT:
                     *
                     * Once Machine 2 exists,
                     * STOP doing anything.
                     *
                     * This prevents the
                     * infinite loading loop
                     * from the previous version.
                     */

                    if (
                        document.getElementById(
                            UI_ID
                        )
                    ) {
                        return;
                    }


                    mountMachine2();

                }
            );


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }


    /* =========================================================
       HAMBURGER CLICK SUPPORT
       ========================================================= */

    function hookMenuButton() {

        document.addEventListener(
            "click",
            function (event) {

                const target =
                    event.target.closest(
                        "#pumpMenuBtn, " +
                        "#pumpMenuButton, " +
                        ".hamburger, " +
                        ".menu-btn, " +
                        "[aria-label*='menu' i]"
                    );


                if (!target) {
                    return;
                }


                /*
                 * Give the existing menu
                 * time to open/create.
                 */

                setTimeout(
                    function () {

                        mountMachine2();

                    },
                    50
                );


                setTimeout(
                    function () {

                        mountMachine2();

                    },
                    250
                );

            },
            true
        );
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    function init() {

        checkDay();

        addCSS();

        wrapCalculation();

        /*
         * Try immediately.
         */
        mountMachine2();


        /*
         * Watch for the hamburger
         * menu being created later.
         */
        startMenuWatcher();


        /*
         * Also explicitly react to
         * hamburger button.
         */
        hookMenuButton();


        /*
         * Retry a few times because
         * your main app dynamically
         * creates the menu.
         */

        setTimeout(
            mountMachine2,
            100
        );

        setTimeout(
            mountMachine2,
            500
        );

        setTimeout(
            mountMachine2,
            1000
        );

        setTimeout(
            mountMachine2,
            2000
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();
