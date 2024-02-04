document.addEventListener("DOMContentLoaded", function() {
    let data; // Declare data variable

    const searchBarForm = document.querySelector(".search-bar");

    if (!searchBarForm) {
        console.error("Search form not found");
        return;
    }

    fetchDataAndPopulateTable();

    searchBarForm.addEventListener("submit", function(event) {
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

            data = await response.json();

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
        tableBody.innerHTML = "";

        rows.forEach((row) => {
            if (row.Change !== 0) {
                const tableRow = document.createElement("tr");
                const changeClass = row.Change > 0 ? "positive" : "negative";

                tableRow.innerHTML = `
                    <td>${row.Symbol}</td>
                    <td>${(+row["Close*"]).toFixed(2)}</td>
                    <td>${(+row.Volume).toFixed(0)}</td>
                    <td class="${changeClass}">$${(+row.Change).toFixed(2)}</td>
                `;
                tableBody.appendChild(tableRow);
            }
        });
    }

    const topLosersButton = document.querySelector(".button-primary");
    if (topLosersButton) {
        topLosersButton.addEventListener("click", function() {
            handleButtonClick("losers");
        });
    } else {
        console.error("Top Losers button not found");
    }

    const topGainersButton = document.querySelector(".button-secondary");
    if (topGainersButton) {
        topGainersButton.addEventListener("click", function() {
            handleButtonClick("gainers");
        });
    } else {
        console.error("Top Gainers button not found");
    }

    function handleButtonClick(type) {
        console.log(`Button clicked: ${type}`);

        const filteredData =
            type === "losers" ?
            data
            .filter((row) => row.Change < 0)
            .sort((a, b) => a.Change - b.Change) :
            type === "gainers" ?
            data
            .filter((row) => row.Change > 0)
            .sort((a, b) => b.Change - a.Change) :
            data;

        updateTable(filteredData);
    }
});