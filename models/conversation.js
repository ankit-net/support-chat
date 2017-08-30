const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    participant: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['open', 'ongoing', 'ended'],
        default: 'open'
    },
    customerEnded: {
        type: Boolean,
        required: false
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Conversation', ConversationSchema);