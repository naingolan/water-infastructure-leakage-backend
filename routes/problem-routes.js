const express = require('express');
const User = require('../models/user');
const Problem = require('../models/problem');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

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
      reportedBy: req.user.userId,
    });
    const savedProblem = await newProblem.save();
    
    //await savedProblem.populate('reportedBy', 'email username').execPopulate();
    await savedProblem.populate('reportedBy', 'email username');
    // Access the user's email and username
    const userEmail = savedProblem.reportedBy.email;
    const userName = savedProblem.reportedBy.username;

    res.status(201).json(savedProblem);
    
    // Send email using the retrieved email and username
    sendProblemReportEmail(userEmail, `Dear ${userName}, Thank you for reporting a problem. Our assigned staff will help you.`);

    console.log(req.user.userEmail);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while creating the problem report.' });
  }
});
//getting all problems
router.get('/problems', authMiddleware, async (req, res) => {
  try {
    // Retrieve all problems from the database
    const problems = await Problem.find().populate('reportedBy', 'username');

    // Convert reportedAt to Date objects
    const convertedProblems = problems.map((problem) => ({
      ...problem.toObject(),
      reportedAt: problem.reportedAt instanceof Date ? problem.reportedAt : new Date(problem.reportedAt)
    }));

    res.status(200).json(convertedProblems);
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

//This is an email which will be used to send information to the email
// Function to send registration confirmation email
async function sendProblemReportEmail(email, textContent) {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'kinegaofficial@gmail.com',
        pass: 'buzpitfowyqigedj',
      },
    });

    let mailOptions = {
      from: 'kinegaofficial@gmail.com',
      to: email,
      subject: 'DAWASA Problem Report',
      text: textContent,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

//adding staffs
const Staff = require('../models/staff');

// Create a new staff
router.post('/staff', async (req, res) => {
  try {
    const { name, position, department, salary } = req.body;

    // Create a new staff object
    const newStaff = new Staff({
      name,
      position,
      department,
      salary
    });

    const savedStaff = await newStaff.save();

    res.status(201).json(savedStaff);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while creating the staff.' });
  }
});

// Get all staff
router.get('/staff', async (req, res) => {
  try {
    // Retrieve all staff from the database
    const staffList = await Staff.find();

    res.status(200).json(staffList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while retrieving the staff list.' });
  }
});

  

module.exports = router;
