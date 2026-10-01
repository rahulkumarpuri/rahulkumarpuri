
/* =========================================================
   SALARY TRACKER - PRINT RECEIPT
   File: print.js

   This file is completely separate from the main HTML.
   It reads the existing salary data from localStorage
   and generates a PNG receipt.
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       SETTINGS
    ===================================================== */

    const STORAGE_KEY =
        "salaryTrackerData_v1";

    const HOURLY_RATE =
        50;

    const DAILY_SALARY =
        600;

    const DUTY_START_HOUR =
        7;

    const DUTY_END_HOUR =
        19;


    /* =====================================================
       START
    ===================================================== */

    function initializePrintFeature() {

        /*
            Find the existing Reset All Data button.

            The current HTML has:
            .reset-area
        */

        const resetArea =
            document.querySelector(
                ".reset-area"
            );


        if (!resetArea) {

            console.warn(
                "Salary Tracker: .reset-area not found."
            );

            return;

        }


        /*
            Don't create the button twice.
        */

        if (
            document.getElementById(
                "printReceiptBtn"
            )
        ) {

            return;

        }


        /* =================================================
           CREATE PRINT BUTTON
        ================================================= */

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "printReceiptBtn";


        button.type =
            "button";


        button.textContent =
            "🧾 Print Receipt";


        /*
            Inline styling so we don't have to
            modify the main HTML CSS.
        */

        button.style.width =
            "100%";

        button.style.marginTop =
            "10px";

        button.style.padding =
            "11px 14px";

        button.style.border =
            "1px solid #c7d2fe";

        button.style.borderRadius =
            "10px";

        button.style.background =
            "linear-gradient(135deg,#6366f1,#4f46e5)";

        button.style.color =
            "#ffffff";

        button.style.fontFamily =
            "inherit";

        button.style.fontSize =
            "13px";

        button.style.fontWeight =
            "800";

        button.style.cursor =
            "pointer";

        button.style.boxShadow =
            "0 6px 16px rgba(79,70,229,.18)";

        button.style.webkitTapHighlightColor =
            "transparent";


        /*
            Add button just BELOW Reset All Data.
        */

        resetArea.appendChild(
            button
        );


        /* =================================================
           BUTTON CLICK
        ================================================= */

        button.addEventListener(
            "click",
            function () {

                generateReceipt();

            }
        );

    }


    /* =====================================================
       LOAD DATA
    ===================================================== */

    function loadSalaryData() {

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


            if (
                !parsed ||
                typeof parsed !==
                "object"
            ) {

                return {
                    overtime: [],
                    advances: []
                };

            }


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
                "Could not read salary data:",
                error
            );


            return {

                overtime: [],

                advances: []

            };

        }

    }


    /* =====================================================
       MONEY FORMAT
    ===================================================== */

    function money(value) {

        const number =
            Number(value);


        return (
            "₹" +
            (
                Number.isFinite(number)
                    ? number
                    : 0
            ).toFixed(2)
        );

    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(date) {

        if (
            !(date instanceof Date) ||
            isNaN(date.getTime())
        ) {

            return "--";

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
       TIME FORMAT
    ===================================================== */

    function formatTime(date) {

        if (
            !(date instanceof Date) ||
            isNaN(date.getTime())
        ) {

            return "--";

        }


        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    }


    /* =====================================================
       OVERTIME AMOUNT

       Supports:

       New:
       item.amount

       Old:
       item.hours × ₹50
    ===================================================== */

    function getOvertimeAmount(item) {

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
                ) *
                HOURLY_RATE
            );

        }


        return 0;

    }


    /* =====================================================
       DAILY NORMAL EARNING
    ===================================================== */

    function getDailyEarning(date) {

        const now =
            new Date();


        const dateOnly =
            new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );


        const todayOnly =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        /*
            Previous days:
            Full ₹600
        */

        if (
            dateOnly <
            todayOnly
        ) {

            return DAILY_SALARY;

        }


        /*
            Future days:
            ₹0
        */

        if (
            dateOnly >
            todayOnly
        ) {

            return 0;

        }


        /*
            Today
        */

        const start =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                DUTY_START_HOUR,
                0,
                0,
                0
            );


        const end =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                DUTY_END_HOUR,
                0,
                0,
                0
            );


        if (
            now <= start
        ) {

            return 0;

        }


        if (
            now >= end
        ) {

            return DAILY_SALARY;

        }


        const elapsed =
            now.getTime() -
            start.getTime();


        const hours =
            elapsed /
            3600000;


        return Math.min(
            hours *
            HOURLY_RATE,

            DAILY_SALARY
        );

    }


    /* =====================================================
       CURRENT MONTH NORMAL SALARY
    ===================================================== */

    function getNormalSalary() {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            now.getMonth();


        const daysInMonth =
            new Date(
                year,
                month + 1,
                0
            ).getDate();


        let total = 0;


        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            total +=
                getDailyEarning(
                    new Date(
                        year,
                        month,
                        day
                    )
                );

        }


        return total;

    }


    /* =====================================================
       OVERTIME TOTAL
    ===================================================== */

    function getOvertimeTotal(
        overtime
    ) {

        return overtime.reduce(
            function (
                total,
                item
            ) {

                return (
                    total +
                    getOvertimeAmount(
                        item
                    )
                );

            },
            0
        );

    }


    /* =====================================================
       ADVANCE TOTAL
    ===================================================== */

    function getAdvanceTotal(
        advances
    ) {

        return advances.reduce(
            function (
                total,
                item
            ) {

                return (
                    total +
                    Number(
                        item.amount || 0
                    )
                );

            },
            0
        );

    }


    /* =====================================================
       TEXT WRAPPING
    ===================================================== */

    function wrapText(
        ctx,
        text,
        maxWidth
    ) {

        const words =
            String(text).split(" ");


        const lines = [];

        let current =
            "";


        for (
            let i = 0;
            i < words.length;
            i++
        ) {

            const test =
                current
                    ? current +
                      " " +
                      words[i]
                    : words[i];


            const width =
                ctx.measureText(
                    test
                ).width;


            if (
                width >
                maxWidth &&
                current
            ) {

                lines.push(
                    current
                );


                current =
                    words[i];

            }

            else {

                current =
                    test;

            }

        }


        if (current) {

            lines.push(
                current
            );

        }


        return lines;

    }


    /* =====================================================
       ROUNDED RECTANGLE
    ===================================================== */

    function roundedRect(
        ctx,
        x,
        y,
        width,
        height,
        radius
    ) {

        const r =
            Math.min(
                radius,
                width / 2,
                height / 2
            );


        ctx.beginPath();


        ctx.moveTo(
            x + r,
            y
        );


        ctx.lineTo(
            x + width - r,
            y
        );


        ctx.quadraticCurveTo(
            x + width,
            y,
            x + width,
            y + r
        );


        ctx.lineTo(
            x + width,
            y + height - r
        );


        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - r,
            y + height
        );


        ctx.lineTo(
            x + r,
            y + height
        );


        ctx.quadraticCurveTo(
            x,
            y + height,
            x,
            y + height - r
        );


        ctx.lineTo(
            x,
            y + r
        );


        ctx.quadraticCurveTo(
            x,
            y,
            x + r,
            y
        );


        ctx.closePath();

    }


    /* =====================================================
       GENERATE RECEIPT
    ===================================================== */

    function generateReceipt() {

        const data =
            loadSalaryData();


        const normalSalary =
            getNormalSalary();


        const overtimeTotal =
            getOvertimeTotal(
                data.overtime
            );


        const advanceTotal =
            getAdvanceTotal(
                data.advances
            );


        const finalBalance =
            normalSalary +
            overtimeTotal -
            advanceTotal;


        const now =
            new Date();


        const monthName =
            now.toLocaleDateString(
                "en-IN",
                {
                    month: "long",
                    year: "numeric"
                }
            );


        /*
            Sort newest first.
        */

        const overtime =
            data.overtime
                .slice()
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            new Date(
                                b.timestamp
                            ) -
                            new Date(
                                a.timestamp
                            )
                        );

                    }
                );


        const advances =
            data.advances
                .slice()
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            new Date(
                                b.timestamp
                            ) -
                            new Date(
                                a.timestamp
                            )
                        );

                    }
                );


        /* =================================================
           CANVAS SETTINGS
        ================================================= */

        const width =
            900;


        /*
            Dynamic height based on history.
        */

        const overtimeRows =
            Math.max(
                overtime.length,
                1
            );


        const advanceRows =
            Math.max(
                advances.length,
                1
            );


        const height =
            950 +
            (
                overtimeRows *
                55
            ) +
            (
                advanceRows *
                55
            );


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            width;


        canvas.height =
            height;


        const ctx =
            canvas.getContext(
                "2d"
            );


        if (!ctx) {

            alert(
                "Your browser does not support receipt generation."
            );

            return;

        }


        /* =================================================
           BACKGROUND
        ================================================= */

        ctx.fillStyle =
            "#f5f7fb";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        /* =================================================
           MAIN RECEIPT CARD
        ================================================= */

        const margin =
            40;


        const cardWidth =
            width -
            margin * 2;


        ctx.fillStyle =
            "#ffffff";


        roundedRect(
            ctx,
            margin,
            30,
            cardWidth,
            height - 60,
            24
        );


        ctx.fill();


        /* =================================================
           HEADER
        ================================================= */

        let y =
            85;


        ctx.textAlign =
            "center";


        ctx.fillStyle =
            "#172033";


        ctx.font =
            "800 34px Arial";


        ctx.fillText(
            "SALARY RECEIPT",
            width / 2,
            y
        );


        y += 36;


        ctx.fillStyle =
            "#667085";


        ctx.font =
            "500 18px Arial";


        ctx.fillText(
            monthName,
            width / 2,
            y
        );


        y += 28;


        ctx.font =
            "500 14px Arial";


        ctx.fillText(
            "Generated: " +
            formatDate(now) +
            " • " +
            formatTime(now),
            width / 2,
            y
        );


        /* =================================================
           SEPARATOR
        ================================================= */

        y += 30;


        ctx.strokeStyle =
            "#e5e7eb";


        ctx.lineWidth =
            2;


        ctx.beginPath();


        ctx.moveTo(
            margin + 30,
            y
        );


        ctx.lineTo(
            width - margin - 30,
            y
        );


        ctx.stroke();


        /* =================================================
           SUMMARY
        ================================================= */

        y += 45;


        ctx.textAlign =
            "left";


        ctx.fillStyle =
            "#172033";


        ctx.font =
            "800 22px Arial";


        ctx.fillText(
            "Salary Summary",
            margin + 35,
            y
        );


        y += 25;


        const summaryX =
            margin + 35;


        const summaryWidth =
            cardWidth - 70;


        const summaryHeight =
            230;


        ctx.fillStyle =
            "#f8fafc";


        roundedRect(
            ctx,
            summaryX,
            y,
            summaryWidth,
            summaryHeight,
            18
        );


        ctx.fill();


        /* =================================================
           SUMMARY ROWS
        ================================================= */

        const rows = [

            [
                "Normal Salary Earned",
                money(normalSalary)
            ],

            [
                "Total Overtime",
                money(overtimeTotal)
            ],

            [
                "Total Advance",
                money(advanceTotal)
            ],

            [
                "TOTAL SALARY BALANCE",
                money(finalBalance)
            ]

        ];


        let rowY =
            y + 42;


        rows.forEach(
            function (
                row,
                index
            ) {

                ctx.font =
                    index === 3
                        ? "800 18px Arial"
                        : "600 17px Arial";


                ctx.fillStyle =
                    index === 3
                        ? "#15803d"
                        : "#667085";


                ctx.fillText(
                    row[0],
                    summaryX + 25,
                    rowY
                );


                ctx.textAlign =
                    "right";


                ctx.fillStyle =
                    index === 2
                        ? "#dc2626"
                        : index === 1
                            ? "#d97706"
                            : index === 3
                                ? "#15803d"
                                : "#2563eb";


                ctx.font =
                    index === 3
                        ? "800 21px Arial"
                        : "750 18px Arial";


                ctx.fillText(
                    row[1],
                    summaryX +
                    summaryWidth -
                    25,
                    rowY
                );


                ctx.textAlign =
                    "left";


                if (
                    index <
                    rows.length - 1
                ) {

                    ctx.strokeStyle =
                        "#e5e7eb";


                    ctx.lineWidth =
                        1;


                    ctx.beginPath();


                    ctx.moveTo(
                        summaryX + 25,
                        rowY + 17
                    );


                    ctx.lineTo(
                        summaryX +
                        summaryWidth -
                        25,
                        rowY + 17
                    );


                    ctx.stroke();

                }


                rowY += 50;

            }
        );


        y +=
            summaryHeight +
            45;


        /* =================================================
           OVERTIME SECTION
        ================================================== */

        ctx.fillStyle =
            "#172033";


        ctx.font =
            "800 22px Arial";


        ctx.textAlign =
            "left";


        ctx.fillText(
            "Overtime History",
            margin + 35,
            y
        );


        y += 30;


        /* =================================================
           OVERTIME TABLE HEADER
        ================================================== */

        drawTableHeader(
            ctx,
            margin + 35,
            y,
            cardWidth - 70,
            [
                "Date",
                "Time",
                "Amount"
            ]
        );


        y += 42;


        if (
            overtime.length === 0
        ) {

            drawEmptyRow(
                ctx,
                margin + 35,
                y,
                cardWidth - 70,
                "No overtime entries"
            );


            y += 55;

        }

        else {

            overtime.forEach(
                function (
                    item
                ) {

                    const date =
                        new Date(
                            item.timestamp
                        );


                    const amount =
                        getOvertimeAmount(
                            item
                        );


                    drawTableRow(
                        ctx,
                        margin + 35,
                        y,
                        cardWidth - 70,
                        [
                            formatDate(date),
                            formatTime(date),
                            "+" +
                            money(amount)
                        ],
                        "#15803d"
                    );


                    y += 55;

                }
            );

        }


        y += 35;


        /* =================================================
           ADVANCE SECTION
        ================================================== */

        ctx.fillStyle =
            "#172033";


        ctx.font =
            "800 22px Arial";


        ctx.textAlign =
            "left";


        ctx.fillText(
            "Advance History",
            margin + 35,
            y
        );


        y += 30;


        drawTableHeader(
            ctx,
            margin + 35,
            y,
            cardWidth - 70,
            [
                "Date",
                "Time",
                "Amount"
            ]
        );


        y += 42;


        if (
            advances.length === 0
        ) {

            drawEmptyRow(
                ctx,
                margin + 35,
                y,
                cardWidth - 70,
                "No advance entries"
            );


            y += 55;

        }

        else {

            advances.forEach(
                function (
                    item
                ) {

                    const date =
                        new Date(
                            item.timestamp
                        );


                    drawTableRow(
                        ctx,
                        margin + 35,
                        y,
                        cardWidth - 70,
                        [
                            formatDate(date),
                            formatTime(date),
                            "-" +
                            money(
                                item.amount
                            )
                        ],
                        "#dc2626"
                    );


                    y += 55;

                }
            );

        }


        y += 35;


        /* =================================================
           FOOTER
        ================================================== */

        ctx.strokeStyle =
            "#e5e7eb";


        ctx.lineWidth =
            2;


        ctx.beginPath();


        ctx.moveTo(
            margin + 35,
            y
        );


        ctx.lineTo(
            width - margin - 35,
            y
        );


        ctx.stroke();


        y += 35;


        ctx.textAlign =
            "center";


        ctx.fillStyle =
            "#98a2b3";


        ctx.font =
            "500 13px Arial";


        ctx.fillText(
            "Salary Tracker",
            width / 2,
            y
        );


        y += 21;


        ctx.fillText(
            "This receipt was generated from locally stored salary data.",
            width / 2,
            y
        );


        /* =================================================
           DOWNLOAD PNG
        ================================================== */

        canvas.toBlob(
            function (blob) {

                if (!blob) {

                    alert(
                        "Could not create receipt image."
                    );

                    return;

                }


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                const dateString =
                    now
                        .toISOString()
                        .slice(
                            0,
                            10
                        );


                link.href =
                    url;


                link.download =
                    "Salary-Receipt-" +
                    dateString +
                    ".png";


                document.body.appendChild(
                    link
                );


                link.click();


                document.body.removeChild(
                    link
                );


                setTimeout(
                    function () {

                        URL.revokeObjectURL(
                            url
                        );

                    },
                    1000
                );


                /*
                    Small confirmation.
                */

                alert(
                    "Salary receipt saved as PNG image."
                );

            },
            "image/png"
        );

    }


    /* =====================================================
       TABLE HEADER
    ===================================================== */

    function drawTableHeader(
        ctx,
        x,
        y,
        width,
        columns
    ) {

        const column1 =
            x + 15;


        const column2 =
            x + width * 0.55;


        const column3 =
            x + width - 15;


        ctx.fillStyle =
            "#f1f5f9";


        roundedRect(
            ctx,
            x,
            y - 25,
            width,
            40,
            8
        );


        ctx.fill();


        ctx.font =
            "700 14px Arial";


        ctx.fillStyle =
            "#667085";


        ctx.textAlign =
            "left";


        ctx.fillText(
            columns[0],
            column1,
            y
        );


        ctx.textAlign =
            "left";


        ctx.fillText(
            columns[1],
            column2,
            y
        );


        ctx.textAlign =
            "right";


        ctx.fillText(
            columns[2],
            column3,
            y
        );


        ctx.textAlign =
            "left";

    }


    /* =====================================================
       TABLE ROW
    ===================================================== */

    function drawTableRow(
        ctx,
        x,
        y,
        width,
        values,
        amountColor
    ) {

        const column1 =
            x + 15;


        const column2 =
            x + width * 0.55;


        const column3 =
            x + width - 15;


        ctx.strokeStyle =
            "#edf0f4";


        ctx.lineWidth =
            1;


        ctx.beginPath();


        ctx.moveTo(
            x,
            y + 22
        );


        ctx.lineTo(
            x + width,
            y + 22
        );


        ctx.stroke();


        ctx.font =
            "600 14px Arial";


        ctx.fillStyle =
            "#344054";


        ctx.textAlign =
            "left";


        ctx.fillText(
            values[0],
            column1,
            y
        );


        ctx.fillText(
            values[1],
            column2,
            y
        );


        ctx.textAlign =
            "right";


        ctx.fillStyle =
            amountColor;


        ctx.font =
            "750 14px Arial";


        ctx.fillText(
            values[2],
            column3,
            y
        );


        ctx.textAlign =
            "left";

    }


    /* =====================================================
       EMPTY TABLE ROW
    ===================================================== */

    function drawEmptyRow(
        ctx,
        x,
        y,
        width,
        text
    ) {

        ctx.fillStyle =
            "#98a2b3";


        ctx.font =
            "500 14px Arial";


        ctx.textAlign =
            "center";


        ctx.fillText(
            text,
            x + width / 2,
            y
        );


        ctx.textAlign =
            "left";

    }


    /* =====================================================
       INITIALIZE SAFELY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializePrintFeature
        );

    }

    else {

        initializePrintFeature();

    }


})();
