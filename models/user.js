const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name:{
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
  role: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    default: 'user',
    required: true
  },
  department: {
    type: String,
    // required: function () {
    //   return this.role === 'staff';
    // }
  },
  position: {
    type: String,
    // required: function () {
    //   return this.role === 'staff';
    // }
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
