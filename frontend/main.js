const BASE_URL = "http://localhost:5000";

// 🔐 SIGNUP
async function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.status !== 200) {
      alert("Signup failed: " + data.message);
      return;
    }

    alert("Signup successful ✅ Now login");

  } catch (err) {
    alert("Server error. Check if backend is running.");
  }
}

// 🔐 LOGIN
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.status !== 200) {
    alert(data.message);
    return;
  }

  // ✅ FIX HERE
  localStorage.setItem("userId", data.userId);
  localStorage.setItem("userEmail", email);

  alert("Login successful");

  window.location.href = "dashboard.html";
}

// 👀 SHOW FORGOT PASSWORD
function showForgot() {
  document.getElementById("forgotBox").style.display = "block";
}

// 🔁 RESET PASSWORD
async function resetPassword() {
  const email = document.getElementById("forgotEmail").value;
  const newPassword = document.getElementById("newPassword").value;

  const res = await fetch(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword })
  });

  const data = await res.json();
  alert(data.message);
}