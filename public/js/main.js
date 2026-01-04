// public/js/main.js
document.getElementById('year').textContent = new Date().getFullYear();

// Hide Login/Sign Up buttons if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    const parsedUser = JSON.parse(user);
    const navButtons = document.querySelectorAll('.nav a.btn');
    const nav = document.querySelector('.nav');
    
    // Hide or replace login/signup buttons
    navButtons.forEach(btn => {
      if (btn.textContent.includes('Login') || btn.textContent.includes('Sign Up')) {
        btn.style.display = 'none';
      }
    });
    
    // Add user profile link and logout button
    if (nav && !document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'btn small ghost';
      logoutBtn.textContent = `${parsedUser.name}`;
      logoutBtn.addEventListener('click', showLogoutModal);
      nav.appendChild(logoutBtn);
    }
  }
});

function showLogoutModal() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const overlay = document.createElement('div');
  overlay.id = 'logoutModal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
  `;
  
  const modalBox = document.createElement('div');
  modalBox.style.cssText = `
    background: linear-gradient(135deg, #0f1720 0%, #0b1220 100%);
    border: 1px solid rgba(255,255,255,0.08);
    color: #e6eef6;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    font-size: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    width: 90%;
  `;
  
  const title = document.createElement('h2');
  title.style.cssText = `
    margin: 0 0 12px 0;
    color: #e6eef6;
    font-size: 24px;
    font-weight: 700;
  `;
  title.textContent = `Goodbye, ${user.name}!`;
  
  const message = document.createElement('p');
  message.style.cssText = `
    margin: 0 0 30px 0;
    color: #98a0a6;
    font-size: 14px;
  `;
  message.textContent = 'Are you sure you want to log out?';
  
  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: center;
  `;
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    padding: 10px 24px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: #e6eef6;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
  `;
  cancelBtn.onmouseover = () => { cancelBtn.style.background = 'rgba(255,255,255,0.05)'; };
  cancelBtn.onmouseout = () => { cancelBtn.style.background = 'transparent'; };
  cancelBtn.addEventListener('click', () => overlay.remove());
  
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Logout';
  logoutBtn.style.cssText = `
    padding: 10px 24px;
    border-radius: 8px;
    border: 0;
    background: linear-gradient(90deg, #29c26b, #31d18e);
    color: #081010;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 6px 20px rgba(41,194,107,0.2);
  `;
  logoutBtn.onmouseover = () => { logoutBtn.style.transform = 'translateY(-2px)'; logoutBtn.style.boxShadow = '0 8px 25px rgba(41,194,107,0.3)'; };
  logoutBtn.onmouseout = () => { logoutBtn.style.transform = 'translateY(0)'; logoutBtn.style.boxShadow = '0 6px 20px rgba(41,194,107,0.2)'; };
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    overlay.remove();
    window.location.href = '/';
  });
  
  buttonGroup.appendChild(cancelBtn);
  buttonGroup.appendChild(logoutBtn);
  
  modalBox.appendChild(title);
  modalBox.appendChild(message);
  modalBox.appendChild(buttonGroup);
  overlay.appendChild(modalBox);
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(overlay);
}

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');

// Validation functions
function validateName(name) {
  if (!name || name.trim().length === 0) return 'Name is required.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  if (name.length > 100) return 'Name must not exceed 100 characters.';
  return '';
}

function validateEmail(email) {
  if (!email || email.trim().length === 0) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address.';
  return '';
}

function validateMessage(message) {
  if (!message || message.trim().length === 0) return 'Message is required.';
  if (message.length < 10) return 'Message must be at least 10 characters.';
  if (message.length > 1000) return 'Message must not exceed 1000 characters.';
  return '';
}

// Display error message
function showError(inputId, errorId, message) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);
  if (message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    inputEl.style.borderColor = '#f6b3b3';
  } else {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    inputEl.style.borderColor = '';
  }
}

// Real-time validation
nameInput.addEventListener('blur', () => {
  const error = validateName(nameInput.value);
  showError('name', 'nameError', error);
});

emailInput.addEventListener('blur', () => {
  const error = validateEmail(emailInput.value);
  showError('email', 'emailError', error);
});

messageInput.addEventListener('blur', () => {
  const error = validateMessage(messageInput.value);
  showError('message', 'messageError', error);
});

// Form submission with validation
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Clear previous status
  status.textContent = '';
  status.style.color = '#d7e6e0';
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();
  
  // Validate all fields
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const messageError = validateMessage(message);
  
  showError('name', 'nameError', nameError);
  showError('email', 'emailError', emailError);
  showError('message', 'messageError', messageError);
  
  // If there are errors, stop submission
  if (nameError || emailError || messageError) {
    status.textContent = 'Please fix the errors above.';
    status.style.color = '#f6b3b3';
    return;
  }
  
  status.textContent = 'Sending...';
  status.style.color = '#d7e6e0';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    const data = await res.json();
    if (res.ok) {
      status.style.color = '#8ef0b3';
      status.textContent = 'Message sent — thank you! We will reply soon.';
      form.reset();
      // Clear all error displays
      showError('name', 'nameError', '');
      showError('email', 'emailError', '');
      showError('message', 'messageError', '');
    } else {
      status.style.color = '#f6b3b3';
      status.textContent = data.error || 'Failed to send. Try again later.';
    }
  } catch (err) {
    status.style.color = '#f6b3b3';
    status.textContent = 'Network error. Please try again.';
    console.error(err);
  }
});