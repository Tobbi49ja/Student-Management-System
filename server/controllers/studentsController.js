const Student = require('../models/student');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Function to generate custom student ID
const generateStudentId = async () => {
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;
  const lastStudent = await Student.findOne({ studentId: { $regex: `^${prefix}` } })
    .sort({ studentId: -1 });
  let nextNumber = 1;
  if (lastStudent && lastStudent.studentId) {
    const lastNumber = parseInt(lastStudent.studentId.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

exports.verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await Student.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const redirect = user.username === 'admin' ? '/admin' : '/profile';
    res.json({ token, redirect, message: 'Login successful', isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Error logging in:', error);
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.signup = async (req, res) => {
  const { name, username, email, password, age, courses, confirmPassword } = req.body;
  try {
    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required: Name, Username, Email, Password, Confirm Password' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    if (courses && (!Array.isArray(courses) || courses.some(c => !c || typeof c !== 'string'))) {
      return res.status(400).json({ message: 'Courses must be an array of non-empty strings' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const studentId = await generateStudentId();
    const student = new Student({
      studentId,
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      age: parseInt(age),
      courses: courses || [],
      isAdmin: false,
    });
    await student.save();

    res.status(201).json({ message: 'Account created successfully', student: { ...student._doc, password: undefined } });
  } catch (error) {
    console.error('Error creating account:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username, email, or student ID already exists' });
    }
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
};

exports.createStudent = async (req, res) => {
  const { name, username, email, password, confirmPassword, age, courses, isAdmin = false } = req.body;
  try {
    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required: Name, Username, Email, Password, Confirm Password' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    if (courses && (!Array.isArray(courses) || courses.some(c => !c || typeof c !== 'string'))) {
      return res.status(400).json({ message: 'Courses must be an array of non-empty strings' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const studentId = await generateStudentId();
    const student = new Student({
      studentId,
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      age: parseInt(age) || undefined,
      courses: courses || [],
      isAdmin,
    });
    await student.save();
    res.status(201).json({ message: 'Student created successfully', student: { ...student._doc, password: undefined } });
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username, email, or student ID already exists' });
    }
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  const { name, username, email, password, confirmPassword, age, courses, isAdmin } = req.body;
  try {
    if (!name || !username || !email) {
      return res.status(400).json({ message: 'Name, username, and email are required' });
    }

    if (password) {
      if (!confirmPassword) {
        return res.status(400).json({ message: 'Confirm Password is required when changing the password' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
    }

    const existingUser = await Student.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
      _id: { $ne: req.params.id },
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const updateData = {
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      age: parseInt(age) || undefined,
      courses: courses || [],
    };

    if (password && confirmPassword) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (isAdmin !== undefined && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can modify admin status' });
    }
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.username === 'admin') {
      return res.status(403).json({ message: 'Cannot delete the main admin account' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

exports.updateCourses = async (req, res) => {
  const { courses } = req.body;
  try {
    if (!Array.isArray(courses) || courses.some(c => !c || typeof c !== 'string')) {
      return res.status(400).json({ message: 'Courses must be an array of non-empty strings' });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.courses = courses;
    await student.save();
    res.json({ message: 'Courses updated successfully', student: { ...student._doc, password: undefined } });
  } catch (error) {
    console.error('Error updating courses:', error);
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Error updating courses', error: error.message });
  }
};

exports.toggleAdmin = async (req, res) => {
  const { isAdmin } = req.body;
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isAdmin },
      { new: true, runValidators: true }
    ).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Admin status updated successfully', student });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ message: 'Error updating admin status', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await Student.findOne({ username: req.user.username }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Validate ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      console.log('Invalid student ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Find student by ID
    console.log('Attempting to find student with ID:', req.params.id);
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log('Student not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Student not found' });
    }

    // Ensure studentId exists
    if (!student.studentId) {
      console.log('Student missing studentId, generating new one for ID:', req.params.id);
      student.studentId = await generateStudentId();
    }

    // Verify user authorization
    console.log('Verifying user:', { requestUser: req.user.username, studentUsername: student.username, isAdmin: req.user.isAdmin });
    if (student.username !== req.user.username && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to change this password' });
    }

    // Verify old password
    console.log('Comparing old password');
    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      console.log('Old password incorrect');
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Hash and save new password
    console.log('Hashing new password');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    console.log('Saving updated student with ID:', req.params.id);
    await student.save();
    console.log('Password changed successfully for student ID:', req.params.id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', {
      error: error.message,
      stack: error.stack,
      studentId: req.params.id,
      body: req.body,
    });
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
      return res.status(503).json({ message: 'Database connection error. Please try again later.' });
    }
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};