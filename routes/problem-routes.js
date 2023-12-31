const express = require('express');
const User = require('../models/user');
const Message = require('../models/message');
const Problem = require('../models/problem');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Report endpoint
router.post('/report', authMiddleware("user"), async (req, res) => {
  try {
    const { kind, description, imageSrc, latitude, longitude, location} = req.body;
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    // Create a new problem object
    const newProblem = new Problem({
      kind,
      description,
      imageSrc,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      status: 'pending',
      reportedBy: req.user.userId,
      location
    });
    const savedProblem = await newProblem.save();

    // Retrieve the reporter's information
    const reporter = await User.findById(req.user.userId);

    // Create a new message object
    const newMessage = new Message({
      header:"Problem Reporting",
      content: "Thank you for reporting a problem. Our assigned staff will help you.",
      sender: null, // Set sender as null to indicate it's a system-generated message
      receiver: reporter._id, // Set the reporter as the receiver
      createdAt: new Date(),
    });

    await newMessage.save();

    // Send email to the reporter
    sendProblemReportEmail(reporter.email, "PROBLEM REPORT", reporter.name);
    res.status(201).json(savedProblem);
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

// Getting problems reported by a specific user
router.get('/problems/:userId', async (req, res) => {
  try {
    const userId = req.params.userId; // Retrieve the user ID from the route parameter

    // Retrieve problems reported by the specified user
    const problems = await Problem.find({ reportedBy: userId })
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name');

    // Convert reportedAt to Date objects
    const convertedProblems = problems.map((problem) => ({
      ...problem.toObject(),
      reportedAt: problem.reportedAt instanceof Date ? problem.reportedAt : new Date(problem.reportedAt)
    }));
    console.log(convertedProblems);
    res.status(200).json(convertedProblems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while retrieving the problems.' });
  }
});


// Getting a single problem
router.get('/singleproblem/:id', async (req, res) => {
  console.log("I am reached ");
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
    console.log(convertedProblem);
    res.status(200).json(convertedProblem);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while retrieving the problem.' });
  }
});

 
//Delete problem  endpoint 
router.delete('/:problemId', authMiddleware("user"), async (req, res) => {
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
    const staffList = await User.find({ role: 'staff' }).select('name email phoneNumber department position staffStatus');
    console.log(staffList);
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
    problem.status = 'on progress';
    staff.staffStatus = 'unavailable';
    console.log(staff);
    
    await problem.save();
    console.log("It has been saved");

    const reporter = await User.findById(problem.reportedBy);
    const reporterEmail = reporter.email;
    const reporterName = reporter.name;
    
    problem.location =  problem.location;
    const reportedAt = problem.reportedAt.toISOString().split('T')[0];

    sendProblemAssignmentEmail(reporterEmail, "Problem Assignment", problem.location, reportedAt);
    sendStaffProblemAssignmentEmail(staff.email, "Problem Assignment", staff.name, reportedAt,problem.location);
    //sendProblemReportEmail(reporterEmail,"DAWASA Problem Assignment", `Dear ${reporterName}, Your problem has been assigned to a staff member.`, problem);
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
      problem.adminApproval = 'approved';
      //problem.status = 'awaiting';
      } else if (status === 'not solved') {
      problem.status = 'on progress';
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

//Admin confirming that the problem has been solved
router.put('/:id/solved', async (req, res) => {
  const { id } = req.params;
  const { status, adminFeedback } = req.body;

  try {
    const problem = await Problem.findById(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (status === 'approve') {
      problem.status = 'solved';
      problem.adminApproval = 'solved';
      const assigned = await User.findById(problem.assignedTo);
      assigned.staffStatus = 'available';
      // Send problem report email to the reporter
      const reporter = await User.findById(problem.reportedBy);
      const reporterEmail = reporter.email;
      const reporterName = reporter.name;
      const problemTime = problem.createdAt.toISOString().split('T')[0];
      sendUserProblemSolvedEmail(reporterEmail, "Problem Solution", reporterName, problemTime, problem.location);
     // sendProblemReportEmail(reporterEmail, "DAWASA Problem Solved", `Dear ${reporterName}, Your problem has been solved. Visit the area for further feedback`, problem);
    } else if (status === 'not solved') {
      problem.status = 'ongoing';
      problem.adminApproval = 'rejected';
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
    const problems = await Problem.find({ assignedTo: objectId})
    .populate('reportedBy', 'name')

    if (problems.length === 0) {
      return res.status(404).json({ message: 'No problems assigned to the staff member' });
    }

    res.status(200).json(problems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while fetching assigned problems' });
  }
});


// Function to send problem report  confirmation email
async function sendProblemReportEmail(email, subjectContent, name) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'kinegaofficial@gmail.com',
        pass: 'buzpitfowyqigedj',
      },
    });

    const htmlContent = `
      <h2 style="background-color:#3498db; color:white; padding:20px;" >WATER INFASTRUCTURES LEAKAGE REPORTING SYSTEM</h2>
      <h3>Problem Report</h3>
      <p>Dear ${name},</p>
      <p>We have received your problem report. Thank you for bringing this to our attention.</p>
      <p>If you have any further questions or need assistance, please feel free to contact us.</p>
      <p>Thank you.</p>
    `;

    let mailOptions = {
      from: 'kinegaofficial@gmail.com',
      to: email,
      subject: subjectContent,
      html: htmlContent,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Function to to inform user that the problem has been assigned to stqaff
async function sendProblemAssignmentEmail(email, subjectContent, name, problemTime, problemLocation) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'kinegaofficial@gmail.com',
        pass: 'buzpitfowyqigedj',
      },
    });

    const htmlContent = `
      <h2 style="background-color:#3498db; color:white; padding:20px;">WATER INFASTRUCTURES LEAKAGE REPORTING SYSTEM</h2>
      <h3>PROBLEM ASSIGNMENT</h3>
      <p>Dear ${name},</p>
      <p>We would like to inform you that a problem has been assigned to you. Please take the necessary actions to resolve it.</p>
      <p>If you have any questions or need any assistance, please feel free to contact us.</p>
      <p>Thank you.</p>
    `;

    let mailOptions = {
      from: 'kinegaofficial@gmail.com',
      to: email,
      subject: subjectContent,
      html: htmlContent,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Function to send problem inform email to staff
async function sendStaffProblemAssignmentEmail(email, subjectContent, name, problemTime, problemLocation) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'kinegaofficial@gmail.com',
        pass: 'buzpitfowyqigedj',
      },
    });

    const htmlContent = `
      <h2 style="background-color:#3498db; color:white; padding:20px;">WATER INFASTRUCTURES LEAKAGE REPORTING SYSTEM</h2>
      <h3>PROBLEM ASSIGNMENT</h3>
      <p>Dear ${name},</p>
      <p>We would like to inform you that a problem has been assigned to you. Please take the necessary actions to resolve it.</p>
      <p>Problem Details:</p>
      <ul>
        <li>Time: ${problemTime}</li>
        <li>Location: ${problemLocation}</li>
      </ul>
      <p>If you have any questions or need any assistance, please feel free to contact us.</p>
      <p>Thank you.</p>
    `;

    let mailOptions = {
      from: 'kinegaofficial@gmail.com',
      to: email,
      subject: subjectContent,
      html: htmlContent,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Function to send problem inform that the problem has been solved
async function sendUserSolvedProblemEmail(reporterEmail, subjectContent, name, problemTime, problemLocation) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'kinegaofficial@gmail.com',
        pass: 'buzpitfowyqigedj',
      },
    });

    const htmlContent = `
      <h2 style="background-color:#3498db; color:white; padding:20px;">WATER INFASTRUCTURES LEAKAGE REPORTING SYSTEM</h2>
      <h3>PROBLEM SOLVED</h3>
      <p>Dear ${name},</p>
      <p>We would like to inform you that the problem you reported has been solved.</p>
      <ul>
        <li>ID: ${problemTime}</li>
        <li>Location: ${problemLocation}</li>
        <l
      </ul>
      <p>Thank you for using our system. If you have any further questions or need any assistance, please feel free to contact us.</p>
    `;

    let mailOptions = {
      from: 'kinegaofficial@gmail.com',
      to: reporterEmail,
      subject: subjectContent,
      html: htmlContent,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


module.exports = router;
