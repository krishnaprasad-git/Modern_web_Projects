// script.js - single JS file for index, userDashboard and userHome pages

/* -------------------------
   Utility / Crypto functions
   ------------------------- */
const ENCRYPTION_SECRET = 'library-management-system-secret-key-2024';

async function getEncryptionKey() {
  const encoder = new TextEncoder();
  const data = encoder.encode(ENCRYPTION_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptUserData(userData) {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(userData));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptUserData(encryptedText) {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedData));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/* -------------------------
   DOM element helpers (guarded)
   ------------------------- */
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const welcomeMessage = document.getElementById('welcome-message');
const formTitle = document.getElementById('form-title');
const showSignupButton = document.getElementById('show-signup');
const showLoginButton = document.getElementById('show-login');
const welcomeText = document.getElementById('welcome-text');
const logoutButton = document.getElementById('logout');
const indexUserGreetingBtn = document.getElementById('userGreeting'); // button on index welcome area
const returnHomeBtn = document.getElementById('returnHome'); // button on userhome
const dashboardLogoutBtn = document.getElementById('logout-dashboard'); // optional unique id if used

/* -------------------------
   Auth UI helpers
   ------------------------- */
function showLogin() {
  if (formTitle) formTitle.textContent = 'Login';
  if (signupForm) signupForm.classList.add('hidden');
  if (loginForm) loginForm.classList.remove('hidden');
  if (welcomeMessage) welcomeMessage.classList.add('hidden');
}

function showSignup() {
  if (formTitle) formTitle.textContent = 'Sign Up';
  if (signupForm) signupForm.classList.remove('hidden');
  if (loginForm) loginForm.classList.add('hidden');
  if (welcomeMessage) welcomeMessage.classList.add('hidden');
}

function showWelcome(name) {
  if (welcomeText) welcomeText.textContent = `Hello, ${name}! You are now logged in.`;
  sessionStorage.setItem('userName', name);
  if (formTitle) formTitle.textContent = '';
  if (signupForm) signupForm.classList.add('hidden');
  if (loginForm) loginForm.classList.add('hidden');
  if (welcomeMessage) welcomeMessage.classList.remove('hidden');
}

/* -------------------------
   Signup / Login handlers
   ------------------------- */
if (showSignupButton) showSignupButton.addEventListener('click', showSignup);
if (showLoginButton) showLoginButton.addEventListener('click', showLogin);

if (signupForm) {
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

    const hashedPassword = await hashPassword(password);
    const user = { name, email, gender, age, password: hashedPassword };
    const encryptedUser = await encryptUserData(user);
    localStorage.setItem('libraryUser', encryptedUser);

    alert('Sign up successful. Redirecting to login...');
    signupForm.reset();
    showLogin();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const encryptedData = localStorage.getItem('libraryUser');
    if (!encryptedData) {
      alert('No account found. Please sign up first.');
      showSignup();
      return;
    }

    const storedUser = await decryptUserData(encryptedData);
    if (!storedUser) {
      alert('Error decrypting user data. Please try again.');
      return;
    }

    const hashedPassword = await hashPassword(password);
    if (storedUser.email === email && storedUser.password === hashedPassword) {
      // store name and redirect to dashboard
      sessionStorage.setItem('userName', storedUser.name);
      // redirect to dashboard with name in query string
      window.location.href = `userDashboard.html?name=${encodeURIComponent(storedUser.name)}`;
    } else {
      alert('Invalid email or password.');
    }
  });
}

/* Logout (guarded) */
if (logoutButton) {
  logoutButton.addEventListener('click', function () {
    // Clear session name and show login UI if on index
    sessionStorage.removeItem('userName');
    if (typeof showLogin === 'function') showLogin();
    if (loginForm) loginForm.reset();
    // If on dashboard/home pages, redirect to index
    if (!document.getElementById('signup-form') && !document.getElementById('login-form')) {
      window.location.href = 'index.html';
    }
  });
}

/* If there is a separate logout button on dashboard with different id */
if (dashboardLogoutBtn) {
  dashboardLogoutBtn.addEventListener('click', function () {
    sessionStorage.removeItem('userName');
    window.location.href = 'index.html';
  });
}

/* -------------------------
   Index welcome button -> dashboard
   (the button shown after login on index page)
   ------------------------- */
if (indexUserGreetingBtn) {
  indexUserGreetingBtn.addEventListener('click', function () {
    const name = sessionStorage.getItem('userName') || '';
    if (!name) {
      // If no name in session, try to read from localStorage decrypted user (best-effort)
      const encryptedData = localStorage.getItem('libraryUser');
      if (encryptedData) {
        decryptUserData(encryptedData).then(storedUser => {
          const n = storedUser ? storedUser.name : '';
          if (n) window.location.href = `userDashboard.html?name=${encodeURIComponent(n)}`;
          else window.location.href = 'userDashboard.html';
        });
      } else {
        window.location.href = 'userDashboard.html';
      }
    } else {
      window.location.href = `userDashboard.html?name=${encodeURIComponent(name)}`;
    }
  });
}

