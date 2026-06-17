# Modern_web_Projects
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login / Sign Up</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      background: #fff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      width: 320px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 22px;
      text-align: center;
    }
    .hidden {
      display: none;
    }
    label {
      display: block;
      margin: 12px 0 4px;
      font-size: 14px;
    }
    input, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 10px;
      margin-top: 16px;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }
    button.secondary {
      background: #6c757d;
      margin-top: 8px;
    }
    .message {
      text-align: center;
      margin-top: 16px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="form-title">Login</h1>

    <form id="signup-form" class="hidden">
      <label for="name">Name</label>
      <input type="text" id="name" required />
      <label for="email">Email</label>
      <input type="email" id="signup-email" required />
      <label for="gender">Gender</label>
      <select id="gender" required>
        <option value="">Select gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      <label for="age">Age</label>
      <input type="number" id="age" min="1" required />
      <label for="signup-password">Password</label>
      <input type="password" id="signup-password" required />
      <button type="submit">Sign Up</button>
      <button type="button" class="secondary" id="show-login">Already have an account? Login</button>
    </form>

    <form id="login-form">
      <label for="login-email">Email</label>
      <input type="email" id="login-email" required />
      <label for="login-password">Password</label>
      <input type="password" id="login-password" required />
      <button type="submit">Login</button>
      <button type="button" class="secondary" id="show-signup">New user? Sign Up</button>
    </form>

    <div id="welcome-message" class="hidden">
      <h1>Welcome!</h1>
      <p class="message" id="welcome-text"></p>
      <button type="button" id="logout">Logout</button>
    </div>
  </div>

  <script>
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const welcomeMessage = document.getElementById('welcome-message');
    const formTitle = document.getElementById('form-title');
    const showSignupButton = document.getElementById('show-signup');
    const showLoginButton = document.getElementById('show-login');
    const welcomeText = document.getElementById('welcome-text');
    const logoutButton = document.getElementById('logout');

    // Secret key for encryption (in production, never hardcode this)
    const ENCRYPTION_SECRET = 'library-management-system-secret-key-2024';

    // Generate encryption key from secret
    async function getEncryptionKey() {
      const encoder = new TextEncoder();
      const data = encoder.encode(ENCRYPTION_SECRET);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }

    // Hash password using Web Crypto API
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }

    // Encrypt user data using AES-256-GCM
    async function encryptUserData(userData) {
      const key = await getEncryptionKey();
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
    }

    // Decrypt user data using AES-256-GCM
    async function decryptUserData(encryptedText) {
      try {
        const key = await getEncryptionKey();
        
        // Decode from base64
        const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
        
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
    }

    function showLogin() {
      formTitle.textContent = 'Login';
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      welcomeMessage.classList.add('hidden');
    }

    function showSignup() {
      formTitle.textContent = 'Sign Up';
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      welcomeMessage.classList.add('hidden');
    }

    function showWelcome(name) {
      welcomeText.textContent = `Hello, ${name}! You are now logged in.`;
      formTitle.textContent = 'Welcome';
      signupForm.classList.add('hidden');
      loginForm.classList.add('hidden');
      welcomeMessage.classList.remove('hidden');
    }

    showSignupButton.addEventListener('click', showSignup);
    showLoginButton.addEventListener('click', showLogin);

    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const gender = document.getElementById('gender').value;
      const age = document.getElementById('age').value.trim();
      const password = document.getElementById('signup-password').value;

      if (!name || !email || !gender || !age || !password) {
        alert('Please fill all fields.');
        return;
      }

      // Hash the password using Web Crypto API
      const hashedPassword = await hashPassword(password);

      const user = {
        name,
        email,
        gender,
        age,
        password: hashedPassword,
      };

      // Encrypt the entire user object before storing
      const encryptedUser = await encryptUserData(user);
      localStorage.setItem('libraryUser', encryptedUser);
      
      alert('Sign up successful. Redirecting to login...');
      signupForm.reset();
      showLogin();
      
     
    });

    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      // Get encrypted user data from localStorage
      const encryptedData = localStorage.getItem('libraryUser');

      if (!encryptedData) {
        alert('No account found. Please sign up first.');
        showSignup();
        return;
      }

      // Decrypt the user data
      const storedUser = await decryptUserData(encryptedData);

      if (!storedUser) {
        alert('Error decrypting user data. Please try again.');
        return;
      }

      // Hash the entered password and compare with stored hash
      const hashedPassword = await hashPassword(password);

      if (storedUser.email === email && storedUser.password === hashedPassword) {
        showWelcome(storedUser.name);
      } else {
        alert('Invalid email or password.');
      }
    });

    logoutButton.addEventListener('click', function () {
      showLogin();
      loginForm.reset();
    });
  </script>
</body>
</html>
