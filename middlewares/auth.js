const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        if (!req.session.user) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
            }
            req.flash('error', 'Please log in to access this page!');
            return res.redirect('/login');
        }

        // Verify user still exists and is active
        const user = await User.findByPk(req.session.user.id);
        if (!user || !user.isActive) {
            req.session.destroy();
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User account not found or inactive' 
                });
            }
            req.flash('error', 'Your account is no longer active. Please contact support.');
            return res.redirect('/login');
        }

        // Update session with fresh user data
        req.session.user = user;
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ 
                success: false, 
                message: 'Authentication error' 
            });
        }
        req.flash('error', 'Authentication error. Please try again.');
        res.redirect('/login');
    }
};

// Optional auth middleware for routes that work with or without auth
const optionalAuth = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findByPk(req.session.user.id);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;