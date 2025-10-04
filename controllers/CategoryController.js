const { Category, Transaction } = require('../models');
const { Op } = require('sequelize');

const addCategory = async (req, res) => {
    try {
        const { name, description, type, color } = req.body;
        
        // Check if category with same name and type already exists
        const existingCategory = await Category.findOne({
            where: { name, type }
        });
        
        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: 'Category with this name and type already exists'
            });
        }
        
        const category = await Category.create({ 
            name, 
            description, 
            type, 
            color: color || '#007bff'
        });
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const { type, active } = req.query;
        const whereClause = {};
        
        if (type) whereClause.type = type;
        if (active !== undefined) whereClause.isActive = active === 'true';
        
        const categories = await Category.findAll({
            where: whereClause,
            order: [['name', 'ASC']],
            include: [
                {
                    model: Transaction,
                    attributes: [],
                    required: false
                }
            ],
            attributes: {
                include: [
                    [
                        Category.sequelize.fn('COUNT', Category.sequelize.col('Transactions.id')),
                        'transactionCount'
                    ]
                ]
            },
            group: ['Category.id']
        });
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch categories',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findByPk(id, {
            include: [
                {
                    model: Transaction,
                    attributes: ['id', 'amount', 'description', 'date'],
                    limit: 10,
                    order: [['date', 'DESC']]
                }
            ]
        });
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, color, isActive } = req.body;
        
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Check for duplicate name/type combination if name or type is being updated
        if (name || type) {
            const existingCategory = await Category.findOne({
                where: {
                    name: name || category.name,
                    type: type || category.type,
                    id: { [Op.ne]: id }
                }
            });
            
            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: 'Category with this name and type already exists'
                });
            }
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;
        if (color !== undefined) updateData.color = color;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        await category.update(updateData);
        
        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Check if category has associated transactions
        const transactionCount = await Transaction.count({
            where: { categoryId: id }
        });
        
        if (transactionCount > 0) {
            // Soft delete by setting isActive to false
            await category.update({ isActive: false });
            return res.status(200).json({
                success: true,
                message: 'Category deactivated successfully (has associated transactions)'
            });
        }
        
        // Hard delete if no transactions
        await category.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = { 
    addCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};

