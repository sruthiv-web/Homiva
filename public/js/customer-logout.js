const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });

      const result = await response.json();

      if (response.ok && result.success) {
  window.location.replace("/");
}
      else {
        alert(result.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
    }
  });
}