document.addEventListener('DOMContentLoaded', () => {
  console.log('auth.js loaded');
  
  // Get DOM elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const togglePwd = document.getElementById('togglePwd');
  const googleBtn = document.getElementById('googleLogin');
  
  // ========== INPUT RESTRICTION FUNCTIONS ==========
  function restrictNameInput(input) {
    if (!input) return;
    const regex = /^[A-Za-z\s]*$/; // Only letters and spaces
    const value = input.value;
    
    if (!regex.test(value)) {
      // Remove invalid characters
      input.value = value.replace(/[^A-Za-z\s]/g, '');
    }
    
    // Update validation hint
    validateName(input);
  }

  function restrictEmailInput(input) {
    if (!input) return;
    const value = input.value;
    
    // Convert uppercase to lowercase automatically
    if (/[A-Z]/.test(value)) {
      input.value = value.toLowerCase();
    }
    
    // Validate
    validateEmail(input);
  }

  function restrictPasswordInput(input) {
    if (!input) return;
    const value = input.value;
    
    // Prevent typing beyond 15 characters
    if (value.length > 15) {
      input.value = value.slice(0, 15);
    }
    
    validatePassword(input);
  }

  // ========== VALIDATION FUNCTIONS ==========           
  function validateName(input) {
    if (!input) return false;
    
    const name = input.value.trim();
    const hint = document.getElementById('nameHint');
    const parentRow = input.closest('.input-row');
    const nameRegex = /^[A-Za-z\s]+$/; // Only letters and spaces
    
    if (!hint) return true;
    
    if (!name) {
      hint.textContent = 'Name is required';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    if (name.length < 3) {
      hint.textContent = 'Name must be at least 3 characters';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    if (name.length > 30) {
      hint.textContent = 'Name cannot exceed 30 characters';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    if (!nameRegex.test(name)) {
      hint.textContent = 'Only letters and spaces are allowed';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    hint.textContent = '✓ Valid name';
    hint.className = 'validation-hint success';
    if (parentRow) {
      parentRow.classList.remove('error');
      parentRow.classList.add('success');
    }
    return true;
  }

  function validateEmail(input) {
    if (!input) return false;
    
    const email = input.value.trim();
    const hintId = input.id === 'email' ? 'loginEmailHint' : 
                   input.id === 'remail' ? 'emailHint' : null;
    const hint = hintId ? document.getElementById(hintId) : null;
    const parentRow = input.closest('.input-row');
    const emailRegex = /^[a-z0-9]+@gmail\.com$/; // Only lowercase, must end with @gmail.com
    
    if (!hint) return true;
    
    if (!email) {
      hint.textContent = 'Email is required';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    // Check for uppercase letters
    if (/[A-Z]/.test(email)) {
      hint.textContent = 'Uppercase letters are not allowed';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    if (!emailRegex.test(email)) {
      if (!email.includes('@')) {
        hint.textContent = 'Email must include @';
      } else if (!email.endsWith('@gmail.com')) {
        hint.textContent = 'Email must end with @gmail.com';
      } else {
        hint.textContent = 'Only letters and numbers before @';
      }
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    hint.textContent = '✓ Valid email';
    hint.className = 'validation-hint success';
    if (parentRow) {
      parentRow.classList.remove('error');
      parentRow.classList.add('success');
    }
    return true;
  }

  function validatePassword(input) {
    if (!input) return false;
    
    const password = input.value;
    const hintId = input.id === 'password' ? 'loginPasswordHint' : 
                   input.id === 'rpassword' ? 'passwordHint' : null;
    const hint = hintId ? document.getElementById(hintId) : null;
    const parentRow = input.closest('.input-row');
    
    if (!hint) return true;
    
    if (!password) {
      hint.textContent = 'Password is required';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    if (password.length < 8) {
      hint.textContent = 'Password must be at least 8 characters';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    if (password.length > 15) {
      hint.textContent = 'Password cannot exceed 15 characters';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      hint.textContent = 'Password must contain at least one number';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      hint.textContent = 'Password must contain at least one uppercase letter';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      hint.textContent = 'Password must contain at least one special character';
      hint.className = 'validation-hint error';
      if (parentRow) {
        parentRow.classList.add('error');
        parentRow.classList.remove('success');
      }
      return false;
    }
    
    hint.textContent = '✓ Strong password';
    hint.className = 'validation-hint success';
    if (parentRow) {
      parentRow.classList.remove('error');
      parentRow.classList.add('success');
    }
    return true;
  }

  // ========== SETUP INPUT RESTRICTIONS ==========
  function setupInputListeners() {
    // Login form inputs
    const loginEmail = document.getElementById('email');
    const loginPassword = document.getElementById('password');
    
    if (loginEmail) {
      loginEmail.addEventListener('input', function() { 
        restrictEmailInput(this); 
      });
      loginEmail.addEventListener('blur', function() { 
        validateEmail(this); 
      });
      loginEmail.addEventListener('paste', function(e) {
        e.preventDefault();
        let pastedText = e.clipboardData.getData('text');
        pastedText = pastedText.toLowerCase().replace(/[^a-z0-9@.]/g, '');
        this.value = pastedText;
        validateEmail(this);
      });
    }

    if (loginPassword) {
      loginPassword.addEventListener('input', function() { 
        restrictPasswordInput(this); 
      });
      loginPassword.addEventListener('blur', function() { 
        validatePassword(this); 
      });
      loginPassword.addEventListener('paste', function(e) {
        e.preventDefault();
        let pastedText = e.clipboardData.getData('text');
        pastedText = pastedText.slice(0, 15);
        this.value = pastedText;
        validatePassword(this);
      });
    }

    // Register form inputs
    const regName = document.getElementById('rname');
    const regEmail = document.getElementById('remail');
    const regPassword = document.getElementById('rpassword');

    if (regName) {
      regName.addEventListener('input', function() { 
        restrictNameInput(this); 
      });
      regName.addEventListener('blur', function() { 
        validateName(this); 
      });
      regName.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const cleanedText = pastedText.replace(/[^A-Za-z\s]/g, '');
        this.value = cleanedText;
        validateName(this);
      });
    }

    if (regEmail) {
      regEmail.addEventListener('input', function() { 
        restrictEmailInput(this); 
      });
      regEmail.addEventListener('blur', function() { 
        validateEmail(this); 
      });
      regEmail.addEventListener('paste', function(e) {
        e.preventDefault();
        let pastedText = e.clipboardData.getData('text');
        pastedText = pastedText.toLowerCase().replace(/[^a-z0-9@.]/g, '');
        this.value = pastedText;
        validateEmail(this);
      });
    }

    if (regPassword) {
      regPassword.addEventListener('input', function() { 
        restrictPasswordInput(this); 
      });
      regPassword.addEventListener('blur', function() { 
        validatePassword(this); 
      });
      regPassword.addEventListener('paste', function(e) {
        e.preventDefault();
        let pastedText = e.clipboardData.getData('text');
        pastedText = pastedText.slice(0, 15);
        this.value = pastedText;
        validatePassword(this);
      });
    }
  }

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
        
        window.history.replaceState({}, document.title, '/auth.html');
        
        showMessage(`Welcome ${user.name}! Successfully logged in with Google.`, 'success');
        
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
    if (!document.getElementById('auth-styles')) {
      const style = document.createElement('style');
      style.id = 'auth-styles';
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
  }

  // ========== PASSWORD VISIBILITY TOGGLE ==========
// ========== PASSWORD VISIBILITY TOGGLE ==========
// Login password toggle
const toggleLoginPwd = document.getElementById('toggleLoginPwd');
if (toggleLoginPwd) {
  toggleLoginPwd.addEventListener('click', () => {
    const pwd = document.getElementById('password');
    if (pwd) {
      const type = pwd.type === 'password' ? 'text' : 'password';
      pwd.type = type;
      toggleLoginPwd.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    }
  });
}

// Register password toggle
const toggleRegisterPwd = document.getElementById('toggleRegisterPwd');
if (toggleRegisterPwd) {
  toggleRegisterPwd.addEventListener('click', () => {
    const rpwd = document.getElementById('rpassword');
    if (rpwd) {
      const type = rpwd.type === 'password' ? 'text' : 'password';
      rpwd.type = type;
      toggleRegisterPwd.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    }
  });
}
  // ========== INITIAL CHECKS ==========
  addAnimationStyles();
  handleOAuthCallback();
  checkLoggedIn();
  setupInputListeners();

  // ========== TOGGLE BETWEEN LOGIN AND REGISTER FORMS ==========
  if (showRegister) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Show register clicked');
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
    });
  }
  
  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Show login clicked');
      if (registerForm) registerForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
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
      
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const loginBtn = document.getElementById('loginBtn');
      
      // Validate email and password
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      
      if (!isEmailValid || !isPasswordValid) {
        showMessage('Please fix the errors in the form', 'error');
        return;
      }
      
      const emailValue = email.value.trim();
      const passwordValue = password.value;
      
      console.log('Logging in with:', emailValue);
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailValue, password: passwordValue })
        });
        
        console.log('Login response status:', res.status);
        const data = await res.json();
        console.log('Login response data:', data);
        
        if (!res.ok) {
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
      
      const name = document.getElementById('rname');
      const email = document.getElementById('remail');
      const password = document.getElementById('rpassword');
      const registerBtn = document.getElementById('registerBtn');
      
      // Run all validations
      const isNameValid = validateName(name);
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      
      if (!isNameValid || !isEmailValid || !isPasswordValid) {
        showMessage('Please fix the errors in the form', 'error');
        return;
      }
      
      const nameValue = name.value.trim();
      const emailValue = email.value.trim();
      const passwordValue = password.value;
      
      console.log('Registering with:', { name: nameValue, email: emailValue });
      
      registerBtn.disabled = true;
      registerBtn.textContent = 'Creating account...';
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: nameValue, 
            email: emailValue, 
            password: passwordValue 
          })
        });
        
        console.log('Register response status:', res.status);
        const data = await res.json();
        console.log('Register response data:', data);
        
        if (!res.ok) {
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

  console.log('Auth.js initialization complete');
});