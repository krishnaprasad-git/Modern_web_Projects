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
    },
    {
      "book_id": "B005",
      "title": "Design Patterns",
      "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
      "genre": "Programming",
      "published_year": 1994,
      "publisher": "Addison-Wesley",
      "isbn": "9780201633610",
      "language": "English",
      "pages": 395,
      "available_copies": 5,
      "total_copies": 7,
      "location": "Shelf A5",
      "tags": ["patterns", "OOP", "architecture"],
      "rating": 4.8
    },
    {
      "book_id": "B006",
      "title": "1984",
      "author": "George Orwell",
      "genre": "Fiction",
      "published_year": 1949,
      "publisher": "Secker & Warburg",
      "isbn": "9780451524935",
      "language": "English",
      "pages": 328,
      "available_copies": 7,
      "total_copies": 10,
      "location": "Shelf C1",
      "tags": ["dystopia", "politics", "society"],
      "rating": 4.9
    },
    {
      "book_id": "B007",
      "title": "JavaScript: The Good Parts",
      "author": "Douglas Crockford",
      "genre": "Programming",
      "published_year": 2008,
      "publisher": "O'Reilly Media",
      "isbn": "9780596517748",
      "language": "English",
      "pages": 176,
      "available_copies": 3,
      "total_copies": 6,
      "location": "Shelf A2",
      "tags": ["javascript", "web", "frontend"],
      "rating": 4.5
    },
    {
      "book_id": "B008",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "genre": "Fiction",
      "published_year": 1925,
      "publisher": "Charles Scribner's Sons",
      "isbn": "9780743273565",
      "language": "English",
      "pages": 180,
      "available_copies": 8,
      "total_copies": 8,
      "location": "Shelf C2",
      "tags": ["classic", "society", "wealth"],
      "rating": 4.7
    },
    {
      "book_id": "B009",
      "title": "Effective Java",
      "author": "Joshua Bloch",
      "genre": "Programming",
      "published_year": 2008,
      "publisher": "Addison-Wesley",
      "isbn": "9780321356680",
      "language": "English",
      "pages": 384,
      "available_copies": 4,
      "total_copies": 6,
      "location": "Shelf A4",
      "tags": ["java", "best practices", "OOP"],
      "rating": 4.8
    },
    {
      "book_id": "B010",
      "title": "Brave New World",
      "author": "Aldous Huxley",
      "genre": "Fiction",
      "published_year": 1932,
      "publisher": "Chatto & Windus",
      "isbn": "9780060850524",
      "language": "English",
      "pages": 268,
      "available_copies": 6,
      "total_copies": 9,
      "location": "Shelf C3",
      "tags": ["dystopia", "science fiction", "society"],
      "rating": 4.6
     }, {
    "book_id": "B011",
    "title": "Head First Design Patterns",
    "author": "Eric Freeman, Bert Bates, Kathy Sierra, Elisabeth Robson",
    "genre": "Programming",
    "published_year": 2004,
    "publisher": "O'Reilly Media",
    "isbn": "9780596007126",
    "language": "English",
    "pages": 694,
    "available_copies": 5,
    "total_copies": 9,
    "location": "Shelf A6",
    "tags": ["design patterns", "OOP", "java"],
    "rating": 4.7
  },
  {
    "book_id": "B012",
    "title": "Python Crash Course",
    "author": "Eric Matthes",
    "genre": "Programming",
    "published_year": 2015,
    "publisher": "No Starch Press",
    "isbn": "9781593276034",
    "language": "English",
    "pages": 560,
    "available_copies": 6,
    "total_copies": 10,
    "location": "Shelf A7",
    "tags": ["python", "beginner", "projects"],
    "rating": 4.6
  },
  {
    "book_id": "B013",
    "title": "Artificial Intelligence: A Modern Approach",
    "author": "Stuart Russell, Peter Norvig",
    "genre": "Computer Science",
    "published_year": 2010,
    "publisher": "Pearson",
    "isbn": "9780136042594",
    "language": "English",
    "pages": 1152,
    "available_copies": 3,
    "total_copies": 7,
    "location": "Shelf D3",
    "tags": ["AI", "machine learning", "CS"],
    "rating": 4.8
  },
  {
    "book_id": "B014",
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "genre": "Fantasy",
    "published_year": 1937,
    "publisher": "George Allen & Unwin",
    "isbn": "9780547928227",
    "language": "English",
    "pages": 310,
    "available_copies": 7,
    "total_copies": 12,
    "location": "Shelf F1",
    "tags": ["fantasy", "adventure", "classic"],
    "rating": 4.9
  },
  {
    "book_id": "B015",
    "title": "Harry Potter and the Sorcerer's Stone",
    "author": "J.K. Rowling",
    "genre": "Fantasy",
    "published_year": 1997,
    "publisher": "Bloomsbury",
    "isbn": "9780747532743",
    "language": "English",
    "pages": 309,
    "available_copies": 10,
    "total_copies": 15,
    "location": "Shelf F2",
    "tags": ["magic", "fantasy", "adventure"],
    "rating": 4.8
  },
  {
    "book_id": "B016",
    "title": "Sapiens: A Brief History of Humankind",
    "author": "Yuval Noah Harari",
    "genre": "History",
    "published_year": 2011,
    "publisher": "Harvill Secker",
    "isbn": "9780062316097",
    "language": "English",
    "pages": 443,
    "available_copies": 6,
    "total_copies": 9,
    "location": "Shelf H1",
    "tags": ["history", "civilization", "anthropology"],
    "rating": 4.7
  },
  {
    "book_id": "B017",
    "title": "Cosmos",
    "author": "Carl Sagan",
    "genre": "Science",
    "published_year": 1980,
    "publisher": "Random House",
    "isbn": "9780345331359",
    "language": "English",
    "pages": 396,
    "available_copies": 5,
    "total_copies": 8,
    "location": "Shelf S1",
    "tags": ["astronomy", "science", "space"],
    "rating": 4.8
  },
  {
    "book_id": "B018",
    "title": "A Brief History of Time",
    "author": "Stephen Hawking",
    "genre": "Science",
    "published_year": 1988,
    "publisher": "Bantam Dell",
    "isbn": "9780553380163",
    "language": "English",
    "pages": 212,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf S2",
    "tags": ["physics", "cosmology", "universe"],
    "rating": 4.7
  },
  {
    "book_id": "B019",
    "title": "War and Peace",
    "author": "Leo Tolstoy",
    "genre": "Classic",
    "published_year": 1869,
    "publisher": "The Russian Messenger",
    "isbn": "9780199232765",
    "language": "English",
    "pages": 1225,
    "available_copies": 3,
    "total_copies": 6,
    "location": "Shelf C5",
    "tags": ["classic", "war", "society"],
    "rating": 4.6
  },
  {
    "book_id": "B020",
    "title": "Crime and Punishment",
    "author": "Fyodor Dostoevsky",
    "genre": "Classic",
    "published_year": 1866,
    "publisher": "The Russian Messenger",
    "isbn": "9780140449136",
    "language": "English",
    "pages": 671,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf C6",
    "tags": ["classic", "psychology", "morality"],
    "rating": 4.7
  }, {
    "book_id": "B021",
    "title": "The Catcher in the Rye",
    "author": "J.D. Salinger",
    "genre": "Fiction",
    "published_year": 1951,
    "publisher": "Little, Brown and Company",
    "isbn": "9780316769488",
    "language": "English",
    "pages": 277,
    "available_copies": 6,
    "total_copies": 10,
    "location": "Shelf C7",
    "tags": ["classic", "coming of age", "society"],
    "rating": 4.5
  },
  {
    "book_id": "B022",
    "title": "The Lord of the Rings",
    "author": "J.R.R. Tolkien",
    "genre": "Fantasy",
    "published_year": 1954,
    "publisher": "George Allen & Unwin",
    "isbn": "9780618640157",
    "language": "English",
    "pages": 1178,
    "available_copies": 8,
    "total_copies": 12,
    "location": "Shelf F3",
    "tags": ["fantasy", "adventure", "epic"],
    "rating": 4.9
  },
  {
    "book_id": "B023",
    "title": "The Alchemist",
    "author": "Paulo Coelho",
    "genre": "Fiction",
    "published_year": 1988,
    "publisher": "HarperTorch",
    "isbn": "9780061122415",
    "language": "English",
    "pages": 208,
    "available_copies": 7,
    "total_copies": 10,
    "location": "Shelf C8",
    "tags": ["philosophy", "dreams", "journey"],
    "rating": 4.6
  },
  {
    "book_id": "B024",
    "title": "Spring in Action",
    "author": "Craig Walls",
    "genre": "Programming",
    "published_year": 2018,
    "publisher": "Manning Publications",
    "isbn": "9781617294945",
    "language": "English",
    "pages": 520,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf A8",
    "tags": ["spring", "java", "framework"],
    "rating": 4.7
  },
  {
    "book_id": "B025",
    "title": "Deep Learning",
    "author": "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
    "genre": "Computer Science",
    "published_year": 2016,
    "publisher": "MIT Press",
    "isbn": "9780262035613",
    "language": "English",
    "pages": 775,
    "available_copies": 3,
    "total_copies": 6,
    "location": "Shelf D4",
    "tags": ["AI", "machine learning", "neural networks"],
    "rating": 4.8
  },
  {
    "book_id": "B026",
    "title": "Pride and Prejudice",
    "author": "Jane Austen",
    "genre": "Classic",
    "published_year": 1813,
    "publisher": "T. Egerton",
    "isbn": "9780141439518",
    "language": "English",
    "pages": 432,
    "available_copies": 6,
    "total_copies": 9,
    "location": "Shelf C9",
    "tags": ["romance", "society", "classic"],
    "rating": 4.7
  },
  {
    "book_id": "B027",
    "title": "Don Quixote",
    "author": "Miguel de Cervantes",
    "genre": "Classic",
    "published_year": 1605,
    "publisher": "Francisco de Robles",
    "isbn": "9780060934347",
    "language": "English",
    "pages": 940,
    "available_copies": 3,
    "total_copies": 6,
    "location": "Shelf C10",
    "tags": ["classic", "satire", "adventure"],
    "rating": 4.6
  },
  {
    "book_id": "B028",
    "title": "The Divine Comedy",
    "author": "Dante Alighieri",
    "genre": "Classic",
    "published_year": 1320,
    "publisher": "John Murray",
    "isbn": "9780142437223",
    "language": "English",
    "pages": 798,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf C11",
    "tags": ["poetry", "religion", "classic"],
    "rating": 4.7
  },
  {
    "book_id": "B029",
    "title": "Moby-Dick",
    "author": "Herman Melville",
    "genre": "Classic",
    "published_year": 1851,
    "publisher": "Harper & Brothers",
    "isbn": "9780142437247",
    "language": "English",
    "pages": 635,
    "available_copies": 4,
    "total_copies": 8,
    "location": "Shelf C12",
    "tags": ["classic", "sea", "adventure"],
    "rating": 4.5
  },
  {
    "book_id": "B030",
    "title": "The Odyssey",
    "author": "Homer",
    "genre": "Classic",
    "published_year": -800,
    "publisher": "Penguin Classics",
    "isbn": "9780140268867",
    "language": "English",
    "pages": 541,
    "available_copies": 5,
    "total_copies": 9,
    "location": "Shelf C13",
    "tags": ["epic", "mythology", "classic"],
    "rating": 4.8
  },{
    "book_id": "B031",
    "title": "The Iliad",
    "author": "Homer",
    "genre": "Classic",
    "published_year": -750,
    "publisher": "Penguin Classics",
    "isbn": "9780140275360",
    "language": "English",
    "pages": 683,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf C14",
    "tags": ["epic", "mythology", "classic"],
    "rating": 4.7
  },
  {
    "book_id": "B032",
    "title": "The Brothers Karamazov",
    "author": "Fyodor Dostoevsky",
    "genre": "Classic",
    "published_year": 1880,
    "publisher": "The Russian Messenger",
    "isbn": "9780374528379",
    "language": "English",
    "pages": 796,
    "available_copies": 3,
    "total_copies": 6,
    "location": "Shelf C15",
    "tags": ["classic", "philosophy", "morality"],
    "rating": 4.8
  },
  {
    "book_id": "B033",
    "title": "Great Expectations",
    "author": "Charles Dickens",
    "genre": "Classic",
    "published_year": 1861,
    "publisher": "Chapman & Hall",
    "isbn": "9780141439563",
    "language": "English",
    "pages": 505,
    "available_copies": 5,
    "total_copies": 9,
    "location": "Shelf C16",
    "tags": ["classic", "society", "coming of age"],
    "rating": 4.6
  },
  {
    "book_id": "B034",
    "title": "Hamlet",
    "author": "William Shakespeare",
    "genre": "Classic",
    "published_year": 1603,
    "publisher": "Nicolas Ling",
    "isbn": "9780141396500",
    "language": "English",
    "pages": 342,
    "available_copies": 6,
    "total_copies": 10,
    "location": "Shelf C17",
    "tags": ["tragedy", "drama", "classic"],
    "rating": 4.7
  },
  {
    "book_id": "B035",
    "title": "Macbeth",
    "author": "William Shakespeare",
    "genre": "Classic",
    "published_year": 1606,
    "publisher": "First Folio",
    "isbn": "9780141396319",
    "language": "English",
    "pages": 272,
    "available_copies": 5,
    "total_copies": 8,
    "location": "Shelf C18",
    "tags": ["tragedy", "drama", "classic"],
    "rating": 4.6
  },
  {
    "book_id": "B036",
    "title": "Othello",
    "author": "William Shakespeare",
    "genre": "Classic",
    "published_year": 1604,
    "publisher": "First Quarto",
    "isbn": "9780141396272",
    "language": "English",
    "pages": 304,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf C19",
    "tags": ["tragedy", "drama", "classic"],
    "rating": 4.6
  },
  {
    "book_id": "B037",
    "title": "Romeo and Juliet",
    "author": "William Shakespeare",
    "genre": "Classic",
    "published_year": 1597,
    "publisher": "First Quarto",
    "isbn": "9780141396470",
    "language": "English",
    "pages": 320,
    "available_copies": 6,
    "total_copies": 10,
    "location": "Shelf C20",
    "tags": ["tragedy", "romance", "classic"],
    "rating": 4.7
  },
  {
    "book_id": "B038",
    "title": "Anna Karenina",
    "author": "Leo Tolstoy",
    "genre": "Classic",
    "published_year": 1877,
    "publisher": "The Russian Messenger",
    "isbn": "9780143035008",
    "language": "English",
    "pages": 864,
    "available_copies": 3,
    "total_copies": 6,
    "location": "Shelf C21",
    "tags": ["classic", "romance", "society"],
    "rating": 4.7
  },
  {
    "book_id": "B039",
    "title": "Les Misérables",
    "author": "Victor Hugo",
    "genre": "Classic",
    "published_year": 1862,
    "publisher": "A. Lacroix, Verboeckhoven & Cie.",
    "isbn": "9780451419439",
    "language": "English",
    "pages": 1232,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf C22",
    "tags": ["classic", "justice", "society"],
    "rating": 4.8
  },
  {
    "book_id": "B040",
    "title": "Meditations",
    "author": "Marcus Aurelius",
    "genre": "Philosophy",
    "published_year": 180,
    "publisher": "Penguin Classics",
    "isbn": "9780140449334",
    "language": "English",
    "pages": 304,
    "available_copies": 5,
    "total_copies": 9,
    "location": "Shelf P1",
    "tags": ["philosophy", "stoicism", "classic"],
    "rating": 4.8
  },{
    "book_id": "B041",
    "title": "The Republic",
    "author": "Plato",
    "genre": "Philosophy",
    "published_year": -380,
    "publisher": "Penguin Classics",
    "isbn": "9780140455112",
    "language": "English",
    "pages": 416,
    "available_copies": 5,
    "total_copies": 9,
    "location": "Shelf P2",
    "tags": ["philosophy", "politics", "classic"],
    "rating": 4.8
  },
  {
    "book_id": "B042",
    "title": "Nicomachean Ethics",
    "author": "Aristotle",
    "genre": "Philosophy",
    "published_year": -340,
    "publisher": "Oxford University Press",
    "isbn": "9780199213610",
    "language": "English",
    "pages": 352,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf P3",
    "tags": ["ethics", "philosophy", "classic"],
    "rating": 4.7
  },
  {
    "book_id": "B043",
    "title": "The Art of Computer Programming",
    "author": "Donald Knuth",
    "genre": "Computer Science",
    "published_year": 1968,
    "publisher": "Addison-Wesley",
    "isbn": "9780201896831",
    "language": "English",
    "pages": 672,
    "available_copies": 3,
    "total_copies": 6,
    "location": "Shelf D5",
    "tags": ["algorithms", "programming", "CS"],
    "rating": 4.9
  },
  {
    "book_id": "B044",
    "title": "Structure and Interpretation of Computer Programs",
    "author": "Harold Abelson, Gerald Jay Sussman",
    "genre": "Computer Science",
    "published_year": 1996,
    "publisher": "MIT Press",
    "isbn": "9780262510875",
    "language": "English",
    "pages": 657,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf D6",
    "tags": ["programming", "CS", "education"],
    "rating": 4.8
  },
  {
    "book_id": "B045",
    "title": "Refactoring: Improving the Design of Existing Code",
    "author": "Martin Fowler",
    "genre": "Programming",
    "published_year": 1999,
    "publisher": "Addison-Wesley",
    "isbn": "9780201485677",
    "language": "English",
    "pages": 431,
    "available_copies": 5,
    "total_copies": 9,
    "location": "Shelf A9",
    "tags": ["refactoring", "software", "best practices"],
    "rating": 4.7
  },
  {
    "book_id": "B046",
    "title": "Domain-Driven Design",
    "author": "Eric Evans",
    "genre": "Programming",
    "published_year": 2003,
    "publisher": "Addison-Wesley",
    "isbn": "9780321125217",
    "language": "English",
    "pages": 560,
    "available_copies": 4,
    "total_copies": 7,
    "location": "Shelf A10",
    "tags": ["DDD", "architecture", "software"],
    "rating": 4.8
  },
  {
    "book_id": "B047",
    "title": "Thinking, Fast and Slow",
    "author": "Daniel Kahneman",
    "genre": "Psychology",
    "published_year": 2011,
    "publisher": "Farrar, Straus and Giroux",
    "isbn": "9780374533557",
    "language": "English",
    "pages": 499,
    "available_copies": 6,
    "total_copies": 10,
    "location": "Shelf PS1",
    "tags": ["psychology", "decision making", "behavior"],
    "rating": 4.7
  },
  {
    "book_id": "B048",
    "title": "Man's Search for Meaning",
    "author": "Viktor E. Frankl",
    "genre": "Psychology",
    "published_year": 1946,
    "publisher": "Beacon Press",
    "isbn": "9780807014271",
    "language": "English",
    "pages": 200,
    "available_copies": 7,
    "total_copies": 10,
    "location": "Shelf PS2",
    "tags": ["psychology", "philosophy", "survival"],
    "rating": 4.8
  },
  {
    "book_id": "B049",
    "title": "The Myth of Sisyphus",
    "author": "Albert Camus",
    "genre": "Philosophy",
    "published_year": 1942,
    "publisher": "Gallimard",
    "isbn": "9780679733737",
    "language": "English",
    "pages": 212,
    "available_copies": 5,
    "total_copies": 8,
    "location": "Shelf P4",
    "tags": ["existentialism", "philosophy", "classic"],
    "rating": 4.6
  },
  {
    "book_id": "B050",
    "title": "The Stranger",
    "author": "Albert Camus",
    "genre": "Fiction",
    "published_year": 1942,
    "publisher": "Gallimard",
    "isbn": "9780679720201",
    "language": "English",
    "pages": 123,
    "available_copies": 6,
    "total_copies": 9,
    "location": "Shelf C23",
    "tags": ["existentialism", "fiction", "classic"],
    "rating": 4.7
  }
 ];
  sessionStorage.setItem('libraryBooks', JSON.stringify(books));
  renderBooks(books);
}
const colorPairs = [
      { bg: "#ffeb3b", text: "#000" },
      { bg: "#2196f3", text: "#fff" },
      { bg: "#f44336", text: "#fff" },
      { bg: "#4caf50", text: "#fff" },
      { bg: "#9c27b0", text: "#fff" },
      { bg: "#ff9800", text: "#000" }
    ];                        

