const express = require('express');
const router = express.Router();
const Announcement = require('../models/anouncements');

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'An error occurred while fetching announcements' });
  }
});

// Create a new announcement
router.post('/', async (req, res) => {
  console.log("Here");
  const { header, content, createdBy } = req.body;

  try {
    const newAnnouncement = new Announcement({
      header,
      content,
      createdBy,
      createdAt: Date.now(),
      isRecent: true
    });

    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'An error occurred while creating announcement' });
  }
});

module.exports = router;
