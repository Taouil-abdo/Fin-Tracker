require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

// Import middlewares
const validateRegister = require('../middlewares/validate');
const db = require('../config/database');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middlewares/auth');

// Import routes
const userRoutes = require('../routes/userRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const budgetRoutes = require('../routes/budgetRoutes');
const transactionRoutes = require('../routes/transactionRoutes');
const goalRoutes = require('../routes/goalRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');

// Import models
const { User, Category, Budget, Transaction, Goal } = require('../models');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views/'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data

// Session and Flash middleware
app.use(session({
    secret: 'fintracker',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        maxAge: 60000 * 60 
    } 
    
}));
app.use(flash());

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/dashboard', dashboardRoutes);



// Routes
app.get('/', (req, res) => res.render('index'));

// Handle GET request for registration page
app.get('/register', (req, res) => {
    res.render('auth/register', {
        message: req.flash('success'),
        error: req.flash('error'),
        sexe: '', 
        age: '',  
        fullname: '', 
        email: '', 
    });
});

// Handle POST request for registration form
app.post('/register', validateRegister, async (req, res) => {
    const { fullname, email, password, sexe, age } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { email: email.toLowerCase().trim() } 
        });

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

        // Hash password with higher salt rounds for security
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create a new user
        const newUser = await User.create({
            fullname: fullname.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            sexe,
            age: parseInt(age)
        });

        // After successful registration, redirect to login
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login'); 

    } catch (error) {
        console.error('Error during registration:', error);
        
        // Handle specific Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => err.message);
            req.flash('error', validationErrors.join(', '));
        } else {
            req.flash('error', 'Something went wrong! Please try again.');
        }
        
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
        error: req.flash('error')  
    });
});

// Handle POST request for login form
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        req.flash('error', 'Email and password are required!');
        return res.redirect('/login');
    }

    try {
        // Check if the email exists in the database
        const user = await User.findOne({ 
            where: { 
                email: email.toLowerCase().trim(),
                isActive: true
            } 
        });

        if (!user) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }

        // Create session after successful login
        req.session.user = {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            sexe: user.sexe,
            age: user.age
        };

        // Regenerate session ID for security
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                req.flash('error', 'Login error. Please try again.');
                return res.redirect('/login');
            }
            
            req.session.user = {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                sexe: user.sexe,
                age: user.age
            };
            
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    req.flash('error', 'Login error. Please try again.');
                    return res.redirect('/login');
                }
                res.redirect('/dashboard');
            });
        });
        
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'Something went wrong! Please try again.');
        res.redirect('/login');
    }
});

// Protect the dashboard route with authentication middleware
app.get('/dashboard', authMiddleware, (req, res) => {
    res.render('dashboard/dashboard', { user: req.session.user });
});

// Category page
app.get('/category', authMiddleware, (req, res) => {
    res.render('dashboard/Category/index', { user: req.session.user });
});

// Budget page
app.get('/budget', authMiddleware, (req, res) => {
    res.render('dashboard/Budget/index', { user: req.session.user });
});

// Transaction page
app.get('/transaction', authMiddleware, (req, res) => {
    res.render('dashboard/Transaction/index', { user: req.session.user });
});

// Goal page
app.get('/goal', authMiddleware, (req, res) => {
    res.render('dashboard/Goal/index', { user: req.session.user });
});


// Handle GET request for logout
app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                req.flash('error', 'Error logging out. Please try again.');
                return res.redirect('/dashboard');
            }
            
            // Clear the session cookie
            res.clearCookie('connect.sid');
            req.flash('success', 'You have been logged out successfully.');
            res.redirect('/login');  
        });
    } else {
        res.redirect('/login');
    }
});

// Handle POST request for profile form

app.get('/profile', authMiddleware, (req, res) => {
    res.render('auth/profile', { user: req.session.user, message: req.flash('success'), error: req.flash('error') });
});

app.post('/profile', authMiddleware, async (req, res) => {
    const { fullname, email, sexe, age } = req.body;
    const userId = req.session.user.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            req.flash('error', 'User not found!');
            return res.redirect('/profile');
        }
        user.fullname = fullname;
        user.email = email;
        user.sexe = sexe;
        user.age = age; 
        await user.save();
        req.session.user = user;
        req.flash('success', 'Profile updated successfully!');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.flash('error', 'Something went wrong! Please try again.');
        res.redirect('/profile');
    }
});


// Test DB connection + sync models + start server
let port = process.env.PORT || 8080;
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
