// =============================================================================
// FICHIER : models/UserCompany.js (Table de Jointure)
// =============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCompany = sequelize.define('UserCompany', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    odooCompanyId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    odooCompanyName: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = UserCompany;
