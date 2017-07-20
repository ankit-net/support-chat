const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CustomerSchema = new Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    profile: {
        firstName: {type: String},
        lastName: {type: String}
    },
    phone: {
        type: String
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema); 