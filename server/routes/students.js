const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');

router.post('/', studentsController.createStudent);
router.get('/', studentsController.verifyToken, studentsController.getAllStudents);
router.put('/:id', studentsController.verifyToken, studentsController.updateStudent);
router.delete('/:id', studentsController.verifyToken, studentsController.deleteStudent);
router.post('/login', studentsController.loginStudent);
router.post('/sync-local-to-atlas', studentsController.verifyToken, studentsController.syncLocalToAtlas);

module.exports = router;