const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/UserController');
const authMiddleware = require('../middlewares/auth');

router.get('/profile', authMiddleware, getUserProfile);

module.exports = router;