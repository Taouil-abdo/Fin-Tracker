const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Transaction = db.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0.01,
            isDecimal: true
        }
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
        validate: {
            isIn: [['income', 'expense']]
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
            isDate: true
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Categories',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['userId', 'date']
        },
        {
            fields: ['categoryId']
        },
        {
            fields: ['type']
        }
    ]
});

module.exports = Transaction;