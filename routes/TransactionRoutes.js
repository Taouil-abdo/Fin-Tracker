const express = require('express');
const router = express.Router();
const { 
    addTransaction, 
    getAllTransactions, 
    getTransactionById,
    updateTransaction, 
    deleteTransaction,
    getTransactionSummary
} = require('../controllers/TransactionController');
const authMiddleware = require('../middlewares/auth');
const { transactionValidation } = require('../middlewares/validation');

router.post('/', authMiddleware, transactionValidation.create, addTransaction);
router.get('/', authMiddleware, getAllTransactions);
router.get('/summary', authMiddleware, getTransactionSummary);
router.get('/:id', authMiddleware, getTransactionById);
router.put('/:id', authMiddleware, transactionValidation.update, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

module.exports = router;