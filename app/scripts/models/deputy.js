"use strict";

module.exports = function(sequelize, DataTypes) {
  var Deputy = sequelize.define("Deputy", {
    id: { type: DataTypes.INTEGER, name: 'id', primaryKey: true },
    displayName: { type: DataTypes.STRING, name: 'display_name' },
    curul: { type: DataTypes.STRING, name: 'curul' },
    email: { type: DataTypes.STRING, name: 'email' },
    birthdate: { type: DataTypes.STRING, name: 'birthdate' },
    picture: { type: DataTypes.STRING, name: 'picture' },
    party: { type: DataTypes.STRING, name: 'party', defaultValue: 'Uknown' },
    alternate: { type: DataTypes.STRING, name: 'alternate' },
    estudios: { type: DataTypes.STRING, name: 'estudios' },
    profile: { type: DataTypes.STRING, name: 'profile' },
    facebook: { type: DataTypes.STRING, name: 'facebook' },
    twitter: { type: DataTypes.STRING, name: 'twitter' },
    phone: { type: DataTypes.STRING, name: 'phone' },
    ext: { type: DataTypes.STRING, name: 'ext' },
    active: { type: DataTypes.INTEGER, name: 'active' },
    tres: { type: DataTypes.INTEGER, name: 'tres', defaultValue: 0 },
    fiscal: { type: DataTypes.STRING, name: 'fiscal' },
    intereses: { type: DataTypes.STRING, name: 'intereses' },
    patrimonial: { type: DataTypes.STRING, name: 'patrimonial' },
    hash: { type: DataTypes.STRING, name: 'hash', defaultValue: 0 },
    altHash: { type: DataTypes.STRING, name: 'alt_hash', defaultValue: 0 }
  }, {
    classMethods: {
      associate: function(models) {
        Deputy.hasMany(models.Attendance, { as: 'attendance'});
        Deputy.belongsToMany(models.Initiative, { through: models.DeputyInitiative });
      }
    }
  });

  return Deputy;
};
