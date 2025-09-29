const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register a new user
const registerUser = async (req, res) => {
  const { fullname, email, password, sexe, age } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).render('auth/register', {
        errors: [{ msg: 'Email is already in use' }],
        fullname,
        email,
        sexe,
        age
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      sexe,
      age
    });

    // Send success message
    res.status(201).render('auth/register', {
      message: 'User registered successfully! Please log in.',
      errors: [] // Empty array to indicate no errors
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('auth/register', {
      errors: [{ msg: 'Something went wrong, please try again later' }],
      fullname,
      email,
      sexe,
      age
    });
  }
};

module.exports = { registerUser };
