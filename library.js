    const userHome= document.getElementById("returnHome");
    // In library.js
    function showUserHome() {
      const params = new URLSearchParams(window.location.search);
      const userName = params.get("name");

      if (userName) {
        document.getElementById("userGreeting").textContent = `Welcome, ${userName}!`;
      }
    }

  function showBooks() {
      const books = [{
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
    }];
      sessionStorage.setItem("libraryBooks", JSON.stringify(books));
    renderBooks(books);
  }

function renderBooks(bookArray) {
  const bookList = document.getElementById("bookList");
  bookList.innerHTML = "";

  bookArray.forEach(book => {
    const li = document.createElement("li");
    li.textContent = `${book.title} by ${book.author} (${book.available_copies}/${book.total_copies} available)`;
    bookList.appendChild(li);
  });
}

function filterBooks() {
  const filterType = document.getElementById("filterType").value;
  const filterValue = document.getElementById("filterValue").value.toLowerCase();

  const storedBooks = JSON.parse(sessionStorage.getItem("libraryBooks"));

  const filtered = storedBooks.filter(book => {
    return book[filterType].toString().toLowerCase().includes(filterValue);
  });

  renderBooks(filtered);
}

userHome.addEventListener("click", function returnToDashboard(){
  window.location.href="userDashboard.html";
});