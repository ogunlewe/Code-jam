// login.js

document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
  
    // Get stored user credentials from cookies (set by signup page)
    const storedUsername = getCookie('username');
    const storedPassword = getCookie('password');
  
    // Check if credentials match
    if (usernameInput === storedUsername && passwordInput === storedPassword) {
      // Set a login session cookie with expiration and path
      document.cookie = `loggedIn=true; path=/; max-age=86400`; // 1 day expiration
      window.location.href = 'index.html'; // Redirect to index page
    } else {
      alert('Incorrect username or password.');
    }
  });
  
  // Utility function to get cookies
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  