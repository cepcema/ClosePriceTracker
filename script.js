document.addEventListener("DOMContentLoaded", function () {
  let data = [];
  const STORAGE_KEY = "fipst_favorites_v1";

  const searchBarForm = document.querySelector(".search-bar");
  const searchInputEl = document.getElementById("search-input");

  const refreshButton = document.querySelector(".refresh-button");

  // .button-primary = Top Gainers
  // .button-secondary = Top Losers
  const topGainersButton = document.querySelector(".button-primary");
  const topLosersButton = document.querySelector(".button-secondary");
  const volumeChangeButton = document.querySelector(".button-tertiary");

  const saveDataButton = document.getElementById("save-data-button");
  const statusIndicator = document.getElementById("status-indicator");

  // Favorites UI
  const favoritesButton = document.getElementById("favorites-button");
  const favoritesPopup = document.getElementById("favorites-popup");
  const favoritesClose = document.getElementById("favorites-close");
  const favoritesList = document.getElementById("favorites-list");
  const favoritesOnlyToggle = document.getElementById("favorites-only-toggle");
  const favoritesClear = document.getElementById("favorites-clear");

  let showFavoritesOnly = false;

  // Sorting
  let sortKey = null;
  let sortDir = "desc"; // asc | desc

  if (!searchBarForm) {
    console.error("Search form not found");
    return;
  }

  function setStatus(text) {
    if (statusIndicator) statusIndicator.textContent = text;
  }

  // Helper: read value from multiple possible keys (prevents empty cols due to header differences)
  function pick(row, keys, fallback = undefined) {
    for (const k of keys) {
      if (row && row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
    }
    return fallback;
  }

  // Refresh
  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      location.reload();
    });
  }

  // Back to top button
  const mybutton = document.getElementById("myBtn");
  window.onscroll = function () { scrollFunction(); };

  function scrollFunction() {
    if (document.body.scrollTop > 210 || document.documentElement.scrollTop > 210) {
      mybutton.style.display = "block";
    } else {
      mybutton.style.display = "none";
    }
  }

  mybutton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Search: submit + live typing
  searchBarForm.addEventListener("submit", function (event) {
    event.preventDefault();
    applyAllAndRender();
  });

  if (searchInputEl) {
    searchInputEl.addEventListener("input", function () {
      applyAllAndRender();
    });
  }

  // Favorites storage
  function loadFavoritesSet() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function saveFavoritesSet(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.error("Failed saving favorites:", e);
    }
  }

  function toggleFavorite(symbol) {
    const favs = loadFavoritesSet();
    if (favs.has(symbol)) favs.delete(symbol);
    else favs.add(symbol);
    saveFavoritesSet(favs);
    renderFavoritesPopup();
    applyAllAndRender();
  }

  // Popup open/close
  function openFavoritesPopup() {
    favoritesPopup.classList.add("open");
    favoritesPopup.setAttribute("aria-hidden", "false");
    favoritesButton.setAttribute("aria-expanded", "true");
    renderFavoritesPopup();
  }

  function closeFavoritesPopup() {
    favoritesPopup.classList.remove("open");
    favoritesPopup.setAttribute("aria-hidden", "true");
    favoritesButton.setAttribute("aria-expanded", "false");
  }

  function renderFavoritesPopup() {
    const favs = Array.from(loadFavoritesSet()).sort((a, b) => a.localeCompare(b));
    favoritesList.innerHTML = "";

    if (favs.length === 0) {
      const empty = document.createElement("div");
      empty.style.color = "rgba(255,255,255,0.65)";
      empty.style.padding = "8px";
      empty.textContent = "No favorites yet. Click ★ in the table to add.";
      favoritesList.appendChild(empty);
      return;
    }

    favs.forEach((sym) => {
      const item = document.createElement("div");
      item.className = "fav-item";

      const left = document.createElement("div");
      left.className = "fav-symbol";
      left.textContent = sym;

      const right = document.createElement("div");
      right.style.color = "rgba(255,255,255,0.55)";
      right.textContent = "Open";

      item.appendChild(left);
      item.appendChild(right);

      item.addEventListener("click", () => {
        if (searchInputEl) searchInputEl.value = sym;
        closeFavoritesPopup();
        applyAllAndRender();
        const tableTop = document.querySelector(".table-container")?.offsetTop || 0;
        window.scrollTo({ top: Math.max(0, tableTop - 10), behavior: "smooth" });
      });

      favoritesList.appendChild(item);
    });
  }

  favoritesButton.addEventListener("click", function () {
    const isOpen = favoritesPopup.classList.contains("open");
    if (isOpen) closeFavoritesPopup();
    else openFavoritesPopup();
  });

  favoritesClose.addEventListener("click", closeFavoritesPopup);

  document.addEventListener("click", function (e) {
    if (!favoritesPopup.classList.contains("open")) return;
    const t = e.target;
    if (favoritesPopup.contains(t) || favoritesButton.contains(t)) return;
    closeFavoritesPopup();
  });

  favoritesOnlyToggle.addEventListener("change", function () {
    showFavoritesOnly = !!favoritesOnlyToggle.checked;
    applyAllAndRender();
  });

  favoritesClear.addEventListener("click", function () {
    saveFavoritesSet(new Set());
    renderFavoritesPopup();
    applyAllAndRender();
  });

  // Sorting helpers
  function parseNumeric(v) {
    if (v === null || v === undefined) return NaN;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[%$,]/g, "").trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function compareByKey(a, b, key, dir) {
    const va = a?.[key];
    const vb = b?.[key];

    const na = parseNumeric(va);
    const nb = parseNumeric(vb);

    const bothNumeric = Number.isFinite(na) && Number.isFinite(nb);
    let out = 0;

    if (bothNumeric) out = na - nb;
    else out = String(va ?? "").localeCompare(String(vb ?? ""));

    return dir === "asc" ? out : -out;
  }

  // Button active state
  function setActiveButton(btn) {
    [topGainersButton, topLosersButton, volumeChangeButton].forEach((b) => {
      if (!b) return;
      b.classList.toggle("is-active", b === btn);
    });
  }

  function resolvePctKey(row) {
    const keys = ["% change", "% Change", "Price Change %", "Price change %", "%change"];
    for (const k of keys) if (row && row[k] !== undefined) return k;
    return "% change";
  }

  function handlePreset(type) {
    if (!data.length) return;

    if (type === "gainers") {
      sortKey = resolvePctKey(data[0]);
      sortDir = "desc";
      setActiveButton(topGainersButton);
    } else if (type === "losers") {
      sortKey = resolvePctKey(data[0]);
      sortDir = "asc";
      setActiveButton(topLosersButton);
    } else if (type === "volume") {
      sortKey = "Volume Change %";
      sortDir = "desc";
      setActiveButton(volumeChangeButton);
    }

    applyAllAndRender();
  }

  if (topGainersButton) topGainersButton.addEventListener("click", () => handlePreset("gainers"));
  if (topLosersButton) topLosersButton.addEventListener("click", () => handlePreset("losers"));
  if (volumeChangeButton) volumeChangeButton.addEventListener("click", () => handlePreset("volume"));

  // Column header sorting
  const headerCells = document.querySelectorAll("#price-table thead th[data-key]");
  headerCells.forEach((th) => {
    th.addEventListener("click", function () {
      const key = th.getAttribute("data-key");
      if (!key) return;

      if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
      else { sortKey = key; sortDir = "desc"; }

      setActiveButton(null);
      applyAllAndRender();
      updateSortIndicators();
    });
  });

  function updateSortIndicators() {
    headerCells.forEach((th) => {
      const key = th.getAttribute("data-key");
      if (!key) return;

      const base = th.getAttribute("data-label") || th.textContent.replace(/\s[▲▼]$/, "");
      th.setAttribute("data-label", base);
      th.textContent = base + (key === sortKey ? (sortDir === "asc" ? " ▲" : " ▼") : "");
    });
  }

  // Apply search + favorites-only + sorting, then render
  function applyAllAndRender() {
    const query = (searchInputEl?.value || "").trim().toUpperCase();
    const favs = loadFavoritesSet();

    let rows = data.slice();

    if (query) {
      rows = rows.filter((row) => (pick(row, ["Symbol", "symbol"], "")).toUpperCase().includes(query));
    }

    if (showFavoritesOnly) {
      rows = rows.filter((row) => favs.has(pick(row, ["Symbol", "symbol"], "")));
    }

    if (sortKey) rows.sort((a, b) => compareByKey(a, b, sortKey, sortDir));

    updateTable(rows);
    updateSortIndicators();
  }

  function updateTable(rows) {
    const tableBody = document.querySelector("#price-table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!rows || rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 11;
      td.textContent = "No matching results";
      td.style.color = "rgba(255,255,255,0.7)";
      td.style.padding = "16px";
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    const favs = loadFavoritesSet();

    for (const row of rows) {
      const symbol = pick(row, ["Symbol", "symbol"], "");

      const tr = document.createElement("tr");

      // ★ Favorite
      const starTd = document.createElement("td");
      starTd.className = "star-cell";
      const starBtn = document.createElement("button");
      starBtn.type = "button";
      starBtn.className = "star-btn" + (favs.has(symbol) ? " is-on" : "");
      starBtn.textContent = "★";
      starBtn.title = favs.has(symbol) ? "Remove favorite" : "Add favorite";
      starBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleFavorite(symbol);
      });
      starTd.appendChild(starBtn);

      // Symbol link
      const symbolTd = document.createElement("td");
      const a = document.createElement("a");
      a.textContent = symbol;
      const formattedSymbol = symbol.replace(/-/g, "-P");
      a.href = `https://finance.yahoo.com/quote/${formattedSymbol}?p=${formattedSymbol}&.tsrc=fin-srch`;
      a.target = "_blank";
      a.className = "symbol-link";
      symbolTd.appendChild(a);

      // Values
      const currentPrice = pick(row, ["Current price", "Current Price"], undefined);
      const yesterdayClose = pick(row, ["Yesterday Close", "Yesterday close"], undefined);
      const avgVol = pick(row, ["Avg Volume", "Average Volume", "avg volume"], undefined);
      const yVol = pick(row, ["Yesterday Volume", "Yesterday volume"], undefined);
      const volChg = pick(row, ["Volume Change %", "Volume change %"], undefined);
      const high = pick(row, ["High"], undefined);
      const low = pick(row, ["Low"], undefined);
      const priceChg = pick(row, ["Price change", "Price Change"], undefined);
      const pct = pick(row, ["% change", "% Change", "Price Change %", "Price change %", "%change"], undefined);

      tr.appendChild(starTd);
      tr.appendChild(symbolTd);

      tr.appendChild(makeNumTd(currentPrice, 2));
      tr.appendChild(makeNumTd(yesterdayClose, 2));
      tr.appendChild(makeNumTd(avgVol, 0));
      tr.appendChild(makeNumTd(yVol, 0));
      tr.appendChild(makePctTd(volChg));

      tr.appendChild(makeNumTd(high, 2));
      tr.appendChild(makeNumTd(low, 2));

      tr.appendChild(makeDollarTd(priceChg));
      tr.appendChild(makePctTd(pct));

      tableBody.appendChild(tr);
    }
  }

  function makeNumTd(value, decimals) {
    const td = document.createElement("td");
    td.className = "num";
    td.textContent = value === undefined ? "N/A" : (+value).toFixed(decimals);
    return td;
  }

  function makeDollarTd(value) {
    const td = document.createElement("td");
    td.className = "num";
    if (value === undefined) {
      td.textContent = "N/A";
      return td;
    }
    const n = +value;
    td.textContent = (n >= 0 ? " " : "") + n.toFixed(2) + "$";
    td.classList.add(n >= 0 ? "positive" : "negative");
    return td;
  }

  function makePctTd(value) {
    const td = document.createElement("td");
    td.className = "num";
    if (value === undefined) {
      td.textContent = "N/A";
      return td;
    }
    const n = +value;
    td.textContent = (n >= 0 ? " " : "") + n.toFixed(2) + "%";
    td.classList.add(n >= 0 ? "positive" : "negative");
    return td;
  }

  // Save CSV
  if (saveDataButton) {
    saveDataButton.addEventListener("click", function () {
      const table = document.getElementById("price-table");
      if (!table) return;

      const headers = Array.from(table.querySelectorAll("th")).map((th) => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
        Array.from(row.querySelectorAll("td")).map((td) => (td.textContent || "").replace(/,/g, " "))
      );

      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = "table_data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Fetch data
  fetchDataAndPopulateTable();

  async function fetchDataAndPopulateTable() {
    try {
      setStatus("Loading…");

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwpMJg4V_zUHA59avHNnihIT3cSZ1u2L3qnXqtXglgqfEMg3OEVaG06AzzgT050pOeBmw/exec"
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }

      const jsonData = await response.json();
      data = Array.isArray(jsonData) ? jsonData : [];

      if (!data.length) {
        setStatus("No data returned");
        return;
      }

      // Date
      const dateValue = pick(data[0], ["Date", "date"], data[0].Date);
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const dateContainer = document.getElementById("date-display");
        if (dateContainer) dateContainer.textContent = `Date: ${formatted}`;
      }

      // Metrics
      const avgDailyChange =
        data.reduce((acc, row) => acc + parseFloat(pick(row, ["Price change", "Price Change"], 0) || 0), 0) / data.length;

      const avgVol =
        data.reduce((acc, row) => acc + parseFloat(pick(row, ["Avg Volume", "Average Volume", "avg volume"], 0) || 0), 0) / data.length;

      const totalChangeContainer = document.getElementById("total-change-container");
      if (totalChangeContainer) totalChangeContainer.textContent = `Average Daily Change: ${avgDailyChange.toFixed(2)}$`;

      const avgVolContainer = document.getElementById("average-volume-change-container");
      if (avgVolContainer) avgVolContainer.textContent = `Average Daily Volume: ${avgVol.toFixed(0)}`;

      // Render safely + update status
      try {
        applyAllAndRender();
        const now = new Date();
        setStatus(`Updated: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } catch (e) {
        console.error("Render error:", e);
        setStatus("Loaded (render issue)");
      }
    } catch (e) {
      console.error("Error fetching data:", e);
      setStatus("Error loading data");
    }
  }
});
