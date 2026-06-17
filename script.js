// ============================================================================
// Authentication System - Secure Login/Sign Up
// ============================================================================

// DOM Elements
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const welcomeMessage = document.getElementById('welcome-message');
const formTitle = document.getElementById('form-title');
const showSignupButton = document.getElementById('show-signup');
const showLoginButton = document.getElementById('show-login');
const welcomeText = document.getElementById('welcome-text');
const logoutButton = document.getElementById('logout');
const userInfoDiv = document.getElementById('user-info');

// ============================================================================
// Encryption Module
// ============================================================================
const EncryptionService = {
  ENCRYPTION_SECRET: 'library-management-system-secret-key-2024',

  // Generate encryption key from secret
  async getEncryptionKey() {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.ENCRYPTION_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  },

  // Hash password using SHA-256
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  // Encrypt user data using AES-256-GCM
  async encryptUserData(userData) {
    const key = await this.getEncryptionKey();
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(userData));

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      plaintext
    );

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  },

  // Decrypt user data using AES-256-GCM
  async decryptUserData(encryptedText) {
    try {
      const key = await this.getEncryptionKey();

      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
      );

      // Decode and parse
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  },
};

// ============================================================================
// Validation Module
// ============================================================================
const ValidationService = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password) {
    return password.length >= 6;
  },

  validateAge(age) {
    const ageNum = parseInt(age);
    return ageNum >= 1 && ageNum <= 120;
  },

  validateName(name) {
    return name.trim().length >= 2;
  },

  validateSignupForm(formData) {
    const errors = {};

    if (!this.validateName(formData.name)) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!this.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender';
    }

    if (!this.validateAge(formData.age)) {
      errors.age = 'Please enter a valid age (1-120)';
    }

    if (!this.validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    return errors;
  },

  validateLoginForm(formData) {
    const errors = {};

    if (!this.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  },
};

// ============================================================================
// UI Module
// ============================================================================
const UIService = {
  showLogin() {
    formTitle.textContent = 'Login';
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    welcomeMessage.classList.add('hidden');
    this.clearErrors();
  },

  showSignup() {
    formTitle.textContent = 'Sign Up';
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    welcomeMessage.classList.add('hidden');
    this.clearErrors();
  },

  showWelcome(userData) {
    welcomeText.textContent = `Hello, ${userData.name}! You are now logged in.`;
    formTitle.textContent = 'Welcome';
    signupForm.classList.add('hidden');
    loginForm.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
    this.displayUserInfo(userData);
  },

  displayUserInfo(userData) {
    userInfoDiv.innerHTML = `
      <div class="user-info-item">
        <span class="user-info-label">Name:</span>
        <span class="user-info-value">${this.escapeHtml(userData.name)}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Email:</span>
        <span class="user-info-value">${this.escapeHtml(userData.email)}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Gender:</span>
        <span class="user-info-value">${this.escapeHtml(userData.gender)}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Age:</span>
        <span class="user-info-value">${this.escapeHtml(userData.age)}</span>
      </div>
    `;
  },

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },

  showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }

    if (inputElement) {
      inputElement.parentElement.classList.add('error');
    }
  },

  clearError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }

    if (inputElement) {
      inputElement.parentElement.classList.remove('error');
    }
  },

  clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach((el) => {
      el.textContent = '';
      el.classList.remove('show');
    });

    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach((el) => {
      el.classList.remove('error');
    });
  },

  showAlert(message, type = 'info') {
    // Using browser alert for simplicity, can be replaced with custom toast
    alert(message);
  },
};

// ============================================================================
// Password Visibility Toggle
// ============================================================================
document.getElementById('toggle-signup-password').addEventListener('click', function (e) {
  e.preventDefault();
  const input = document.getElementById('signup-password');
  const type = input.type === 'password' ? 'text' : 'password';
  input.type = type;
  this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
});

document.getElementById('toggle-login-password').addEventListener('click', function (e) {
  e.preventDefault();
  const input = document.getElementById('login-password');
  const type = input.type === 'password' ? 'text' : 'password';
  input.type = type;
  this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
});

// ============================================================================
// Sign Up Handler
// ============================================================================
signupForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  UIService.clearErrors();

  const formData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('signup-email').value.trim(),
    gender: document.getElementById('gender').value,
    age: document.getElementById('age').value.trim(),
    password: document.getElementById('signup-password').value,
  };

  // Validate form data
  const errors = ValidationService.validateSignupForm(formData);

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => {
      UIService.showError(field === 'email' ? 'signup-email' : field, message);
    });
    return;
  }

  // Hash the password
  const hashedPassword = await EncryptionService.hashPassword(formData.password);

  const user = {
    name: formData.name,
    email: formData.email,
    gender: formData.gender,
    age: formData.age,
    password: hashedPassword,
  };

  // Encrypt and store user data
  const encryptedUser = await EncryptionService.encryptUserData(user);
  localStorage.setItem('libraryUser', encryptedUser);

  UIService.showAlert('✅ Sign up successful! Redirecting to login...');
  signupForm.reset();
  UIService.showLogin();
});

// ============================================================================
// Login Handler
// ============================================================================
loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  UIService.clearErrors();

  const formData = {
    email: document.getElementById('login-email').value.trim(),
    password: document.getElementById('login-password').value,
  };

  // Validate form data
  const errors = ValidationService.validateLoginForm(formData);

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => {
      UIService.showError(`login-${field}`, message);
    });
    return;
  }

  // Get encrypted user data from localStorage
  const encryptedData = localStorage.getItem('libraryUser');

  if (!encryptedData) {
    UIService.showAlert('❌ No account found. Please sign up first.');
    UIService.showSignup();
    return;
  }

  // Decrypt the user data
  const storedUser = await EncryptionService.decryptUserData(encryptedData);

  if (!storedUser) {
    UIService.showAlert('❌ Error decrypting user data. Please try again.');
    return;
  }

  // Hash the entered password and compare
  const hashedPassword = await EncryptionService.hashPassword(formData.password);

  if (storedUser.email === formData.email && storedUser.password === hashedPassword) {
    // Store session
    sessionStorage.setItem('currentUser', JSON.stringify(storedUser));
    UIService.showWelcome(storedUser);
  } else {
    UIService.showAlert('❌ Invalid email or password.');
  }
});

// ============================================================================
// Logout Handler
// ============================================================================
logoutButton.addEventListener('click', function () {
  sessionStorage.removeItem('currentUser');
  UIService.showLogin();
  loginForm.reset();
});

// ============================================================================
// Navigation Handlers
// ============================================================================
showSignupButton.addEventListener('click', () => UIService.showSignup());
showLoginButton.addEventListener('click', () => UIService.showLogin());

// ============================================================================
// Check for existing session on page load
// ============================================================================
window.addEventListener('load', function () {
  const currentUser = sessionStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser);
      UIService.showWelcome(userData);
    } catch (error) {
      console.error('Session error:', error);
      UIService.showLogin();
    }
  }
});