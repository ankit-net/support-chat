const crypto = require('crypto'),
    emailController = require('./email')
    User = require('../models/user'),
    waterfall = require('async-waterfall');

exports.createOperator = function(req, res, next){
    waterfall([
        function(done){
            User.findOne({'email': req.body.email}, function(err, user){
                if(err){
                    // return res.status(401).json({error: err});
                    done(err);
                }
                if(user){
                    return res.status(401).json({error: 'User for this email already exists.'});
                }else{
                    var newUser = new User({
                        email: req.body.email,
                        profile: {firstName: req.body.firstName, lastName: req.body.lastName},
                        role: 'Operator'
                    });
                    newUser.save(function(err, user){
                        if(err)
                            return done(err);
                        return done(null, user);
                    });
                }
            });
        },
        function(user, done){
            console.log('starting token generation');
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString('hex');
                console.log('generated token');

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
                subject: 'New Operator Created.',
                text: 'You are receiving this because you (or someone else) has registered an operator with your email.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process of resetting password:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            
            emailController.sendEmail(mailOptions, function(err, info) {
                if(err){
                    done(err);
                }else{
                    res.status(200).json({message: 'User created.', userId: user._id});
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