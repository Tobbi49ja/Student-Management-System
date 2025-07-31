const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  courses: [String],
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// Student Model
const Student = mongoose.model('Student', studentSchema);

exports.createStudent = async (req, res) => {
  const { name, age, courses, username, email, password } = req.body;
  try {
    const existingStudent = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingStudent) {
      const message = existingStudent.username === username ? 'Username already in use' : 'Email already in use';
      return res.status(400).json({ message });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({ name, age, courses, username, email, password: hashedPassword });
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: 'Error adding student', error });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving students', error });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: 'Error updating student', error });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting student', error });
  }
};

exports.loginStudent = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username or email and password are required' });
  }
  try {
    const student = await Student.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!student) {
      return res.status(401).json({ message: 'Incorrect credentials' });
    }
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect credentials' });
    }
    const token = jwt.sign({ id: student._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};