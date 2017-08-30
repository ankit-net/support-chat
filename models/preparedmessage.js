const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const PreparedMessageSchema = new Schema({
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body:{
        type: String,
        required: true
    },
    usageCounter:{
        type: Number
    },
    isActive:{
        type: Boolean,
        required: true,
        default: false
    },
    lastUpdatedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('PreparedMessage', PreparedMessageSchema);