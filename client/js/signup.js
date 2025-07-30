document.getElementById('signupForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const name = document.getElementById('signup-name').value;
  const username = document.getElementById('signup-email').value;
  const age = document.getElementById('signup-age').value;
  const courses = document.getElementById('signup-courses').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;
  const errorMessage = document.getElementById('signup-error');

  if (password !== confirmPassword) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Passwords do not match';
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age, courses: courses.split(',').map(c => c.trim()), username, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Redirect to login page after successful signup
      window.location.href = '/login';
    } else {
      errorMessage.style.display = 'block';
      errorMessage.textContent = data.message || 'Error creating account';
    }
  } catch (error) {
    console.error('Error signing up:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Error signing up. Please try again.';
  }
});