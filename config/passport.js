var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

const localOptions = {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
    };

module.exports = function(passport){
    // passport.serializeUser(function(user, done){
    //     done(null, user.id);
    // });
    // passport.deserializeUser(function(id, done){
    //     User.findById(id, function(err, user){
    //         done(err, user);
    //     });
    // });

    passport.serializeUser( (user, done) => {
        var sessionUser = { _id: user._id, email: user.email, role: user.role }
        done(null, sessionUser)
    })

    passport.deserializeUser( (sessionUser, done) => {
        done(null, sessionUser)
    })

    passport.use('local-login', new LocalStrategy(localOptions, function(req, email, password, done){
        User.findOne({'email':email}, function(err, user){
            if(err)
                return done(err);
            if(!user)
                return done(null, false, req.flash('loginMessage', 'No user found!'));
            user.comparePassword(password, function(err, isMatch){
                if (err)
                    return done(err);
                if (!isMatch)
                    return done(null, false, req.flash('loginMessage', 'Wrong Password!'));
                return done(null, user);
            });
        });
    }));

    passport.use('local-signup', new LocalStrategy(localOptions, function(req, email, password, done){
        findOrCreateUser = function(){
            User.findOne({'email': email}, function(err, user){
                if(err)
                    return done(err);
                if(user){
                    return done(null, false, req.flash('signupMessage', 'User for this email already exists.'));
                }else{
                    var newUser = new User({
                        email: email,
                        password: password,
                        profile: {firstName: req.body.firstName, lastName: req.body.lastName},
                        role: req.body.role
                    });
                    newUser.save(function(err, user){
                        if(err)
                            return done(err);
                        return done(null, user);
                    });
                }

            });
        };
        process.nextTick(findOrCreateUser);
    }));
};