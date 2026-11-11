
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");
const togglePassword = document.getElementById("togglePassword");

// Show or hide password
togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password"
  );
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMessage.textContent = "";
  loginButton.disabled = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const result = await response.json();

    if (!response.ok) {
      loginMessage.textContent =
        result.message || "Login failed. Please try again.";
      return;
    }

    loginMessage.textContent = "Login successful!";

   window.location.href = "/";
  } catch (error) {
    console.error("Login request failed:", error);
    loginMessage.textContent =
      "Unable to connect to the server. Please try again.";
  } finally {
    loginButton.disabled = false;
  }
});
 const params = new URLSearchParams(window.location.search);
const from = params.get("from");

const messageElement = document.getElementById("login-message");

if (from && messageElement) {
    if (from === "wishlist") {
        messageElement.textContent =
            "Please login to access your wishlist.";
    } 
    else if (from === "cart") {
        messageElement.textContent =
            "Please login to access your cart.";
    }

    messageElement.hidden = false;
}