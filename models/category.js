const {DataTypes} = require('sequelize');
const db = require('../config/database');



const Category = db.define('Category',{
    name:{
        type:DataTypes.STRING,
        allowNull:false,
    }
});

modules.exports= Category;



