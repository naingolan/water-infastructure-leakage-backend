const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  
  street: {
    type: String
  },
  district: {
    type: String
  },
  
});

const User = mongoose.model('User', userSchema);

module.exports = User;