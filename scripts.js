



const OPENCAGE_API_KEY = 'f70c1042f67043818d42e63b5d4a4e9d';

let map;
let routingControl;

document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadRecentReports();
    loadSafetyData();  
    addSOSButton();
    addEmergencyContacts();
    setupFamilyContactModal();
    //aaaaaa
    showLiveLocation();

    const reportForm = document.getElementById("report-form");
    const reportList = document.getElementById("report-list");

    function loadReports() {
        const reports = JSON.parse(localStorage.getItem("userReports")) || [];
        reportList.innerHTML = reports.map(r => `
            <li>
                <h3>${r.type}</h3>
                <p><strong>Location:</strong> ${r.location}</p>
                <p><strong>Description:</strong> ${r.desc}</p>
            </li>
        `).join("");
    }

    reportForm.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent page reload

        const newReport = {
            type: document.getElementById("incident-type").value,
            location: document.getElementById("incident-location").value,
            desc: document.getElementById("incident-description").value
        };

        if (!newReport.type || !newReport.location || !newReport.desc) {
            alert("❌ Please fill all fields!");
            return;
        }

        const reports = JSON.parse(localStorage.getItem("userReports")) || [];
        reports.push(newReport);
        localStorage.setItem("userReports", JSON.stringify(reports));

        alert("✅ Report submitted successfully!");
        reportForm.reset();
        loadReports(); // Update the list instantly
    });

    loadReports(); // Load reports on page load

    
});

function initMap() {
    map = L.map('map').setView([28.6139, 77.2090], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true
    }).addTo(map);
    addPanControls();
}


// function showLiveLocation() {
//     if (!navigator.geolocation) {
//         alert("Geolocation is not supported by your browser.");
//         return;
//     }

//     navigator.geolocation.watchPosition(position => {
//         const { latitude, longitude } = position.coords;

//         map.setView([latitude, longitude], 15);

//         if (window.userMarker) {
//             map.removeLayer(window.userMarker);
//         }

//         window.userMarker = L.marker([latitude, longitude]).addTo(map)
//             .bindPopup("📍 You are here").openPopup();

//         console.log(`Live location updated: ${latitude}, ${longitude}`);
//     }, error => {
//         alert("Unable to retrieve your location.");
//         console.error("Geolocation error:", error);
//     }, {
//         enableHighAccuracy: true,
//         maximumAge: 0,
//         timeout: 5000
//     });
// }

function addPanControls() {
    const panControls = document.createElement('div');
    panControls.innerHTML = `
        <div id="pan-controls" style="position: fixed; bottom: 30px; left: 30px; z-index: 1000; display: flex; flex-direction: column; align-items: center;">
            <button onclick="panMap(0, -0.05)" style="margin-bottom: 5px;">⬅️</button>
            <div style="display: flex;">
                <button onclick="panMap(-0.05, 0)" style="margin-right: 5px;">⬇️</button>
                <button onclick="panMap(0.05, 0)">⬆️</button>
            </div>
            <button onclick="panMap(0, 0.05)" style="margin-top: 5px;">➡️</button>
        </div>
    `;
    document.body.appendChild(panControls);
}

