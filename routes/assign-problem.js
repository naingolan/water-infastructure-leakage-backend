const express = require('express');
const User = require('../models/user');
const Problem = require('../models/problem');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Assign staff to problem endpoint
router.put('/:id/assign', authMiddleware("user"), async (req, res) => {
    const { id } = req.params;
    const { staffId } = req.body;
  
    try {
      const problem = await Problem.findById(id);
  
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
  
      const staff = await User.findById(staffId);
  
      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
  
      if (staff.role !== 'staff') {
        return res.status(400).json({ error: 'Selected user is not a staff member' });
      }
  
      if (problem.status !== 'pending') {
        return res.status(400).json({ error: 'Problem is not in a pending state' });
      }
  
      problem.assignedTo = staffId;
      problem.assignedAt = new Date();
      problem.status = 'in process';
  
      await problem.save();
  
      res.status(200).json({ message: 'Staff assigned successfully', problem });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign staff to the problem' });
    }
  });
  