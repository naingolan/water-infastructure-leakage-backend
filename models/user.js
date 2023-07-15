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
  },
  position: {
    type: String,
  },
  staffStatus: {
    enum: ['available', 'unavailable'],
    default: 'available',
    type: String,
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
