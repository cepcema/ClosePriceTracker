document.addEventListener("DOMContentLoaded", function () {
  let data; // Declare data variable

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
        "https://closepricetracker-784fa7ae3975.herokuapp.com/"
      );

      if (!response.ok) {
        throw new Error(
          `Network response was not ok, status: ${response.status}`
        );
      }

      const jsonData = await response.json();
      data = removeDuplicates(jsonData, "Symbol"); // Remove duplicates based on Symbol
      updateTable(data);
      displayDate(data[0].Date);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  }

  function displayDate(date) {
    const dateContainer = document.getElementById("date-display");
    dateContainer.textContent = `Date: ${date}`;
  }

  function updateTable(rows) {
    const tableBody = document.querySelector("#price-table tbody");
    tableBody.innerHTML = ""; // Clear previous content

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const symbol = row.Symbol;

      const tableRow = document.createElement("tr");
      const changeClass = row.Change > 0 ? "positive" : "negative";

      // Create a hyperlink around the symbol that leads to Yahoo Finance
      const symbolLink = document.createElement("a");
      symbolLink.href = `https://finance.yahoo.com/quote/${symbol}?p=${symbol}&.tsrc=fin-srch`;
      symbolLink.textContent = symbol;

      const symbolCell = document.createElement("td");
      symbolCell.appendChild(symbolLink);

      const closeCell = document.createElement("td");
      closeCell.textContent = (+row["Close*"]).toFixed(2);

      const volumeCell = document.createElement("td");
      // Handle NaN or missing volume by displaying 0
      volumeCell.textContent = isNaN(row.Volume)
        ? "0"
        : (+row.Volume).toFixed(0);

      const highCell = document.createElement("td");
      highCell.textContent = isNaN(row.High) ? "0" : (+row.High).toFixed(2);

      const lowCell = document.createElement("td");
      lowCell.textContent = isNaN(row.Low) ? "0" : (+row.Low).toFixed(2);

      const changeCell = document.createElement("td");
      changeCell.textContent = `$${(+row.Change).toFixed(2)}`;
      changeCell.classList.add(changeClass);

      tableRow.appendChild(symbolCell);
      tableRow.appendChild(closeCell);
      tableRow.appendChild(volumeCell);
      tableRow.appendChild(highCell);
      tableRow.appendChild(lowCell);
      tableRow.appendChild(changeCell);

      tableBody.appendChild(tableRow);
    }
  }

  // Function to remove duplicates from array of objects based on a key
  function removeDuplicates(array, key) {
    return array.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t[key] === item[key])
    );
  }

  // Function to handle button click
  function handleButtonClick(type) {
    console.log(`Button clicked: ${type}`);

    const filteredData =
      type === "losers"
        ? data
            .filter((row) => row.Change < 0)
            .sort((a, b) => a.Change - b.Change)
        : type === "gainers"
        ? data
            .filter((row) => row.Change > 0)
            .sort((a, b) => b.Change - a.Change)
        : data;

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
});
