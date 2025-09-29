const { DataTypes } = require('sequelize');
const db = require('../config/database');  // Assuming you're importing your database configuration

const User = db.define('User', {
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sexe: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 18, // Ensure age is at least 18
        },
    },
});

module.exports = User;
