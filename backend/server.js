require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔗CONNECT MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

//  DONOR MODEL
const donorSchema = new mongoose.Schema({
  userId: String,
  name: String,
  phone: String,
  bloodGroup: String,
  location: {
    lat: Number,
    lng: Number
  },
  available: Boolean
});

const Donor = mongoose.model("Donor", donorSchema);

//for emergency
const emergencySchema = new mongoose.Schema({
  userId: String,
  name: String,
  phone: String,
  bloodGroup: String,
  location: {
    lat: Number,
    lng: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Emergency = mongoose.model("Emergency", emergencySchema);
app.post("/save-emergency", async (req, res) => {
  const emergency = new Emergency(req.body);
  await emergency.save();
  res.json({ message: "Emergency saved" });
});
app.get("/get-emergencies", async (req, res) => {
  const data = await Emergency.find().sort({ createdAt: -1 });
  res.json(data);
});


// 🩸 BECOME DONOR
app.post("/become-donor", async (req, res) => {
  const { phone } = req.body;

  try {
    const existing = await Donor.findOne({ phone });

    if (existing) {
      // ✅ update existing donor
      await Donor.findOneAndUpdate(
        { phone },
        req.body
      );

      return res.json({ message: "Donor updated" });
    }

    // ✅ new donor
    const donor = new Donor(req.body);
    await donor.save();

    res.json({ message: "Donor saved" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🚨 FIND DONORS
app.post("/find-donors", async (req, res) => {
  try {
    const { bloodGroup, location } = req.body;

    // 🛑 VALIDATION
    if (!bloodGroup || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const donors = await Donor.find({
      bloodGroup,
      available: true
    });

    const nearby = donors.filter(d => {
      if (!d.location || !d.location.lat || !d.location.lng) return false;

      const dist = Math.sqrt(
        (location.lat - d.location.lat) ** 2 +
        (location.lng - d.location.lng) ** 2
      );

      return dist < 0.1;
    });

    res.json(nearby);

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/set-unavailable", async (req, res) => {
  const { phone } = req.body;

  await Donor.findOneAndUpdate(
    { phone },
    { available: false }
  );

  res.json({ message: "Now unavailable" });
});
// 📢 BROADCAST
app.post("/broadcast-emergency", async (req, res) => {
   const emergency = new Emergency(req.body); // 🔥 SAVE DATA
  await emergency.save();
  res.json({ message: "Broadcast sent" });
});

// 🚀 START SERVER
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});
app.get("/my-data/:userId", async (req, res) => {
  const donors = await Donor.find({ userId: req.params.userId });
  const emergencies = await Emergency.find({ userId: req.params.userId });

  res.json({ donors, emergencies });
});
app.delete("/delete-emergency/:id", async (req, res) => {
  await Emergency.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});
//login/signup
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  console.log("SIGNUP DATA:", email);
  const user = new User({ email, password });
  await user.save();

  res.json({ message: "User created", userId: user._id });
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login success", userId: user._id });
});
app.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "User not found" });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated" });
});
const vaccineSchema = new mongoose.Schema({
  userId: String,
  vaccine: String,
  doses: [
  {
    date: String,
    taken: Boolean
  }
]
});

const Vaccine = mongoose.model("Vaccine", vaccineSchema);
app.post("/save-vaccine", async (req, res) => {
  const vaccine = new Vaccine(req.body);
  await vaccine.save();
  res.json({ message: "Saved" });
});
app.get("/get-vaccines/:userId", async (req, res) => {
  const data = await Vaccine.find({ userId: req.params.userId });
  res.json(data);
});
app.post("/mark-taken", async (req, res) => {
  const { vaccineId, doseId } = req.body;

  const vaccine = await Vaccine.findById(vaccineId);

  if (!vaccine) {
    return res.json({ message: "Vaccine not found" });
  }

  const dose = vaccine.doses.id(doseId);
  if (dose) {
    dose.taken = true;
  }

  await vaccine.save();

  res.json({ message: "Dose marked as taken" });
});
app.post("/delete-dose", async (req, res) => {
  const { vaccineId, doseId } = req.body;

  const vaccine = await Vaccine.findById(vaccineId);

  if (!vaccine) {
    return res.json({ message: "Vaccine not found" });
  }

  vaccine.doses = vaccine.doses.filter(
    d => d._id.toString() !== doseId
  );

  await vaccine.save();

  res.json({ message: "Dose deleted" });
});

const babyVaccineSchema = new mongoose.Schema({
  userId: String,
  vaccine: String,
  date: String,
  taken: {
    type: Boolean,
    default: false
  }
});

const BabyVaccine = mongoose.model("BabyVaccine", babyVaccineSchema);
app.post("/save-baby-vaccines", async (req, res) => {
  const { userId, doses } = req.body;

  const formatted = doses.map(d => ({
    userId,
    vaccine: d.vaccine,
    date: d.date,
    taken: false
  }));

  await BabyVaccine.insertMany(formatted);

  res.json({ message: "Baby vaccines saved" });
});
app.get("/get-baby-vaccines/:userId", async (req, res) => {
  const data = await BabyVaccine.find({ userId: req.params.userId });
  res.json(data);
});
app.post("/mark-baby-taken", async (req, res) => {
  const { id } = req.body;

  await BabyVaccine.findByIdAndUpdate(id, { taken: true });

  res.json({ message: "Marked as taken" });
});
app.delete("/clear-baby-vaccines/:userId", async (req, res) => {
  await BabyVaccine.deleteMany({ userId: req.params.userId });

  res.json({ message: "Cleared all baby vaccines" });
});
// ❌ DELETE ONE BABY VACCINE
app.delete("/delete-baby-vaccine/:id", async (req, res) => {
  await BabyVaccine.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted baby vaccine" });
});

//medicine
const MedicineSchema = new mongoose.Schema({
    userId: String,   // ADD THIS
    patient: String,
    name: String,
    time: String,
    dose: String,
    date: String,
    status: String
});

const Medicine = mongoose.model("Medicine", MedicineSchema);

//////////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////////

// TEST
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

// GET all medicines
app.get("/medicines/:userId", async (req, res) => {
    const meds = await Medicine.find({ userId: req.params.userId });
    res.json(meds);
});
// ADD medicine
app.post("/medicines", async (req, res) => {
    const med = new Medicine(req.body);
    await med.save();
    res.json(med);
});

// UPDATE status
app.put("/medicines/:id", async (req, res) => {
    const updated = await Medicine.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(updated);
});

// DELETE medicine
app.delete("/medicines/:id", async (req, res) => {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});
//for voice
app.post("/translate", async (req, res) => {
    const response = await fetch("https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-hi-en", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: req.body.text })
    });

    const data = await response.json();
    res.json(data);
});