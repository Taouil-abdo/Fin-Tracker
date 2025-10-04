const { Budget, Transaction } = require('../models');
const { Op } = require('sequelize');
const db = require('../config/database');

const addBudget = async (req, res) => {
    try {
        const { name, description, amount, startDate, endDate } = req.body;
        const userId = req.user.id;
        
        // Check for overlapping budgets
        const overlappingBudget = await Budget.findOne({
            where: {
                userId,
                name,
                [Op.or]: [
                    {
                        startDate: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        endDate: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lte]: startDate } },
                            { endDate: { [Op.gte]: endDate } }
                        ]
                    }
                ]
            }
        });
        
        if (overlappingBudget) {
            return res.status(409).json({
                success: false,
                message: 'A budget with this name already exists for the specified period'
            });
        }
        
        const budget = await Budget.create({ 
            name, 
            description, 
            amount, 
            startDate, 
            endDate, 
            userId 
        });
        
        res.status(201).json({
            success: true,
            message: 'Budget created successfully',
            data: budget
        });
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create budget',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getAllBudgets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, active } = req.query;
        
        const whereClause = { userId };
        if (status) whereClause.status = status;
        
        const budgets = await Budget.findAll({ 
            where: whereClause,
            order: [['startDate', 'DESC']],
            include: [
                {
                    model: Transaction,
                    attributes: [],
                    required: false,
                    where: {
                        type: 'expense',
                        date: {
                            [Op.between]: [db.col('Budget.startDate'), db.col('Budget.endDate')]
                        }
                    }
                }
            ],
            attributes: {
                include: [
                    [
                        db.fn('COALESCE', 
                            db.fn('SUM', db.col('Transactions.amount')), 
                            0
                        ),
                        'actualSpent'
                    ],
                    [
                        db.literal('(amount - COALESCE(SUM(Transactions.amount), 0))'),
                        'remaining'
                    ],
                    [
                        db.literal('(COALESCE(SUM(Transactions.amount), 0) / amount * 100)'),
                        'percentageUsed'
                    ]
                ]
            },
            group: ['Budget.id']
        });
        
        res.status(200).json({
            success: true,
            data: budgets
        });
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch budgets',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getBudgetById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const budget = await Budget.findOne({
            where: { id, userId },
            include: [
                {
                    model: Transaction,
                    where: {
                        type: 'expense',
                        date: {
                            [Op.between]: [db.col('Budget.startDate'), db.col('Budget.endDate')]
                        }
                    },
                    required: false,
                    order: [['date', 'DESC']],
                    limit: 20
                }
            ]
        });
        
        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: budget
        });
    } catch (error) {
        console.error('Error fetching budget:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch budget',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, amount, startDate, endDate, status } = req.body;
        const userId = req.user.id;
        
        const budget = await Budget.findOne({
            where: { id, userId }
        });
        
        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }
        
        // Check for overlapping budgets if dates are being updated
        if (name || startDate || endDate) {
            const overlappingBudget = await Budget.findOne({
                where: {
                    userId,
                    name: name || budget.name,
                    id: { [Op.ne]: id },
                    [Op.or]: [
                        {
                            startDate: {
                                [Op.between]: [startDate || budget.startDate, endDate || budget.endDate]
                            }
                        },
                        {
                            endDate: {
                                [Op.between]: [startDate || budget.startDate, endDate || budget.endDate]
                            }
                        }
                    ]
                }
            });
            
            if (overlappingBudget) {
                return res.status(409).json({
                    success: false,
                    message: 'A budget with this name already exists for the specified period'
                });
            }
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = amount;
        if (startDate !== undefined) updateData.startDate = startDate;
        if (endDate !== undefined) updateData.endDate = endDate;
        if (status !== undefined) updateData.status = status;
        
        await budget.update(updateData);
        
        res.status(200).json({
            success: true,
            message: 'Budget updated successfully',
            data: budget
        });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update budget',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const budget = await Budget.findOne({
            where: { id, userId }
        });
        
        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }
        
        await budget.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Budget deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete budget',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getBudgetAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, month } = req.query;
        
        let dateFilter = {};
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            dateFilter = {
                [Op.or]: [
                    {
                        startDate: { [Op.between]: [startDate, endDate] }
                    },
                    {
                        endDate: { [Op.between]: [startDate, endDate] }
                    },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lte]: startDate } },
                            { endDate: { [Op.gte]: endDate } }
                        ]
                    }
                ]
            };
        }
        
        const analytics = await Budget.findAll({
            where: {
                userId,
                ...dateFilter
            },
            attributes: [
                'status',
                [db.fn('COUNT', db.col('id')), 'count'],
                [db.fn('SUM', db.col('amount')), 'totalBudgeted'],
                [db.fn('SUM', db.col('spentAmount')), 'totalSpent']
            ],
            group: ['status']
        });
        
        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching budget analytics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch budget analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = { 
    addBudget,
    getAllBudgets,
    getBudgetById,
    updateBudget,
    deleteBudget,
    getBudgetAnalytics
};