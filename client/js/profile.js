document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Fetch protected profile data
        const response = await fetch('http://localhost:8000/students', {
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
                // Populate profile data in left panel
                document.getElementById('name').textContent = currentUser.name;
                document.getElementById('username').textContent = `@${currentUser.username}`;
                document.getElementById('studentId').textContent = `ID: ${currentUser._id}`;
                document.getElementById('welcomeMessage').textContent = `Welcome back, @${currentUser.username}!`;

                // Populate courses tags
                const coursesTagsContainer = document.getElementById('coursesTags');
                coursesTagsContainer.innerHTML = '';
                const colors = ['indigo', 'purple', 'blue', 'green'];
                currentUser.courses.forEach((course, index) => {
                    const color = colors[index % colors.length];
                    const tag = document.createElement('span');
                    tag.className = `bg-${color}-100 text-${color}-800 text-xs px-2 py-1 rounded`;
                    tag.textContent = course;
                    coursesTagsContainer.appendChild(tag);
                });

                // Populate personal information
                document.getElementById('student-info').innerHTML = `
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Email:</span>
                            <span class="font-medium">${currentUser.email}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Age:</span>
                            <span class="font-medium">${currentUser.age}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">GPA:</span>
                            <span class="font-medium text-green-600">3.78</span>
                        </div>
                    </div>
                `;

                // Populate courses in main content
                const coursesContainer = document.getElementById('coursesContainer');
                coursesContainer.innerHTML = '';
                currentUser.courses.forEach((course, index) => {
                    const color = colors[index % colors.length];
                    const courseCard = document.createElement('div');
                    courseCard.className = 'course-card';
                    courseCard.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-lg text-gray-800">${course}</h3>
                            <span class="text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-800">75%</span>
                        </div>
                        <h4 class="text-gray-700 mb-1">${course}</h4>
                        <p class="text-sm text-gray-500 mb-3">Instructor:Prof Tobias</p>
                        <div class="progress-bar">
                            <div class="progress-fill bg-${color}-500" style="width: 75%"></div>
                        </div>
                        <div class="flex justify-between mt-3">
                            <a href="#" class="text-sm text-${color}-600 hover:text-${color}-800 transition">Materials</a>
                            <a href="#" class="text-sm text-${color}-600 hover:text-${color}-800 transition">Assignments</a>
                            <a href="#" class="text-sm text-${color}-600 hover:text-${color}-800 transition">Grades</a>
                        </div>
                    `;
                    coursesContainer.appendChild(courseCard);
                });
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

// Profile picture upload functionality
document.getElementById('profileUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result;
            // i shld upload to server here
        };
        reader.readAsDataURL(file);
    }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.href = '/login';
});