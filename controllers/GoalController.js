const { Goal } = require('../models');
const { Op } = require('sequelize');
const db = require('../config/database');

const addGoal = async (req, res) => {
    try {
        const { name, description, targetAmount, currentAmount, targetDate, priority } = req.body;
        const userId = req.user.id;
        
        // Check if goal with same name already exists for user
        const existingGoal = await Goal.findOne({
            where: { userId, name }
        });
        
        if (existingGoal) {
            return res.status(409).json({
                success: false,
                message: 'A goal with this name already exists'
            });
        }
        
        const goal = await Goal.create({ 
            name, 
            description,
            targetAmount, 
            currentAmount: currentAmount || 0, 
            targetDate,
            priority: priority || 'medium',
            userId 
        });
        
        res.status(201).json({
            success: true,
            message: 'Goal created successfully',
            data: goal
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create goal',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getAllGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, sortBy = 'targetDate', order = 'ASC' } = req.query;
        
        const whereClause = { userId };
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        
        const goals = await Goal.findAll({ 
            where: whereClause,
            order: [[sortBy, order.toUpperCase()]],
            attributes: {
                include: [
                    [
                        db.literal('(currentAmount / targetAmount * 100)'),
                        'progressPercentage'
                    ],
                    [
                        db.literal('(targetAmount - currentAmount)'),
                        'remainingAmount'
                    ],
                    [
                        db.literal(`DATEDIFF(targetDate, NOW())`),
                        'daysRemaining'
                    ]
                ]
            }
        });
        
        res.status(200).json({
            success: true,
            data: goals
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch goals',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getGoalById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const goal = await Goal.findOne({
            where: { id, userId },
            attributes: {
                include: [
                    [
                        db.literal('(currentAmount / targetAmount * 100)'),
                        'progressPercentage'
                    ],
                    [
                        db.literal('(targetAmount - currentAmount)'),
                        'remainingAmount'
                    ],
                    [
                        db.literal(`DATEDIFF(targetDate, NOW())`),
                        'daysRemaining'
                    ]
                ]
            }
        });
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: goal
        });
    } catch (error) {
        console.error('Error fetching goal:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch goal',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, targetAmount, currentAmount, targetDate, status, priority } = req.body;
        const userId = req.user.id;
        
        const goal = await Goal.findOne({
            where: { id, userId }
        });
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        // Check for duplicate name if name is being updated
        if (name && name !== goal.name) {
            const existingGoal = await Goal.findOne({
                where: {
                    userId,
                    name,
                    id: { [Op.ne]: id }
                }
            });
            
            if (existingGoal) {
                return res.status(409).json({
                    success: false,
                    message: 'A goal with this name already exists'
                });
            }
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
        if (currentAmount !== undefined) {
            updateData.currentAmount = currentAmount;
            // Auto-update status if goal is completed
            if (currentAmount >= (targetAmount || goal.targetAmount)) {
                updateData.status = 'completed';
            }
        }
        if (targetDate !== undefined) updateData.targetDate = targetDate;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        
        await goal.update(updateData);
        
        res.status(200).json({
            success: true,
            message: 'Goal updated successfully',
            data: goal
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update goal',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const goal = await Goal.findOne({
            where: { id, userId }
        });
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        await goal.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete goal',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const updateGoalProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const userId = req.user.id;
        
        const goal = await Goal.findOne({
            where: { id, userId }
        });
        
        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        const newCurrentAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
        const updateData = { currentAmount: Math.max(0, newCurrentAmount) };
        
        // Auto-complete goal if target is reached
        if (newCurrentAmount >= parseFloat(goal.targetAmount)) {
            updateData.status = 'completed';
        }
        
        await goal.update(updateData);
        
        res.status(200).json({
            success: true,
            message: 'Goal progress updated successfully',
            data: goal
        });
    } catch (error) {
        console.error('Error updating goal progress:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update goal progress',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getGoalAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const analytics = await Goal.findAll({
            where: { userId },
            attributes: [
                'status',
                'priority',
                [db.fn('COUNT', db.col('id')), 'count'],
                [db.fn('SUM', db.col('targetAmount')), 'totalTarget'],
                [db.fn('SUM', db.col('currentAmount')), 'totalCurrent'],
                [db.fn('AVG', db.literal('(currentAmount / targetAmount * 100)')), 'avgProgress']
            ],
            group: ['status', 'priority']
        });
        
        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching goal analytics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch goal analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = { 
    addGoal,
    getAllGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    getGoalAnalytics
};