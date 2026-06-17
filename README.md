# 🔐 Secure Library Management - Login System

A modern, responsive, and secure authentication system built with vanilla JavaScript and Web Crypto API.

## ✨ Features

- ✅ **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- 🔒 **Secure Encryption** - AES-256-GCM encryption for user data
- 🔐 **Password Hashing** - SHA-256 hashing for password storage
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations
- 📱 **Mobile Optimized** - Touch-friendly buttons and readable fonts
- ♿ **Accessible** - WCAG 2.1 compliant with keyboard navigation
- 🌓 **Dark Mode** - Automatic dark mode support
- ⚡ **No Backend Required** - Works entirely in the browser with localStorage
- 📦 **Local Storage** - User data persists between sessions
- ✔️ **Form Validation** - Real-time validation with clear error messages

## 📂 Project Structure

```
├── index.html       # Main HTML file with form structure
├── styles.css       # Responsive styling and animations
├── script.js        # JavaScript logic with encryption
├── manifest.json    # PWA manifest for mobile app experience
└── README.md        # Documentation
```

## 🚀 Quick Start

### Option 1: Local File System
1. Download all files (`index.html`, `styles.css`, `script.js`, `manifest.json`)
2. Place them in the same folder
3. Open `index.html` in your browser
4. Done! No installation required

### Option 2: GitHub Pages (Recommended for Remote Access)
1. Fork this repository
2. Go to Settings → Pages
3. Select `main` branch as source
4. Your app will be live at: `https://yourusername.github.io/Modern_web_Projects/`

### Option 3: Simple HTTP Server
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if http-server installed)
http-server

# PHP
php -S localhost:8000
```
Then visit: `http://localhost:8000`

## 💻 How to Use

### Sign Up
1. Click "New user? Sign Up"
2. Fill in all required fields:
   - Full Name
   - Email Address
   - Gender
   - Age
   - Password (minimum 6 characters)
3. Click "Sign Up" button
4. Your account is created and encrypted locally

### Login
1. Enter your registered email
2. Enter your password
3. Click "Login"
4. View your profile information
5. Click "Logout" to sign out

## 🔒 Security Features

### Encryption
- **AES-256-GCM** encryption for user data
- Random IV (Initialization Vector) for each encryption
- Base64 encoding for storage compatibility

### Password Security
- **SHA-256** hashing algorithm
- Passwords never stored in plain text
- One-way hashing prevents data compromise

### Data Storage
- User data encrypted in browser's localStorage
- No server communication (client-side only)
- Automatic session persistence

## 📱 Browser Compatibility

| Browser | Support |
|---------|----------|
| Chrome/Chromium | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| IE 11 | ❌ Not Supported |

## 🎨 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 📋 Form Validation

### Sign Up Validation
- ✓ Name: Minimum 2 characters
- ✓ Email: Valid email format
- ✓ Gender: Must select one
- ✓ Age: Between 1-120
- ✓ Password: Minimum 6 characters

### Login Validation
- ✓ Email: Valid email format
- ✓ Password: Required field

## 🔧 Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
}
```

### Modify Encryption Secret
Edit in `script.js`:
```javascript
ENCRYPTION_SECRET: 'your-custom-secret-key-here'
```

### Adjust Password Requirements
Edit validation in `script.js`:
```javascript
validatePassword(password) {
  return password.length >= 8; // Change 6 to 8
}
```

## 📊 Local Storage Data Structure

User data is stored as encrypted JSON:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "gender": "Male",
  "age": "25",
  "password": "hashed_password_here"
}
```

## ⚠️ Important Notes

### For Production Use
1. **Use HTTPS** - Always use HTTPS for real applications
2. **Backend Implementation** - Add server-side validation and secure database
3. **API Keys** - Never hardcode secrets in client-side code
4. **Database** - Implement proper user database instead of localStorage
5. **Authentication** - Use industry-standard auth (OAuth, JWT, etc.)

### Current Limitations
- Data stored only in browser (clears if cache is cleared)
- Single user per browser
- No password recovery
- No email verification
- Client-side only (not production-ready)

## 🐛 Troubleshooting

### Forms not working?
- Check browser console for errors (F12)
- Ensure all files are in the same directory
- Clear browser cache and reload

### Data not persisting?
- Check if localStorage is enabled
- Try in incognito/private mode
- Clear localStorage if corrupted

### Encryption errors?
- Ensure using HTTPS (required for Web Crypto)
- Check browser compatibility
- Verify encryption secret hasn't changed

## 📚 Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Flexbox, Grid, Animations
- **JavaScript (ES6+)** - Modern syntax
- **Web Crypto API** - Browser-based encryption
- **LocalStorage API** - Client-side persistence

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 📄 License

This project is open source and available for educational use.

## 📧 Support

For issues or questions, please create a GitHub issue.

---

**Made with ❤️ for secure authentication**