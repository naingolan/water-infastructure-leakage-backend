const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const config = require('../config')
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, password, email, phoneNumber, role, department, position } = req.body;
 console.log(req.body);
  try {
    const salt = await bcrypt.genSalt(10);
    // Check if the name or email already exists in the database
    const existingUser = await User.findOne({ $or: [ { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      password: hashedPassword,
      email,
      phoneNumber,
      role,
      department: role === 'staff' ? department : undefined,
      position: role === 'staff' ? position : undefined,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, config.jwtSecret);

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id, token });
    if(role=="staff"){
      sendAccountCreationEmail(req.body.email, req.body.name);
    }else{
    sendRegistrationConfirmationEmail(req.body.email);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to register this new user' });
  }
});

// Function to send registration confirmation email
async function sendRegistrationConfirmationEmail(email) {
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
      subject: 'Registration Confirmation',
      text: 'Thank you for registering. Your account has been successfully created.',
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

//funciton for staff login
async function sendAccountCreationEmail(email, name) {
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

    const subjectContent = 'Account Created - Action Required';
    const changePasswordLink = 'http://localhost:4200/staffpassword'; 
    const loginLink = 'http://localhost:4200/login'; 

    const htmlContent = `
      <h3>Account Creation Notification</h3>
      <p>Dear ${name},</p>
      <p>Your account has been successfully created. Please follow the steps below to activate your account:</p>
      <ol>
        <li>Click <a href="${changePasswordLink}">here</a> to change your password.</li>
        <li>Once you have changed your password, you can login using the following link: <a href="${loginLink}">Login</a></li>
      </ol>
      <p>If you did not create an account, please contact us immediately.</p>
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


// Function to generate JWT token
function generateToken(userId) {
  const secretKey = jwtSecret; // Replace with your own secret key
  const expiresIn = '5h'; // Token expiration time

  return jwt.sign({ userId }, secretKey, { expiresIn });
}

// User login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const userId = user._id;
      const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret);
      return res.status(200).json({ message: 'User authenticated successfully', userId, token });
    }

    return res.status(401).json({ error: 'Invalid password' });
  } catch (error) {
    console.error('Failed to compare passwords', error);
    return res.status(500).json({ error: 'Failed to compare passwords' });
  }
});



router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      error: 'Failed to fetch user data' });
  }
});


//updating user info
router.patch('/update', authMiddleware, async (req, res) => {
  try {
    const { name, email, phoneNumber, district, street } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user information
    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.district = district;
    user.street = street;

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while updating user information' });
  }
});

// Updating user password
router.patch('/update/password/:userId',  async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    // Find the user by ID
    console.log(userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    const isNewMatch = await bcrypt.compare(newPassword, user.password);

    if (!isMatch || isNewMatch) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    // Update the user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword2 = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword2;

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while updating the password' });
  }
});

router.patch('/update/staff/password', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(password);
    // Find the staff by email
    const staff = await User.findOne({ email });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Generate a new salt
    const salt = await bcrypt.genSalt(10);

    // Update the staff's password
    staff.password = await bcrypt.hash(password, salt);

    // Save the updated staff
    const updatedStaff = await staff.save();

    res.status(200).json(updatedStaff);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while updating the password' });
  }
});



module.exports = router;
