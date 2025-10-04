const express = require('express');
const router = express.Router();
const { 
    addGoal, 
    getAllGoals, 
    getGoalById,
    updateGoal, 
    deleteGoal,
    updateGoalProgress,
    getGoalAnalytics
} = require('../controllers/GoalController');
const authMiddleware = require('../middlewares/auth');
const { goalValidation } = require('../middlewares/validation');

router.post('/', authMiddleware, goalValidation.create, addGoal);
router.get('/', authMiddleware, getAllGoals);
router.get('/analytics', authMiddleware, getGoalAnalytics);
router.get('/:id', authMiddleware, getGoalById);
router.put('/:id', authMiddleware, goalValidation.update, updateGoal);
router.patch('/:id/progress', authMiddleware, updateGoalProgress);
router.delete('/:id', authMiddleware, deleteGoal);

module.exports = router;