/* -------------------------
   Book list + filtering (used on userhome.html)
   ------------------------- */
function showUserHome() {
  const params = new URLSearchParams(window.location.search);
  const userName = params.get('name') || sessionStorage.getItem('userName');
  const greetingEl = document.getElementById('userGreeting');
  if (greetingEl) {
    greetingEl.textContent = userName ? `Welcome, ${userName}!` : 'Welcome!';
  }
}

function showBooks() {
  const books = [
    {
      "book_id": "B001",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "genre": "Programming",
      "published_year": 2008,
      "publisher": "Prentice Hall",
      "isbn": "9780132350884",
      "language": "English",
      "pages": 464,
      "available_copies": 4,
      "total_copies": 10,
      "location": "Shelf A3",
      "tags": ["software", "best practices", "coding"],
      "rating": 4.8
    },
    {
      "book_id": "B002",
      "title": "The Pragmatic Programmer",
      "author": "Andrew Hunt, David Thomas",
      "genre": "Programming",
      "published_year": 1999,
      "publisher": "Addison-Wesley",
      "isbn": "9780201616224",
      "language": "English",
      "pages": 352,
      "available_copies": 2,
      "total_copies": 5,
      "location": "Shelf B1",
      "tags": ["software", "development", "career"],
      "rating": 4.7
    },
    {
      "book_id": "B003",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "genre": "Fiction",
      "published_year": 1960,
      "publisher": "J.B. Lippincott & Co.",
      "isbn": "9780061120084",
      "language": "English",
      "pages": 281,
      "available_copies": 6,
      "total_copies": 6,
      "location": "Shelf C4",
      "tags": ["classic", "justice", "society"],
      "rating": 4.9
    },
    {
      "book_id": "B004",
      "title": "Introduction to Algorithms",
      "author": "Thomas H. Cormen",
      "genre": "Computer Science",
      "published_year": 2009,
      "publisher": "MIT Press",
      "isbn": "9780262033848",
      "language": "English",
      "pages": 1312,
      "available_copies": 3,
      "total_copies": 8,
      "location": "Shelf D2",
      "tags": ["algorithms", "data structures", "CS"],
      "rating": 4.6
    }
  ];
  sessionStorage.setItem('libraryBooks', JSON.stringify(books));
  renderBooks(books);
}

function renderBooks(bookArray) {
  const bookList = document.getElementById('bookList');
  if (!bookList) return;
  bookList.innerHTML = '';
  bookArray.forEach(book => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${book.title}</strong> by ${book.author} (${book.available_copies}/${book.total_copies} available)`;
    bookList.appendChild(li);
  });
}

function filterBooks() {
  const filterTypeEl = document.getElementById('filterType');
  const filterValueEl = document.getElementById('filterValue');
  if (!filterTypeEl || !filterValueEl) return;

  const filterType = filterTypeEl.value;
  const filterValue = filterValueEl.value.toLowerCase();
  const storedBooks = JSON.parse(sessionStorage.getItem('libraryBooks') || '[]');

  const filtered = storedBooks.filter(book => {
    const val = (book[filterType] !== undefined && book[filterType] !== null) ? book[filterType].toString().toLowerCase() : '';
    return val.includes(filterValue);
  });

  renderBooks(filtered);
}

/* Attach filter functions to global scope so inline onclick attributes work */
window.showUserHome = showUserHome;
window.showBooks = showBooks;
window.filterBooks = filterBooks;

/* Return to dashboard from userhome */
function returnToDashboard() {
  const name = sessionStorage.getItem('userName') || new URLSearchParams(window.location.search).get('name') || '';
  if (name) window.location.href = `userDashboard.html?name=${encodeURIComponent(name)}`;
  else window.location.href = 'userDashboard.html';
}
window.returnToDashboard = returnToDashboard;

if (returnHomeBtn) {
  returnHomeBtn.addEventListener('click', returnToDashboard);
}

/* On pages that need initial actions, call them if present */
document.addEventListener('DOMContentLoaded', function () {
  // If on userhome page (bookList exists), initialize
  if (document.getElementById('bookList')) {
    showUserHome();
    showBooks();
  }

  // If on userDashboard page, ensure greeting is shown (dashboardGreeting id)
  const dashboardGreeting = document.getElementById('dashboardGreeting');
  if (dashboardGreeting) {
    const params = new URLSearchParams(window.location.search);
    const userName = params.get('name') || sessionStorage.getItem('userName') || 'User';
    dashboardGreeting.textContent = `Welcome, ${userName}`;
  }
});
