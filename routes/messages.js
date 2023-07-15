const express = require('express');
const router = express.Router();
const Message = require('../models/message');

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().populate('sender receiver');
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching messages' });
  }
});

// Create a new message
router.post('/', async (req, res) => {
  const { content, sender, receiver } = req.body;

  try {
    const newMessage = new Message({
      content,
      sender,
      receiver
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a message' });
  }
});

// Update a reply
router.put('/replies/:messageId', async (req, res) => {
  //const { content } = req.body;
  console.log(req.body);
  try {
    const reply = await Message.findById(req.params.messageId);
    reply.reply.content = req.params.message;
    reply.reply.replier = req.params.userId;
    await reply.save();
    res.status(200).json(reply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the reply' });
  }
});
module.exports = router;

// Get messages by receiver ID
router.get('/:receiverId', async (req, res) => {
    const { receiverId } = req.params;
  
    try {
      const messages = await Message.find({ receiver: receiverId }).populate('sender receiver');
      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching messages' });
    }
  });
  