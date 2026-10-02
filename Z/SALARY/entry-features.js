(function () {

    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE_KEY = "salaryTrackerData_v1";
    const HOURLY_RATE = 50;


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function getToday() {

        const d = new Date();

        const year = d.getFullYear();

        const month = String(
            d.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            d.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function createId() {

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );

    }


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
                    Array.isArray(parsed.overtime)
                        ? parsed.overtime
                        : [],

                advances:
                    Array.isArray(parsed.advances)
                        ? parsed.advances
                        : []

            };

        }

        catch (error) {

            console.error(
                "Entry Features:",
                error
            );

            return {
                overtime: [],
                advances: []
            };

        }

    }


    function saveData(data) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    }


    function getOvertimeAmount(item) {

        if (
            item.amount !== undefined
        ) {

            return Number(
                item.amount || 0
            );

        }

        if (
            item.hours !== undefined
        ) {

            return (
                Number(
                    item.hours || 0
                ) * HOURLY_RATE
            );

        }

        return 0;

    }


    function getItemDate(item) {

        if (
            item.date
        ) {

            return item.date;

        }


        if (
            item.timestamp
        ) {

            const d =
                new Date(
                    item.timestamp
                );

            if (
                !isNaN(
                    d.getTime()
                )
            ) {

                return (
                    d.getFullYear() +
                    "-" +
                    String(
                        d.getMonth() + 1
                    ).padStart(2, "0") +
                    "-" +
                    String(
                        d.getDate()
                    ).padStart(2, "0")
                );

            }

        }


        return getToday();

    }


    function getItemNote(item) {

        return (
            typeof item.note === "string"
                ? item.note
                : ""
        );

    }


    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       CSS
    ===================================================== */

    function addStyles() {

        if (
            document.getElementById(
                "entryFeatureStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "entryFeatureStyles";


        style.textContent = `

            .ef-extra-fields {
                margin-top: 12px;
                display: grid;
                gap: 10px;
            }

            .ef-field {
                width: 100%;
            }

            .ef-field label {
                display: block;
                margin-bottom: 6px;
                color: #667085;
                font-size: 12px;
                font-weight: 700;
            }

            .ef-field input {
                width: 100%;
                height: 44px;
                padding: 10px 12px;
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

            .ef-field input:focus {
                border-color: #60a5fa;

                box-shadow:
                    0 0 0 3px
                    rgba(59,130,246,.10);
            }

            .ef-field input::placeholder {
                color: #98a2b3;
            }

            /* -----------------------------------------
               EDIT MODAL
            ----------------------------------------- */

            .ef-modal-overlay {
                position: fixed;
                inset: 0;

                z-index: 999999;

                display: none;

                align-items: center;
                justify-content: center;

                padding: 18px;

                background:
                    rgba(15,23,42,.50);

                backdrop-filter:
                    blur(5px);
            }

            .ef-modal-overlay.show {
                display: flex;
            }

            .ef-modal {
                width:
                    min(420px, 100%);

                padding: 20px;

                border-radius: 18px;

                background: #ffffff;

                box-shadow:
                    0 25px 70px
                    rgba(15,23,42,.25);
            }

            .ef-modal h3 {
                margin:
                    0 0 16px;

                color: #172033;

                font-size: 19px;

                font-weight: 800;
            }

            .ef-modal-field {
                margin-top: 11px;
            }

            .ef-modal-field label {
                display: block;

                margin-bottom: 6px;

                color: #667085;

                font-size: 12px;

                font-weight: 700;
            }

            .ef-modal-field input {
                width: 100%;

                height: 44px;

                padding:
                    10px 12px;

                box-sizing: border-box;

                border:
                    1px solid #d9e0e8;

                border-radius: 10px;

                background: #ffffff;

                color: #172033;

                outline: none;

                font-family: inherit;

                font-size: 14px;
            }

            .ef-modal-actions {
                display: grid;

                grid-template-columns:
                    1fr 1fr;

                gap: 9px;

                margin-top: 17px;
            }

            .ef-modal-btn {
                height: 43px;

                border: none;

                border-radius: 10px;

                font-family: inherit;

                font-size: 13px;

                font-weight: 800;

                cursor: pointer;
            }

            .ef-cancel {
                background: #f1f5f9;

                color: #475467;

                border:
                    1px solid #e2e8f0;
            }

            .ef-save {
                background: #2563eb;

                color: #ffffff;
            }

            /* -----------------------------------------
               HISTORY NOTE
            ----------------------------------------- */

            .ef-history-note {
                display: block;

                max-width: 180px;

                overflow: hidden;

                text-overflow: ellipsis;

                white-space: nowrap;

                color: #667085;

                font-size: 11px;
            }

            .ef-history-note.empty {
                color: #98a2b3;
            }

            .ef-custom-date {
                font-weight: 700;

                color: #344054;
            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       ADD DATE + NOTE FIELDS
    ===================================================== */

    function createExtraFields() {

        const overtimeInput =
            document.getElementById(
                "overtimeAmount"
            );


        const advanceInput =
            document.getElementById(
                "advanceAmount"
            );


        if (!overtimeInput) {

            console.error(
                "Entry Features: overtimeAmount not found."
            );

        }


        if (!advanceInput) {

            console.error(
                "Entry Features: advanceAmount not found."
            );

        }


        /* -----------------------------------------
           OVERTIME
        ----------------------------------------- */

        if (
            overtimeInput &&
            !document.getElementById(
                "efOvertimeFields"
            )
        ) {

            const card =
                overtimeInput.closest(
                    ".form-card"
                );


            if (card) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.id =
                    "efOvertimeFields";


                wrapper.className =
                    "ef-extra-fields";


                wrapper.innerHTML = `

                    <div class="ef-field">

                        <label
                            for="efOvertimeDate"
                        >
                            📅 Overtime Date
                        </label>

                        <input
                            type="date"
                            id="efOvertimeDate"
                            value="${getToday()}"
                        >

                    </div>


                    <div class="ef-field">

                        <label
                            for="efOvertimeNote"
                        >
                            📝 Custom Note
                        </label>

                        <input
                            type="text"
                            id="efOvertimeNote"
                            maxlength="150"
                            placeholder="Example: Sunday extra duty"
                        >

                    </div>

                `;


                /*
                    Put the new fields directly
                    AFTER the existing amount input.
                */

                overtimeInput.insertAdjacentElement(
                    "afterend",
                    wrapper
                );

            }

        }


        /* -----------------------------------------
           ADVANCE
        ----------------------------------------- */

        if (
            advanceInput &&
            !document.getElementById(
                "efAdvanceFields"
            )
        ) {

            const card =
                advanceInput.closest(
                    ".form-card"
                );


            if (card) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.id =
                    "efAdvanceFields";


                wrapper.className =
                    "ef-extra-fields";


                wrapper.innerHTML = `

                    <div class="ef-field">

                        <label
                            for="efAdvanceDate"
                        >
                            📅 Advance Date
                        </label>

                        <input
                            type="date"
                            id="efAdvanceDate"
                            value="${getToday()}"
                        >

                    </div>


                    <div class="ef-field">

                        <label
                            for="efAdvanceNote"
                        >
                            📝 Custom Note
                        </label>

                        <input
                            type="text"
                            id="efAdvanceNote"
                            maxlength="150"
                            placeholder="Example: Emergency expense"
                        >

                    </div>

                `;


                advanceInput.insertAdjacentElement(
                    "afterend",
                    wrapper
                );

            }

        }

    }


    /* =====================================================
       ADD / UPDATE DATA
    ===================================================== */

    function addOvertime() {

        const amountInput =
            document.getElementById(
                "overtimeAmount"
            );


        const dateInput =
            document.getElementById(
                "efOvertimeDate"
            );


        const noteInput =
            document.getElementById(
                "efOvertimeNote"
            );


        if (
            !amountInput ||
            !dateInput ||
            !noteInput
        ) {

            alert(
                "Overtime fields could not be loaded. Please refresh the page."
            );

            return;

        }


        const amount =
            parseFloat(
                amountInput.value
            );


        const date =
            dateInput.value ||
            getToday();


        const note =
            noteInput.value.trim();


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Please enter a valid overtime amount."
            );

            amountInput.focus();

            return;

        }


        const data =
            loadData();


        data.overtime.push({

            id:
                createId(),

            timestamp:
                new Date()
                    .toISOString(),

            amount:
                amount,

            date:
                date,

            note:
                note

        });


        saveData(data);


        window.location.reload();

    }


    function addAdvance() {

        const amountInput =
            document.getElementById(
                "advanceAmount"
            );


        const dateInput =
            document.getElementById(
                "efAdvanceDate"
            );


        const noteInput =
            document.getElementById(
                "efAdvanceNote"
            );


        if (
            !amountInput ||
            !dateInput ||
            !noteInput
        ) {

            alert(
                "Advance fields could not be loaded. Please refresh the page."
            );

            return;

        }


        const amount =
            parseFloat(
                amountInput.value
            );


        const date =
            dateInput.value ||
            getToday();


        const note =
            noteInput.value.trim();


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Please enter a valid advance amount."
            );

            amountInput.focus();

            return;

        }


        const data =
            loadData();


        data.advances.push({

            id:
                createId(),

            timestamp:
                new Date()
                    .toISOString(),

            amount:
                amount,

            date:
                date,

            note:
                note

        });


        saveData(data);


        window.location.reload();

    }


    /* =====================================================
       CREATE EDIT MODAL
    ===================================================== */

    function createModal() {

        if (
            document.getElementById(
                "efEditModal"
            )
        ) {

            return;

        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "efEditModal";


        overlay.className =
            "ef-modal-overlay";


        overlay.innerHTML = `

            <div class="ef-modal">

                <h3 id="efEditTitle">
                    Edit Entry
                </h3>


                <div class="ef-modal-field">

                    <label
                        for="efEditAmount"
                    >
                        💰 Amount (₹)
                    </label>

                    <input
                        id="efEditAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputmode="decimal"
                    >

                </div>


                <div class="ef-modal-field">

                    <label
                        for="efEditDate"
                    >
                        📅 Date
                    </label>

                    <input
                        id="efEditDate"
                        type="date"
                    >

                </div>


                <div class="ef-modal-field">

                    <label
                        for="efEditNote"
                    >
                        📝 Custom Note
                    </label>

                    <input
                        id="efEditNote"
                        type="text"
                        maxlength="150"
                        placeholder="Add a custom note..."
                    >

                </div>


                <div class="ef-modal-actions">

                    <button
                        type="button"
                        id="efCancelEdit"
                        class="
                            ef-modal-btn
                            ef-cancel
                        "
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        id="efSaveEdit"
                        class="
                            ef-modal-btn
                            ef-save
                        "
                    >
                        Save Changes
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        document
            .getElementById(
                "efCancelEdit"
            )
            .addEventListener(
                "click",
                closeModal
            );


        document
            .getElementById(
                "efSaveEdit"
            )
            .addEventListener(
                "click",
                saveEdit
            );


        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    overlay
                ) {

                    closeModal();

                }

            }
        );

    }


    /* =====================================================
       EDIT STATE
    ===================================================== */

    let currentType =
        null;

    let currentId =
        null;


    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

    function openEdit(
        type,
        id
    ) {

        const data =
            loadData();


        const list =
            type === "overtime"
                ? data.overtime
                : data.advances;


        const item =
            list.find(
                function (entry) {

                    return String(
                        entry.id
                    ) === String(id);

                }
            );


        if (!item) {

            alert(
                "Entry not found."
            );

            return;

        }


        currentType =
            type;


        currentId =
            item.id;


        document.getElementById(
            "efEditTitle"
        ).textContent =
            type === "overtime"
                ? "✏️ Edit Overtime"
                : "✏️ Edit Advance";


        document.getElementById(
            "efEditAmount"
        ).value =
            type === "overtime"
                ? getOvertimeAmount(item)
                : Number(
                    item.amount || 0
                );


        document.getElementById(
            "efEditDate"
        ).value =
            getItemDate(item);


        document.getElementById(
            "efEditNote"
        ).value =
            getItemNote(item);


        document.getElementById(
            "efEditModal"
        ).classList.add(
            "show"
        );

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

        const modal =
            document.getElementById(
                "efEditModal"
            );


        if (modal) {

            modal.classList.remove(
                "show"
            );

        }


        currentType =
            null;

        currentId =
            null;

    }


    /* =====================================================
       SAVE EDIT
    ===================================================== */

    function saveEdit() {

        if (
            !currentType ||
            !currentId
        ) {

            return;

        }


        const amount =
            parseFloat(
                document.getElementById(
                    "efEditAmount"
                ).value
            );


        const date =
            document.getElementById(
                "efEditDate"
            ).value;


        const note =
            document.getElementById(
                "efEditNote"
            ).value.trim();


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Please enter a valid amount."
            );

            return;

        }


        if (!date) {

            alert(
                "Please select a date."
            );

            return;

        }


        const data =
            loadData();


        const list =
            currentType === "overtime"
                ? data.overtime
                : data.advances;


        const item =
            list.find(
                function (entry) {

                    return String(
                        entry.id
                    ) === String(
                        currentId
                    );

                }
            );


        if (!item) {

            alert(
                "Entry not found."
            );

            return;

        }


        item.amount =
            amount;


        item.date =
            date;


        item.note =
            note;


        if (
            !item.timestamp
        ) {

            item.timestamp =
                new Date()
                    .toISOString();

        }


        /*
            Convert old overtime format
            to the new direct amount format.
        */

        if (
            currentType === "overtime"
        ) {

            delete item.hours;

            delete item.rate;

        }


        saveData(data);


        closeModal();


        window.location.reload();

    }


    /* =====================================================
       DELETE
    ===================================================== */

    function deleteEntry(
        type,
        id
    ) {

        const data =
            loadData();


        const list =
            type === "overtime"
                ? data.overtime
                : data.advances;


        const index =
            list.findIndex(
                function (item) {

                    return String(
                        item.id
                    ) === String(id);

                }
            );


        if (
            index === -1
        ) {

            alert(
                "Entry not found."
            );

            return;

        }


        const item =
            list[index];


        const amount =
            type === "overtime"
                ? getOvertimeAmount(item)
                : Number(
                    item.amount || 0
                );


        const confirmed =
            confirm(
                "Delete " +
                type +
                " of ₹" +
                amount.toFixed(2) +
                "?"
            );


        if (!confirmed) {

            return;

        }


        list.splice(
            index,
            1
        );


        saveData(data);


        window.location.reload();

    }


    /* =====================================================
       BUTTON INTERCEPTION
    ===================================================== */

    function setupButtonHandling() {

        /*
            CAPTURE PHASE

            This runs before the existing main
            application's click handlers.
        */

        document.addEventListener(
            "click",
            function (event) {

                const target =
                    event.target.closest(
                        "button"
                    );


                if (!target) {

                    return;

                }


                /* -----------------------------------------
                   ADD OVERTIME
                ----------------------------------------- */

                if (
                    target.id ===
                    "addOvertimeBtn"
                ) {

                    event.preventDefault();

                    event.stopPropagation();

                    event.stopImmediatePropagation();

                    addOvertime();

                    return;

                }


                /* -----------------------------------------
                   ADD ADVANCE
                ----------------------------------------- */

                if (
                    target.id ===
                    "addAdvanceBtn"
                ) {

                    event.preventDefault();

                    event.stopPropagation();

                    event.stopImmediatePropagation();

                    addAdvance();

                    return;

                }


                /* -----------------------------------------
                   EDIT / DELETE
                ----------------------------------------- */

                if (
                    target.classList.contains(
                        "edit-btn"
                    ) ||
                    target.classList.contains(
                        "delete-btn"
                    )
                ) {

                    const tbody =
                        target.closest(
                            "tbody"
                        );


                    if (!tbody) {

                        return;

                    }


                    const id =
                        target.dataset.id;


                    if (!id) {

                        return;

                    }


                    let type =
                        null;


                    if (
                        tbody.id ===
                        "overtimeHistory"
                    ) {

                        type =
                            "overtime";

                    }


                    if (
                        tbody.id ===
                        "advanceHistory"
                    ) {

                        type =
                            "advance";

                    }


                    if (!type) {

                        return;

                    }


                    event.preventDefault();

                    event.stopPropagation();

                    event.stopImmediatePropagation();


                    if (
                        target.classList.contains(
                            "edit-btn"
                        )
                    ) {

                        openEdit(
                            type,
                            id
                        );

                    }

                    else {

                        deleteEntry(
                            type,
                            id
                        );

                    }

                }

            },
            true
        );

    }


    /* =====================================================
       HISTORY DISPLAY
    ===================================================== */

    function enhanceHistory(
        tbodyId,
        type
    ) {

        const tbody =
            document.getElementById(
                tbodyId
            );


        if (!tbody) {

            return;

        }


        const data =
            loadData();


        const list =
            type === "overtime"
                ? data.overtime
                : data.advances;


        const rows =
            tbody.querySelectorAll(
                "tr"
            );


        rows.forEach(
            function (row) {

                const buttons =
                    row.querySelectorAll(
                        ".action-btn"
                    );


                if (
                    !buttons.length
                ) {

                    return;

                }


                const id =
                    buttons[0].dataset.id;


                if (!id) {

                    return;

                }


                const item =
                    list.find(
                        function (entry) {

                            return String(
                                entry.id
                            ) === String(id);

                        }
                    );


                if (!item) {

                    return;

                }


                if (
                    row.dataset
                        .efEnhanced ===
                    "yes"
                ) {

                    return;

                }


                const cells =
                    row.querySelectorAll(
                        "td"
                    );


                if (
                    cells.length <
                    4
                ) {

                    return;

                }


                /*
                    DATE
                */

                cells[0].innerHTML =
                    `
                        <span
                            class="ef-custom-date"
                        >
                            ${escapeHTML(
                                formatDate(
                                    getItemDate(item)
                                )
                            )}
                        </span>
                    `;


                /*
                    NOTE
                */

                const noteCell =
                    document.createElement(
                        "td"
                    );


                const note =
                    getItemNote(item);


                if (note) {

                    noteCell.innerHTML =
                        `
                            <span
                                class="ef-history-note"
                                title="${escapeHTML(note)}"
                            >
                                ${escapeHTML(note)}
                            </span>
                        `;

                }

                else {

                    noteCell.innerHTML =
                        `
                            <span
                                class="
                                    ef-history-note
                                    empty
                                "
                            >
                                —
                            </span>
                        `;

                }


                /*
                    Put Note immediately
                    before Actions.
                */

                row.insertBefore(
                    noteCell,
                    cells[
                        cells.length - 1
                    ]
                );


                row.dataset
                    .efEnhanced =
                    "yes";

            }
        );


        /*
            Add "Note" table header.
        */

        const table =
            tbody.closest(
                "table"
            );


        if (!table) {

            return;

        }


        const header =
            table.querySelector(
                "thead tr"
            );


        if (!header) {

            return;

        }


        if (
            !header.querySelector(
                ".ef-note-header"
            )
        ) {

            const th =
                document.createElement(
                    "th"
                );


            th.className =
                "ef-note-header";


            th.textContent =
                "Note";


            const headers =
                header.querySelectorAll(
                    "th"
                );


            header.insertBefore(
                th,
                headers[
                    headers.length - 1
                ]
            );

        }

    }


    function formatDate(
        dateString
    ) {

        if (!dateString) {

            return "—";

        }


        const parts =
            dateString.split("-");


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
       HISTORY OBSERVER
    ===================================================== */

    function setupHistoryObserver() {

        const overtime =
            document.getElementById(
                "overtimeHistory"
            );


        const advance =
            document.getElementById(
                "advanceHistory"
            );


        function update() {

            enhanceHistory(
                "overtimeHistory",
                "overtime"
            );


            enhanceHistory(
                "advanceHistory",
                "advance"
            );

        }


        update();


        if (overtime) {

            const observer1 =
                new MutationObserver(
                    function () {

                        update();

                    }
                );


            observer1.observe(
                overtime,
                {
                    childList: true,
                    subtree: true
                }
            );

        }


        if (advance) {

            const observer2 =
                new MutationObserver(
                    function () {

                        update();

                    }
                );


            observer2.observe(
                advance,
                {
                    childList: true,
                    subtree: true
                }
            );

        }


        /*
            Also check periodically.

            This is intentional because the original
            application redraws its history after
            certain operations.
        */

        setInterval(
            update,
            1000
        );

    }


    /* =====================================================
       KEYBOARD SUPPORT
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeModal();

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        addStyles();

        createExtraFields();

        createModal();

        setupButtonHandling();

        setupHistoryObserver();

    }


    /*
        Wait until the existing application
        has created its cards and inputs.
    */

    function boot() {

        let attempts = 0;


        const timer =
            setInterval(
                function () {

                    attempts++;


                    const overtime =
                        document.getElementById(
                            "overtimeAmount"
                        );


                    const advance =
                        document.getElementById(
                            "advanceAmount"
                        );


                    if (
                        overtime &&
                        advance
                    ) {

                        clearInterval(
                            timer
                        );


                        initialize();

                    }


                    /*
                        Stop after 10 seconds.
                    */

                    if (
                        attempts >= 100
                    ) {

                        clearInterval(
                            timer
                        );

                        console.error(
                            "Entry Features: Could not find salary form."
                        );

                    }

                },
                100
            );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot
        );

    }

    else {

        boot();

    }

})();
