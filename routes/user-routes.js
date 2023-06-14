const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const jwtSecret = require('../config').jwtSecret;
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// User registration endpoint
router.post('/register', async (req, res) => {
  const { username, password, email, phoneNumber, district, street } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      phoneNumber,
      street,
      district
    });

    await newUser.save();

    const token = generateToken(newUser._id); // Generate JWT token

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id, token });
    sendRegistrationConfirmationEmail(req.body.email);
  } catch (error) {
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
  const expiresIn = '1h'; // Token expiration time

  return jwt.sign({ userId }, secretKey, { expiresIn });
}

// User login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      bcrypt.compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            const token = generateToken(user._id); // Generate JWT token
            res.status(200).json({ message: 'User authenticated successfully', token });
          } else {
            res.status(401).json({ error: 'Invalid password' });
          }
        })
        .catch((error) => {
          res.status(500).json({ error: 'Failed to compare passwords' });
        });
    })
    .catch((error) => {
      res.status(500).json({ error: 'Failed to find user' });
    });
});


router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});


//updating user info
router.patch('/update', authMiddleware, async (req, res) => {
  try {
    const { username, email, phoneNumber, district, street } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user information
    user.username = username;
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
