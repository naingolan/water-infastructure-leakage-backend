const express = require('express');
const cors = require('cors');
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
};


const userRoutes = require('./routes/user-routes');
const problemRoutes = require('./routes/problem-routes');



const app = express();
app.use(cors(corsOptions)) 

// Set up middleware and routes
app.use(express.json());
app.use('/api/users', userRoutes); // Mount the userRoutes middleware under '/api/users' path
app.use('/api/problems', problemRoutes); // Mount the problemRoutes middleware under '/api/problems' path

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://nainggolan:kevin2001@cluster0.h6vms6z.mongodb.net/water-infastructure-reporting-systemm?retryWrites=true&w=majority';


mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });
