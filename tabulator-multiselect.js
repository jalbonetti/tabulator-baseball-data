console.log("Tabulator script loaded - basic version!");

// Check if required element exists
var tableElement = document.getElementById('batter-table');
if (!tableElement) {
    console.error("Element 'batter-table' not found!");
} else {
    console.log("Found batter-table element, creating basic table...");
    
    // Create a basic Tabulator table first
    var table1 = new Tabulator("#batter-table", {
        ajaxURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/ModBatterClearances",
        ajaxConfig: {
            method: "GET",
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Content-Type": "application/json"
            }
        },
        layout: "fitColumns",
        columns: [
            {title: "Name", field: "Batter Name", headerFilter: true},
            {title: "Team", field: "Batter Team", headerFilter: true},
            {title: "Prop", field: "Batter Prop Type", headerFilter: true},
            {title: "Value", field: "Batter Prop Value"},
            {title: "Season %", field: "Clearance Season", formatter: function(cell) {
                var value = cell.getValue();
                if (value === null || value === undefined) return "0%";
                return (parseFloat(value) * 100).toFixed(1) + "%";
            }}
        ],
        dataLoaded: function(data) {
            console.log("Basic table loaded with", data.length, "records");
        }
    });
}
