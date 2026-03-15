document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ main.js loaded");
  
  // Update navbar based on login status
  updateNavbar();
  
  // Handle contact form if it exists
  setupContactForm();
});

// ========== NAVBAR AUTHENTICATION LOGIC ==========
// ========== NAVBAR AUTHENTICATION LOGIC ==========
function updateNavbar() {
  const authNavButtons = document.getElementById('authNavButtons');
  if (!authNavButtons) {
    console.log('Auth nav buttons not found');
    return;
  }
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  
  if (token && userJson) {
    // User is logged in - show ONLY logout button (no greeting)
    try {
      showLoggedInNavbar();
    } catch (e) {
      console.error('Error:', e);
      showLoggedOutNavbar();
    }
  } else {
    // User is logged out - show login/signup buttons
    showLoggedOutNavbar();
  }
}

function showLoggedInNavbar() {
  const authNavButtons = document.getElementById('authNavButtons');
  if (!authNavButtons) return;
  
  // ONLY logout button - no user greeting
  authNavButtons.innerHTML = `
    <button onclick="logout()" class="btn small logout-btn">
      <i class="fa-solid fa-sign-out-alt"></i> Logout
    </button>
  `;
}

function showLoggedOutNavbar() {
  const authNavButtons = document.getElementById('authNavButtons');
  if (!authNavButtons) return;
  
  authNavButtons.innerHTML = `
    <a class="btn small ghost" href="./auth.html?mode=login">Login</a>
    <a class="btn small primary" href="./Registration.html?mode=register">Sign Up</a>
  `;
}

// ========== LOGOUT FUNCTION ==========
window.logout = function() {
  console.log('Logging out...');
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Show notification
  showNotification('Logged out successfully', 'success');
  
  // Update navbar
  updateNavbar();
  
  // Redirect to home page
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
};

// ========== NOTIFICATION FUNCTION ==========
function showNotification(message, type = 'info') {
  // Remove any existing notification
  const existingNotif = document.querySelector('.notification');
  if (existingNotif) {
    existingNotif.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#3498db'};
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Call this when page loads
document.addEventListener('DOMContentLoaded', function() {
  updateNavbar();
});

// Add animation styles
(function addAnimationStyles() {
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();// ========== LOGOUT FUNCTION ==========
window.logout = function() {
  console.log('Logging out...');
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Show notification
  showNotification('Logged out successfully', 'success');
  
  // Update navbar
  updateNavbar();
  
  // Redirect to home page
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
};

// ========== NOTIFICATION FUNCTION ==========
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#3498db'};
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========== CONTACT FORM SETUP ==========
function setupContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) {
    console.log("ℹ️ Contact form not found on this page");
    return;
  }

  console.log("✅ Contact form found");

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const messageError = document.getElementById("messageError");
    const formStatus = document.getElementById("formStatus");

    // Reset messages
    if (nameError) nameError.textContent = "";
    if (emailError) emailError.textContent = "";
    if (messageError) messageError.textContent = "";
    if (formStatus) formStatus.textContent = "";

    let isValid = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Name validation
    if (name.length < 2) {
      if (nameError) nameError.textContent = "Name must be at least 2 characters";
      isValid = false;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      if (emailError) emailError.textContent = "Please enter a valid email address";
      isValid = false;
    }

    // Message validation
    if (message.length < 10) {
      if (messageError) messageError.textContent = "Message must be at least 10 characters";
      isValid = false;
    }

    if (message.length > 1000) {
      if (messageError) messageError.textContent = "Message cannot exceed 1000 characters";
      isValid = false;
    }

    if (!isValid) return;

    if (formStatus) formStatus.textContent = "📨 Sending message...";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });

      const data = await response.json();

      if (data.success) {
        if (formStatus) formStatus.textContent = "✅ Message sent successfully!";
        contactForm.reset();
      } else {
        if (formStatus) formStatus.textContent = "❌ Failed to send message.";
      }
    } catch (err) {
      console.error(err);
      if (formStatus) formStatus.textContent = "❌ Server error. Try again later.";
    }
  });
}

// Add animation styles
(function addAnimationStyles() {
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();