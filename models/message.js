const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  header: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reply: {
    type: mongoose.Schema.Types.ObjectId,
     content: {
      type: String
      },
      replier: {
        ref: 'User',
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
