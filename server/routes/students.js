const express = require('express');
const router = express.Router();

let studentsController;
try {
  studentsController = require('../controllers/studentsController');
} catch (error) {
  console.error('Error loading studentsController:', error);
  throw new Error('Failed to load studentsController');
}

// Unprotected routes
router.post('/', studentsController.signup); // Signup route
router.post('/login', studentsController.login); // Login route

// Protected routes
router.get('/me', studentsController.verifyToken, studentsController.getMe);
router.get('/', studentsController.verifyToken, studentsController.verifyAdmin, studentsController.getStudents);
router.get('/:id', studentsController.verifyToken, studentsController.getStudent);
router.put('/:id', studentsController.verifyToken, studentsController.updateStudent);
router.delete('/:id', studentsController.verifyToken, studentsController.verifyAdmin, studentsController.deleteStudent);
router.put('/:id/courses', studentsController.verifyToken, studentsController.updateCourses);
router.put('/:id/admin', studentsController.verifyToken, studentsController.verifyAdmin, studentsController.toggleAdmin);
router.post('/:id/change-password', studentsController.verifyToken, studentsController.changePassword);

module.exports = router;