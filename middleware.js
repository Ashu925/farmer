module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/login');
    }
    next();
};

module.exports.isSeller = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== 'seller') {
        req.flash('error', 'You must be a seller to access this page');
        return res.redirect('/');
    }
    next();
};

module.exports.isBuyer = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        req.flash('error', 'You must be a buyer to access this page');
        return res.redirect('/');
    }
    next();
};