function renderBooks(bookArray) {
  const bookList = document.getElementById('bookList');
  if (!bookList) return;
  bookList.innerHTML = '';

  bookArray.forEach((book, index) => {
    const li = document.createElement('li');
    const colors = colorPairs[index % colorPairs.length]; // cycle through colors

    // apply background and text color
    li.style.backgroundColor = colors.bg;
    li.style.color = colors.text;

    li.innerHTML = `
      <div class="book-card">
        <h3>${book.title} <small>(${book.book_id})</small></h3>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>Genre:</strong> ${book.genre}</p>
        <p><strong>Published:</strong> ${book.published_year} by ${book.publisher}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>Language:</strong> ${book.language}</p>
        <p><strong>Pages:</strong> ${book.pages}</p>
        <p><strong>Copies:</strong> ${book.available_copies} available / ${book.total_copies} total</p>
        <p><strong>Location:</strong> ${book.location}</p>
        <p><strong>Tags:</strong> ${book.tags.join(", ")}</p>
        <p><strong>Rating:</strong> ⭐ ${book.rating}</p>
      </div>
    `;
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
    const val = (book[filterType] !== undefined && book[filterType] !== null) 
      ? book[filterType].toString().toLowerCase() 
      : '';
    return val.includes(filterValue);
  });

  // render with colors applied
  const bookList = document.getElementById('bookList');
  if (!bookList) return;
  bookList.innerHTML = '';

  filtered.forEach((book, index) => {
    const li = document.createElement('li');
    const colors = colorPairs[index % colorPairs.length]; // cycle through colors
    li.style.backgroundColor = colors.bg;
    li.style.color = colors.text;

    li.innerHTML = `
      <div class="book-card">
        <h3>${book.title} <small>(${book.book_id})</small></h3>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>Genre:</strong> ${book.genre}</p>
        <p><strong>Published:</strong> ${book.published_year} by ${book.publisher}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>Language:</strong> ${book.language}</p>
        <p><strong>Pages:</strong> ${book.pages}</p>
        <p><strong>Copies:</strong> ${book.available_copies} available / ${book.total_copies} total</p>
        <p><strong>Location:</strong> ${book.location}</p>
        <p><strong>Tags:</strong> ${book.tags.join(", ")}</p>
        <p><strong>Rating:</strong> ⭐ ${book.rating}</p>
      </div>
    `;
    bookList.appendChild(li);
  });
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
