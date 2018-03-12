"use strict";

module.exports = function(sequelize, DataTypes) {
  var Profile = sequelize.define("Profile", {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    displayName: { type: DataTypes.STRING, name: 'display_name' },
    profileNumber: { type: DataTypes.INTEGER, name: 'profileNumber'},
    status: { type: DataTypes.STRING, name: 'status' },
    party: { type: DataTypes.STRING, name: 'party' },
    birth: { type: DataTypes.STRING, name: 'birth' },
    type: { type: DataTypes.STRING, name: 'type' },
    state: { type: DataTypes.STRING, name: 'state' },
    district: { type: DataTypes.STRING, name: 'district' },
    startDate: { type: DataTypes.STRING, name: 'startDate' },
    building: { type: DataTypes.STRING, name: 'building' },
    email: { type: DataTypes.STRING, name: 'email' },
    phone: { type: DataTypes.STRING, name: 'phone' },
    alternate: { type: DataTypes.STRING, name: 'alternate' },
    alternateProfile: { type: DataTypes.STRING, name: 'profile' },
    studies: { type: DataTypes.STRING, name: 'studies' },
    academics: { type: DataTypes.STRING, name: 'academics' },
    twitter: { type: DataTypes.STRING, name: 'twitter' },
    facebook: { type: DataTypes.STRING, name: 'facebook' },
    hash: { type: DataTypes.STRING, name: 'hash', defaultValue: 0 },
    slug: { type: DataTypes.STRING, name: 'slug'}
  }, {
    indexes: [{
            unique: true,
            fields: ['id', 'profileNumber']
        }]
  });

  return Profile;
};
