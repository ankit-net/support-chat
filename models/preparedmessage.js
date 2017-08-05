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
        kind: Number
    },
    isActive:{
        kind: Boolean,
        required: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('PreparedMessage', PreparedMessageSchema);