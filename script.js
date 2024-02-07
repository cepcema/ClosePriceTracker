document.addEventListener("DOMContentLoaded", function () {
  let data; // Declare data variable
  let totalChangePercentage = 0; // New variable to store the total change percentage value

  const searchBarForm = document.querySelector(".search-bar");

  if (!searchBarForm) {
    console.error("Search form not found");
    return;
  }

  fetchDataAndPopulateTable();

  searchBarForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const searchInput = document
      .getElementById("search-input")
      .value.toUpperCase();

    const filteredData = data.filter((row) =>
      row.Symbol.toUpperCase().includes(searchInput)
    );

    updateTable(filteredData);
  });

  async function fetchDataAndPopulateTable() {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwpMJg4V_zUHA59avHNnihIT3cSZ1u2L3qnXqtXglgqfEMg3OEVaG06AzzgT050pOeBmw/exec"
      );

      if (!response.ok) {
        throw new Error(
          `Network response was not ok, status: ${response.status}`
        );
      }

      const jsonData = await response.json();
      data = jsonData; // Assuming the response is already in the correct format
      updateTable(data);
      displayDate(data[0].Date);
      calculateTotalChangePercentage(data); // Calculate total change percentage
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  }

  function displayDate(dateString) {
    const date = new Date(dateString);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const dateContainer = document.getElementById("date-display");
    dateContainer.textContent = `Date: ${formattedDate}`;
  }

  function calculateTotalChangePercentage(data) {
    totalChangePercentage = data.reduce((acc, row) => {
      return acc + parseFloat(row["% change"]);
    }, 0);
    console.log(
      "Total Change Percentage:",
      totalChangePercentage.toFixed(2) + "%"
    );

    const totalChangeContainer = document.getElementById(
      "total-change-container"
    );
    totalChangeContainer.textContent = `Total Daily Change Percentage: ${totalChangePercentage.toFixed(
      2
    )}%`;
  }

  function updateTable(rows) {
    const tableBody = document.querySelector("#price-table tbody");
    tableBody.innerHTML = ""; // Clear previous content

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const symbol = row.Symbol;

      const tableRow = document.createElement("tr");

      const symbolCell = document.createElement("td");
      const symbolLink = document.createElement("a");
      symbolLink.textContent = symbol;
      // Construct the Yahoo Finance URL
      const formattedSymbol = symbol.replace(/-/g, "-P");
      const yahooFinanceURL = `https://finance.yahoo.com/quote/${formattedSymbol}?p=${formattedSymbol}&.tsrc=fin-srch`;
      symbolLink.setAttribute("href", yahooFinanceURL);
      // Open the link in a new tab
      symbolLink.setAttribute("target", "_blank");
      // Style the link to appear like a hyperlink
      symbolLink.style.textDecoration = "underline";
      symbolLink.style.color = "blue";
      // Append the link to the symbol cell
      symbolCell.appendChild(symbolLink);

      const closeCell = document.createElement("td");
      closeCell.textContent =
        row["Current price"] !== undefined
          ? (+row["Current price"]).toFixed(2)
          : "N/A";

      const yesterdayCloseCell = document.createElement("td");
      yesterdayCloseCell.textContent =
        row["Yesterday Close"] !== undefined
          ? (+row["Yesterday Close"]).toFixed(2)
          : "N/A";

      const volumeCell = document.createElement("td");
      volumeCell.textContent =
        row["Avg Volume"] !== undefined
          ? (+row["Avg Volume"]).toFixed(0)
          : "N/A";

      const highCell = document.createElement("td");
      highCell.textContent =
        row["High"] !== undefined ? (+row["High"]).toFixed(2) : "N/A";

      const lowCell = document.createElement("td");
      lowCell.textContent =
        row["Low"] !== undefined ? (+row["Low"]).toFixed(2) : "N/A";

      const changeDollarCell = document.createElement("td");
      const changeDollarValue =
        row["Price change"] !== undefined
          ? (+row["Price change"]).toFixed(2)
          : "N/A";
      changeDollarCell.textContent =
        (changeDollarValue >= 0 ? " " : "") + changeDollarValue + "$";
      changeDollarCell.classList.add(
        changeDollarValue >= 0 ? "positive" : "negative"
      );

      const changePercentCell = document.createElement("td");
      const changePercentValue =
        row["% change"] !== undefined
          ? (+row["% change"]).toFixed(2) + "%"
          : "N/A";
      changePercentCell.textContent =
        (changePercentValue.includes("-") ? "" : " ") + changePercentValue;
      changePercentCell.classList.add(
        changePercentValue.includes("-") ? "negative" : "positive"
      );

      tableRow.appendChild(symbolCell);
      tableRow.appendChild(closeCell);
      tableRow.appendChild(yesterdayCloseCell);
      tableRow.appendChild(volumeCell);
      tableRow.appendChild(highCell);
      tableRow.appendChild(lowCell);
      tableRow.appendChild(changeDollarCell);
      tableRow.appendChild(changePercentCell);

      tableBody.appendChild(tableRow);
    }
  }

  function handleButtonClick(type, sortBy, sortOrder) {
    console.log(`Button clicked: ${type}`);

    let filteredData;

    if (type === "losers") {
      filteredData = data
        .filter((row) => row["% change"] < 0)
        .sort((a, b) => a["% change"] - b["% change"]);
    } else if (type === "gainers") {
      filteredData = data
        .filter((row) => row["% change"] > 0)
        .sort((a, b) => b["% change"] - a["% change"]);
    } else if (type === "sort") {
      if (sortBy === "% change") {
        // Only consider gainers for sorting by "% change"
        filteredData = data
          .filter((row) => row["% change"] > 0)
          .sort((a, b) => {
            const valueA = sortOrder === "asc" ? a[sortBy] : b[sortBy];
            const valueB = sortOrder === "asc" ? b[sortBy] : a[sortBy];
            return valueA - valueB;
          });
      } else {
        // Sort all data based on the specified column
        filteredData = data.slice().sort((a, b) => {
          const valueA = sortOrder === "asc" ? a[sortBy] : b[sortBy];
          const valueB = sortOrder === "asc" ? b[sortBy] : a[sortBy];
          return valueA - valueB;
        });
      }
    } else {
      filteredData = data;
    }

    updateTable(filteredData);
  }

  // Add event listener for the "Top Losers" button
  const topLosersButton = document.querySelector(".button-primary");
  if (topLosersButton) {
    topLosersButton.addEventListener("click", function () {
      handleButtonClick("losers");
    });
  } else {
    console.error("Top Losers button not found");
  }

  // Add event listener for the "Top Gainers" button
  const topGainersButton = document.querySelector(".button-secondary");
  if (topGainersButton) {
    topGainersButton.addEventListener("click", function () {
      handleButtonClick("gainers");
    });
  } else {
    console.error("Top Gainers button not found");
  }

  // Add event listener for the "Save Data" button
  const saveDataButton = document.querySelector("#save-data-button");
  if (saveDataButton) {
    saveDataButton.addEventListener("click", function () {
      saveData();
    });
  } else {
    console.error("Save Data button not found");
  }

  function saveData() {
    const table = document.getElementById("price-table");

    // Get table headers
    const headers = Array.from(table.querySelectorAll("th")).map(
      (th) => th.textContent
    );

    // Get table rows
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) => {
      return Array.from(row.querySelectorAll("td")).map((td) => td.textContent);
    });

    // Combine headers and rows
    const data = [headers, ...rows];

    // Convert to CSV format
    const csvContent = data.map((row) => row.join(",")).join("\n");

    // Create a Blob containing the CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary anchor element to trigger the download
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "table_data.csv";

    // Trigger the download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
