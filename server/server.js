let express = require('express');
const path = require('path');
const app = express();
const { registerUser } = require('../controllers/AuthController');
const validateRegister = require('../middlewares/validate');
const db = require('../config/database');
const User = require('../models/User');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middlewares/auth');

app.use(express.static(path.join(__dirname, '..', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views/'));

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data

// Session and Flash middleware
app.use(session({
    secret: 'fintracker',
    resave: false,
    saveUninitialized: true,
}));
app.use(flash());

// Routes
app.get('/', (req, res) => res.render('index'));

// Handle GET request for registration page
app.get('/register', (req, res) => {
    res.render('auth/register', {
        message: req.flash('success'),
        error: req.flash('error'),
        sexe: '', // Default sexe value, will be replaced with selected value if any
        age: '',  // Default age value
        fullname: '', // Default fullname value
        email: '', // Default email value
    });
});

// Handle POST request for registration form
app.post('/register', validateRegister, async (req, res) => {
    const { fullname, email, password, sexe, age } = req.body;

    try {
        // Check if the email already exists in the database
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            req.flash('error', 'Email is already taken!');
            return res.render('auth/register', {
                message: '',
                error: req.flash('error'),
                fullname,
                email,
                sexe,
                age
            });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await User.create({
            fullname,
            email,
            password: hashedPassword,
            sexe,
            age
        });

        // After successful registration:
        req.flash('success', 'Registration successful!');
        res.redirect('/register'); // Redirect to /register page to show success message

    } catch (error) {
        console.error('Error during registration:', error);
        req.flash('error', 'Something went wrong! Please try again.');
        res.render('auth/register', {
            message: '',
            error: req.flash('error'),
            fullname,
            email,
            sexe,
            age
        });
    }
});

// Handle GET request for login page
app.get('/login', (req, res) => {
    res.render('auth/logIn', {
        error: req.flash('error')  // Pass the error message if exists
    });
});

// Handle POST request for login form
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email exists in the database
        const user = await User.findOne({ where: { email } });

        if (!user) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }

        // Create session after successful login
        req.session.user = user;

        // Redirect to dashboard or home page after successful login
        res.redirect('/dashboard');  // You can redirect the user to their profile or home page
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'Something went wrong! Please try again.');
        res.redirect('/login');
    }
});

// Protect the dashboard route with authentication middleware
app.get('/dashboard', authMiddleware, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Handle GET request for logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/login');  // Redirect to the login page after logout
    });
});

// Test DB connection + sync models + start server
let port = 8080;
db.authenticate()
    .then(() => {
        console.log('Database connected...');
        return db.sync({ alter: true });
    })
    .then(() => {
        console.log('All models synced');
        app.listen(port, () => console.log(`Server started at http://localhost:${port}`));
    })
    .catch(err => console.log('Error: ' + err));
