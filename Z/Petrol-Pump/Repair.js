<script>

/* =========================================================
   COLLECTION DISPLAY REPAIR
   ---------------------------------------------------------
   Fixes:
   1. Manual/custom Collection entries are saved but invisible.
   2. Keeps existing calculations/storage.
   3. Does NOT use MutationObserver.
   4. Does NOT continuously modify the page.
   5. Safe with existing Collection system.
========================================================= */

(function(){

  "use strict";


  /* =======================================================
     STORAGE
  ======================================================= */

  const COLLECTION_KEY =
    "pumpCollections";


  /* =======================================================
     SAFE STORAGE READ
  ======================================================= */

  function getCollectionsSafe(){

    try{

      const raw =
        localStorage.getItem(
          COLLECTION_KEY
        );


      if(!raw)
        return [];


      const data =
        JSON.parse(raw);


      return Array.isArray(data)
        ? data
        : [];

    }
    catch(error){

      console.warn(
        "Collection read error:",
        error
      );

      return [];

    }

  }


  /* =======================================================
     FORMAT MONEY
  ======================================================= */

  function money(value){

    const n =
      Number(value) || 0;


    return n.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:2,
        maximumFractionDigits:2
      }
    );

  }


  /* =======================================================
     FORMAT TIME
  ======================================================= */

  function formatTime(value){

    if(!value)
      return "";


    const d =
      new Date(value);


    if(
      isNaN(
        d.getTime()
      )
    ){

      return "";

    }


    return d.toLocaleTimeString(
      "en-IN",
      {
        hour:"2-digit",
        minute:"2-digit"
      }
    );

  }


  /* =======================================================
     HTML ESCAPE
  ======================================================= */

  function escapeHTML(value){

    return String(
      value == null
        ? ""
        : value
    )
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

  }


  /* =======================================================
     GET TAGS
  ======================================================= */

  function getTagsSafe(){

    try{

      const raw =
        localStorage.getItem(
          "pumpTags"
        );


      if(!raw)
        return [];


      const data =
        JSON.parse(raw);


      return Array.isArray(data)
        ? data
        : [];

    }
    catch(e){

      return [];

    }

  }


  /* =======================================================
     FIND COLLECTION CONTAINER
  ======================================================= */

  function getContainer(){

    return document.getElementById(
      "tagsList"
    );

  }


  /* =======================================================
     RENDER MANUAL COLLECTIONS
  ======================================================= */

  function renderCollectionsFallback(){

    const container =
      getContainer();


    if(!container)
      return;


    const collections =
      getCollectionsSafe();


    /*
      Nothing saved.
    */

    if(
      collections.length === 0
    ){

      container.innerHTML = `

        <div class="result sub"
             style="margin-top:8px">

          No entries yet.

        </div>

      `;

      updateCollectedFallback();

      return;

    }


    /* -----------------------------------------------
       Group entries by tag
    ------------------------------------------------ */

    const groups = {};


    collections.forEach(
      function(entry){

        const tag =
          String(
            entry.tag ||
            "Other"
          );


        if(
          !groups[tag]
        ){

          groups[tag] = [];

        }


        groups[tag].push(
          entry
        );

      }
    );


    /* -----------------------------------------------
       Render
    ------------------------------------------------ */

    const tags =
      Object.keys(
        groups
      );


    container.innerHTML =
      tags.map(
        function(tag){

          const entries =
            groups[tag];


          const total =
            entries.reduce(
              function(sum,entry){

                return (
                  sum +
                  (
                    Number(
                      entry.amount
                    ) || 0
                  )
                );

              },
              0
            );


          return `

            <div
              class="tag-row"
              data-repair-tag="${escapeHTML(tag)}"
            >

              <div
                class="tag-header"
                data-repair-toggle="${escapeHTML(tag)}"
              >

                <span>

                  ${escapeHTML(tag)}

                  ₹ ${money(total)}

                </span>

                <span class="arrow">
                  ▸
                </span>

              </div>


              <div
                class="tag-body hidden"
                data-repair-body="${escapeHTML(tag)}"
              >

                ${entries.map(
                  function(entry){

                    return `

                      <div
                        class="entry-row"
                      >

                        <div class="entry-left">

                          ₹ ${money(
                            entry.amount
                          )}

                          <span
                            class="entry-time"
                          >
                            ${formatTime(
                              entry.time
                            )}
                          </span>

                        </div>


                        <div
                          class="entry-icons"
                        >

                          <span
                            title="Edit"
                            data-repair-edit="${escapeHTML(entry.id)}"
                          >
                            ✏️
                          </span>


                          <span
                            title="Delete"
                            data-repair-delete="${escapeHTML(entry.id)}"
                          >
                            🗑️
                          </span>

                        </div>

                      </div>

                    `;

                  }
                ).join("")}

              </div>

            </div>

          `;

        }
      ).join("");


    installCollectionEvents();


    updateCollectedFallback();

  }


  /* =======================================================
     UPDATE COLLECTED DISPLAY
  ======================================================= */

  function updateCollectedFallback(){

    const collectedElement =
      document.getElementById(
        "collected"
      );


    if(!collectedElement)
      return;


    const collections =
      getCollectionsSafe();


    let total =
      collections.reduce(
        function(sum,entry){

          return (
            sum +
            (
              Number(
                entry.amount
              ) || 0
            )
          );

        },
        0
      );


    /*
      Preserve existing Testing logic.
    */

    try{

      if(
        typeof getTesting ===
        "function" &&
        typeof TESTING_AMOUNT !==
        "undefined"
      ){

        if(
          getTesting()
        ){

          total +=
            Number(
              TESTING_AMOUNT
            ) || 0;

        }

      }

    }
    catch(e){}


    collectedElement.textContent =
      money(total);

  }


  /* =======================================================
     TOGGLE TAG
  ======================================================= */

  function toggleTag(tag){

    const body =
      document.querySelector(
        `[data-repair-body="${CSS.escape(tag)}"]`
      );


    const header =
      document.querySelector(
        `[data-repair-toggle="${CSS.escape(tag)}"]`
      );


    if(!body)
      return;


    body.classList.toggle(
      "hidden"
    );


    if(header){

      const arrow =
        header.querySelector(
          ".arrow"
        );


      if(arrow){

        arrow.classList.toggle(
          "open"
        );

      }

    }

  }


  /* =======================================================
     EDIT COLLECTION
  ======================================================= */

  function editCollection(id){

    const collections =
      getCollectionsSafe();


    const entry =
      collections.find(
        function(item){

          return item.id === id;

        }
      );


    if(!entry)
      return;


    const amount =
      prompt(
        "Enter amount:",
        entry.amount
      );


    if(
      amount === null
    )
      return;


    const parsedAmount =
      parseFloat(
        amount
      );


    if(
      !isFinite(
        parsedAmount
      ) ||
      parsedAmount <= 0
    ){

      alert(
        "Please enter a valid amount."
      );

      return;

    }


    const heading =
      prompt(
        "Enter heading / tag:",
        entry.tag
      );


    if(
      heading === null
    )
      return;


    const tag =
      heading.trim();


    if(!tag){

      alert(
        "Heading cannot be empty."
      );

      return;

    }


    entry.amount =
      parsedAmount;


    entry.tag =
      tag;


    localStorage.setItem(
      COLLECTION_KEY,
      JSON.stringify(
        collections
      )
    );


    refreshCollections();

  }


  /* =======================================================
     DELETE COLLECTION
  ======================================================= */

  function deleteCollection(id){

    const collections =
      getCollectionsSafe();


    const entry =
      collections.find(
        function(item){

          return item.id === id;

        }
      );


    if(!entry)
      return;


    if(
      !confirm(
        "Delete this entry?\n\n" +
        entry.tag +
        " — ₹ " +
        money(entry.amount)
      )
    ){

      return;

    }


    const updated =
      collections.filter(
        function(item){

          return item.id !== id;

        }
      );


    localStorage.setItem(
      COLLECTION_KEY,
      JSON.stringify(
        updated
      )
    );


    refreshCollections();

  }


  /* =======================================================
     EVENT HANDLERS
  ======================================================= */

  function installCollectionEvents(){

    const container =
      getContainer();


    if(!container)
      return;


    container.onclick =
      function(e){

        const toggle =
          e.target.closest(
            "[data-repair-toggle]"
          );


        if(toggle){

          toggleTag(
            toggle.getAttribute(
              "data-repair-toggle"
            )
          );

          return;

        }


        const edit =
          e.target.closest(
            "[data-repair-edit]"
          );


        if(edit){

          editCollection(
            edit.getAttribute(
              "data-repair-edit"
            )
          );

          return;

        }


        const del =
          e.target.closest(
            "[data-repair-delete]"
          );


        if(del){

          deleteCollection(
            del.getAttribute(
              "data-repair-delete"
            )
          );

        }

      };

  }


  /* =======================================================
     REFRESH COLLECTION DISPLAY
  ======================================================= */

  function refreshCollections(){

    /*
      IMPORTANT:

      If the original website has its own
      renderTagsList(), let it render first.

      Otherwise use our fallback renderer.
    */

    try{

      if(
        typeof window.renderTagsList ===
        "function"
      ){

        window.renderTagsList();

      }

    }
    catch(error){

      console.warn(
        "Original collection renderer failed:",
        error
      );

    }


    /*
      Small delay allows original renderer
      to finish before we verify the result.
    */

    setTimeout(
      function(){

        const container =
          getContainer();


        if(!container)
          return;


        const collections =
          getCollectionsSafe();


        /*
          If saved entries exist but the original
          renderer didn't actually put them on screen,
          use fallback renderer.
        */

        if(
          collections.length > 0 &&
          container.textContent.trim()
            .toLowerCase()
            .includes(
              "no entries yet"
            )
        ){

          renderCollectionsFallback();

        }


        updateCollectedFallback();

      },
      30
    );

  }


  /* =======================================================
     WATCH ADD ENTRY
     ======================================================= */

  document.addEventListener(
    "click",
    function(e){

      /*
        Existing Add Entry button.
      */

      const addButton =
        e.target.closest(
          "#addEntryBtn"
        );


      if(addButton){

        /*
          Do nothing here.
          Existing code handles opening
          the form.
        */

        return;

      }


      /*
        Existing Add button inside form.

        IMPORTANT:
        We only refresh AFTER the original
        function has executed.
      */

      const add =
        e.target.closest(
          "#addForm .btn"
        );


      if(add){

        setTimeout(
          refreshCollections,
          40
        );


        setTimeout(
          refreshCollections,
          200
        );

      }

    },
    false
  );


  /* =======================================================
     WATCH ENTER KEY IN ADD FORM
  ======================================================= */

  document.addEventListener(
    "keydown",
    function(e){

      if(
        e.key !== "Enter"
      )
        return;


      const amount =
        document.getElementById(
          "entryAmount"
        );


      const tag =
        document.getElementById(
          "entryTag"
        );


      if(
        e.target !== amount &&
        e.target !== tag
      ){

        return;

      }


      setTimeout(
        refreshCollections,
        50
      );

    }
  );


  /* =======================================================
     SAFE PERIODIC CHECK
     
     NOT a MutationObserver.
     
     Only checks every 2 seconds.
     It does NOT rewrite the DOM unless
     necessary.
  ======================================================= */

  let lastSignature =
    "";


  function checkCollections(){

    const collections =
      getCollectionsSafe();


    const signature =
      collections.map(
        function(e){

          return (
            e.id +
            "|" +
            e.amount +
            "|" +
            e.tag
          );

        }
      ).join("||");


    if(
      signature !==
      lastSignature
    ){

      lastSignature =
        signature;


      refreshCollections();

    }

  }


  /* =======================================================
     INITIAL
  ======================================================= */

  setTimeout(
    function(){

      refreshCollections();

      checkCollections();

    },
    300
  );


  /* =======================================================
     PERIODIC STORAGE CHECK
  ======================================================= */

  setInterval(
    checkCollections,
    2000
  );


})();

</script>
