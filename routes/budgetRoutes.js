const express = require('express');
const router = express.Router();
const { 
    addBudget, 
    getAllBudgets, 
    getBudgetById,
    updateBudget, 
    deleteBudget,
    getBudgetAnalytics
} = require('../controllers/BudgetController');
const authMiddleware = require('../middlewares/auth');
const { budgetValidation } = require('../middlewares/validation');

router.post('/', authMiddleware, budgetValidation.create, addBudget);
router.get('/', authMiddleware, getAllBudgets);
router.get('/analytics', authMiddleware, getBudgetAnalytics);
router.get('/:id', authMiddleware, getBudgetById);
router.put('/:id', authMiddleware, budgetValidation.update, updateBudget);
router.delete('/:id', authMiddleware, deleteBudget);

module.exports = router;