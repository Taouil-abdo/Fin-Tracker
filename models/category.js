const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Category = db.define('Category', {
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
    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
        validate: {
            isIn: [['income', 'expense']]
        }
    },
    color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: '#007bff',
        validate: {
            is: /^#[0-9A-F]{6}$/i
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['type']
        },
        {
            fields: ['name', 'type']
        }
    ]
});

module.exports = Category;
