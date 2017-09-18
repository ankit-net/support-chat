var LocalStrategy = require('passport-local').Strategy;
var Customer = require('../models/customer');

const localOptions = {
        usernameField: 'email',
        passwordField: 'mobile',
        passReqToCallback: true,
    };

module.exports = function(passport){
    passport.serializeUser( (user, done) => {
        var sessionUser = { _id: user._id, email: user.email, name: user.profile.firstName + ' ' + user.profile.lastName}
        done(null, sessionUser)
    })

    passport.deserializeUser( (sessionUser, done) => {
        done(null, sessionUser)
    })

    passport.use('local-customer', new LocalStrategy(localOptions, function(req, email, mobile, done){
        findOrCreateCustomer = function(){
            Customer.findOne({'email': email}, function(err, customer){
                if(err)
                    return done(err);
                if(!customer){
                    return done(null, false, 'Customer for this email already exists.');
                }else{
                    var newCustomer = new Customer({
                        email: email,
                        phone: mobile,
                        profile: {firstName: req.body.firstName, lastName: req.body.lastName}
                    });
                    newCustomer.save(function(err, customer){
                        if(err)
                            return done(err);
                        return done(null, customer);
                    });
                }

            });
        };
        process.nextTick(findOrCreateCustomer);
    }));
};