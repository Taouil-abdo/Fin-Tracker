const { Transaction, Category, Budget, Goal } = require('../models');
const { Op } = require('sequelize');

const getDashboardData = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Get transactions with categories
        const transactions = await Transaction.findAll({
            where: { userId },
            include: [{ model: Category, attributes: ['name'] }],
            order: [['date', 'DESC']],
            limit: 5
        });

        // Calculate totals
        const allTransactions = await Transaction.findAll({ where: { userId } });
        const income = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expenses = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const balance = income - expenses;

        // Get active budgets
        const activeBudgets = await Budget.count({
            where: { 
                userId,
                endDate: { [Op.gte]: new Date() }
            }
        });

        // Get goals progress
        const goals = await Goal.findAll({ where: { userId } });
        const totalGoalProgress = goals.length > 0 
            ? goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount * 100), 0) / goals.length 
            : 0;

        // Monthly data for chart (last 6 months)
        const monthlyData = await getMonthlyData(userId);

        res.json({
            summary: {
                income: income.toFixed(2),
                expenses: expenses.toFixed(2),
                balance: balance.toFixed(2),
                goalProgress: totalGoalProgress.toFixed(1)
            },
            recentTransactions: transactions,
            activeBudgets,
            monthlyData
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getMonthlyData = async (userId) => {
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        months.push(date.toLocaleDateString('en-US', { month: 'short' }));
        
        const monthTransactions = await Transaction.findAll({
            where: {
                userId,
                date: {
                    [Op.between]: [monthStart, monthEnd]
                }
            }
        });
        
        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpenses);
    }
    
    return { months, incomeData, expenseData };
};

module.exports = { getDashboardData };