const crypto = require('crypto'),
    emailController = require('./email')
    User = require('../models/user'),
    waterfall = require('async-waterfall');

exports.getOperators = function(userId, callback){
    User.find({$and:[{role:'Operator'},{'_id': {$ne: userId}}]})
    .select('_id profile email status')
    .sort('email')
    .exec()
    .then(function(users){
        callback(true, {users: users});
    })
    .catch(function(err){
        console.log(err);
        callback(false, {error: err});
    });
}

exports.setOperatorOnlineStatus = function(userId, callback){
    User.findOne({'_id': userId})
    .exec()
    .then(function(user){
        user.status = 'online';
        return user.save();
    })
    .then(function(savedUser){
        callback(true, {message: 'User status set to online', userId: savedUser._id});
    })
    .catch(function(err){
        console.log(err);
        callback(false, {error: err});
    });
}

exports.setOperatorSocketInfo = function(userId, socketId, callback){
    User.findOne({'_id': userId})
    .exec()
    .then(function(user){
        user.socketId = socketId;
        return user.save();
    })
    .then(function(savedUser){
        callback(true, {message: 'User socketid info set'});
    })
    .catch(function(err){
        console.log(err);
        callback(false, {error: err});
    });
}

exports.setOperatorOfflineStatus = function(socketId, callback){
    User.findOne({'socketId': socketId})
    .exec()
    .then(function(user){
        if(user){
            user.status = 'offline';
            return user.save();
        }
        return null;
    })
    .then(function(savedUser){
        if(savedUser){
            callback(true, {message: 'User status set to offline', userId: savedUser._id});
        }
        else{
            callback(false, {message: 'No user found for the socketid : ' + socketId});
        }
    })
    .catch(function(err){
        console.log(err);
        callback(false, {error: err});
    });
}

exports.createOperator = function(req, res, next){
    waterfall([
        function(done){
            User.findOne({'email': req.body.email}, function(err, user){
                if(err){
                    done(err);
                }
                else if(user){
                    return res.status(500).json({error: 'User for this email already exists.'});
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
                    res.status(200).json({message: 'User created.', user:{
                        _id: user._id,
                        status: user.status,
                        email: user.email,
                        profile: {
                            firstName: user.profile.firstName,
                            lastName: user.profile.lastName
                        }
                    }});
                }
            });
        }
    ],
    function(err){
        console.log(err.toString);
        res.status(500).json({error: err});
    });
};