// Creating a Map to store students with their name as the key and their info as the value
const studentsMap = new Map();

// Creating a Set to track unique courses
const coursesSet = new Set();

// Symbol for password security
const passwordSymbol = Symbol('password');

// Add Student Function
function addStudent(name, age, courses, password) {
  // Ensure no duplicate student names
  if (studentsMap.has(name)) {
    alert("This student already exists!");
    return;
  }

  // Add the student to the students map
  const student = {
    name,
    age,
    courses: courses.split(",").map(course => course.trim()), // Split and clean up course names
    [passwordSymbol]: password
  };

  studentsMap.set(name, student);

  // Add unique courses to the Set
  student.courses.forEach(course => coursesSet.add(course));
}

// Display Students Function
function displayStudents() {
    const studentsList = document.getElementById('students-list');
    studentsList.innerHTML = ''; // Clear existing list

    studentsMap.forEach((student, name) => {
        const listItem = document.createElement('li');
        listItem.className = 'student-item'; // Add a class for styling
        listItem.innerHTML = `
            <div class="student-info">
                <p><strong>Name:</strong> ${student.name}</p>
                <p><strong>Age:</strong> ${student.age}</p>
                <p><strong>Courses:</strong> ${student.courses.join(', ')}</p>
            </div>
            <button class="btn  btn-block red" onclick="deleteStudent('${name}')">Delete Student</button>
        `;
        studentsList.appendChild(listItem);
    });
}

// Delete Student Function
function deleteStudent(name) {
  if (studentsMap.has(name)) {
    studentsMap.delete(name);
    displayStudents(); // Update the list after deletion
  } else {
    alert("Student not found!");
  }
}

// Clear All Students Function
function clearAllStudents() {
  studentsMap.clear();
  displayStudents();
}

// Add Event Listeners to buttons
document.getElementById('add-student').addEventListener('click', () => {
  const name = document.getElementById('student-name').value;
  const age = document.getElementById('student-age').value;
  const courses = document.getElementById('student-courses').value;
  const password = document.getElementById('student-password').value;

  if (name && age && courses && password) {
    addStudent(name, age, courses, password);
    displayStudents();
    document.getElementById('student-name').value = '';
    document.getElementById('student-age').value = '';
    document.getElementById('student-courses').value = '';
    document.getElementById('student-password').value = '';
  } else {
    alert("Please fill all fields!");
  }
});

document.getElementById('view-students').addEventListener('click', displayStudents);
document.getElementById('clear-all').addEventListener('click', clearAllStudents);