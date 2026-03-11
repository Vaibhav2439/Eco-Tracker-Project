document.addEventListener('DOMContentLoaded', () => {
  console.log('auth.js loaded');
  
  // Get DOM elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const togglePwd = document.getElementById('togglePwd');
  const googleBtn = document.querySelector('.btn.google, #googleLogin');
  
  // ========== CHECK FOR GOOGLE OAUTH CALLBACK ==========
  function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const error = params.get('error');
    
    if (error) {
      showMessage(`Authentication failed: ${error}`, 'error');
    }
    
    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/auth.html');
        
        // Show success message
        showMessage(`Welcome ${user.name}! Successfully logged in with Google.`, 'success');
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (e) {
        console.error('Error parsing user data:', e);
        showMessage('Error processing login data', 'error');
      }
    }
  }

  // ========== CHECK IF ALREADY LOGGED IN ==========
  function checkLoggedIn() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // User is logged in, show message and redirect
      const userData = JSON.parse(user);
      showMessage(`Already logged in as ${userData.name}. Redirecting...`, 'info');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  }

  // ========== GOOGLE LOGIN HANDLER ==========
  function googleLogin() {
    console.log('Google login initiated');
    window.location.href = '/api/auth/google';
  }

  // ========== SHOW MESSAGE FUNCTION ==========
  function showMessage(message, type = 'info') {
    // Remove any existing message
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) {
      existingMsg.remove();
    }
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `auth-message ${type}`;
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
      msgDiv.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
  }

  // ========== SHOW SUCCESS MESSAGE OVERLAY ==========
  function showSuccessMessage(message) {
    const overlay = document.createElement('div');
    overlay.id = 'successOverlay';
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
    `;
    
    const msgBox = document.createElement('div');
    msgBox.style.cssText = `
      background: linear-gradient(135deg, #2ecc71, #34c3ff);
      color: #062124;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;
    msgBox.textContent = message;
    
    overlay.appendChild(msgBox);
    document.body.appendChild(overlay);
  }

  // ========== ADD ANIMATION STYLES ==========
  function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-50px); opacity: 0; }
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .hidden {
        display: none !important;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  // ========== INITIAL CHECKS ==========
  addAnimationStyles();
  handleOAuthCallback();
  checkLoggedIn();

  // ========== TOGGLE BETWEEN LOGIN AND REGISTER FORMS ==========
  if (showRegister) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Show register clicked');
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });
  }
  
  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Show login clicked');
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });
  }

  // ========== PASSWORD VISIBILITY TOGGLE ==========
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const pwd = document.getElementById('password');
      if (!pwd) return;
      const type = pwd.type === 'password' ? 'text' : 'password';
      pwd.type = type;
      togglePwd.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }

  // ========== GOOGLE BUTTON HANDLER ==========
  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Google login button clicked');
      googleLogin();
    });
  } else {
    console.log('Google button not found');
  }

  // ========== LOGIN FORM SUBMISSION ==========
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Login form submitted');
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const loginBtn = document.getElementById('loginBtn');
      
      if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
      }
      
      console.log('Logging in with:', email);
      
      // Disable button to prevent double submission
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        console.log('Login response status:', res.status);
        const data = await res.json();
        console.log('Login response data:', data);
        
        if (!res.ok) {
          // Handle different error formats
          let errorMsg = 'Login failed';
          if (data && data.error) {
            errorMsg = data.error;
          } else if (data && data.errors && data.errors[0]) {
            errorMsg = data.errors[0].msg || data.errors[0].message;
          }
          showMessage(errorMsg, 'error');
          loginBtn.disabled = false;
          loginBtn.textContent = '→ Login';
          return;
        }
        
        // Successful login
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showSuccessMessage(`Welcome back, ${data.user.name}!`);
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err) {
        console.error('Login error:', err);
        showMessage('Network error: ' + (err.message || 'Unknown error'), 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = '→ Login';
      }
    });
  }

  // ========== REGISTER FORM SUBMISSION ==========
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Register form submitted');
      
      const name = document.getElementById('rname').value.trim();
      const email = document.getElementById('remail').value.trim();
      const password = document.getElementById('rpassword').value;
      const registerBtn = document.getElementById('registerBtn');
      
      if (!name || !email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
      }
      
      if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
      }
      
      console.log('Registering with:', { name, email });
      
      // Disable button to prevent double submission
      registerBtn.disabled = true;
      registerBtn.textContent = 'Creating account...';
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        
        console.log('Register response status:', res.status);
        const data = await res.json();
        console.log('Register response data:', data);
        
        if (!res.ok) {
          // Handle different error formats
          let errorMsg = 'Registration failed';
          if (data && data.error) {
            errorMsg = data.error;
          } else if (data && data.errors && data.errors[0]) {
            errorMsg = data.errors[0].msg || data.errors[0].message;
          }
          showMessage(errorMsg, 'error');
          registerBtn.disabled = false;
          registerBtn.textContent = 'Create account';
          return;
        }
        
        // Successful registration
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showSuccessMessage(`Welcome, ${data.user.name}! Your account has been created.`);
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err) {
        console.error('Register error:', err);
        showMessage('Network error: ' + (err.message || 'Unknown error'), 'error');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create account';
      }
    });
  }

  // ========== ADD FORGOT PASSWORD HANDLER ==========
  const forgotLink = document.querySelector('.forgot');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showMessage('Password reset feature coming soon!', 'info');
    });
  }

  console.log('Auth.js initialization complete');
});