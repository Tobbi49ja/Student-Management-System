document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login';
    return;
  }

  const API_BASE = window.location.origin;

  // Capitalize words function
  function capitalizeWords(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Fetch and display students
  async function fetchStudents() {
    try {
      const response = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const studentTableBody = document.getElementById('studentTableBody');
        studentTableBody.innerHTML = '';
        data.forEach(student => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="p-2">${student.name}</td>
            <td class="p-2">${student.username}</td>
            <td class="p-2">${student.email}</td>
            <td class="p-2">${student.age || '-'}</td>
            <td class="p-2">${student.courses ? student.courses.join(', ') : '-'}</td>
            <td class="p-2">${student.isAdmin ? 'Yes' : 'No'}</td>
            <td class="p-2">
              <button class="edit-student-btn text-blue-600 hover:text-blue-800 transition" data-id="${student._id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-student-btn text-red-600 hover:text-red-800 transition" data-id="${student._id}" data-name="${student.name}" ${student.username === 'admin' ? 'disabled title="Cannot delete main admin"' : ''}>
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          studentTableBody.appendChild(row);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-student-btn').forEach(button => {
          button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            editStudent(studentId);
          });
        });

        document.querySelectorAll('.delete-student-btn:not(:disabled)').forEach(button => {
          button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-id');
            const studentName = button.getAttribute('data-name');
            document.getElementById('deleteStudentName').textContent = `Are you sure you want to delete ${studentName}?`;
            document.getElementById('deleteStudentModal').style.display = 'flex';
            document.getElementById('confirmDeleteStudent').onclick = () => deleteStudent(studentId);
          });
        });
      } else {
        console.error('Fetch students error:', data.message, 'Status:', response.status);
        alert(data.message || 'Error fetching students');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error loading students. Please check your connection and try again.');
    }
  }

  // Load students initially
  fetchStudents();

  // Clear form
  document.getElementById('clearForm').addEventListener('click', () => {
    document.getElementById('adminName').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminConfirmPassword').value = '';
    document.getElementById('adminAge').value = '';
    document.getElementById('adminCourses').value = '';
    document.getElementById('adminIsAdmin').checked = false;
    document.getElementById('submitStudent').textContent = 'Add Student';
    document.getElementById('confirmPasswordField').classList.remove('hidden');
    const hiddenInput = document.getElementById('adminStudentId');
    if (hiddenInput) hiddenInput.remove();
  });

  // Submit student (add or edit)
  document.getElementById('submitStudent').addEventListener('click', async () => {
    const name = capitalizeWords(document.getElementById('adminName').value.trim());
    const username = document.getElementById('adminUsername').value.trim().toLowerCase();
    const email = document.getElementById('adminEmail').value.trim().toLowerCase();
    const password = document.getElementById('adminPassword').value.trim();
    const confirmPassword = document.getElementById('adminConfirmPassword').value.trim();
    const age = parseInt(document.getElementById('adminAge').value) || undefined;
    const coursesInput = document.getElementById('adminCourses').value.trim();
    const courses = coursesInput ? coursesInput.split(',').map(c => c.trim()).filter(c => c) : [];
    const isAdmin = document.getElementById('adminIsAdmin').checked;
    const isEditing = document.getElementById('submitStudent').textContent === 'Update Student';
    const studentId = document.getElementById('adminStudentId')?.value;

    // Validate required fields
    if (!name || !username || !email) {
      alert('Please fill all required fields: Name, Username, Email');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      alert('Email must end with @gmail.com');
      return;
    }

    if (courses.some(c => c.length === 0)) {
      alert('Courses must be non-empty');
      return;
    }

    if (!isEditing) {
      if (!password || !confirmPassword) {
        alert('Password and Confirm Password are required for new students');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
    } else if (password && password !== '********') {
      if (!confirmPassword) {
        alert('Confirm Password is required when changing the password');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
    }

    const studentData = { name, username, email, age, courses, isAdmin };
    if (password && password !== '********') {
      studentData.password = password;
      studentData.confirmPassword = confirmPassword;
    }

    try {
      const url = isEditing && studentId ? `${API_BASE}/students/${studentId}` : `${API_BASE}/students`;
      const method = isEditing && studentId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();
      if (response.ok) {
        alert(isEditing ? `Student updated successfully${password && password !== '********' ? ' with new password' : ''}` : 'Student added successfully');
        document.getElementById('clearForm').click();
        fetchStudents();
      } else {
        console.error('Save student error:', data.message, 'Status:', response.status, 'URL:', url, 'Data sent:', studentData);
        alert(data.message || 'Error saving student');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student. Please check your connection and try again.');
    }
  });

  // Edit student
  async function editStudent(studentId) {
    try {
      const response = await fetch(`${API_BASE}/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const student = data;
        document.getElementById('adminName').value = student.name || '';
        document.getElementById('adminUsername').value = student.username || '';
        document.getElementById('adminEmail').value = student.email || '';
        document.getElementById('adminPassword').value = '********';
        document.getElementById('adminConfirmPassword').value = '';
        document.getElementById('adminAge').value = student.age || '';
        document.getElementById('adminCourses').value = student.courses ? student.courses.join(', ') : '';
        document.getElementById('adminIsAdmin').checked = student.isAdmin || false;
        document.getElementById('confirmPasswordField').classList.add('hidden');
        let hiddenInput = document.getElementById('adminStudentId');
        if (!hiddenInput) {
          hiddenInput = document.createElement('input');
          hiddenInput.id = 'adminStudentId';
          hiddenInput.type = 'hidden';
          document.querySelector('.form-group').appendChild(hiddenInput);
        }
        hiddenInput.value = studentId;
        document.getElementById('submitStudent').textContent = 'Update Student';
      } else {
        console.error('Load student error:', data.message, 'Status:', response.status, 'Student ID:', studentId);
        alert(data.message || 'Error loading student data');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      alert('Error loading student data. Please check your connection and try again.');
    }
  }

  // Delete student
  async function deleteStudent(studentId) {
    try {
      const response = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        alert('Student deleted successfully');
        document.getElementById('deleteStudentModal').style.display = 'none';
        fetchStudents();
      } else {
        console.error('Delete student error:', data.message, 'Status:', response.status);
        alert(data.message || 'Error deleting student');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student. Please check your connection and try again.');
    }
  }

  // Cancel delete
  document.getElementById('cancelDeleteStudent').addEventListener('click', () => {
    document.getElementById('deleteStudentModal').style.display = 'none';
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  });
});