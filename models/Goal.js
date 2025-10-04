const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Goal = db.define('Goal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500]
        }
    },
    targetAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 0.01,
            isDecimal: true
        }
    },
    currentAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0,
            isDecimal: true
        }
    },
    targetDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true,
            isAfterToday(value) {
                if (value <= new Date()) {
                    throw new Error('Target date must be in the future');
                }
            }
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['userId', 'status']
        },
        {
            fields: ['targetDate']
        },
        {
            fields: ['priority']
        }
    ]
});

module.exports = Goal;