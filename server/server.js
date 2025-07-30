const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const { students } = require("./routes/api"); // Importing the students array from api.js

const PORT = process.env.PORT || 5000;

app.use(express.json());

mongoose
  .connect("mongodb://localhost/studentdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "home", "index.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "SignUp", "index.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "Login", "index.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "Profile", "index.html"));
});
// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  courses: [String],
});

// Student Model
const Student = mongoose.model('Student', studentSchema);

// Create new student
app.post('/students', async (req, res) => {
  const { name, age, courses } = req.body;
  const student = new Student({ name, age, courses });

  try {
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: 'Error adding student', error });
  }
});

// Get all students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving students', error });
  }
});

// Update a student
app.put('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: 'Error updating student', error });
  }
});

// Delete a student
app.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting student', error });
  }
});
app.use((req, res) => {
  res
    .status(404)
    .sendFile(path.join(__dirname, "../client", "error", "index.html"));
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
