const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.DB_HOST,          
  username:'root',           
  password:'',               
  database: 'FinTracker',    
  dialect: 'mysql',           
  port: process.env.PORT,      
  logging: false,           
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
module.exports = sequelize;