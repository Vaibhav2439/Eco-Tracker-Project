document.addEventListener('DOMContentLoaded', () => {
  console.log('auth.js loaded');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const togglePwd = document.getElementById('togglePwd');
  const authCard = document.querySelector('.auth-card');

  // Toggle between login and register forms
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

  // Password visibility toggle
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const pwd = document.getElementById('password');
      if (!pwd) return;
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
    });
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Login form submitted');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      if (!email || !password) return alert('Please enter email and password');
      console.log('Logging in with:', email);
      
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
          return alert((data && data.error) || (data.errors && data.errors[0] && data.errors[0].msg) || 'Login failed');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showSuccessMessage(`Welcome back, ${data.user.name}!`);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err) {
        console.error('Login error:', err);
        alert('Network error: ' + (err.message || 'Unknown error'));
      }
    });
  }

  // Register form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Register form submitted');
      const name = document.getElementById('rname').value.trim();
      const email = document.getElementById('remail').value.trim();
      const password = document.getElementById('rpassword').value;
      if (!name || !email || !password) return alert('Please fill all fields');
      console.log('Registering with:', { name, email });
      
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
          return alert((data && (data.error || (data.errors && data.errors[0] && data.errors[0].msg))) || 'Registration failed');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showSuccessMessage(`Welcome, ${data.user.name}! Your account has been created.`);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (err) {
        console.error('Register error:', err);
        alert('Network error: ' + (err.message || 'Unknown error'));
      }
    });
  }

  // Show success message overlay
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
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(msgBox);
    document.body.appendChild(overlay);
  }
});

