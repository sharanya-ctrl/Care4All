let selectedLang = "en-US";
const params = new URLSearchParams(window.location.search);
const action = params.get("action");
const translations = {
    "en-US": {
        title: "Find Blood Now",
        name: "Your Name",
        phone: "Phone Number",
        blood: "Select Blood Group",
        find: "Find Donors",
        locationBtn: "Use My Location",
        emergencyBtn: "🚨 Send Emergency Alert",
        speakBtn: "🎤 Speak",
        repeatBtn: "🔁 Repeat Voice"
    },
    "hi-IN": {
        title: "रक्त खोजें",
        name: "आपका नाम",
        phone: "फ़ोन नंबर",
        blood: "ब्लड ग्रुप चुनें",
        find: "डोनर खोजें",
        locationBtn: "मेरा स्थान उपयोग करें",
        emergencyBtn: "🚨 आपातकालीन अलर्ट भेजें",
        speakBtn: "🎤 बोलें",
        repeatBtn: "🔁 आवाज़ दोहराएं"
    },
    "kn-IN": {
        title: "ರಕ್ತವನ್ನು ಹುಡುಕಿ",
        name: "ನಿಮ್ಮ ಹೆಸರು",
        phone: "ಫೋನ್ ಸಂಖ್ಯೆ",
        blood: "ರಕ್ತದ ಗುಂಪು ಆಯ್ಕೆ ಮಾಡಿ",
        find: "ದಾನಿಗಳನ್ನು ಹುಡುಕಿ",
        locationBtn: "ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ",
        emergencyBtn: "🚨 ತುರ್ತು ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ",
        speakBtn: "🎤 ಮಾತನಾಡಿ",
        repeatBtn: "🔁 ಧ್ವನಿ ಪುನರಾವರ್ತಿಸಿ"
    }
};
//emergency form
function showEmergencyForm() {
    const t = translations[selectedLang] || translations["en-US"];
    document.getElementById("app").innerHTML = `
   <h2>${t.title}</h2>
    <input id="name" placeholder="${t.name}">
    <div class="phone-group">
  <input id="phone" placeholder="${t.phone}"
         onfocus="showNumpad()" 
         onkeydown="handleEnter(event)"
         oninput="checkPhoneLength()">

  <div class="numpad" id="numpad" style="display:none;">
    <button onclick="addNumber('1')">1</button>
    <button onclick="addNumber('2')">2</button>
    <button onclick="addNumber('3')">3</button>

    <button onclick="addNumber('4')">4</button>
    <button onclick="addNumber('5')">5</button>
    <button onclick="addNumber('6')">6</button>

    <button onclick="addNumber('7')">7</button>
    <button onclick="addNumber('8')">8</button>
    <button onclick="addNumber('9')">9</button>

    <button onclick="backspace()">⌫</button>
    <button onclick="addNumber('0')">0</button>
    <button onclick="clearAll()">C</button>
  </div>
</div>
   <div class="form-row">
  <select id="blood">
    <option value="">${t.blood}</option>
    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
  </select>

  <button onclick="getLocation()">${t.locationBtn}</button>
</div>
    <p id="locationText"></p>

    <button onclick="findDonors()">${t.find}</button>
    <button onclick="saveEmergencyAndBroadcast()">${t.emergencyBtn}</button>
    <div id="map"></div>
    <div id="results"></div>
  `;
    setTimeout(() => {
    const phoneInput = document.getElementById("phone");

    if (phoneInput) {
        phoneInput.addEventListener("input", () => {
            const name = document.getElementById("name").value.trim();
            const phone = phoneInput.value.trim();
            const blood = document.getElementById("blood").value;

            // ✅ check ALL conditions
            if (
                phone.length === 10 &&
                name !== "" &&
                blood !== "" &&
                userLocation &&
                userLocation.lat &&
                userLocation.lng
            ) {
                // 🔥 speak only once
                if (!hasSpoken) {
                    hasSpoken = true;

                    if (selectedLang === "hi-IN") {
                        speak("डोनर खोजे जा रहे हैं", "hi-IN");
                    } else if (selectedLang === "kn-IN") {
                        speak("ರಕ್ತದಾನಿಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ", "kn-IN");
                    } else {
                        speak("Searching donors now", "en-US");
                    }

                    findDonors();
                }
            }
        });
    }
}, 300);
}
//save user data 
async function saveEmergencyAndBroadcast() {
    if (!validateEmergency()) return;
    const userId = localStorage.getItem("userId"); 

    const data = {
        userId,
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        bloodGroup: document.getElementById("blood").value,
        location: userLocation
    };

    // SAVE TO MONGODB
    await fetch("http://localhost:5000/save-emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    // Show all broadcasts
    triggerBroadcastUI();
}

//broadcast ui
async function triggerBroadcastUI() {
    const res = await fetch("http://localhost:5000/get-emergencies");
    const data = await res.json();

    if (data.length === 0) {
        document.getElementById("app").innerHTML =
            "<h2>No Emergency Requests</h2>";
        return;
    }

    document.getElementById("app").innerHTML = `
        <h2>🚨 Live Emergency Requests</h2>
         <div id="map" style="height:300px;"></div>

        ${data.map((e, index) => `
            <div style="border:2px solid red; padding:10px; margin:10px;">
                <p><b>Name:</b> ${e.name}</p>
                <p><b>Phone:</b> ${e.phone}</p>
                <p><b>Blood:</b> ${e.bloodGroup}</p>

                ${e.location?.lat && e.location?.lng
            ? `<button onclick="showEmergencyOnMap(${e.location.lat}, ${e.location.lng})">
                        📍 Show on Map
                       </button>`
            : `<p>No location available</p>`
        }
            </div>
        `).join("")}
    `;
}
//map
let userLocation = {};

function getLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
        userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };

        const locText = document.getElementById("locationText");
        if (locText) locText.innerText = "Location detected";

        showMap(userLocation.lat, userLocation.lng);
    });
}
function showEmergencyOnMap(lat, lng) {
    showMap(lat, lng);

    // highlight emergency
    L.marker([lat, lng])
        .addTo(map)
        .bindPopup("🚨 Emergency Here")
        .openPopup();
}
//phone no validation
function validateEmergency() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const blood = document.getElementById("blood").value.trim();

    if (!name || !phone || !blood) {
        alert("Please fill all fields");
        return false;
    }

    if (!/^\d{10}$/.test(phone)) {
        alert("Enter valid 10-digit phone");
        return false;
    }

    return true;
}
//ui
function setLoading(on) {
    const r = document.getElementById("results");
    if (!r) return;

    r.innerHTML = on ? "<p>Loading...</p>" : "";
}
//find donors
async function findDonors() {
   if (!userLocation || !userLocation.lat || !userLocation.lng) {
    alert("⚠️ Please click 'Use My Location' first");
    return;
}
    if (!validateEmergency()) return;
    

    const blood = document.getElementById("blood").value;
    if (!blood) {
        alert("Please select blood group");
        return;
    }

    setLoading(true);  // START loading
    console.log("Sending:", {
    bloodGroup: blood,
    location: userLocation
});

    try {
        const res = await fetch("http://localhost:5000/find-donors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: document.getElementById("name").value,
                phone: document.getElementById("phone").value,
                bloodGroup: blood,
                location: userLocation
            })
        });

        const data = await res.json();

        setLoading(false);  //  STOP loading

        if (data.length === 0) {
            document.getElementById("results").innerHTML =
                "<p>No donors nearby. Sending emergency broadcast…</p>";
            speak("No donors nearby. We are sending emergency alert. Stay calm.", selectedLang);
            await saveEmergencyAndBroadcast();
            return;
        }

        const nearest = sortNearestDonors(userLocation, data);

        showResults(nearest);
        showDonorsOnMap(nearest);

    } catch (err) {
        setLoading(false);  //  STOP loading on error
        alert("Network error. Try again.");
    }
}
//broadcast
async function broadcastEmergency() {
    await fetch("http://localhost:5000/broadcast-emergency", {
        method: "POST"
    });

    document.getElementById("results").innerHTML =
        "<h3>Emergency broadcast sent 🚨</h3>";
}
//donor flow
function showDonateForm() {
    document.getElementById("app").innerHTML = `
    <h2>Donate Blood</h2>
    <input id="name" placeholder="Your Name">
  <div class="phone-group">
  <input id="phone" placeholder="Phone Number" 
         onfocus="showNumpad()" 
         onkeydown="handleEnter(event)"
         oninput="checkPhoneLength()">

  <div class="numpad" id="numpad" style="display:none;">
    <button onclick="addNumber('1')">1</button>
    <button onclick="addNumber('2')">2</button>
    <button onclick="addNumber('3')">3</button>

    <button onclick="addNumber('4')">4</button>
    <button onclick="addNumber('5')">5</button>
    <button onclick="addNumber('6')">6</button>

    <button onclick="addNumber('7')">7</button>
    <button onclick="addNumber('8')">8</button>
    <button onclick="addNumber('9')">9</button>

    <button onclick="backspace()">⌫</button>
    <button onclick="addNumber('0')">0</button>
    <button onclick="clearAll()">C</button>
  </div>
</div>
    <select id="blood">
  <option value="">Select Blood Group</option>
  <option value="A+">A+</option>
  <option value="A-">A-</option>
  <option value="B+">B+</option>
  <option value="B-">B-</option>
  <option value="O+">O+</option>
  <option value="O-">O-</option>
  <option value="AB+">AB+</option>
  <option value="AB-">AB-</option>
</select>

    <button onclick="getLocation()">Use Location</button>
<p id="locationText"></p>

<div id="map"></div>   <!-- 🔥 ADD THIS -->

<button onclick="becomeDonor()">I am Available</button>
<button onclick="setUnavailable()">I am Not Available</button>
  `;
}
async function setUnavailable() {
    await fetch("http://localhost:5000/set-unavailable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone: document.getElementById("phone").value
        })
    });

    alert("You are now unavailable");
}
async function becomeDonor() {
    if (!userLocation.lat) {
    alert("Click 'Use Location' first");
    return;
}
const userId = localStorage.getItem("userId");

    await fetch("http://localhost:5000/become-donor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId,
            name: document.getElementById("name").value,
            phone: document.getElementById("phone").value,
            bloodGroup: document.getElementById("blood").value,
            location: userLocation,
            available: true
        })
    });

    alert("You are now available to donate. Thank you!");
    document.querySelector("button[onclick='becomeDonor()']").innerText = "Available ✓";
}
function showNumpad() {
    const pad = document.getElementById("numpad");
    if (pad) pad.style.display = "grid";

    //  focus cursor at end (important UX)
    const phone = document.getElementById("phone");
    phone.focus();
    phone.setSelectionRange(phone.value.length, phone.value.length);
}

