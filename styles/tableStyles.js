// Add this to your existing tableStyles.js file, in the style.textContent string:

/* Ensure matchups table is visible */
#matchups-table {
    width: 100% !important;
    min-height: 200px !important;
    display: block !important;
    visibility: visible !important;
}

#matchups-table .tabulator-table {
    display: table !important;
    width: 100% !important;
}

#matchups-table .tabulator-tableHolder {
    overflow: auto !important;
    max-height: none !important;
}

/* Ensure table0 container is properly displayed */
#table0-container {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
}

#table0-container.active-table {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
}
