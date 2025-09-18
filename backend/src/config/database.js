const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite database connected successfully');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
