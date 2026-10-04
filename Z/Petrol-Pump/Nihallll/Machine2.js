
/* =========================================================
   Machine2.js
   ---------------------------------------------------------
   OPTIONAL MACHINE 2

   Machine 2:
   Nozzle 1 → Diesel
   Nozzle 2 → Diesel

   This module extends the existing petrol pump website.

   IMPORTANT:
   - Machine 1 remains untouched.
   - Machine 2 is completely optional.
   - If Machine 2 is not entered, it contributes ₹0.
   - If Machine 2 is entered, its sale is merged with
     the existing Machine 1 fuel sale.
========================================================= */

(function(){

  "use strict";


  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const M2 = {

    openingKey:
      "pumpMachine2Opening",

    closingKey:
      "pumpMachine2Closing",

    dayKey:
      "pumpMachine2Day",

    uiId:
      "machine2UI",

    dieselRate:
      103.19

  };


  /* =======================================================
     TODAY
  ======================================================= */

  function todayKey(){

    const d =
      new Date();

    const y =
      d.getFullYear();

    const m =
      String(
        d.getMonth() + 1
      ).padStart(2,"0");

    const day =
      String(
        d.getDate()
      ).padStart(2,"0");

    return (
      y + "-" +
      m + "-" +
      day
    );

  }


  /* =======================================================
     STORAGE HELPERS
  ======================================================= */

  function getJSON(
    key,
    fallback
  ){

    try{

      const value =
        localStorage.getItem(
          key
        );


      if(
        value === null
      ){

        return fallback;

      }


      return JSON.parse(
        value
      );

    }
    catch(e){

      return fallback;

    }

  }


  function setJSON(
    key,
    value
  ){

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  }


  /* =======================================================
     DAILY STORAGE
  ======================================================= */

  function ensureDay(){

    const today =
      todayKey();


    const stored =
      localStorage.getItem(
        M2.dayKey
      );


    if(
      stored !== today
    ){

      localStorage.removeItem(
        M2.openingKey
      );

      localStorage.removeItem(
        M2.closingKey
      );

      localStorage.setItem(
        M2.dayKey,
        today
      );

    }

  }


  ensureDay();


  /* =======================================================
     MACHINE 2 DATA
  ======================================================= */

  function emptyReading(){

    return {

      saved:false,

      values:[
        null,
        null
      ]

    };

  }


  function getOpening(){

    return getJSON(
      M2.openingKey,
      emptyReading()
    );

  }


  function setOpening(data){

    setJSON(
      M2.openingKey,
      data
    );

  }


  function getClosing(){

    return getJSON(
      M2.closingKey,
      emptyReading()
    );

  }


  function setClosing(data){

    setJSON(
      M2.closingKey,
      data
    );

  }


  /* =======================================================
     NUMBER / FORMAT
  ======================================================= */

  function num(value){

    const n =
      parseFloat(value);


    return isNaN(n)
      ? 0
      : n;

  }


  function fmt(value){

    const n =
      num(value);


    return n.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:2,
        maximumFractionDigits:2
      }
    );

  }


  /* =======================================================
     DIESEL RATE
     
     Prefer existing global RATES array.
     
     Existing website:
     RATES[1] = Diesel = 103.19
  ======================================================= */

  function getDieselRate(){

    try{

      if(
        typeof RATES !==
        "undefined" &&
        Array.isArray(RATES) &&
        RATES.length > 1 &&
        Number(RATES[1]) > 0
      ){

        return Number(
          RATES[1]
        );

      }

    }
    catch(e){}


    return M2.dieselRate;

  }


  /* =======================================================
     MACHINE 2 STATUS
  ======================================================= */

  function isOpeningSaved(){

    return getOpening().saved === true;

  }


  function isClosingSaved(){

    return getClosing().saved === true;

  }


  function isMachine2Ready(){

    return (
      isOpeningSaved() &&
      isClosingSaved()
    );

  }


  /*
    Machine 2 is considered active only when
    BOTH Opening and Closing are saved.

    If neither exists:
       contribution = ₹0

    If only one exists:
       contribution = ₹0

    This prevents half-entered Machine 2 data
    from accidentally changing today's sale.
  */


  /* =======================================================
     MACHINE 2 SALE
  ======================================================= */

  function calculateMachine2(){

    const opening =
      getOpening();


    const closing =
      getClosing();


    if(
      !opening.saved ||
      !closing.saved
    ){

      return {

        ready:false,

        dieselVolume:0,

        dieselSale:0

      };

    }


    let volume1 =
      num(
        closing.values[0]
      ) -
      num(
        opening.values[0]
      );


    let volume2 =
      num(
        closing.values[1]
      ) -
      num(
        opening.values[1]
      );


    /*
      Prevent negative sale.
    */

    if(volume1 < 0)
      volume1 = 0;


    if(volume2 < 0)
      volume2 = 0;


    const totalVolume =
      volume1 +
      volume2;


    const dieselSale =
      totalVolume *
      getDieselRate();


    return {

      ready:true,

      dieselVolume:
        totalVolume,

      dieselSale:
        dieselSale,

      nozzle1Volume:
        volume1,

      nozzle2Volume:
        volume2

    };

  }


  /* =======================================================
     READ INPUTS
  ======================================================= */

  function readOpening(){

    const values = [];


    for(
      let i=0;
      i<2;
      i++
    ){

      const input =
        document.getElementById(
          "machine2_opening_" + i
        );


      values.push(
        input
          ? num(input.value)
          : 0
      );

    }


    return values;

  }


  function readClosing(){

    const values = [];


    for(
      let i=0;
      i<2;
      i++
    ){

      const input =
        document.getElementById(
          "machine2_closing_" + i
        );


      values.push(
        input
          ? num(input.value)
          : 0
      );

    }


    return values;

  }


  /* =======================================================
     SAVE OPENING
  ======================================================= */

  function saveMachine2Opening(){

    const values =
      readOpening();


    setOpening({

      saved:true,

      values:values

    });


    renderMachine2();


    updateExistingSale();

  }


  /* =======================================================
     UPDATE OPENING
  ======================================================= */

  function updateMachine2Opening(){

    const values =
      readOpening();


    setOpening({

      saved:true,

      values:values

    });


    renderMachine2();


    updateExistingSale();

  }


  /* =======================================================
     SAVE CLOSING
  ======================================================= */

  function saveMachine2Closing(){

    const values =
      readClosing();


    setClosing({

      saved:true,

      values:values

    });


    renderMachine2();


    updateExistingSale();

  }


  /* =======================================================
     UPDATE CLOSING
  ======================================================= */

  function updateMachine2Closing(){

    const values =
      readClosing();


    setClosing({

      saved:true,

      values:values

    });


    renderMachine2();


    updateExistingSale();

  }


  /* =======================================================
     EXPAND / COLLAPSE STATE
  ======================================================= */

  let openingExpanded =
    false;


  let closingExpanded =
    false;


  function toggleOpening(){

    openingExpanded =
      !openingExpanded;


    renderMachine2();

  }


  function toggleClosing(){

    closingExpanded =
      !closingExpanded;


    renderMachine2();

  }


  /* =======================================================
     MACHINE 2 HTML
  ======================================================= */

  function createReadingHTML(
    type
  ){

    const isOpening =
      type === "opening";


    const data =
      isOpening
        ? getOpening()
        : getClosing();


    const expanded =
      isOpening
        ? openingExpanded
        : closingExpanded;


    const label =
      isOpening
        ? "Opening CumVolume"
        : "Closing CumVolume";


    const values =
      data.values || [
        null,
        null
      ];


    let inputs = "";


    for(
      let i=0;
      i<2;
      i++
    ){

      const value =
        values[i] !== null &&
        values[i] !== undefined
          ? values[i]
          : "";


      inputs += `

        <div class="m2-nozzle-box">

          <div class="m2-nozzle-title">

            <span>
              Diesel Nozzle ${i + 1}
            </span>

            <span class="m2-fuel-badge">
              DIESEL
            </span>

          </div>


          <input
            type="number"
            step="0.001"
            id="machine2_${type}_${i}"
            value="${value}"
            placeholder="0.000"
            inputmode="decimal"
          >

        </div>

      `;

    }


    /*
      Not saved yet
    */

    if(
      !data.saved
    ){

      return `

        <div class="m2-card">

          <div class="m2-card-title">

            <div>

              <div class="m2-card-heading">
                ${label}
              </div>

              <div class="m2-card-sub">
                Machine 2 • Optional •
                2 Diesel Nozzles
              </div>

            </div>

          </div>


          <div class="m2-nozzle-grid">

            ${inputs}

          </div>


          <button
            class="m2-save-btn"
            onclick="${
              isOpening
                ? "saveMachine2Opening()"
                : "saveMachine2Closing()"
            }"
          >

            💾 Save ${label}

          </button>

        </div>

      `;

    }


    /*
      Saved / collapsed
    */

    return `

      <div class="m2-card">

        <div
          class="m2-card-header"
          onclick="${
            isOpening
              ? "toggleMachine2Opening()"
              : "toggleMachine2Closing()"
          }"
        >

          <div>

            <div class="m2-card-heading">

              ${label}

              <span class="m2-saved">
                SAVED
              </span>

            </div>

            <div class="m2-card-sub">
              Machine 2 • Diesel
            </div>

          </div>


          <span
            class="m2-arrow ${
              expanded
                ? "open"
                : ""
            }"
          >
            ▸
          </span>

        </div>


        <div
          class="${
            expanded
              ? "m2-card-content"
              : "m2-card-content m2-hidden"
          }"
        >

          <div class="m2-nozzle-grid">

            ${inputs}

          </div>


          <button
            class="m2-save-btn"
            onclick="${
              isOpening
                ? "updateMachine2Opening()"
                : "updateMachine2Closing()"
            }"
          >

            🔄 Update ${label}

          </button>

        </div>

      </div>

    `;

  }


  /* =======================================================
     MACHINE 2 MAIN UI
  ======================================================= */

  function renderMachine2(){

    const container =
      document.getElementById(
        M2.uiId
      );


    if(!container)
      return;


    const opening =
      getOpening();


    const closing =
      getClosing();


    const calc =
      calculateMachine2();


    container.innerHTML = `

      <div class="m2-header">

        <div class="m2-header-icon">
          🛢️
        </div>

        <div class="m2-header-text">

          <div class="m2-title">
            Machine 2
          </div>

          <div class="m2-subtitle">
            Optional • 2 Diesel Nozzles
          </div>

        </div>


        <div class="m2-status">

          ${
            calc.ready
              ? "ACTIVE"
              : "OPTIONAL"
          }

        </div>

      </div>


      <div class="m2-info">

        ℹ️ Machine 2 is optional.
        Leave both readings empty if
        this machine is not being used.

      </div>


      ${createReadingHTML("opening")}

      ${createReadingHTML("closing")}


      ${
        calc.ready
          ? `

            <div class="m2-sale-card">

              <div class="m2-sale-label">
                Machine 2 Diesel Sale
              </div>

              <div class="m2-sale-value">
                ₹ ${fmt(calc.dieselSale)}
              </div>

              <div class="m2-sale-detail">

                ${fmt(calc.dieselVolume)}
                L × ₹ ${fmt(getDieselRate())}

              </div>

            </div>

          `
          : ""

      }

    `;

  }


  /* =======================================================
     EXPOSE FUNCTIONS
     
     Inline onclick attributes need access.
  ======================================================= */

  window.saveMachine2Opening =
    saveMachine2Opening;


  window.updateMachine2Opening =
    updateMachine2Opening;


  window.saveMachine2Closing =
    saveMachine2Closing;


  window.updateMachine2Closing =
    updateMachine2Closing;


  window.toggleMachine2Opening =
    toggleOpening;


  window.toggleMachine2Closing =
    toggleClosing;


  /* =======================================================
     MACHINE 2 CSS
  ======================================================= */

  function injectCSS(){

    if(
      document.getElementById(
        "machine2CSS"
      )
    )
      return;


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "machine2CSS";


    style.textContent = `

      /* =================================================
         MACHINE 2 CONTAINER
      ================================================= */

      #machine2UI{

        margin-top:10px;

      }


      /* =================================================
         HEADER
      ================================================= */

      .m2-header{

        display:flex;

        align-items:center;

        gap:11px;

        padding:13px;

        border-radius:15px;

        background:
          linear-gradient(
            135deg,
            #eff6ff,
            #dbeafe
          );

        border:
          1px solid #bfdbfe;

      }


      .m2-header-icon{

        width:43px;

        height:43px;

        flex-shrink:0;

        display:flex;

        align-items:center;

        justify-content:center;

        border-radius:13px;

        background:
          rgba(255,255,255,.82);

        font-size:23px;

      }


      .m2-header-text{

        flex:1;

        min-width:0;

      }


      .m2-title{

        font-size:.98rem;

        font-weight:900;

        color:#172554;

      }


      .m2-subtitle{

        margin-top:2px;

        font-size:.7rem;

        color:#64748b;

      }


      .m2-status{

        padding:
          5px 8px;

        border-radius:8px;

        background:
          rgba(255,255,255,.8);

        color:#2563eb;

        font-size:.58rem;

        font-weight:900;

        letter-spacing:.5px;

      }


      /* =================================================
         INFO
      ================================================= */

      .m2-info{

        margin-top:8px;

        padding:9px 11px;

        border-radius:11px;

        background:#f8fafc;

        border:
          1px solid #e2e8f0;

        color:#64748b;

        font-size:.7rem;

        line-height:1.45;

      }


      /* =================================================
         READING CARD
      ================================================= */

      .m2-card{

        margin-top:9px;

        border:
          1px solid #e2e8f0;

        border-radius:15px;

        overflow:hidden;

        background:#fff;

      }


      .m2-card-header{

        display:flex;

        align-items:center;

        justify-content:space-between;

        gap:10px;

        padding:12px;

        cursor:pointer;

        background:#fafcff;

      }


      .m2-card-title{

        padding:12px;

      }


      .m2-card-heading{

        font-size:.86rem;

        font-weight:850;

        color:#1e293b;

      }


      .m2-card-sub{

        margin-top:3px;

        font-size:.67rem;

        color:#94a3b8;

      }


      .m2-saved{

        display:inline-block;

        margin-left:5px;

        padding:
          3px 6px;

        border-radius:6px;

        background:#dcfce7;

        color:#15803d;

        font-size:.55rem;

        font-weight:900;

        vertical-align:middle;

      }


      .m2-arrow{

        font-size:18px;

        color:#64748b;

        transition:
          transform .15s;

      }


      .m2-arrow.open{

        transform:
          rotate(90deg);

      }


      .m2-card-content{

        padding:
          0 12px 12px;

      }


      .m2-hidden{

        display:none;

      }


      /* =================================================
         NOZZLES
      ================================================= */

      .m2-nozzle-grid{

        display:grid;

        grid-template-columns:
          1fr 1fr;

        gap:8px;

      }


      .m2-nozzle-box{

        padding:9px;

        border-radius:11px;

        background:#f8fafc;

        border:
          1px solid #e2e8f0;

      }


      .m2-nozzle-title{

        display:flex;

        align-items:center;

        justify-content:space-between;

        gap:5px;

        margin-bottom:6px;

        font-size:.72rem;

        font-weight:800;

        color:#334155;

      }


      .m2-fuel-badge{

        padding:
          3px 5px;

        border-radius:5px;

        background:#dbeafe;

        color:#1d4ed8;

        font-size:.5rem;

        font-weight:900;

      }


      .m2-nozzle-box input{

        width:100%;

        box-sizing:border-box;

        padding:9px;

        border:
          1px solid #cbd5e1;

        border-radius:8px;

        background:#fff;

        outline:none;

        font-size:.82rem;

      }


      .m2-nozzle-box input:focus{

        border-color:#2563eb;

        box-shadow:
          0 0 0 3px
          rgba(37,99,235,.09);

      }


      /* =================================================
         BUTTON
      ================================================= */

      .m2-save-btn{

        width:100%;

        margin-top:9px;

        padding:10px;

        border:0;

        border-radius:10px;

        background:#2563eb;

        color:#fff;

        font-weight:850;

        font-size:.78rem;

        cursor:pointer;

      }


      .m2-save-btn:active{

        transform:
          scale(.98);

      }


      /* =================================================
         SALE CARD
      ================================================= */

      .m2-sale-card{

        margin-top:10px;

        padding:13px;

        border-radius:15px;

        background:
          linear-gradient(
            135deg,
            #ecfdf5,
            #f0fdf4
          );

        border:
          1px solid #bbf7d0;

      }


      .m2-sale-label{

        color:#166534;

        font-size:.7rem;

        font-weight:800;

      }


      .m2-sale-value{

        margin-top:3px;

        color:#15803d;

        font-size:1.2rem;

        font-weight:950;

      }


      .m2-sale-detail{

        margin-top:3px;

        color:#65a30d;

        font-size:.65rem;

      }


      /* =================================================
         MOBILE
      ================================================= */

      @media(max-width:400px){

        .m2-nozzle-grid{

          grid-template-columns:
            1fr;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =======================================================
     INSERT MACHINE 2 INTO EXISTING MENU
  ======================================================= */

  function findMenu(){

    /*
      Your current website uses #pumpMenu.
      Additional fallbacks are included for
      future redesigns.
    */

    return (
      document.getElementById(
        "pumpMenu"
      ) ||

      document.querySelector(
        ".side-menu"
      ) ||

      document.querySelector(
        ".menu-panel"
      ) ||

      document.querySelector(
        ".mobile-menu"
      ) ||

      document.querySelector(
        ".hamburger-menu"
      )

    );

  }


  function findMachine1Container(){

    return (
      document.getElementById(
        "openingSection"
      )?.parentElement ||

      null
    );

  }


  function insertIntoMenu(){

    const menu =
      findMenu();


    if(!menu)
      return;


    let ui =
      document.getElementById(
        M2.uiId
      );


    /*
      Create our container if required.
    */

    if(!ui){

      ui =
        document.createElement(
          "div"
        );


      ui.id =
        M2.uiId;

    }


    /*
      If already inside menu,
      don't move unnecessarily.
    */

    if(
      !menu.contains(ui)
    ){

      /*
        Try to place Machine 2 after
        existing Opening / Closing area.

        Since the original application
        dynamically moves those containers,
        Machine 2 is placed at the end
        of the menu content.
      */

      const content =
        menu.querySelector(
          ".pump-menu-content"
        );


      if(content){

        content.appendChild(
          ui
        );

      }else{

        menu.appendChild(
          ui
        );

      }

    }


    renderMachine2();

  }


  /* =======================================================
     AUTOMATIC MENU RECONNECTION
  ======================================================= */

  const observer =
    new MutationObserver(
      function(){

        insertIntoMenu();

      }
    );


  observer.observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );


  /* =======================================================
     SALE INTEGRATION
  ======================================================= */

  function updateExistingSale(){

    /*
      The original website has calcSale()
      and renderTotals().

      We DO NOT permanently replace Machine 1's
      calculation.

      Instead, we wrap calcSale so Machine 2
      becomes part of the returned sale.

      This keeps:
        - Oil
        - Discount Oil
        - Machine 1
        - Existing UI
        - Short / Excess

      working together.
    */

    if(
      typeof window.calcSale !==
      "function"
    ){

      return;

    }


    /*
      Avoid wrapping multiple times.
    */

    if(
      window.calcSale.__machine2Wrapped
    ){

      /*
        Existing calculation will already
        include Machine 2.

        Just refresh UI.
      */

      if(
        typeof window.renderTotals ===
        "function"
      ){

        window.renderTotals();

      }

      return;

    }


    const originalCalcSale =
      window.calcSale;


    function machine2CalcSale(){

      const base =
        originalCalcSale();


      const machine2 =
        calculateMachine2();


      /*
        If Machine 2 isn't ready,
        return the original result exactly.
      */

      if(
        !machine2.ready
      ){

        return base;

      }


      /*
        Merge Machine 2 Diesel sale
        into existing diesel amount.

        Existing base.sale contains:
          Machine 1 Petrol
          Machine 1 Diesel
          Oil
          Discount Oil (if present)

        So only add Machine 2 Diesel.
      */

      const merged = {

        ...base,

        diesel:
          num(base.diesel) +
          machine2.dieselSale,

        sale:
          num(base.sale) +
          machine2.dieselSale,

        machine2:
          machine2

      };


      return merged;

    }


    machine2CalcSale.__machine2Wrapped =
      true;


    machine2CalcSale.__machine2Original =
      originalCalcSale;


    window.calcSale =
      machine2CalcSale;


    /*
      Refresh existing totals.
    */

    if(
      typeof window.renderTotals ===
      "function"
    ){

      window.renderTotals();

    }

  }


  /* =======================================================
     IMPORTANT:
     calcSale may not exist yet when this
     script executes.
     
     Wait until the existing website has
     finished initializing.
  ======================================================= */

  function trySaleIntegration(){

    if(
      typeof window.calcSale ===
      "function"
    ){

      updateExistingSale();

      return true;

    }

    return false;

  }


  /* =======================================================
     WAIT FOR EXISTING WEBSITE
  ======================================================= */

  let integrationAttempts =
    0;


  const integrationTimer =
    setInterval(
      function(){

        integrationAttempts++;


        const ready =
          trySaleIntegration();


        if(
          ready ||
          integrationAttempts > 40
        ){

          clearInterval(
            integrationTimer
          );

        }

      },
      250
    );


  /* =======================================================
     UPDATE SALE WHEN MACHINE 2 DATA CHANGES
  ======================================================= */

  function refreshAll(){

    renderMachine2();

    updateExistingSale();

  }


  /*
    Expose optional debugging / manual refresh.
  */

  window.refreshMachine2 =
    refreshAll;


  /* =======================================================
     INITIALIZE
  ======================================================= */

  injectCSS();

  renderMachine2();

  insertIntoMenu();


  /* =======================================================
     FINAL DELAYED CONNECTIONS
  ======================================================= */

  setTimeout(
    function(){

      insertIntoMenu();

      trySaleIntegration();

    },
    300
  );


  setTimeout(
    function(){

      insertIntoMenu();

      trySaleIntegration();

    },
    1000
  );


})();
