 const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const welcomeMessage = document.getElementById('welcome-message');
    const formTitle = document.getElementById('form-title');
    const showSignupButton = document.getElementById('show-signup');
    const showLoginButton = document.getElementById('show-login');
    const welcomeText = document.getElementById('welcome-text');
    const logoutButton = document.getElementById('logout');
    const userHome= document.getElementById('userGreeting');
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
      sessionStorage.setItem("userName", name); // store name
      formTitle.textContent = "";
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
    userHome.addEventListener("click", function (name){
      window.location.href = `userdashboard.html?name=${encodeURIComponent(name)}`;
    });
  