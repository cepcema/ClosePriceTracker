// buttons.js

document.addEventListener("DOMContentLoaded", function() {
    // Add event listener for the "Top Losers" button
    const topLosersButton = document.querySelector(".button-primary");
    if (topLosersButton) {
        topLosersButton.addEventListener("click", function() {
            handleButtonClick("losers");
        });
    } else {
        console.error("Top Losers button not found");
    }

    // Add event listener for the "Top Gainers" button
    const topGainersButton = document.querySelector(".button-secondary");
    if (topGainersButton) {
        topGainersButton.addEventListener("click", function() {
            handleButtonClick("gainers");
        });
    } else {
        console.error("Top Gainers button not found");
    }

    // Function to handle button click
    function handleButtonClick(type) {
        // You can perform actions based on the button type
        console.log(`Button clicked: ${type}`);

        // Example: Filter and display rows based on the button clicked
        const filteredData =
            type === "losers" ?
            data
            .filter((row) => row.Change < 0)
            .sort((a, b) => a.Change - b.Change) // Sort from lowest to highest
            :
            type === "gainers" ?
            data
            .filter((row) => row.Change > 0)
            .sort((a, b) => b.Change - a.Change) // Sort from lowest to highest
            :
            data;

        // Update the table with the filtered and sorted data
        updateTable(filteredData);
    }
});