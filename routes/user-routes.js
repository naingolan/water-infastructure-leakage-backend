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
    sendRegistrationConfirmationEmail(req.body.email);
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

module.exports = router;
