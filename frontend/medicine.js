let medicines = [];

const API = "http://localhost:5000/medicines";

// 🔊 sound
function playSound() {
    let sound = document.getElementById("alarmSound");
    if (sound) sound.play();
}

// LOAD FROM DATABASE
async function loadData() {
    const userId = localStorage.getItem("userId");

    let res = await fetch(API + "/" + userId);
    medicines = await res.json();

    // add flags if missing
    medicines = medicines.map(m => ({
        ...m,
        notified: m.notified || false,
        missedNotified: m.missedNotified || false
    }));

    render();
}

// ADD MEDICINE
async function addMedicine() {
    let patient = document.getElementById("patient").value;
    let name = document.getElementById("name").value;
    let time = document.getElementById("time").value;
    let dose = document.getElementById("dose").value;
    let date = document.getElementById("date").value;

    if (!patient || !name || !time || !dose || !date) {
        alert("Fill all fields");
        return;
    }

    const userId = localStorage.getItem("userId");

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId,
            patient,
            name,
            time,
            dose,
            date,
            status: "pending"
        })
    });

    loadData();
}

// RENDER
function render() {
    let list = document.getElementById("list");
    let reminders = document.getElementById("reminders");

    list.innerHTML = "";
    reminders.innerHTML = "";

    let taken = 0, missed = 0;

    medicines.forEach(m => {

        if (m.status === "taken") taken++;
        if (m.status === "missed") missed++;

        let li = document.createElement("li");

        li.innerHTML = `
            👤 ${m.patient} <br>
            💊 ${m.name} (${m.dose}) <br>
            ⏰ ${m.time} | 📅 ${m.date} <br>
            Status: [${m.status}]
            <br>
            <button onclick="markTaken('${m._id}')">Taken</button>
            <button onclick="markMissed('${m._id}')">Missed</button>
            <button onclick="deleteMed('${m._id}')">Delete</button>
            <br><br>
        `;

        list.appendChild(li);

        if (m.status !== "taken") {
            let r = document.createElement("li");
            r.innerText = `${m.patient} - ${m.name} at ${m.time} (${m.status})`;
            reminders.appendChild(r);
        }
    });

    document.getElementById("stats").innerText =
        `Taken: ${taken} | Missed: ${missed}`;
}

// UPDATE STATUS
async function markTaken(id) {
    await fetch(API + "/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "taken" })
    });
    loadData();
}

async function markMissed(id) {
    await fetch(API + "/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "missed" })
    });
    loadData();
}

// DELETE
async function deleteMed(id) {
    await fetch(API + "/" + id, {
        method: "DELETE"
    });
    loadData();
}

//////////////////////////////////////////////////////
// 🔔 REMINDER SYSTEM (FIXED)
//////////////////////////////////////////////////////

setInterval(() => {

    let now = new Date();

    medicines.forEach(m => {

        let [year, month, day] = m.date.split("-");
        let [hour, minute] = m.time.split(":");

        let medTime = new Date(year, month - 1, day, hour, minute, 0);

        let diff = now - medTime;

        // 🔔 reminder
        if (
            diff >= 0 &&
            diff <= 60000 &&
            m.status === "pending" &&
            !m.notified
        ) {
            playSound();
            alert(`Reminder: ${m.patient}, take ${m.name}`);
            m.notified = true;
        }

        // ❌ missed
        if (
            diff > 120000 &&
            m.status === "pending" &&
            !m.missedNotified
        ) {
            playSound();
            alert(`${m.patient} missed ${m.name}`);
            m.missedNotified = true;
        }

    });

}, 5000);

// FIRST LOAD
loadData();