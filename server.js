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
