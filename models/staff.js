const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: String,
  // Add any other required fields
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
