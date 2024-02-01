document.addEventListener("DOMContentLoaded", function() {
    // Function to fetch data from the API
    async function fetchData() {
        try {
            const response = await fetch(
                "https://closepricetracker-784fa7ae3975.herokuapp.com/"
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Function to update the table with fetched data
    async function updateTable() {
        const data = await fetchData();

        // Check if data is available
        if (data && data.length > 0) {
            const tableBody = document.querySelector(".dividend-history-table tbody");

            // Clear existing rows
            tableBody.innerHTML = "";

            // Loop through the data and populate the table
            data.forEach((row) => {
                // Check if 'Change' is not equal to 0
                if (row.Change !== 0) {
                    const newRow = tableBody.insertRow();

                    // Assuming the API response has 'Symbol', 'Close*', 'Volume', 'Change' properties
                    const cellSymbol = newRow.insertCell(0);
                    cellSymbol.textContent = row.Symbol;

                    // Check if 'Close*' property exists and is not null or undefined
                    const cellClose = newRow.insertCell(1);
                    if (
                        "Close*" in row &&
                        row["Close*"] !== null &&
                        row["Close*"] !== undefined
                    ) {
                        // Remove asterisk (*) from 'Close*' and trim any extra whitespaces
                        cellClose.textContent = String(row["Close*"])
                            .replace("*", "")
                            .trim();
                    } else {
                        cellClose.textContent = ""; // Handle case when 'Close*' is not present or is null/undefined
                    }

                    const cellVolume = newRow.insertCell(2);
                    cellVolume.textContent = row.Volume;

                    const cellChange = newRow.insertCell(3);
                    cellChange.textContent = row.Change;
                }
            });
        }
    }

    // Call the updateTable function to initially populate the table
    updateTable();

    // Add event listener to update the table when the search form is submitted
    const searchForm = document.querySelector(".search-bar");
    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();
        updateTable();
    });
});