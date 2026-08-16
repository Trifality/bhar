const smokeValue = document.getElementById("smokeValue");
const threshold = document.getElementById("threshold");
const statusBox = document.getElementById("status");
const progressBar = document.getElementById("progressBar");
const deviceStatus = document.getElementById("deviceStatus");
const lastUpdate = document.getElementById("lastUpdate");

const updateBtn = document.getElementById("updateBtn");
const password = document.getElementById("password");
const newThreshold = document.getElementById("newThreshold");

// -------------------------
// Chart
// -------------------------

const ctx = document.getElementById("historyChart");

const chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Smoke Reading",
            data: [],
            borderColor: "#00ff99",
            borderWidth: 3,
            tension: 0.35,
            fill: false
        }]
    },
    options: {
        responsive: true,
        animation: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// -------------------------
// Fetch latest data
// -------------------------

async function updateDashboard(){

    try{

        const response = await fetch("/api/status");

        const data = await response.json();

        smokeValue.innerText = data.smoke;
        threshold.innerText = data.threshold;

        deviceStatus.innerText = "Online";

        lastUpdate.innerText =
            new Date().toLocaleTimeString();

        let percent = (data.smoke / 4095) * 100;

        progressBar.style.width = percent + "%";

        if(data.status=="SAFE"){

            statusBox.innerText="SAFE";

            statusBox.className="status safe";

            progressBar.style.background="#22c55e";

        }

        else if(data.status=="WARNING"){

            statusBox.innerText="WARNING";

            statusBox.className="status warning";

            progressBar.style.background="#f59e0b";

        }

        else{

            statusBox.innerText="SMOKE DETECTED";

            statusBox.className="status danger";

            progressBar.style.background="#ef4444";

        }

        chart.data.labels.push("");

        chart.data.datasets[0].data.push(data.smoke);

        if(chart.data.labels.length>25){

            chart.data.labels.shift();

            chart.data.datasets[0].data.shift();

        }

        chart.update();

    }

    catch(err){

        deviceStatus.innerText="Offline";

    }

}

setInterval(updateDashboard,1000);

updateDashboard();


// -------------------------
// Update Threshold
// -------------------------

updateBtn.onclick=async()=>{

    const response=await fetch("/threshold",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            password:password.value,

            threshold:Number(newThreshold.value)

        })

    });

    const data=await response.json();

    alert(data.message);

    password.value="";

    newThreshold.value="";

          }
