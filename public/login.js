// login.js

// Attach event listener to form submit
document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form from refreshing the page
  
    // Log to check if the form is being submitted
    console.log('Login form submitted');
  
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
  
    // Get stored user credentials from cookies (set by signup page)
    const storedUsername = getCookie('username');
    const storedPassword = getCookie('password');
  
    // Log user inputs and cookies for debugging
    console.log('Entered Username:', usernameInput);
    console.log('Entered Password:', passwordInput);
    console.log('Stored Username:', storedUsername);
    console.log('Stored Password:', storedPassword);
  
    // Check if credentials match
    if (usernameInput === storedUsername && passwordInput === storedPassword) {
      // Set a login session cookie with an expiration of 1 day and path for all pages
      document.cookie = `loggedIn=true; path=/; max-age=86400`; // 1 day expiration
  
      // Log to confirm cookie has been set
      console.log('LoggedIn cookie set:', document.cookie);
  
      // Redirect to index page
      window.location.href = 'index.html'; 
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
  