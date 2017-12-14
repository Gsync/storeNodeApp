const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

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
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user: user,
        subject: 'Password Reset',
        resetURL: resetURL,
        filename: 'password-reset'
    });
    req.flash('success', `You have been emailed a password reset link.`);   
    //4. redirect to login page
    res.redirect('/login');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() } 
    });
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired!');
        return res.redirect('/login');
    }
    //If there is a user, show the reset password form
    res.render('reset', {title: 'Reset your password'})
};

exports.confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) { //to access a variable with hyphen(-) in it, wrap around square brackets req.body.password-confirm === req.body['password-confirm']
       next(); //keep going
       return ;
    }
    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Password reset is inalid or has expired!');
        return res.redirect('/login');
    }
    const setPassword = promisify(user.setPassword, user); //promisify the setPassword so that we can use await
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined; //clear both fields because password has been reset
    user.resetPasswordExpires = undefined;

    const updatedUser = await user.save();
    await req.login(updatedUser); //login user directly
    req.flash('Success', 'Your password has been reset! You are now logged in!');
    res.redirect('/');
};