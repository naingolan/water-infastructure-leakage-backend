const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['Small Water Pipe Leak', 'Water Tank Burst', 'Small Pipe Fixture', 'Large Water Leak'],
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
    enum: ['pending', 'on process', 'solved'],
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
  staffFeedback: {
    type: String
  },
  staffFeedbackAt: {
    type: Date
  },
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
