const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const MessageSchema = new Schema({
    conversation:{
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    body:{
        type: String,
        required: true
    },
    author:{
        kind: String,
        item: {type: Schema.Types.ObjectId, refPath: 'author.kind'}
    },
    sentAt:{ 
        type : Date,
        default: Date.now
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);