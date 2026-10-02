// ================= DARK MODE =================

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeBtn.textContent = "☀️";
    } else {
        themeBtn.textContent = "🌙";
    }

});


// ================= NOTIFICATIONS =================

const notificationBtn = document.getElementById("notificationBtn");

notificationBtn.addEventListener("click", async () => {

    if (!("Notification" in window)) {
        alert("Your browser does not support notifications.");
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        notificationBtn.textContent = "🔔 Notifications Enabled";

        new Notification("SafeLoad", {
            body: "Notifications are now enabled."
        });
    } else {
        notificationBtn.textContent = "🔕 Notifications Blocked";
    }

});


function sendNotification(title, message, status) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        const lastStatus = localStorage.getItem("lastNotificationStatus");

        if (lastStatus === status) {
            return;
        }

        new Notification(title, {
            body: message
        });

        localStorage.setItem(
            "lastNotificationStatus",
            status
        );
    }
}


// ================= BACK TO TOP =================

const topBtn = document.getElementById("topBtn");

window.addEventListener("scroll", () => {

    if (window.scrollY > 300) {
        topBtn.style.display = "block";
    } else {
        topBtn.style.display = "none";
    }

});

topBtn.addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// ================= SELECTED DEVICE =================

let selectedDeviceId =
    localStorage.getItem("selectedDeviceId");

const dataUrl = selectedDeviceId
    ? `https://aeshaayman.pythonanywhere.com/api/data?device_id=${encodeURIComponent(selectedDeviceId)}`
    : "https://aeshaayman.pythonanywhere.com/api/data";

const latestUrl = selectedDeviceId
    ? `https://aeshaayman.pythonanywhere.com/api/latest?device_id=${encodeURIComponent(selectedDeviceId)}`
    : "https://aeshaayman.pythonanywhere.com/api/latest";


// ================= BACKEND STATUS =================

function loadDeviceData(deviceId) {

    fetch(`https://aeshaayman.pythonanywhere.com/api/device/${deviceId}`)

        .then(response => response.json())

        .then(data => {

            if (!data.found) {

                document.getElementById("status").textContent =
                    "Device Not Found";

                return;
            }

            document.getElementById("deviceId").textContent =
                data.device_id;

            document.getElementById("current").textContent =
                data.current + " A";

            document.getElementById("maximum").textContent =
                data.maximum_limit + " A";

            document.getElementById("temperature").textContent =
                data.temperature + " °C";

            document.getElementById("load").textContent =
                data.load_percentage + " %";

            document.getElementById("status").textContent =
                data.status;

            if (data.status === "Warning") {

                sendNotification(
                    "⚠️ SafeLoad Warning",
                    "High electrical load detected. The device will be disconnected automatically if the critical limit is reached.",
                    "Warning"
                );

            }

            if (data.status === "Critical") {

                sendNotification(
                    "🚨 SafeLoad Critical",
                    "Critical electrical load detected. The device will be disconnected automatically.",
                    "Critical"
                );

            }

            if (data.status === "Normal") {
                localStorage.removeItem("lastNotificationStatus");
            }

        })

        .catch(error => {

            console.error(error);

            document.getElementById("status").textContent =
                "Connection Error";

        });
}


// Load saved device when dashboard opens

if (selectedDeviceId) {
    loadDeviceData(selectedDeviceId);
}


// ================= ALERTS =================

fetch(dataUrl)
    .then(response => response.json())
    .then(data => {

        const alertsContainer =
            document.getElementById("alertsContainer");

        const alerts = data.filter(reading =>
            reading.Status === "Warning" ||
            reading.Status === "Critical"
        );

        if (alerts.length === 0) {

            alertsContainer.innerHTML = `
                <div class="alert normal">
                    ✅ No warnings or critical events.
                </div>
            `;

            return;
        }

        alertsContainer.innerHTML = "";

        alerts.reverse().forEach(reading => {

            if (reading.Status === "Critical") {

                alertsContainer.innerHTML += `
                    <div class="alert danger">
                        🚨 Critical load detected —
                        ${reading.Current} A at ${reading.Time}
                    </div>
                `;

            } else {

                alertsContainer.innerHTML += `
                    <div class="alert warning">
                        ⚠️ High load warning —
                        ${reading.Current} A at ${reading.Time}
                    </div>
                `;

            }

        });

    })
    .catch(error => {
        console.error(error);
    });


// ================= AI PREDICTION =================

fetch(latestUrl)
    .then(response => response.json())
    .then(data => {

        fetch(
            `https://aeshaayman.pythonanywhere.com/api/predict?current=${data.Current}&temperature=${data.Temperature}`
        )
            .then(response => response.json())
            .then(result => {

                document.getElementById("prediction").textContent =
                    result.prediction;

            });

    })
    .catch(error => {

        console.error(error);

        document.getElementById("prediction").textContent =
            "Prediction unavailable";

    });


// ================= ADD DEVICE =================

