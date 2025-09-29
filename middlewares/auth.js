module.exports = (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to access this page!');
        return res.redirect('/login');
    }
    next();  // Proceed to the requested page if logged in
};