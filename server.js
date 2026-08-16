const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static("public"));


// ===============================
// Smoke Detector Variables
// ===============================

const ADMIN_PASSWORD = "admin123"; // Change this later

let smokeValue = 0;
let threshold = 1800;
let status = "SAFE";

let lastSeen = 0;
let history = [];


// ===============================
// Helper Functions
// ===============================

function updateStatus() {

    if (smokeValue >= threshold) {

        status = "DANGER";

    }
    else if (smokeValue >= threshold * 0.8) {

        status = "WARNING";

    }
    else {

        status = "SAFE";

    }

}

function addHistory(value) {

    history.push({
        time: Date.now(),
        value: value
    });

    if (history.length > 30)
        history.shift();

}


// ===============================
// Routes
// ===============================

// Frontend is served automatically
// by express.static("public")


// Dashboard Data

app.get("/api/status", (req, res) => {

    const online =
        (Date.now() - lastSeen) < 10000;

    res.json({

        smoke: smokeValue,

        threshold: threshold,

        status: status,

        online: online,

        history: history

    });

});
// ===============================
// Receive Smoke Reading from ESP32
// ===============================

app.post("/sensor", (req, res) => {

    const smoke = Number(req.body.smoke);

    if (isNaN(smoke)) {
        return res.status(400).json({
            success: false,
            message: "Invalid smoke value"
        });
    }

    smokeValue = smoke;

    lastSeen = Date.now();

    updateStatus();

    addHistory(smokeValue);

    res.json({
        success: true,
        smoke: smokeValue,
        status: status
    });

});


// ===============================
// Get Threshold
// ESP32 calls this
// ===============================

app.get("/threshold", (req, res) => {

    res.json({

        threshold: threshold

    });

});


// ===============================
// Update Threshold
// Website calls this
// ===============================

app.post("/threshold", (req, res) => {

    const password = req.body.password;
    const newThreshold = Number(req.body.threshold);

    if (password !== ADMIN_PASSWORD) {

        return res.status(401).json({

            success: false,
            message: "Wrong Password"

        });

    }

    if (isNaN(newThreshold) || newThreshold < 100) {

        return res.status(400).json({

            success: false,
            message: "Invalid Threshold"

        });

    }

    threshold = newThreshold;

    updateStatus();

    res.json({

        success: true,
        message: "Threshold Updated",

        threshold: threshold

    });

});
// ===============================
// Unknown Routes
// ===============================

app.use((req, res) => {

    res.status(404).json({

        success: false,
        message: "Endpoint Not Found"

    });

});


// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {

    console.log("=================================");
    console.log("🚨 Smart Smoke Detector Started");
    console.log("Server running on Port :", PORT);
    console.log("=================================");

});
