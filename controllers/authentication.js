const waterfall = require('async-waterfall'),
    crypto = require('crypto'),
    User = require('../models/user'),
    emailController = require('./email'),
    passport = require('passport');

exports.userAuthenticated = function(req, res, next){
    console.log('Cookies for authentication: ', req.cookies);
    console.log('Session for authentication: ', req.session);

    if(req.user)
        return next();
    else
        return next(new Error('User not authenticated.'));
};

exports.userAuthorized = function(role){
    console.log('Cookies for authorization: ', req.cookies);
    console.log('Session for authorization: ', req.session);
    return function(req, res, next){
        if(role !== req.user.role){
            return next(new Error('User not authorized.'));
        }else{
            return next();
        }
    }   
}

exports.forgotPassword = function(req, res){
    waterfall([
        function(done){
            console.log('starting token generation');
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString('hex');
                console.log('generated token');
                done(err, token);
            });
        }, 
        function(token, done){
            console.log('finding user');
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                req.flash('forgotPasswordMessage', 'No account with that email address exists.');
                return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                console.log('saving user');
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        }, 
        function(token, user, done) {
            console.log('preparing to send email.');
            
            var mailOptions = {
                to: user.email,
                from: 'niraj.kumar@psquickit.com',
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            
            emailController.sendEmail(mailOptions, function(err, info) {
                if(err){
                    done(err);
                }else{
                    req.flash('loginMessage', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    res.redirect('/login');
                }
            });
        }
    ],
    function(err){
        console.log(err.toString);
        if(err){
            return next(err);
        }
        res.redirect('/forgot');
    });
};

exports.getResetForm = function(req, res){
    User.findOne({resetPasswordToken:req.params.token})
    .exec()
    .then(function(user){
        if(!user || new Date(user.resetPasswordExpires)-new Date() <= 0){
            req.flash('loginMessage', 'Password reset token is invalid or has expired.');
            return res.redirect('/login');
        }else{
            res.render('resetPassword.ejs', {
                user: req.user,
                message: req.flash('resetPasswordMessage')
            });
        }
    }).catch(function(err){
        console.log(err);
        req.flash('loginMessage', err);
        return res.redirect('/login');
    });
}

exports.resetPassword = function(req, res){
    waterfall([
        function(done){
            User.findOne({ resetPasswordToken: req.params.token}, function(err, user) {
                if (!user || new Date(user.resetPasswordExpires)-new Date() <= 0) {
                    req.flash('resetPasswordMessage', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }

                user.password = req.body.password;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                    req.logIn(user, function(err) {
                        done(err, user);
                    });
                });
            });
        },
        function(user, done){
            console.log('preparing to send email.');
            
            var mailOptions = {
                to: user.email,
                from: 'niraj.kumar@psquickit.com',
                subject: 'Node.js Password Changed',
                text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            
            emailController.sendEmail(mailOptions, function(err, info) {
                if(err){
                    done(err);
                }else{
                    req.flash('loginMessage', 'Success! Your password has been changed.');
                    res.redirect('/login');
                }
            });
        }
    ], 
    function(err){
        console.log(err.toString);
        if(err){
            return next(err);
        }
        res.redirect('/');
    });
};