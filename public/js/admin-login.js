
        const passwordInput = document.getElementById("password");
        const togglePassword = document.getElementById("togglePassword");
        const loginForm = document.getElementById("adminLoginForm");
        const loginMessage = document.getElementById("loginMessage");

        togglePassword.addEventListener("click", function () {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";
            togglePassword.textContent = isPassword ? "Hide" : "Show";
            togglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });

        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            loginMessage.textContent = "";
            loginMessage.className = "login-message";

            const email = document.getElementById("email").value.trim();
            const password = passwordInput.value;
            const submitButton = loginForm.querySelector(".login-button");

            if (!email || !password) {
                loginMessage.textContent = "Please enter your email and password.";
                loginMessage.classList.add("error");
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = "Signing in...";

            try {
                const response = await fetch("/admin/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Unable to sign in.");
                }

                loginMessage.textContent = result.message || "Login successful.";
                loginMessage.classList.add("success");

                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                }
            } catch (error) {
                loginMessage.textContent =
                    error.message || "Something went wrong. Please try again.";
                loginMessage.classList.add("error");
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML =
                    'Sign in to dashboard <span>↗</span>';
            }
        });
    
   