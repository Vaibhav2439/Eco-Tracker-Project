document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  if (!form) return;

  function validateName(name) {
    if (!name) return "Name is required.";
    if (name.length < 2) return "Name must be at least 2 characters.";
    return "";
  }

  function validateEmail(email) {
    if (!email) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid email address.";
    return "";
  }

  function validateMessage(message) {
    if (!message) return "Message is required.";
    if (message.length < 10) return "Message must be at least 10 characters.";
    return "";
  }

  function showError(id, msg) {
    document.getElementById(id).textContent = msg;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    status.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const mErr = validateMessage(message);

    showError("nameError", nErr);
    showError("emailError", eErr);
    showError("messageError", mErr);

    if (nErr || eErr || mErr) {
      status.textContent = "❌ Please fix the errors above.";
      status.style.color = "#f87171";
      return;
    }

    status.textContent = "📨 Sending...";
    status.style.color = "#94a3b8";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        status.textContent = data.msg;
        status.style.color = "#22c55e";
        form.reset();
      } else {
        status.textContent = data.msg || "❌ Failed to send.";
        status.style.color = "#f87171";
      }

    } catch (err) {
      status.textContent = "❌ Server error. Try later.";
      status.style.color = "#f87171";
      console.error(err);
    }
  });
});
