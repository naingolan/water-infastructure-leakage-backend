const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['Water Leakage', 'Valve Malfunction', 'Pump Failure', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageSrc: {
    type: String,
    required: true
  },
  latitude:{
    type: Number,
    required: true
  },
  longitude:{
    type:Number,
    required:true
  },
  status: {
    type: String,
    enum: ['pending', 'in process', 'solved'],
    default: 'pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  // Other fields as needed
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
