const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'login' });
}