var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    profile: {
        firstName: {type: String},
        lastName: {type: String},
        profilePhotoUrl: {type: String}
    },
    role: {
        type: String,
        enum: ['Operator', 'Manager', 'Admin'],
        default: 'Operator'
    },
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date}
},
{
    timeStamps: true
});

userSchema.pre('save', function(next){
    const user = this;
    SALT_FACTOR = 5;
    
    if(!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_FACTOR, function(err, salt){
        if(err){
            return next(err);
        }
        bcrypt.hash(user.password, salt, null, function(err, hash){
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {  
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) { return cb(err); }

    cb(null, isMatch);
  });
}

module.exports = mongoose.model('User', userSchema); 