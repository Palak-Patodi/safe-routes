const OPENCAGE_API_KEY = 'f70c1042f67043818d42e63b5d4a4e9d'; // Replace with your OpenCage API Key

let map;
let routingControl;

document.addEventListener("DOMContentLoaded", function () {
    initMap();
    showLiveLocation();
    loadRecentReports();

    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', submitReport);
    } else {
        console.error("❌ Error: report-form not found in the DOM.");
    }
});

function submitReport(event) {
    event.preventDefault();

    if (!navigator.geolocation) {
        alert("❌ Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const incidentType = document.getElementById('incident-type').value;
        const incidentDescription = document.getElementById('incident-description').value;
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (!incidentType || !incidentDescription) {
            alert("❌ Please fill in all required fields!");
            return;
        }

        // Fetch place name using OpenCage API
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`)
            .then(response => response.json())
            .then(data => {
                const placeName = data.results[0]?.formatted || `Lat: ${latitude}, Lng: ${longitude}`;

                const newReport = {
                    type: incidentType,
                    description: incidentDescription,
                    location: placeName, 
                    latitude: latitude,
                    longitude: longitude,
                    date: new Date().toLocaleString()
                };

                // ❌ DELETE PREVIOUS REPORTS BEFORE ADDING NEW ONE
                localStorage.removeItem("userReports");

                // Store only the new report
                localStorage.setItem("userReports", JSON.stringify([newReport]));

                alert("✅ Report submitted successfully!");
                document.getElementById('report-form').reset();
                loadRecentReports(); // Refresh the list
            })
            .catch(error => {
                console.error("❌ Error fetching location data:", error);
                alert("❌ Failed to get address. Saving coordinates instead.");

                const newReport = {
                    type: incidentType,
                    description: incidentDescription,
                    location: `Lat: ${latitude}, Lng: ${longitude}`, 
                    latitude: latitude,
                    longitude: longitude,
                    date: new Date().toLocaleString()
                };

                localStorage.removeItem("userReports"); // ❌ Delete previous reports
                localStorage.setItem("userReports", JSON.stringify([newReport])); // Store only new report
                loadRecentReports();
            });
    }, error => {
        alert("❌ Location access denied. Please enable location permissions.");
    });
}

 // Attach event listener to the form
 document.getElementById('report-form').addEventListener('submit', submitReport);


 function loadRecentReports() {
    const reportList = document.getElementById('report-list');
    reportList.innerHTML = '';

    // Get reports from localStorage
    const reports = JSON.parse(localStorage.getItem("userReports")) || [];

    reports.forEach(report => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <h3>${report.type}</h3>
            <p><strong>Location:</strong> ${report.location}</p> <!-- Now shows place name -->
            <p><strong>Description:</strong> ${report.description}</p>
            <p><strong>Date:</strong> ${report.date}</p>
        `;
        reportList.appendChild(listItem);
    });
}

// Load reports when the page loads
document.addEventListener("DOMContentLoaded", loadRecentReports);

function initMap() {
    map = L.map('map').setView([28.6139, 77.2090], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true
    }).addTo(map);
}

function showLiveLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;

        map.setView([latitude, longitude], 15);

        if (window.userMarker) {
            map.removeLayer(window.userMarker);
        }

        window.userMarker = L.marker([latitude, longitude]).addTo(map)
            .bindPopup("📍 You are here").openPopup();

        console.log(`Live location updated: ${latitude}, ${longitude}`);
    }, error => {
        alert("Unable to retrieve your location.");
        console.error("Geolocation error:", error);
    }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
    });
}

// 🚨 SOS Button Functionality
function addSOSButton() {
    const sosButton = document.createElement('button');
    sosButton.innerHTML = '🚨 SOS';
    sosButton.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: red;
        color: white;
        border: none;
        padding: 15px 20px;
        font-size: 18px;
        cursor: pointer;
        border-radius: 10px;
        z-index: 1000;
    `;
    sosButton.onclick = sendSOS;
    document.body.appendChild(sosButton);
}

function sendSOS() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            alert('🚨 SOS Alert Sent! Authorities have been notified.');
        }, () => {
            alert('Location access denied! Please enable location services.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// 🚨 Emergency Contacts
function addEmergencyContacts() {
    const contactsDiv = document.createElement('div');
    contactsDiv.innerHTML = `
        <div style="position: fixed; bottom: 80px; right: 20px; z-index: 1000;">
            <button onclick="callPolice()" style="background: blue; color: white; margin-bottom: 5px; padding: 10px;">👮 Call Police</button>
            <button onclick="callFamily()" style="background: green; color: white; padding: 10px;">📞 Call Family</button>
        </div>
    `;
    document.body.appendChild(contactsDiv);
}

function callPolice() {
    window.location.href = 'tel:100'; // Calls police
}

function callFamily() {
    window.location.href = 'tel:+1234567890'; // Calls family
}

// Load Everything on Page Load
document.addEventListener("DOMContentLoaded", function () {
    addSOSButton();
    addEmergencyContacts();
    loadRecentReports();
});
