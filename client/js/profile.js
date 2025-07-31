document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/login';
    return;
  }

  try {
    // Fetch protected profile data
    const response = await fetch('http://localhost:5000/students', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      // Find the current user from the students list
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const currentUser = data.find(student => student._id === decodedToken.id);
      
      if (currentUser) {
        // Display profile data
        document.getElementById('student-info').innerHTML = `
          <div class="form-group">
            <label>Name:</label>
            <p>${currentUser.name}</p>
          </div>
          <div class="form-group">
            <label>Username:</label>
            <p>${currentUser.username}</p>
          </div>
          <div class="form-group">
            <label>Email:</label>
            <p>${currentUser.email}</p>
          </div>
          <div class="form-group">
            <label>Age:</label>
            <p>${currentUser.age}</p>
          </div>
          <div class="form-group">
            <label>Courses:</label>
            <p>${currentUser.courses.join(', ')}</p>
          </div>
        `;
      } else {
        document.getElementById('student-info').innerHTML = '<p>Error: User data not found</p>';
      }
    } else {
      document.getElementById('student-info').innerHTML = `<p>Error: ${data.message}</p>`;
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    document.getElementById('student-info').innerHTML = '<p>Error loading profile data</p>';
  }
});

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}