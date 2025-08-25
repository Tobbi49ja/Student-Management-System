document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login';
    return;
  }

  let currentUser;
  let courseToDelete;
  const API_BASE = window.location.origin;

  try {
    const response = await fetch(`${API_BASE}/students/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data;

      if (currentUser) {
        document.getElementById('name').textContent = currentUser.name || 'N/A';
        document.getElementById('username').textContent = `@${currentUser.username || 'N/A'}`;
        document.getElementById('studentId').textContent = `ID: ${currentUser._id || 'N/A'}`;
        document.getElementById('welcomeMessage').textContent = `Welcome back, @${currentUser.username || 'Student'}!`;

        renderCourses(currentUser.courses || []);

        renderStudentInfo(currentUser);

        const editBtn = document.createElement('button');
        editBtn.id = 'editProfileBtn';
        editBtn.className = 'btn btn-outline';
        editBtn.textContent = 'Edit Profile';
        document.getElementById('student-info').after(editBtn);

        const changePwdBtn = document.createElement('button');
        changePwdBtn.id = 'changePasswordBtn';
        changePwdBtn.className = 'btn btn-outline mt-2 ml-2 mb-5 media-adjustment';
        changePwdBtn.textContent = 'Change Password';
        editBtn.after(changePwdBtn);

        if (currentUser.isAdmin) {
          document.getElementById('adminLink').style.display = 'block';
          document.getElementById('adminIndicator').style.display = 'block';
        }
      } else {
        document.getElementById('student-info').innerHTML = '<p>Error: User data not found</p>';
      }
    } else {
      console.error('Fetch profile error:', data.message, 'Status:', response.status);
      document.getElementById('student-info').innerHTML = `<p>Error: ${data.message || 'Unable to fetch profile'}</p>`;
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    document.getElementById('student-info').innerHTML = '<p>Error loading profile data. Please check your connection and try again.</p>';
  }

  function capitalizeWords(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function renderCourses(courses) {
    const coursesTagsContainer = document.getElementById('coursesTags');
    coursesTagsContainer.innerHTML = '';
    const colors = ['indigo', 'purple', 'blue', 'green'];
    courses.forEach((course, index) => {
      const color = colors[index % colors.length];
      const tag = document.createElement('span');
      tag.className = `bg-${color}-100 text-${color}-800 text-xs px-2 py-1 rounded media-flex-card`;
      tag.textContent = course;
      coursesTagsContainer.appendChild(tag);
    });

    const coursesContainer = document.getElementById('coursesContainer');
    coursesContainer.innerHTML = '';
    courses.forEach((course, index) => {
      const color = colors[index % colors.length];
      const courseCard = document.createElement('div');
      courseCard.className = 'course-card bg-gray-100 p-4 rounded-lg';
      courseCard.innerHTML = `
        <div class="flex justify-between media-b items-start mb-2">
          <h3 class="font-bold  text-lg text-gray-800 media-font">${course}</h3>
          <div>
            <span class="text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-800">75%</span>
            <button class="delete-course-btn text-red-600 hover:text-red-800 transition" data-course="${course}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 75%"></div>
        </div>
      `;
      coursesContainer.appendChild(courseCard);
    });

    document.querySelectorAll('.delete-course-btn').forEach(button => {
      button.addEventListener('click', () => {
        courseToDelete = button.getAttribute('data-course');
        document.getElementById('deleteCourseName').textContent = `Are you sure you want to unenroll from ${courseToDelete}?`;
        document.getElementById('deleteCourseModal').style.display = 'flex';
      });
    });
  }

  function renderStudentInfo(student) {
    document.getElementById('student-info').innerHTML = `
      <div><strong>Email:</strong> ${student.email || 'N/A'}</div>
      <div class="media-adjust-mb-5"><strong>Age:</strong> ${student.age || 'N/A'}</div>
    `;
  }

  document.getElementById('addCourseBtn').addEventListener('click', () => {
    document.getElementById('addCourseModal').style.display = 'flex';
  });

  document.getElementById('submitAddCourse').addEventListener('click', async () => {
    const newCourse = document.getElementById('newCourseInput').value.trim();
    if (!newCourse) {
      alert('Please enter a course name');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/students/${currentUser._id}/courses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courses: [...(currentUser.courses || []), newCourse] }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Course added successfully');
        currentUser.courses = data.student.courses;
        renderCourses(currentUser.courses);
        document.getElementById('addCourseModal').style.display = 'none';
        document.getElementById('newCourseInput').value = '';
      } else {
        alert(data.message || 'Error adding course');
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Error adding course. Please try again.');
    }
  });

  document.getElementById('cancelAddCourse').addEventListener('click', () => {
    document.getElementById('addCourseModal').style.display = 'none';
    document.getElementById('newCourseInput').value = '';
  });

  document.getElementById('confirmDeleteCourse').addEventListener('click', async () => {
    try {
      const updatedCourses = (currentUser.courses || []).filter(course => course !== courseToDelete);
      const response = await fetch(`${API_BASE}/students/${currentUser._id}/courses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courses: updatedCourses }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Course deleted successfully');
        currentUser.courses = data.student.courses;
        renderCourses(currentUser.courses);
        document.getElementById('deleteCourseModal').style.display = 'none';
      } else {
        alert(data.message || 'Error deleting course');
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course. Please try again.');
    }
  });

  document.getElementById('cancelDeleteCourse').addEventListener('click', () => {
    document.getElementById('deleteCourseModal').style.display = 'none';
  });

  document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editUsername').value = currentUser.username || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editAge').value = currentUser.age || '';
    document.getElementById('editProfileModal').style.display = 'flex';
  });

  document.getElementById('cancelEditProfile').addEventListener('click', () => {
    document.getElementById('editProfileModal').style.display = 'none';
  });

  document.getElementById('submitEditProfile').addEventListener('click', async () => {
    const name = capitalizeWords(document.getElementById('editName').value.trim());
    const username = document.getElementById('editUsername').value.trim().toLowerCase();
    const email = document.getElementById('editEmail').value.trim().toLowerCase();
    const age = parseInt(document.getElementById('editAge').value) || undefined;

    if (!name || !username || !email) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/students/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, username, email, age }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Profile updated successfully');
        currentUser = data.student;
        document.getElementById('name').textContent = currentUser.name;
        document.getElementById('username').textContent = `@${currentUser.username}`;
        document.getElementById('studentId').textContent = `ID: ${currentUser._id}`;
        document.getElementById('welcomeMessage').textContent = `Welcome back, @${currentUser.username}!`;
        renderStudentInfo(currentUser);
        document.getElementById('editProfileModal').style.display = 'none';
      } else {
        alert(data.message || 'Error updating profile');
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  });

  document.getElementById('changePasswordBtn').addEventListener('click', () => {
    document.getElementById('changePasswordModal').style.display = 'flex';
  });

  document.getElementById('cancelChangePassword').addEventListener('click', () => {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
  });

  document.getElementById('submitChangePassword').addEventListener('click', async () => {
    const oldPassword = document.getElementById('oldPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();

    if (!currentUser || !currentUser._id) {
      alert('User data not loaded. Please refresh the page.');
      return;
    }

    if (!oldPassword || !newPassword) {
      alert('Please enter both old and new passwords');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    const requestBody = { oldPassword, newPassword };
    console.log('Change password request:', {
      url: `${API_BASE}/students/${currentUser._id}/change-password`,
      body: requestBody,
    });

    try {
      const response = await fetch(`${API_BASE}/students/${currentUser._id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Change password response:', { status: response.status, data });

      if (response.ok) {
        alert('Password changed successfully');
        document.getElementById('changePasswordModal').style.display = 'none';
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
      } else {
        console.error('Change password error:', data.message, 'Status:', response.status);
        alert(data.message || 'Error changing password. Please try again.');
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password. Please check your connection and try again.');
    }
  });

  document.getElementById('toggleOldPassword').addEventListener('click', () => {
    const oldPasswordInput = document.getElementById('oldPassword');
    const toggleIcon = document.getElementById('toggleOldPassword');
    if (oldPasswordInput.type === 'password') {
      oldPasswordInput.type = 'text';
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
    } else {
      oldPasswordInput.type = 'password';
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
    }
  });

  document.getElementById('toggleNewPassword').addEventListener('click', () => {
    const newPasswordInput = document.getElementById('newPassword');
    const toggleIcon = document.getElementById('toggleNewPassword');
    if (newPasswordInput.type === 'password') {
      newPasswordInput.type = 'text';
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
    } else {
      newPasswordInput.type = 'password';
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
    }
  });

  document.getElementById('profileUpload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById('profileImage').src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  });
});