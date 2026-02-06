document.addEventListener("DOMContentLoaded", function () {
  let data = [];
  let currentRows = [];
  let totalChangePercentage = 0;

  const STORAGE_KEY = "fipst_favorites_v1";

  const searchBarForm = document.querySelector(".search-bar");
  const searchInputEl = document.getElementById("search-input");

  const refreshButton = document.querySelector(".refresh-button");

  const topGainersButton = document.querySelector(".button-primary");
  const topLosersButton = document.querySelector(".button-secondary");
  const volumeChangeButton = document.querySelector(".button-tertiary");

  const saveDataButton = document.querySelector("#save-data-button");

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

  // Refresh
  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      location.reload();
    });
  }

  // Back to top button behavior (kept)
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

  // Fetch initial
  fetchDataAndPopulateTable();

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

      if (data.length === 0) {
        setStatus("No data returned");
        console.error("No data returned from API");
        return;
      }

      displayDate(data[0].Date);
      calculateTotalChangePercentage(data);
      calculateAverageVolumeChange(data);

      // Default view: no filters, no sort
      sortKey = null;
      sortDir = "desc";
      showFavoritesOnly = false;
      favoritesOnlyToggle.checked = false;

      applyAllAndRender();

      const now = new Date();
      setStatus(`Updated: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      console.error("Error fetching data:", error.message);
      setStatus("Error loading data");
    }
  }

  function setStatus(text) {
    if (statusIndicator) statusIndicator.textContent = text;
  }

  function displayDate(dateString) {
    const date = new Date(dateString);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const dateContainer = document.getElementById("date-display");
    if (dateContainer) dateContainer.textContent = `Date: ${formattedDate}`;
  }

  function calculateTotalChangePercentage(rows) {
    totalChangePercentage =
      rows.reduce((acc, row) => acc + parseFloat(row["Price change"] || 0), 0) / rows.length;

    const totalChangeContainer = document.getElementById("total-change-container");
    if (totalChangeContainer) {
      totalChangeContainer.textContent = `Average Daily Change: ${totalChangePercentage.toFixed(2)}$`;
    }
  }

  function calculateAverageVolumeChange(rows) {
    const avgVolume =
      rows.reduce((acc, row) => acc + parseFloat(row["Avg Volume"] || 0), 0) / rows.length;

    const averageVolumeChangeContainer = document.getElementById("average-volume-change-container");
    if (averageVolumeChangeContainer) {
      averageVolumeChangeContainer.textContent = `Average Daily Volume: ${avgVolume.toFixed(0)}`;
    }
  }

  // Favorites helpers
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
    applyAllAndRender(); // keep view consistent if "favorites only" is on
  }

  // Apply search + favorites-only + sorting
  function applyAllAndRender() {
    const query = (searchInputEl?.value || "").trim().toUpperCase();
    const favs = loadFavoritesSet();

    let rows = data.slice();

    if (query) {
      rows = rows.filter((row) => (row.Symbol || "").toUpperCase().includes(query));
    }

    if (showFavoritesOnly) {
      rows = rows.filter((row) => favs.has(row.Symbol));
    }

    if (sortKey) {
      rows.sort((a, b) => compareByKey(a, b, sortKey, sortDir));
    }

    currentRows = rows;
    updateTable(currentRows);
    updateSortIndicators();
  }

  function compareByKey(a, b, key, dir) {
    const va = a?.[key];
    const vb = b?.[key];

    // Numeric keys (including percent strings)
    const na = parseNumeric(va);
    const nb = parseNumeric(vb);

    const bothNumeric = Number.isFinite(na) && Number.isFinite(nb);
    let out = 0;

    if (bothNumeric) {
      out = na - nb;
    } else {
      const sa = (va ?? "").toString();
      const sb = (vb ?? "").toString();
      out = sa.localeCompare(sb);
    }

    return dir === "asc" ? out : -out;
  }

  function parseNumeric(v) {
    if (v === null || v === undefined) return NaN;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[%$,]/g, "").trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const symbol = row.Symbol;

      const tableRow = document.createElement("tr");

      // Star cell
      const starCell = document.createElement("td");
      starCell.className = "star-cell";
      const starBtn = document.createElement("button");
      starBtn.type = "button";
      starBtn.className = "star-btn" + (favs.has(symbol) ? " is-on" : "");
      starBtn.textContent = "★";
      starBtn.title = favs.has(symbol) ? "Remove favorite" : "Add favorite";
      starBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleFavorite(symbol);
      });
      starCell.appendChild(starBtn);

      // Symbol cell with Yahoo link
      const symbolCell = document.createElement("td");
      const symbolLink = document.createElement("a");
      symbolLink.textContent = symbol;

      const formattedSymbol = symbol.replace(/-/g, "-P");
      const yahooFinanceURL = `https://finance.yahoo.com/quote/${formattedSymbol}?p=${formattedSymbol}&.tsrc=fin-srch`;

      symbolLink.setAttribute("href", yahooFinanceURL);
      symbolLink.setAttribute("target", "_blank");
      symbolLink.className = "symbol-link";
      symbolCell.appendChild(symbolLink);

      const closeCell = document.createElement("td");
      closeCell.className = "num";
      closeCell.textContent =
        row["Current price"] !== undefined ? (+row["Current price"]).toFixed(2) : "N/A";

      const yesterdayCloseCell = document.createElement("td");
      yesterdayCloseCell.className = "num";
      yesterdayCloseCell.textContent =
        row["Yesterday Close"] !== undefined ? (+row["Yesterday Close"]).toFixed(2) : "N/A";

      const volumeCell = document.createElement("td");
      volumeCell.className = "num";
      volumeCell.textContent =
        row["Avg Volume"] !== undefined ? (+row["Avg Volume"]).toFixed(0) : "N/A";

      const yesterdayVolume = document.createElement("td");
      yesterdayVolume.className = "num";
      yesterdayVolume.textContent =
        row["Yesterday Volume"] !== undefined ? (+row["Yesterday Volume"]).toFixed(0) : "N/A";

      const volumeChangePercentCell = document.createElement("td");
      volumeChangePercentCell.className = "num";
      const volumeChangePercentValue =
        row["Volume Change %"] !== undefined ? (+row["Volume Change %"]).toFixed(2) + "%" : "N/A";
      volumeChangePercentCell.textContent =
        (volumeChangePercentValue.includes("-") ? "" : " ") + volumeChangePercentValue;
      volumeChangePercentCell.classList.add(
        volumeChangePercentValue.includes("-") ? "negative" : "positive"
      );

      const highCell = document.createElement("td");
      highCell.className = "num";
      highCell.textContent = row["High"] !== undefined ? (+row["High"]).toFixed(2) : "N/A";

      const lowCell = document.createElement("td");
      lowCell.className = "num";
      lowCell.textContent = row["Low"] !== undefined ? (+row["Low"]).toFixed(2) : "N/A";

      const changeDollarCell = document.createElement("td");
      changeDollarCell.className = "num";
      const changeDollarNum =
        row["Price change"] !== undefined ? (+row["Price change"]).toFixed(2) : "N/A";
      changeDollarCell.textContent =
        (parseFloat(changeDollarNum) >= 0 ? " " : "") + changeDollarNum + "$";
      changeDollarCell.classList.add(parseFloat(changeDollarNum) >= 0 ? "positive" : "negative");

      const changePercentCell = document.createElement("td");
      changePercentCell.className = "num";
      const changePercentValue =
        row["% change"] !== undefined ? (+row["% change"]).toFixed(2) + "%" : "N/A";
      changePercentCell.textContent =
        (changePercentValue.includes("-") ? "" : " ") + changePercentValue;
      changePercentCell.classList.add(changePercentValue.includes("-") ? "negative" : "positive");

      tableRow.appendChild(starCell);
      tableRow.appendChild(symbolCell);
      tableRow.appendChild(closeCell);
      tableRow.appendChild(yesterdayCloseCell);
      tableRow.appendChild(volumeCell);
      tableRow.appendChild(yesterdayVolume);
      tableRow.appendChild(volumeChangePercentCell);
      tableRow.appendChild(highCell);
      tableRow.appendChild(lowCell);
      tableRow.appendChild(changeDollarCell);
      tableRow.appendChild(changePercentCell);

      tableBody.appendChild(tableRow);
    }
  }

  // Button click behavior (fixed wiring + active state)
  function setActiveButton(btn) {
    [topGainersButton, topLosersButton, volumeChangeButton].forEach((b) => {
      if (!b) return;
      b.classList.toggle("is-active", b === btn);
    });
  }

  function handlePreset(type) {
    if (type === "gainers") {
      sortKey = "% change";
      sortDir = "desc";
      setActiveButton(topGainersButton);
    } else if (type === "losers") {
      sortKey = "% change";
      sortDir = "asc";
      setActiveButton(topLosersButton);
    } else if (type === "volume") {
      sortKey = "Volume Change %";
      sortDir = "desc";
      setActiveButton(volumeChangeButton);
    }
    applyAllAndRender();
  }

  if (topGainersButton) {
    topGainersButton.addEventListener("click", function () {
      handlePreset("gainers");
    });
  } else {
    console.error("Top Gainers button not found");
  }

  if (topLosersButton) {
    topLosersButton.addEventListener("click", function () {
      handlePreset("losers");
    });
  } else {
    console.error("Top Losers button not found");
  }

  if (volumeChangeButton) {
    volumeChangeButton.addEventListener("click", function () {
      handlePreset("volume");
    });
  } else {
    console.error("Volume Change % button not found");
  }

  // Column header sorting
  const headerCells = document.querySelectorAll("#price-table thead th[data-key]");
  headerCells.forEach((th) => {
    th.addEventListener("click", function () {
      const key = th.getAttribute("data-key");
      if (!key) return;

      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = "desc";
      }

      // clear preset active highlight when manual sorting
      setActiveButton(null);
      applyAllAndRender();
    });
  });

  function updateSortIndicators() {
    headerCells.forEach((th) => {
      const key = th.getAttribute("data-key");
      if (!key) return;

      // Remove existing arrow
      th.textContent = th.textContent.replace(/\s[▲▼]$/, "");

      if (key === sortKey) {
        th.textContent = th.textContent + (sortDir === "asc" ? " ▲" : " ▼");
      }
    });
  }

  // Favorites popup open/close
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
        // Set search box to this symbol and apply
        if (searchInputEl) {
          searchInputEl.value = sym;
        }
        closeFavoritesPopup();
        applyAllAndRender();
        window.scrollTo({ top: document.querySelector(".table-container").offsetTop - 10, behavior: "smooth" });
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
    const target = e.target;
    if (favoritesPopup.contains(target) || favoritesButton.contains(target)) return;
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

  // Save data (CSV)
  if (saveDataButton) {
    saveDataButton.addEventListener("click", function () {
      saveData();
    });
  }

  function saveData() {
    const table = document.getElementById("price-table");
    if (!table) return;

    const headers = Array.from(table.querySelectorAll("th")).map((th) => th.textContent.trim());

    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) => {
      return Array.from(row.querySelectorAll("td")).map((td) => {
        // remove commas for cleaner csv cells
        return (td.textContent || "").replace(/,/g, " ");
      });
    });

    const out = [headers, ...rows];
    const csvContent = out.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "table_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
