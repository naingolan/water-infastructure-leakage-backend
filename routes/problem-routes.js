const express = require('express');
const User = require('../models/user');
const Problem = require('../models/problem');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Report endpoint
router.post('/report', authMiddleware, async (req, res) => {
  try {
    const { kind, description, imageSrc, latitude, longitude } = req.body;

    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    // Create a new problem object
    console.log(req.user);
    const newProblem = new Problem({
      kind,
      description,
      imageSrc,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      status: 'pending',
      reportedBy: req.user.userId
    });

    // Save the problem to the database
    const savedProblem = await newProblem.save();

    res.status(201).json(savedProblem);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while creating the problem report.' });
  }
});

// Get all problems endpoint
router.get('/problems', authMiddleware, async (req, res) => {
    try {
      // Retrieve all problems from the database
      const problems = await Problem.find();
  
      res.status(200).json(problems);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'An error occurred while retrieving the problems.' });
    }
  });
  
//Delete problem  endpoint 
router.delete('/problems/:problemId', authMiddleware, async (req, res) => {
    try {
      const problemId = req.params.problemId;
      console.log(req.params.problemId);
  
      // Find the problem by ID
      const problem = await Problem.findById(problemId);
  
      // Check if the problem exists
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
  
      // Check if the current user is the creator of the problem
      if (problem.reportedBy.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this problem' });
      }
  
      // Delete the problem
      await Problem.findByIdAndDelete(problemId);
  
      res.status(200).json({ message: 'Problem deleted successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'An error occurred while deleting the problem' });
    }
  });

// Update problem details endpoint
router.put('/:problemId', authMiddleware, async (req, res) => {
    const { problemId } = req.params;
    const { description } = req.body;
  
    try {
      // Find the problem by ID
      const problem = await Problem.findById(problemId);
  
      // Check if the problem exists
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
  
      // Check if the authenticated user is the creator of the problem
      if (problem.reportedBy.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
  
      // Update the problem description
      problem.description = description;
      const updatedProblem = await problem.save();
  
      res.status(200).json(updatedProblem);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'An error occurred while updating the problem details' });
    }
  });
  
  //receiving the problem kind
  // Get all problem kinds endpoint
router.get('/kinds', (req, res) => {
  const kinds = ['Water Leakage', 'Pothole', 'Electricity Outage', 'Garbage Disposal'];
  res.status(200).json(kinds);
});

  

module.exports = router;
