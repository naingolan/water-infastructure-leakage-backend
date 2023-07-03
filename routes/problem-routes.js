const express = require('express');
const User = require('../models/user');
const Problem = require('../models/problem');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Report endpoint
router.post('/report', authMiddleware("user"), async (req, res) => {
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
    console.log(newProblem);
    //await savedProblem.populate('reportedBy', 'email username').execPopulate();
    await savedProblem.populate('reportedBy', 'email name');
    // Access the user's email and username
    const userEmail = savedProblem.reportedBy.email;
    const userName = savedProblem.reportedBy.name;

    res.status(201).json(savedProblem);
    
    // Send email using the retrieved email and username
    sendProblemReportEmail(userEmail, `Dear ${userName}, Thank you for reporting a problem. Our assigned staff will help you.`);

    console.log(req.user.userEmail);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while creating the problem report.' });
  }
});
// Getting all problems
router.get('/problems', async (req, res) => {
  try {
    // Retrieve all problems from the database
    const problems = await Problem.find()
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name');

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

// Getting a single problem
router.get('/problems/:id', async (req, res) => {
  try {
    const problemId = req.params.id;

    // Retrieve the problem from the database based on the ID
    const problem = await Problem.findById(problemId).populate('reportedBy', 'username');

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // Convert reportedAt to a Date object if needed
    const convertedProblem = {
      ...problem.toObject(),
      reportedAt: problem.reportedAt instanceof Date ? problem.reportedAt : new Date(problem.reportedAt)
    };

    res.status(200).json(convertedProblem);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while retrieving the problem.' });
  }
});

 
//Delete problem  endpoint 
router.delete('/problems/:problemId', authMiddleware("user"), async (req, res) => {
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
router.put('/:problemId', authMiddleware("user"), async (req, res) => {
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
  const kinds = ['Small Water Pipe Leak', 'Water Tank Burst', 'Small Pipe Fixture', 'Large Water Leak'];
  res.status(200).json(kinds);
});

//Assigning staff a problem
//fetch those staffs
router.get('/staff', async (req, res) => {
  try {
    const staffList = await User.find({ role: 'staff' }).select('name department position');
    res.json(staffList);
  } catch (error) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign staff to problem endpoint
router.put('/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { staffId, staffName } = req.body;

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
    problem.status = 'on process';

    await problem.save();
    console.log("It has been saved");

    const reporter = await User.findById(problem.reportedBy);
    const reporterEmail = reporter.email;
    const reporterName = reporter.name;
    sendProblemReportEmail(reporterEmail,"DAWASA Problem Assignment", `Dear ${reporterName}, Your problem has been assigned to a staff member.`, problem);

    res.status(200).json({ message: 'Staff assigned successfully', problem });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to assign staff to the problem' });
  }
});


// Finalising problem endpoint for staff
router.put('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { status, staffFeedback } = req.body;

  try {
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (status === 'solved') {
      problem.status = 'solved';

      // Send problem report email to the reporter
      const reporter = await User.findById(problem.reportedBy);
      const reporterEmail = reporter.email;
      const reporterName = reporter.name;
      sendProblemReportEmail(reporterEmail, "DAWASA Problem Solved", `Dear ${reporterName}, Your problem has been solved. Visit the area for further feedback`, problem);
    } else if (status === 'not solved') {
      problem.status = 'ongoing';
    }

    // Update staff feedback if provided
    if (staffFeedback) {
      problem.staffFeedback = staffFeedback;
    }

    // Save the updated problem
    await problem.save();

    res.status(200).json(problem);
  } catch (error) {
    console.error('An error occurred while finalizing the problem:', error);
    res.status(500).json({ error: 'An error occurred while finalizing the problem' });
  }
});


const mongoose = require('mongoose');
    // Get problems assigned to specific staff
router.get('/assigned/:staffId',async (req, res) => {
  const { staffId } = req.params;

  try {
    // Find problems assigned to the staff member
    const objectId = new mongoose.Types.ObjectId(staffId);
    const problems = await Problem.find({ assignedTo: objectId});

    if (problems.length === 0) {
      return res.status(404).json({ message: 'No problems assigned to the staff member' });
    }

    res.status(200).json(problems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while fetching assigned problems' });
  }
});


//This is an email which will be used to send information to the email
// Function to send registration confirmation email
const handlebars = require('handlebars');

const fs = require('fs');

async function sendProblemReportEmail(email, subjectContent, templateData) {
  try {
    const htmlTemplatePath = './templates/problem_report_template.html';
    const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(htmlTemplate);
    const renderedTemplate = compiledTemplate(templateData);

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
      subject: subjectContent,
      html: renderedTemplate,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = router;
