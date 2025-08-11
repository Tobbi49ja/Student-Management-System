document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const identifier = document.getElementById('identifier').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  try {
    const API_BASE = window.location.origin;
    const response = await fetch(`${API_BASE}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
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

document.querySelectorAll('.toggle-password').forEach(toggle => {
  toggle.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = input.type === 'password' ? '👁️' : '🙈';
  });
});
