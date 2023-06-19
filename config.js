const jwt = require('jsonwebtoken');

const jwtSecret = 'kelvinDiegoArmando'; 

const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret);
};

module.exports = {
  jwtSecret,
  generateToken
};