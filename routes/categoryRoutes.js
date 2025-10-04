const express = require('express');
const router = express.Router();
const { 
    addCategory, 
    getAllCategories, 
    getCategoryById,
    updateCategory, 
    deleteCategory 
} = require('../controllers/CategoryController');
const authMiddleware = require('../middlewares/auth');
const { categoryValidation } = require('../middlewares/validation');

router.post('/', authMiddleware, categoryValidation.create, addCategory);
router.get('/', authMiddleware, getAllCategories);
router.get('/:id', authMiddleware, getCategoryById);
router.put('/:id', authMiddleware, categoryValidation.update, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;