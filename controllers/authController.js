const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('sucess', 'You are now logged out!');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    //first check if the user is authenticated
    if (req.isAuthenticated()) {
        next(); //keep going, user is logged in
        return ;
    }
    req.flash('error', 'Ooops you must be logged in to do that!');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    //1. check if user email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash('error', 'A password reset has been mailed to you!(No email exists)');
        return res.redirect('/login');
    }
    //2. set reset tokens and expiry to their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now (3600000 seconds === 1 hour)
    await user.save();
    //3. send them an email with the token
    const resetURL = `https://${req.headers.host}/account/reset/${user.resetPasswordToken}}`;
    req.flash('success', `You have been emailed a password reset link: ${resetURL}`);   
    //4. redirect to login page
    res.redirect('/login');
};