function setupFamilyContactModal() {
    // Create modal elements
    const modalContainer = document.createElement('div');
    modalContainer.id = 'family-contact-modal';
    modalContainer.style = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        justify-content: center;
        align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style = `
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        width: 80%;
        max-width: 400px;
    `;

    modalContent.innerHTML = `
        <h3 style="margin-top: 0;">Enter Emergency Contact</h3>
        <p>Please enter the phone number for your emergency contact.</p>
        <input type="tel" id="emergency-contact-number" placeholder="Phone number with country code" style="width: 100%; padding: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between;">
            <button id="save-contact" style="background: #2980b9; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">Save & Call</button>
            <button id="close-modal" style="background: #95a5a6; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
    `;

    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Event listeners for modal buttons
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('family-contact-modal').style.display = 'none';
    });

    document.getElementById('save-contact').addEventListener('click', () => {
        const phoneNumber = document.getElementById('emergency-contact-number').value;
        if (!phoneNumber) {
            alert('Please enter a valid phone number');
            return;
        }

        // Save to localStorage
        localStorage.setItem('emergencyContact', phoneNumber);
        
        // Clean number and open WhatsApp
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanNumber}?text=Emergency!%20I%20need%20help!`, '_blank');
        
        // Close modal
        document.getElementById('family-contact-modal').style.display = 'none';
    });
}

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
            const userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            alert('SOS Alert Sent! Sending emergency WhatsApp message.');
            sendSOSToEmergencyContact(userLocation);
        }, () => {
            alert('Location access denied! Please enable location services.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function sendSOSToEmergencyContact(location) {
    const savedContact = localStorage.getItem('emergencyContact');
    
    if (!savedContact) {
        alert('No emergency contact saved. Please set one first.');
        return;
    }
    
    const cleanNumber = savedContact.replace(/\D/g, '');
    const mapLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const message = `EMERGENCY! I need help. My location: ${mapLink}`;
    
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
}


function sendSOStoServer(location) {
    fetch('/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
    })
    .then(response => response.json())
    .then(data => console.log(data.message))
    .catch(error => console.error('Error sending SOS to server:', error));
}

// Fix for the SOS email functionality
function sendSOSEmail(location) {
    // Get user email from localStorage if available
    const userEmail = localStorage.getItem('userEmail') || 'palakpatodi06@gmail.com';
    
    // Create a more direct and reliable approach for sending the location
    const subject = 'EMERGENCY SOS ALERT!';
    const body = `EMERGENCY! I need help at this location: 
Latitude: ${location.latitude}
Longitude: ${location.longitude}
Map link: https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

    // URL-encode the parameters
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    // Open the default email client with the pre-filled email
    window.location.href = `mailto:${userEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Also provide a fallback alert with the information in case the email client doesn't open
    alert(`
SOS Alert Triggered!

Your location has been captured:
Latitude: ${location.latitude}
Longitude: ${location.longitude}

A map link has been created. If your email didn't open automatically, 
you can manually copy this map link to share with emergency contacts:
https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}
    `);
}

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
    window.location.href = 'tel:100'; // Emergency number for India
}

function setupFamilyContactModal() {
    // Create modal elements
    const modalContainer = document.createElement('div');
    modalContainer.id = 'family-contact-modal';
    modalContainer.style = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        justify-content: center;
        align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style = `
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        width: 80%;
        max-width: 400px;
    `;

    modalContent.innerHTML = `
        <h3 style="margin-top: 0;">Enter Emergency Contact</h3>
        <p>Please enter the phone number for your emergency contact.</p>
        <input type="tel" id="emergency-contact-number" placeholder="Phone number with country code" style="width: 100%; padding: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between;">
            <button id="save-contact" style="background: #2980b9; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">Save & Call</button>
            <button id="close-modal" style="background: #95a5a6; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
    `;

    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Event listeners for modal buttons
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('family-contact-modal').style.display = 'none';
    });

    document.getElementById('save-contact').addEventListener('click', () => {
        const phoneNumber = document.getElementById('emergency-contact-number').value;
        if (!phoneNumber) {
            alert('Please enter a valid phone number');
            return;
        }

        // Save to localStorage
        localStorage.setItem('emergencyContact', phoneNumber);
        
        // Format the number without any special characters for WhatsApp
        const cleanNumber = phoneNumber.replace(/[+\s\(\)-]/g, '');
        
        // Instead of just opening WhatsApp, initiate a WhatsApp call directly
        initiateWhatsAppCall(cleanNumber);
        
        // Close modal
        document.getElementById('family-contact-modal').style.display = 'none';
    });
}

// New function to initiate a WhatsApp call directly
function initiateWhatsAppCall(phoneNumber) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        window.location.href = `whatsapp://call?phone=${phoneNumber}`;
    } else {
        window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}`, '_blank');
    }
    
    setTimeout(() => {
        alert(`If the WhatsApp call didn't start, manually call ${phoneNumber} in WhatsApp.`);
    }, 3000);
    
}


function callFamily() {
    const savedContact = localStorage.getItem('emergencyContact');
    
    if (savedContact) {
        initiateWhatsAppCall(savedContact);
    } else {
        document.getElementById('family-contact-modal').style.display = 'flex';
    }
}

// Function to move the map in a given direction
function panMap(latOffset, lngOffset) {
    const center = map.getCenter();
    map.setView([center.lat + latOffset, center.lng + lngOffset], map.getZoom());
}

function geocodeAddress(address, callback) {
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                callback([lat, lng]);
            } else {
                alert('Address not found.');
            }
        })
        .catch(error => {
            console.error('Error geocoding address:', error);
            alert('Error geocoding address.');
        });
}

