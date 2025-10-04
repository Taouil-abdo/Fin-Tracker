const { Transaction, Category, User, Budget } = require('../models');
const { Op } = require('sequelize');
const db = require('../config/database');

const addTransaction = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const { description, amount, type, categoryId, date, notes } = req.body;
        const userId = req.user.id;
        
        // Verify category exists and belongs to correct type
        const category = await Category.findByPk(categoryId);
        if (!category) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        if (category.type !== type) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Transaction type must match category type'
            });
        }
        
        const transaction = await Transaction.create({ 
            description, 
            amount, 
            type, 
            categoryId, 
            date: date || new Date(),
            notes,
            userId 
        }, { transaction: t });
        
        // Update budget spent amount if it's an expense
        if (type === 'expense') {
            await updateBudgetSpentAmount(userId, amount, date, t);
        }
        
        await t.commit();
        
        // Fetch the created transaction with category info
        const createdTransaction = await Transaction.findByPk(transaction.id, {
            include: [{ model: Category, attributes: ['name', 'type', 'color'] }]
        });
        
        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: createdTransaction
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating transaction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create transaction',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            page = 1, 
            limit = 10, 
            type, 
            categoryId, 
            startDate, 
            endDate,
            search 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const whereClause = { userId };
        
        if (type) whereClause.type = type;
        if (categoryId) whereClause.categoryId = categoryId;
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        }
        if (search) {
            whereClause[Op.or] = [
                { description: { [Op.like]: `%${search}%` } },
                { notes: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const { count, rows: transactions } = await Transaction.findAndCountAll({
            where: whereClause,
            include: [{ 
                model: Category, 
                attributes: ['name', 'type', 'color'] 
            }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch transactions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const transaction = await Transaction.findOne({
            where: { id, userId },
            include: [{ 
                model: Category, 
                attributes: ['name', 'type', 'color'] 
            }]
        });
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch transaction',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const updateTransaction = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const { id } = req.params;
        const { description, amount, type, categoryId, date, notes } = req.body;
        const userId = req.user.id;
        
        const transaction = await Transaction.findOne({
            where: { id, userId }
        });
        
        if (!transaction) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        // Store old values for budget updates
        const oldAmount = transaction.amount;
        const oldType = transaction.type;
        const oldDate = transaction.date;
        
        // Verify category if being updated
        if (categoryId) {
            const category = await Category.findByPk(categoryId);
            if (!category) {
                await t.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            
            if (type && category.type !== type) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Transaction type must match category type'
                });
            }
        }
        
        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = amount;
        if (type !== undefined) updateData.type = type;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (date !== undefined) updateData.date = date;
        if (notes !== undefined) updateData.notes = notes;
        
        await transaction.update(updateData, { transaction: t });
        
        // Update budget amounts if expense amounts changed
        if (oldType === 'expense' || (type && type === 'expense')) {
            // Reverse old expense
            if (oldType === 'expense') {
                await updateBudgetSpentAmount(userId, -oldAmount, oldDate, t);
            }
            // Add new expense
            if (type === 'expense' || (!type && oldType === 'expense')) {
                const newAmount = amount !== undefined ? amount : oldAmount;
                const newDate = date !== undefined ? date : oldDate;
                await updateBudgetSpentAmount(userId, newAmount, newDate, t);
            }
        }
        
        await t.commit();
        
        // Fetch updated transaction with category info
        const updatedTransaction = await Transaction.findByPk(id, {
            include: [{ model: Category, attributes: ['name', 'type', 'color'] }]
        });
        
        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: updatedTransaction
        });
    } catch (error) {
        await t.rollback();
        console.error('Error updating transaction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update transaction',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const deleteTransaction = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const transaction = await Transaction.findOne({
            where: { id, userId }
        });
        
        if (!transaction) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        // Update budget if it was an expense
        if (transaction.type === 'expense') {
            await updateBudgetSpentAmount(userId, -transaction.amount, transaction.date, t);
        }
        
        await transaction.destroy({ transaction: t });
        await t.commit();
        
        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting transaction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete transaction',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getTransactionSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;
        
        const whereClause = { userId };
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const summary = await Transaction.findAll({
            where: whereClause,
            attributes: [
                'type',
                [db.fn('SUM', db.col('amount')), 'total'],
                [db.fn('COUNT', db.col('id')), 'count']
            ],
            group: ['type']
        });
        
        const result = {
            income: { total: 0, count: 0 },
            expense: { total: 0, count: 0 }
        };
        
        summary.forEach(item => {
            result[item.type] = {
                total: parseFloat(item.dataValues.total) || 0,
                count: parseInt(item.dataValues.count) || 0
            };
        });
        
        result.balance = result.income.total - result.expense.total;
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching transaction summary:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch transaction summary',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Helper function to update budget spent amounts
const updateBudgetSpentAmount = async (userId, amount, date, transaction) => {
    const budgets = await Budget.findAll({
        where: {
            userId,
            startDate: { [Op.lte]: date },
            endDate: { [Op.gte]: date },
            status: 'active'
        },
        transaction
    });
    
    for (const budget of budgets) {
        const newSpentAmount = Math.max(0, parseFloat(budget.spentAmount) + parseFloat(amount));
        await budget.update({ spentAmount: newSpentAmount }, { transaction });
        
        // Update budget status if exceeded
        if (newSpentAmount >= parseFloat(budget.amount)) {
            await budget.update({ status: 'exceeded' }, { transaction });
        }
    }
};

module.exports = { 
    addTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getTransactionSummary
};