
const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");
const signupButton = document.getElementById("signupButton");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const termsAccepted = document.getElementById("terms").checked;

  if (password !== confirmPassword) {
    signupMessage.textContent = "Passwords do not match.";
    return;
  }

  if (!termsAccepted) {
    signupMessage.textContent = "Please accept the terms to continue.";
    return;
  }

  signupButton.disabled = true;
  signupMessage.textContent = "Creating your account...";

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    signupMessage.textContent = data.message;

    if (data.success) {
      signupForm.reset();
    }
  } catch (error) {
    console.error("Signup request failed:", error);
    signupMessage.textContent = "Unable to connect. Please try again.";
  } finally {
    signupButton.disabled = false;
  }
});
