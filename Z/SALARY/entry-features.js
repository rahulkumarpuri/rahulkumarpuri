(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE_KEY =
        "salaryTrackerData_v1";

    const HOURLY_RATE =
        50;


    /* =====================================================
       DATA FUNCTIONS
    ===================================================== */

    function loadData() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!saved) {

                return {
                    overtime: [],
                    advances: []
                };

            }


            const parsed =
                JSON.parse(saved);


            return {

                overtime:
                    Array.isArray(
                        parsed.overtime
                    )
                        ? parsed.overtime
                        : [],

                advances:
                    Array.isArray(
                        parsed.advances
                    )
                        ? parsed.advances
                        : []

            };

        }

        catch (error) {

            console.error(
                "Salary Entry Feature - Load Error:",
                error
            );


            return {

                overtime: [],

                advances: []

            };

        }

    }


    function saveData(data) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );


            return true;

        }

        catch (error) {

            console.error(
                "Salary Entry Feature - Save Error:",
                error
            );


            alert(
                "Could not save data on this device."
            );


            return false;

        }

    }


    /* =====================================================
       ID
    ===================================================== */

    function createId() {

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 11)
        );

    }


    /* =====================================================
       TODAY
    ===================================================== */

    function getToday() {

        const date =
            new Date();


        return (
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                date.getDate()
            ).padStart(2, "0")
        );

    }


    /* =====================================================
       OVERTIME AMOUNT
    ===================================================== */

    function getOvertimeAmount(item) {

        if (
            item &&
            item.amount !== undefined
        ) {

            return Number(
                item.amount || 0
            );

        }


        /*
            Compatibility with old
            hour-based entries.
        */

        if (
            item &&
            item.hours !== undefined
        ) {

            return (
                Number(
                    item.hours || 0
                ) *
                HOURLY_RATE
            );

        }


        return 0;

    }


    /* =====================================================
       ENTRY DATE
    ===================================================== */

    function getEntryDate(item) {

        /*
            New format.
        */

        if (
            item &&
            item.date
        ) {

            return item.date;

        }


        /*
            Old format:
            use timestamp date.
        */

        if (
            item &&
            item.timestamp
        ) {

            const date =
                new Date(
                    item.timestamp
                );


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                return (
                    date.getFullYear() +
                    "-" +
                    String(
                        date.getMonth() + 1
                    ).padStart(2, "0") +
                    "-" +
                    String(
                        date.getDate()
                    ).padStart(2, "0")
                );

            }

        }


        return getToday();

    }


    /* =====================================================
       NOTE
    ===================================================== */

    function getEntryNote(item) {

        if (
            item &&
            typeof item.note ===
            "string"
        ) {

            return item.note;

        }


        return "";

    }


    /* =====================================================
       DATE DISPLAY
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {

            return "—";

        }


        const parts =
            String(
                dateString
            ).split("-");


        if (
            parts.length !== 3
        ) {

            return dateString;

        }


        const date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return dateString;

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       CSS
    ===================================================== */

    function addStyles() {

        if (
            document.getElementById(
                "salaryEntryFeatureStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "salaryEntryFeatureStyles";


        style.textContent = `

            /* ==========================================
               EXTRA FIELDS
            ========================================== */

            .sef-extra-fields {
                display: grid;

                gap: 10px;

                margin-top: 12px;
            }


            .sef-field {
                width: 100%;
            }


            .sef-field label {
                display: block;

                margin-bottom: 6px;

                color: #667085;

                font-size: 12px;

                font-weight: 700;
            }


            .sef-field input {
                width: 100%;

                height: 44px;

                padding:
                    10px
                    12px;

                box-sizing: border-box;

                border:
                    1px solid #d9e0e8;

                border-radius: 10px;

                background:
                    #ffffff !important;

                color:
                    #172033 !important;

                outline: none;

                font-family: inherit;

                font-size: 14px;
            }


            .sef-field input:focus {
                border-color:
                    #60a5fa;

                box-shadow:
                    0 0 0 3px
                    rgba(
                        59,
                        130,
                        246,
                        .10
                    );
            }


            /* ==========================================
               REPLACED BUTTONS
            ========================================== */

            .sef-main-button {
                width: 100%;

                margin-top: 10px;

                padding:
                    11px
                    14px;

                border: none;

                border-radius: 10px;

                color: #ffffff;

                font-family: inherit;

                font-size: 13px;

                font-weight: 800;

                cursor: pointer;

                touch-action: manipulation;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .sef-overtime-button {

                background:
                    linear-gradient(
                        135deg,
                        #22c55e,
                        #16a34a
                    );

                box-shadow:
                    0 6px 16px
                    rgba(
                        34,
                        197,
                        94,
                        .18
                    );
            }


            .sef-advance-button {

                background:
                    linear-gradient(
                        135deg,
                        #3b82f6,
                        #2563eb
                    );

                box-shadow:
                    0 6px 16px
                    rgba(
                        59,
                        130,
                        246,
                        .18
                    );
            }


            .sef-main-button:active {
                transform:
                    scale(.98);
            }


            /* ==========================================
               MODAL
            ========================================== */

            .sef-modal-overlay {

                position: fixed;

                inset: 0;

                z-index: 999999;

                display: none;

                align-items: center;

                justify-content: center;

                padding: 18px;

                background:
                    rgba(
                        15,
                        23,
                        42,
                        .52
                    );

                backdrop-filter:
                    blur(5px);
            }


            .sef-modal-overlay.show {

                display: flex;

            }


            .sef-modal {

                width:
                    min(
                        420px,
                        100%
                    );

                padding: 21px;

                border-radius: 18px;

                background: #ffffff;

                box-shadow:
                    0 25px 70px
                    rgba(
                        15,
                        23,
                        42,
                        .25
                    );
            }


            .sef-modal h3 {

                margin:
                    0 0 16px;

                color:
                    #172033;

                font-size: 19px;

                font-weight: 800;
            }


            .sef-modal-field {

                margin-top: 11px;

            }


            .sef-modal-field label {

                display: block;

                margin-bottom: 6px;

                color:
                    #667085;

                font-size: 12px;

                font-weight: 700;
            }


            .sef-modal-field input {

                width: 100%;

                height: 44px;

                padding:
                    10px
                    12px;

                box-sizing:
                    border-box;

                border:
                    1px solid #d9e0e8;

                border-radius: 10px;

                background:
                    #ffffff;

                color:
                    #172033;

                outline: none;

                font-family:
                    inherit;

                font-size:
                    14px;
            }


            .sef-modal-actions {

                display: grid;

                grid-template-columns:
                    1fr 1fr;

                gap: 9px;

                margin-top: 17px;
            }


            .sef-modal-button {

                height: 43px;

                border: none;

                border-radius: 10px;

                font-family:
                    inherit;

                font-size: 13px;

                font-weight: 800;

                cursor: pointer;
            }


            .sef-cancel {

                background:
                    #f1f5f9;

                color:
                    #475467;

                border:
                    1px solid #e2e8f0;
            }


            .sef-save {

                background:
                    #2563eb;

                color:
                    #ffffff;
            }


            /* ==========================================
               HISTORY NOTE
            ========================================== */

            .sef-history-note {

                display: block;

                max-width: 180px;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;

                color:
                    #667085;

                font-size:
                    11px;
            }


            .sef-history-note.empty {

                color:
                    #98a2b3;
            }


            .sef-date {

                color:
                    #344054;

                font-weight:
                    700;
