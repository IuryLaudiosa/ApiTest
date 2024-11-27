const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('tsystem', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;