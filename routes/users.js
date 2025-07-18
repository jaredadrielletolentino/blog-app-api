const express = require('express');
const userController = require('../controllers/users');
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Authenticated user routes
router.get('/profile', verify, userController.getProfile);

// Admin-only routes
router.get('/', verify, verifyAdmin, userController.getAllUsers);

module.exports = router;