// Hide when Enter is pressed
function handleEnter(e) {
    if (e.key === "Enter") {
        hideNumpad();
    }
}

//  Hide when 10 digits entered
function checkPhoneLength() {
    const phone = document.getElementById("phone");

    // allow only numbers
    phone.value = phone.value.replace(/[^0-9]/g, '');

    if (phone.value.length >= 10) {
        hideNumpad();
    }
}

function hideNumpad() {
    const pad = document.getElementById("numpad");
    if (pad) pad.style.display = "none";
}
//show results
function showResults(data) {
    const div = document.getElementById("results");
    if (!div) return;

    if (data.length === 0) {
        div.innerHTML = "<p>No donors found</p>";
        return;
    }

    // ⭐ Top 3 closest
    const closest = data.slice(0, 3);

    // 📍 Remaining donors
    const others = data.slice(3);

    div.innerHTML = `
        <h3>⭐ Closest Donors</h3>
        ${closest.map(d => `
            <div style="border:2px solid green; padding:10px; margin:8px; border-radius:10px;">
                <p><b>Name:</b> ${d.name || "Donor"}</p>
                <p><b>Phone:</b> ${d.phone}</p>
                <p><b>Blood:</b> ${d.bloodGroup}</p>
                <p><b>Distance:</b> ${d.distance.toFixed(2)} km</p>
            </div>
        `).join("")}

        ${others.length > 0 ? `
            <h3>📍 Other Nearby Donors</h3>
            ${others.map(d => `
                <div style="border:1px solid #ccc; padding:8px; margin:6px; border-radius:8px;">
                    <p><b>Name:</b> ${d.name || "Donor"}</p>
                    <p><b>Phone:</b> ${d.phone}</p>
                    <p><b>Blood:</b> ${d.bloodGroup}</p>
                    <p><b>Distance:</b> ${d.distance.toFixed(2)} km</p>
                </div>
            `).join("")}
        ` : ""}
    `;
}

