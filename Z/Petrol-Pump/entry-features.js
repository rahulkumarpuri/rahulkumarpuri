(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY =
        "salaryTrackerData_v1";


    /* =====================================================
       HELPERS
    ===================================================== */

    function getData() {

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


            const data =
                JSON.parse(saved);


            return {

                overtime:
                    Array.isArray(data.overtime)
                        ? data.overtime
                        : [],

                advances:
                    Array.isArray(data.advances)
                        ? data.advances
                        : []

            };

        }

        catch (error) {

            console.error(
                "Entry Features: Could not load data.",
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


    function createId() {

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );

    }


    function getToday() {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        return (
            year +
            "-" +
            month +
            "-" +
            day
        );

    }


    function formatCustomDate(dateString) {

        if (!dateString) {

            return "—";

        }


        const parts =
            String(dateString).split("-");


        if (
            parts.length !== 3
        ) {

            return dateString;

        }


        const year =
            Number(parts[0]);


        const month =
            Number(parts[1]) - 1;


        const day =
            Number(parts[2]);


        const date =
            new Date(
                year,
                month,
                day
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


    function getEntryDate(item) {

        /*
            New entries:
            item.date

            Old entries:
            item.timestamp
        */

        if (
            item &&
            item.date
        ) {

            return item.date;

        }


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
                    ).padStart(
                        2,
                        "0"
                    ) +
                    "-" +
                    String(
                        date.getDate()
                    ).padStart(
                        2,
                        "0"
                    )
                );

            }

        }


        return getToday();

    }


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


    function getOvertimeAmount(item) {

        /*
            New format:
            amount

            Old format:
            hours × 50
        */

        if (
            item &&
            item.amount !==
            undefined
        ) {

            return Number(
                item.amount || 0
            );

        }


        if (
            item &&
            item.hours !==
            undefined
        ) {

            return (
                Number(
                    item.hours || 0
                ) * 50
            );

        }


        return 0;

    }


    /* =====================================================
       CREATE FIELD
    ===================================================== */

    function createField(
        labelText,
        type,
        id,
        placeholder
    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "ef-field";


        const label =
            document.createElement(
                "label"
            );


        label.textContent =
            labelText;


        label.setAttribute(
            "for",
            id
        );


        const input =
            document.createElement(
                "input"
            );


        input.type =
            type;


        input.id =
            id;


        input.placeholder =
            placeholder || "";


        input.className =
            "ef-input";


        wrapper.appendChild(
            label
        );


        wrapper.appendChild(
            input
        );


        return wrapper;

    }


    /* =====================================================
       CREATE NOTE + DATE FIELDS
    ===================================================== */

    function addExtraFields() {

        const overtimeInput =
            document.getElementById(
                "overtimeAmount"
            );


        const advanceInput =
            document.getElementById(
                "advanceAmount"
            );


        if (
            !overtimeInput ||
            !advanceInput
        ) {

            console.warn(
                "Entry Features: Salary inputs not found."
            );

            return;

        }


        /*
            OVERTIME
        */

        const overtimeCard =
            overtimeInput.closest(
                ".form-card"
            );


        if (
            overtimeCard &&
            !document.getElementById(
                "efOvertimeDate"
            )
        ) {

            const dateField =
                createField(
                    "📅 Overtime Date",
                    "date",
                    "efOvertimeDate",
                    ""
                );


            const noteField =
                createField(
                    "📝 Custom Note",
                    "text",
                    "efOvertimeNote",
                    "Example: Sunday extra duty"
                );


            overtimeCard.insertBefore(
                dateField,
                overtimeInput.parentNode
            );


            /*
                Because the existing HTML has
                label + input directly inside the card,
                insertBefore(input) would put things
                in the wrong location.

                We move them to a clean position
                using appendChild below.
            */

            overtimeCard.appendChild(
                dateField
            );


            overtimeCard.appendChild(
                noteField
            );


            document.getElementById(
                "efOvertimeDate"
            ).value =
                getToday();

        }


        /*
            ADVANCE
        */

        const advanceCard =
            advanceInput.closest(
                ".form-card"
            );


        if (
            advanceCard &&
            !document.getElementById(
                "efAdvanceDate"
            )
        ) {

            const dateField =
                createField(
                    "📅 Advance Date",
                    "date",
                    "efAdvanceDate",
                    ""
                );


            const noteField =
                createField(
                    "📝 Custom Note",
                    "text",
                    "efAdvanceNote",
                    "Example: Emergency expense"
                );


            advanceCard.appendChild(
                dateField
            );


            advanceCard.appendChild(
                noteField
            );


            document.getElementById(
                "efAdvanceDate"
            ).value =
                getToday();

        }

    }


    /* =====================================================
       ADD CSS
    ===================================================== */

    function addStyles() {

        if (
            document.getElementById(
                "entryFeaturesStyle"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "entryFeaturesStyle";


        style.textContent = `

            .ef-field {
                width: 100%;
                margin-top: 10px;
            }

            .ef-field label {
                display: block;
                margin-bottom: 7px;
                color: #667085;
                font-size: 12px;
                font-weight: 700;
            }

            .ef-input {
                width: 100%;
                padding: 12px 13px;
                border: 1px solid #d9e0e8;
                border-radius: 10px;
                outline: none;
                background: #ffffff !important;
                color: #172033 !important;
                font-family: inherit;
                font-size: 14px;
                box-sizing: border-box;
            }

            .ef-input:focus {
                border-color: #60a5fa;
                box-shadow:
                    0 0 0 3px
                    rgba(59,130,246,.10);
            }

            .ef-note {
                display: block;
                margin-top: 4px;
                color: #667085;
                font-size: 11px;
                max-width: 220px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .ef-date {
                color: #344054;
                font-weight: 600;
            }

            .ef-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 100000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background:
                    rgba(15,23,42,.48);
                backdrop-filter: blur(5px);
            }

            .ef-modal-overlay.show {
                display: flex;
            }

            .ef-modal {
                width: min(430px, 100%);
                padding: 21px;
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
            }

            .ef-modal-actions {
                display: grid;
                grid-template-columns:
                    1fr 1fr;
                gap: 9px;
                margin-top: 16px;
            }

            .ef-modal-btn {
                padding: 11px;
                border-radius: 10px;
                border: none;
                font-family: inherit;
                font-size: 13px;
                font-weight: 750;
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

            .ef-history-note {
                display: block;
                margin-top: 3px;
                color: #7b8494;
                font-size: 10px;
                max-width: 220px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       CREATE EDIT MODAL
    ===================================================== */

    function createEditModal() {

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

                <h3 id="efModalTitle">
                    Edit Entry
                </h3>


                <div class="ef-field">

                    <label for="efEditAmount">
                        💰 Amount (₹)
                    </label>

                    <input
                        id="efEditAmount"
                        class="ef-input"
                        type="number"
                        min="0"
                        step="0.01"
                        inputmode="decimal"
                    >

                </div>


                <div class="ef-field">

                    <label for="efEditDate">
                        📅 Date
                    </label>

                    <input
                        id="efEditDate"
                        class="ef-input"
                        type="date"
                    >

                </div>


                <div class="ef-field">

                    <label for="efEditNote">
                        📝 Custom Note
                    </label>

                    <input
                        id="efEditNote"
                        class="ef-input"
                        type="text"
                        maxlength="150"
                        placeholder="Add a note..."
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
                closeEditModal
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

                    closeEditModal();

                }

            }
        );

    }


    /* =====================================================
       MODAL STATE
    ===================================================== */

    let editType =
        null;


    let editId =
        null;


    /* =====================================================
       OPEN EDIT
    ===================================================== */

    function openEdit(
        type,
        id
    ) {

        const data =
            getData();


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


        editType =
            type;


        editId =
            item.id;


        const modal =
            document.getElementById(
                "efEditModal"
            );


        const title =
            document.getElementById(
                "efModalTitle"
            );


        const amount =
            document.getElementById(
                "efEditAmount"
            );


        const date =
            document.getElementById(
                "efEditDate"
            );


        const note =
            document.getElementById(
                "efEditNote"
            );


        title.textContent =
            type === "overtime"
                ? "Edit Overtime"
                : "Edit Advance";


        amount.value =
            type === "overtime"
                ? getOvertimeAmount(item)
                : Number(
                    item.amount || 0
                );


        date.value =
            getEntryDate(item);


        note.value =
            getEntryNote(item);


        modal.classList.add(
            "show"
        );


        setTimeout(
            function () {

                amount.focus();

            },
            50
        );

    }


    /* =====================================================
       CLOSE EDIT
    ===================================================== */

    function closeEditModal() {

        const modal =
            document.getElementById(
                "efEditModal"
            );


        if (modal) {

            modal.classList.remove(
                "show"
            );

        }


        editType =
            null;


        editId =
            null;

    }


    /* =====================================================
       SAVE EDIT
    ===================================================== */

    function saveEdit() {

        if (
            !editType ||
            editId === null
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
            getData();


        const list =
            editType === "overtime"
                ? data.overtime
                : data.advances;


        const item =
            list.find(
                function (entry) {

                    return String(
                        entry.id
                    ) === String(editId);

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


        /*
            New entries are no longer
            dependent on timestamp for
            the transaction date.

            Keep timestamp so the existing
            application remains compatible.
        */

        if (
            !item.timestamp
        ) {

            item.timestamp =
                new Date()
                    .toISOString();

        }


        /*
            Convert old overtime records
            to the new amount format.
        */

        if (
            editType ===
            "overtime"
        ) {

            delete item.hours;

            delete item.rate;

        }


        saveData(data);


        closeEditModal();


        /*
            Reload the page so the original
            application's own rendering system
            displays the updated data.

            This means we don't touch the
            original HTML/main JS.
        */

        window.location.reload();

    }


    /* =====================================================
       INTERCEPT ADD BUTTON
    ===================================================== */

    function interceptAddButtons() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "#addOvertimeBtn, #addAdvanceBtn"
                    );


                if (!button) {

                    return;

                }


                /*
                    IMPORTANT:

                    Stop the original button handler.
                */

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


                if (
                    button.id ===
                    "addOvertimeBtn"
                ) {

                    addCustomOvertime();

                }

                else {

                    addCustomAdvance();

                }

            },
            true
        );

    }


    /* =====================================================
       CUSTOM OVERTIME ADD
    ===================================================== */

    function addCustomOvertime() {

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


        const amount =
            parseFloat(
                amountInput.value
            );


        const date =
            dateInput &&
            dateInput.value
                ? dateInput.value
                : getToday();


        const note =
            noteInput
                ? noteInput.value.trim()
                : "";


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


        if (!date) {

            alert(
                "Please select an overtime date."
            );

            return;

        }


        const data =
            getData();


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


        /*
            Clear inputs.
        */

        amountInput.value =
            "";


        if (dateInput) {

            dateInput.value =
                getToday();

        }


        if (noteInput) {

            noteInput.value =
                "";

        }


        window.location.reload();

    }


    /* =====================================================
       CUSTOM ADVANCE ADD
    ===================================================== */

    function addCustomAdvance() {

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


        const amount =
            parseFloat(
                amountInput.value
            );


        const date =
            dateInput &&
            dateInput.value
                ? dateInput.value
                : getToday();


        const note =
            noteInput
                ? noteInput.value.trim()
                : "";


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


        if (!date) {

            alert(
                "Please select an advance date."
            );

            return;

        }


        const data =
            getData();


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


        amountInput.value =
            "";


        if (dateInput) {

            dateInput.value =
                getToday();

        }


        if (noteInput) {

            noteInput.value =
                "";

        }


        window.location.reload();

    }


    /* =====================================================
       INTERCEPT HISTORY EDIT/DELETE
    ===================================================== */

    function interceptHistoryButtons() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".action-btn"
                    );


                if (!button) {

                    return;

                }


                const parentTable =
                    button.closest(
                        "tbody"
                    );


                if (!parentTable) {

                    return;

                }


                const id =
                    button.dataset.id;


                if (!id) {

                    return;

                }


                const isOvertime =
                    parentTable.id ===
                    "overtimeHistory";


                const isAdvance =
                    parentTable.id ===
                    "advanceHistory";


                if (
                    !isOvertime &&
                    !isAdvance
                ) {

                    return;

                }


                /*
                    Stop the original
                    Edit/Delete handlers.
                */

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


                const isEdit =
                    button.classList.contains(
                        "edit-btn"
                    );


                const isDelete =
                    button.classList.contains(
                        "delete-btn"
                    );


                const type =
                    isOvertime
                        ? "overtime"
                        : "advance";


                if (isEdit) {

                    openEdit(
                        type,
                        id
                    );

                }


                if (isDelete) {

                    deleteEntry(
                        type,
                        id
                    );

                }

            },
            true
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    function deleteEntry(
        type,
        id
    ) {

        const data =
            getData();


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


        const label =
            type === "overtime"
                ? "overtime"
                : "advance";


        const confirmed =
            confirm(
                "Delete this " +
                label +
                " entry of ₹" +
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
       PATCH HISTORY DISPLAY

       The existing main JS creates the history
       table after adding/loading data.

       MutationObserver watches for those changes
       and adds our custom date/note information.
    ===================================================== */

    function observeHistory() {

        const overtimeHistory =
            document.getElementById(
                "overtimeHistory"
            );


        const advanceHistory =
            document.getElementById(
                "advanceHistory"
            );


        if (
            overtimeHistory
        ) {

            observeSingleHistory(
                overtimeHistory,
                "overtime"
            );

        }


        if (
            advanceHistory
        ) {

            observeSingleHistory(
                advanceHistory,
                "advance"
            );

        }

    }


    function observeSingleHistory(
        tbody,
        type
    ) {

        function update() {

            const data =
                getData();


            const list =
                type === "overtime"
                    ? data.overtime
                    : data.advances;


            const rows =
                tbody.querySelectorAll(
                    "tr"
                );


            rows.forEach(
                function (
                    row
                ) {

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
                        buttons[0]
                            .dataset
                            .id;


                    if (!id) {

                        return;

                    }


                    const item =
                        list.find(
                            function (
                                entry
                            ) {

                                return String(
                                    entry.id
                                ) === String(id);

                            }
                        );


                    if (!item) {

                        return;

                    }


                    /*
                        Existing table has:

                        Date
                        Time
                        Amount
                        Actions

                        We change it to:

                        Date
                        Time
                        Amount
                        Note
                        Actions
                    */

                    if (
                        row.dataset
                            .efEnhanced ===
                        "true"
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


                    const dateCell =
                        cells[0];


                    const noteCell =
                        document.createElement(
                            "td"
                        );


                    noteCell.className =
                        "ef-note-cell";


                    const note =
                        getEntryNote(
                            item
                        );


                    noteCell.innerHTML =
                        note
                            ? `
                                <span
                                    class="
                                        ef-history-note
                                    "
                                    title="${escapeHtml(note)}"
                                >
                                    ${escapeHtml(note)}
                                </span>
                              `
                            : `
                                <span
                                    class="
                                        ef-history-note
                                    "
                                >
                                    —
                                </span>
                              `;


                    /*
                        Replace the date with
                        the custom transaction date.
                    */

                    dateCell.innerHTML =
                        `
                            <span
                                class="ef-date"
                            >
                                ${escapeHtml(
                                    formatCustomDate(
                                        getEntryDate(item)
                                    )
                                )}
                            </span>
                        `;


                    /*
                        Insert note before Actions.
                    */

                    row.insertBefore(
                        noteCell,
                        cells[
                            cells.length - 1
                        ]
                    );


                    /*
                        Mark as enhanced.
                    */

                    row.dataset
                        .efEnhanced =
                        "true";

                }
            );


            /*
                Add Note header only once.
            */

            const table =
                tbody.closest(
                    "table"
                );


            if (
                !table
            ) {

                return;

            }


            const header =
                table.querySelector(
                    "thead tr"
                );


            if (
                !header
            ) {

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


        /*
            Run once.
        */

        update();


        /*
            Watch future changes.
        */

        const observer =
            new MutationObserver(
                function () {

                    update();

                }
            );


        observer.observe(
            tbody,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(
        value
    ) {

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
       DATE DEFAULT REFRESH
    ===================================================== */

    function setDefaultDates() {

        const today =
            getToday();


        const overtimeDate =
            document.getElementById(
                "efOvertimeDate"
            );


        const advanceDate =
            document.getElementById(
                "efAdvanceDate"
            );


        if (
            overtimeDate &&
            !overtimeDate.value
        ) {

            overtimeDate.value =
                today;

        }


        if (
            advanceDate &&
            !advanceDate.value
        ) {

            advanceDate.value =
                today;

        }

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        addStyles();

        addExtraFields();

        createEditModal();

        setDefaultDates();

        interceptAddButtons();

        interceptHistoryButtons();

        observeHistory();

    }


    /* =====================================================
       WAIT FOR MAIN APP
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                /*
                    Small delay because the
                    existing salary app also
                    initializes on DOMContentLoaded.
                */

                setTimeout(
                    initialize,
                    100
                );

            }
        );

    }

    else {

        setTimeout(
            initialize,
            100
        );

    }


})();
