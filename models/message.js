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
    //required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  ,
  reply:{
    type:string,  
  },
  replierId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