let lastSpoken = "";
let hasSpoken = false;
function speak(text, lang = "en-US") {
    lastSpoken = text;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang;
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
}
function setLang(lang) {
    selectedLang = lang;

    showEmergencyForm(); //  THIS LINE
    const t = translations[selectedLang];

    // 🔥 UPDATE BUTTON TEXTS
    const voiceBtn = document.getElementById("voiceBtn");
    const repeatBtn = document.getElementById("repeatBtn");

    if (voiceBtn) voiceBtn.innerText = t.speakBtn;
    if (repeatBtn) repeatBtn.innerText = t.repeatBtn;


    if (lang === "hi-IN") {
        speak("अब आप हिंदी में बोल सकते हैं", "hi-IN");
    } else if (lang === "kn-IN") {
        speak("ಈಗ ನೀವು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಹುದು", "kn-IN");
    } else {
        speak("You can speak in English now", "en-US");
    }
}
function repeatSpeech() {
    if (lastSpoken) {
        speak(lastSpoken, selectedLang);
    }
}
async function translateToEnglish(text) {
    try {
        const res = await fetch("http://localhost:5000/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        const data = await res.json();

        if (data[0]?.translation_text) {
            return data[0].translation_text.toLowerCase();
        }

        return text;

    } catch (err) {
        console.log("Translation failed, using original text");
        return text;
    }
}
// voice first
function startVoice() {
    console.log("Voice started");
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;     // ✅ keep listening
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
        console.log("Mic ON 🎤");
    };
    recognition.onsoundstart = () => {
        console.log("Sound detected 🔊");
    };
    recognition.onerror = (e) => {
        console.log("ERROR:", e.error);
    };
    // 🎤 minimal instruction (no overload)
    if (selectedLang === "hi-IN") {
        speak("अपना ब्लड ग्रुप बोलिए", "hi-IN");
    } else if (selectedLang === "kn-IN") {
        speak("ನಿಮ್ಮ ರಕ್ತದ ಗುಂಪನ್ನು ಹೇಳಿ", "kn-IN");
    } else {
        speak("Say your blood group", "en-US");
    }

    recognition.onresult = async function (event) {
    const result = event.results[event.resultIndex];

    // 🔥 ONLY FINAL RESULT
    if (!result.isFinal) return;

    let text = result[0].transcript.toLowerCase();
    text = await translateToEnglish(text);

    console.log("User said:", text);

        //  detect blood group
        let foundBlood = null;

        // normalize text
        text = text.replace("positive", "+")
            .replace("plus", "+")
            .replace("negative", "-")
            .replace("minus", "-")
            .replace("pos", "+")
            .replace("neg", "-");
        text = text.replace("0", "o");
        text = text.replace(/bee|be/g, "b");
        text = text.replace("ab", "ab"); // safe normalize
        text = text.replace("a b", "ab");
        text = text
            .replace("पॉजिटिव", "+")
            .replace("नेगेटिव", "-")
            .replace("ಪಾಸಿಟಿವ್", "+")
            .replace("ನೆಗಟಿವ್", "-");

        // remove spaces
        text = text.replace(/\s/g, "");

        // check patterns
        const patterns = ["ab+", "ab-", "a+", "a-", "b+", "b-", "o+", "o-"];

        for (let p of patterns) {
            if (text.includes(p)) {
                foundBlood = p.toUpperCase();
                break;
            }
        }

        // if blood detected → emergency flow
        if (foundBlood && !hasSpoken) {
    hasSpoken = true;

    showEmergencyForm();

    setTimeout(() => {
        document.getElementById("blood").value = foundBlood;
        getLocation();

       // ask ONLY for required info
                if (selectedLang === "hi-IN") {
                    speak("कृपया अपना नाम और फोन नंबर दर्ज करें", "hi-IN");
                } else if (selectedLang === "kn-IN") {
                    speak("ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ", "kn-IN");
                } else {
                    speak("Please enter your name and phone number", "en-US");
                }

    }, 500);

    return;
}


        //  fallback
        if (selectedLang === "hi-IN") {
            speak("कृपया ब्लड ग्रुप बोलिए, जैसे ओ पॉजिटिव", "hi-IN");
        } else if (selectedLang === "kn-IN") {
            speak("ದಯವಿಟ್ಟು ರಕ್ತದ ಗುಂಪು ಹೇಳಿ, ಉದಾಹರಣೆಗೆ ಓ ಪಾಸಿಟಿವ್", "kn-IN");
        } else {
            speak("Please say a blood group like O positive", "en-US");
        }
    };
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.start();
}
//for number pad
function addNumber(num) {
    const phone = document.getElementById("phone");

    if (phone.value.length < 10) {
        phone.value += num;
    }

    //auto hide when complete
    if (phone.value.length === 10) {
        hideNumpad();
    }
}

function backspace() {
    const phone = document.getElementById("phone");
    phone.value = phone.value.slice(0, -1);
}

function clearAll() {
    document.getElementById("phone").value = "";
}
window.onload = () => {
    const t = translations[selectedLang];

    const voiceBtn = document.getElementById("voiceBtn");
    const repeatBtn = document.getElementById("repeatBtn");

    if (voiceBtn) voiceBtn.innerText = t.speakBtn;
    if (repeatBtn) repeatBtn.innerText = t.repeatBtn;

    if (action === "emergency") showEmergencyForm();
    else if (action === "donate") showDonateForm();
    else if (action === "broadcast") triggerBroadcastUI();
    else showEmergencyForm();
        if (action === "broadcast") {
        setTimeout(() => {
            const btns = document.querySelectorAll(
                "button[onclick^='setLang'], #voiceBtn, #repeatBtn"
            );

            btns.forEach(b => b.style.display = "none");
        }, 100);
    }
};