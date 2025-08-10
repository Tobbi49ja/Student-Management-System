document.getElementById('signupFormPart2').addEventListener('submit', async function(event) {
  event.preventDefault();

  const nameInput = document.getElementById('signup-name');
  const usernameInput = document.getElementById('signup-username');
  const emailInput = document.getElementById('signup-email');
  const age = document.getElementById('signup-age').value;
  const course = document.getElementById('signup-courses').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;
  const errorMessage = document.getElementById('signup-error');

  // Get sanitized values
  const name = nameInput.value.trim();
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  // Validate inputs
  if (!name || !username || !email || !age || !course || !password || !confirmPassword) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Please fill all fields';
    return;
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!emailRegex.test(email)) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Email must end with @gmail.com';
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Passwords do not match';
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, age, courses: [course], password })
    });

    const data = await response.json();

    if (response.ok) {
      // Redirect to login page after successful signup
      window.location.href = '/login';
    } else {
      errorMessage.style.display = 'block';
      errorMessage.textContent = data.message === 'Email already exists' 
        ? 'This email is already registered. Please use a different email.'
        : data.message || 'Error creating account';
    }
  } catch (error) {
    console.error('Error signing up:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Error signing up. Please try again.';
  }
});

// Capitalize first letter of each word in Full Name
document.getElementById('signup-name').addEventListener('input', function() {
  const input = this.value.trim();
  if (input) {
    this.value = input
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
});

// Ensure username starts with lowercase
document.getElementById('signup-username').addEventListener('input', function() {
  const input = this.value.trim();
  if (input) {
    this.value = input.charAt(0).toLowerCase() + input.slice(1);
  }
});

// Password toggle functionality
document.querySelectorAll('.toggle-password').forEach(toggle => {
  toggle.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    this.textContent = isPassword ? '🙈' : '👁️';
  });
});