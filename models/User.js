// =============================================================================
// FICHIER : models/User.js
// =============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profile: {
        type: DataTypes.ENUM('ADMIN', 'COLLABORATEUR', 'USER', 'CAISSIER'),
        allowNull: false
    }
});

module.exports = User;
