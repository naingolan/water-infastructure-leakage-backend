const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  header: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isNew: {
    type: Boolean,
    default: true,
  },
});

announcementSchema.virtual('isRecent').get(function () {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return this.timestamp >= threeDaysAgo;
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
