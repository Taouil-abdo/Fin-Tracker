const User = require('./User');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./budget');
const Goal = require('./Goal');

// Define relationships
User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Transaction, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });
Goal.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Category,
    Transaction,
    Budget,
    Goal
};