const addDeviceBtn = document.getElementById("addDeviceBtn");
const deviceModal = document.getElementById("deviceModal");
const closeDeviceBtn = document.getElementById("closeDeviceBtn");

addDeviceBtn.addEventListener("click", () => {
    deviceModal.style.display = "flex";
});

closeDeviceBtn.addEventListener("click", () => {
    deviceModal.style.display = "none";
});

const connectDeviceBtn = document.getElementById("connectDeviceBtn");
const deviceInput = document.getElementById("deviceInput");

connectDeviceBtn.addEventListener("click", () => {

    const deviceId = deviceInput.value.trim();

    if (deviceId === "") {
        alert("Please enter Device ID");
        return;
    }

    fetch(`https://aeshaayman.pythonanywhere.com/api/device/${deviceId}`)

        .then(response => response.json())

        .then(data => {

            if (data.found) {

                // Save selected device
                localStorage.setItem(
                    "selectedDeviceId",
                    data.device_id
                );

                selectedDeviceId = data.device_id;

                document.getElementById("deviceId").textContent =
                    data.device_id;

                document.getElementById("current").textContent =
                    data.current + " A";

                document.getElementById("maximum").textContent =
                    data.maximum_limit + " A";

                document.getElementById("temperature").textContent =
                    data.temperature + " °C";

                document.getElementById("load").textContent =
                    data.load_percentage + " %";

                document.getElementById("status").textContent =
                    data.status;

                deviceModal.style.display = "none";

            }
            else {

                alert("Device not found");

            }

        })

        .catch(error => {

            console.error(error);

            alert("Could not connect to backend");

        });

});


// ================= POWER CONTROL =================
const powerToggle = document.getElementById("powerToggle");
const powerStatus = document.getElementById("powerStatus");
const statusBadge = document.getElementById("status");

powerToggle.addEventListener("change", async () => {

    if (!selectedDeviceId) {
        alert("Please connect a device first.");
        powerToggle.checked = false;
        return;
    }

    const power = powerToggle.checked ? "ON" : "OFF";

    try {

        const response = await fetch("https://aeshaayman.pythonanywhere.com/api/power", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                device_id: selectedDeviceId,
                power: power
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        if (power === "ON") {

            powerStatus.textContent = "Device is ON";
            statusBadge.textContent = "Normal";

        } else {

            powerStatus.textContent = "Device is OFF";
            statusBadge.textContent = "OFF";

        }

    } catch (error) {

        console.error("Power Control Error:", error);
        alert("Could not control the device.");

        powerToggle.checked = !powerToggle.checked;
    }

});


// ================= HISTORY =================

fetch(dataUrl)
    .then(response => response.json())
    .then(data => {

        const historyTable = document.getElementById("historyTable");

        data.forEach(reading => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${reading.Current} A</td>
                <td>${reading.Temperature} °C</td>
                <td>${reading.Status}</td>
                <td>${reading.Date}</td>
                <td>${reading.Time}</td>
            `;

            historyTable.appendChild(row);

        });

    })
    .catch(error => {
        console.error(error);
    });


// ================= HISTORY STATS =================

fetch(dataUrl)
    .then(response => response.json())
    .then(data => {

        const currents = data.map(reading => Number(reading.Current));

        const average =
            currents.reduce((sum, value) => sum + value, 0) / currents.length;

        const maximum = Math.max(...currents);

        const warnings =
            data.filter(reading => reading.Status === "Warning").length;

        const critical =
            data.filter(reading => reading.Status === "Critical").length;

        document.getElementById("avgCurrent").textContent =
            average.toFixed(1) + " A";

        document.getElementById("maxCurrent").textContent =
            maximum.toFixed(1) + " A";

        document.getElementById("warningCount").textContent =
            warnings;

        document.getElementById("criticalCount").textContent =
            critical;

    })
    .catch(error => {
        console.error(error);
    });


// ================= REAL LOAD CHART =================

fetch(dataUrl)
    .then(response => response.json())
    .then(data => {

        const times = data.map(reading => reading.Time);

        const percentages = data.map(reading =>
            (Number(reading.Current) / Number(reading.Maximum_Limit)) * 100
        );

        const ctx = document.getElementById("loadChart");

        new Chart(ctx, {
            type: "line",

            data: {
                labels: times,

                datasets: [{
                    label: "Current Load (%)",
                    data: percentages,
                    tension: 0.3
                },

                {
                    label: "Warning Limit (80%)",
                    data: times.map(() => 80),
                    borderDash: [6, 6],
                    pointRadius: 0
                },

                {
                    label: "Critical Limit (100%)",
                    data: times.map(() => 100),
                    borderDash: [6, 6],
                    pointRadius: 0
                }]
            },

            options: {
                responsive: true,

                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + "%"
                        }
                    }
                }
            }
        });

    })
    .catch(error => {
        console.error("Chart error:", error);
    });


// ================= AUTO UPDATE =================

setInterval(() => {
    location.reload();
}, 30000);
