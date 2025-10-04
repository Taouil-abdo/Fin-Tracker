const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/DashboardController');
const authMiddleware = require('../middlewares/auth');

router.get('/data', authMiddleware, getDashboardData);

module.exports = router;