document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const identifier = document.getElementById('identifier').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  try {
    // Send POST request to login
    const response = await fetch('http://localhost:5000/students/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Store JWT token in localStorage
      localStorage.setItem('token', data.token);
      // Redirect to the profile page
      window.location.href = '/profile';
    } else {
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'Incorrect credentials';
    }
  } catch (error) {
    console.error('Error logging in:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Error logging in. Please try again.';
  }
});