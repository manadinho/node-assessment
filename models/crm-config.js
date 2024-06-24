const { DataTypes } = require("sequelize");
const db = require("../config/database.js");

const CrmConfigs = db.sequelize.define(
  "crm_config",
  {
    id: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.NUMBER,
      autoIncrement: true,
    },
    ref_type: {
      type: DataTypes.ENUM("admin", "extension"),
      allowNull: false,
    },
    ref_id: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

module.exports = CrmConfigs;