let safetyData = [];

function loadSafetyData() {
    fetch('safety_scores.json')
        .then(response => response.json())
        .then(data => {
            safetyData = data;
            addHotspots(); 
        })
        .catch(error => {
            console.error('Error loading safety data:', error);
        });
}

function addHotspots() {
    safetyData.forEach(entry => {
        const { Latitude, Longitude, safety_score } = entry;
        
        let color;
        if (safety_score > 90) {
            color = '#77DD77'; // Pastel Green
        } else if (safety_score > 80) {
            color = '#B2B27F'; // Pastel Yellow-Green
        } else if (safety_score > 70) {
            color = '#FDFD96'; // Pastel Yellow
        } else if (safety_score > 60) {
            color = '#F6C4C4'; // Pastel Orange
        } else {
            color = '#FFB3B3'; // Pastel Red
        }

        L.circle([Latitude, Longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            radius: 5000 
        }).addTo(map)
        .bindPopup(`<b>Safety Score: ${safety_score.toFixed(2)}</b>`);
    });
}

function getSafetyScore(lat, lng, callback) {
    let closestScore = 0;
    let minDistance = Infinity;

    safetyData.forEach(entry => {
        const distance = Math.sqrt(
            Math.pow(entry.Latitude - lat, 2) + Math.pow(entry.Longitude - lng, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestScore = entry.safety_score;
        }
    });

    callback(closestScore);
}

function findRoute() {
    const start = document.getElementById('start').value;
    const destination = document.getElementById('destination').value;
    const safetyScoresElement = document.getElementById('safety-scores');

    if (start && destination) {
        geocodeAddress(start, startCoords => {
            geocodeAddress(destination, endCoords => {
                routingControl.setWaypoints([
                    L.latLng(startCoords[0], startCoords[1]),
                    L.latLng(endCoords[0], endCoords[1])
                ]);

                getSafetyScore(startCoords[0], startCoords[1], startSafetyScore => {
                    getSafetyScore(endCoords[0], endCoords[1], endSafetyScore => {
                        safetyScoresElement.innerHTML = `Safety Score for Start: ${startSafetyScore.toFixed(2)}<br>Safety Score for Destination: ${endSafetyScore.toFixed(2)}`;
                    });
                });
            });
        });
    } else {
        alert('Please enter both start and destination.');
    }
}
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
///liveeeeeee
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
// let userId = 1;
// function submitReport(event) {
//     event.preventDefault();
    
//     const incidentType = document.getElementById('incident-type').value;
//     const incidentLocation = document.getElementById('incident-location').value;
//     const incidentDescription = document.getElementById('incident-description').value;

//     if (incidentType && incidentLocation && incidentDescription) {
//         fetch('http://127.0.0.1:5000/report', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 user_id: userId,  
//                 type: incidentType,
//                 location: incidentLocation,
//                 description: incidentDescription
//             })
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 alert('Report submitted successfully.');
//                 document.getElementById('report-form').reset();
//                 loadRecentReports(); 
//                 userId+=1;
//             } else {
//                 alert(`Failed to submit report: ${data.message}`);
//             }
//         })
//         .catch(error => {
//             console.error('Error submitting report:', error);
//             alert('Error submitting report.');
//         });
//     } else {
//         alert('Please fill in all fields.');
//     }
// }

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
//  loadRecentReports() {
//     fetch('http://127.0.0.1:5000/reports')
//         .then(response => response.json())
//      function   .then(data => {
//             const reportList = document.getElementById('report-list');
//             reportList.innerHTML = '';

//             data.reports.forEach(report => {
//                 const listItem = document.createElement('li');
//                 listItem.innerHTML = `
//                     <h3>${report.type}</h3>
//                     <p><strong>Location:</strong> ${report.location}</p>
//                     <p><strong>Description:</strong> ${report.description}</p>
//                     <p><strong>Date:</strong> ${new Date(report.report_date).toLocaleDateString()}</p>
//                 `;
//                 reportList.appendChild(listItem);
//             });
//         })
//         .catch(error => {
//             console.error('Error loading reports:', error);
//         });
// }

document.getElementById('find-route-btn').addEventListener('click', findRoute);
document.getElementById('report-form').addEventListener('submit', submitReport);

window.onload = function() {
    initMap();
    loadRecentReports();
};
