const Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    User = require('../models/user'),
    Customer = require('../models/customer'),
    emailController = require('./email');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

exports.getConversationsForOperator = function(operatorId, callback){
    Conversation.find({$or:[{$and:[{participant: operatorId},{status:'ongoing'}]}, {status:'open'}]})
    .select('_id')
    .sort('-createdAt')
    .then(function(conversations){
        //if no conversations found
        if(conversations.length === 0){
            return Promise.all([]);
        }

        let fullConversationRes = [];
        conversations.forEach(function(conversation){
            fullConversationRes.push(
                Message.findOne({'conversation': conversation._id})
                .select('_id createdAt body author conversation isSystemGenerated')
                .sort('-createdAt')
                .populate('author.item', 'profile email')
                .populate({
                    path: 'conversation',
                    select: 'customer _id status',
                    populate: {path: 'customer', select:'profile'}
                })
            );
        });

        return Promise.all(fullConversationRes);
    }).then(function(listOfConversations) {
        callback(true, {conversations:listOfConversations.filter(function(x){return x !== null})});
    }, function(err) {
        callback(false, {error: err});
    });
};

exports.sendReplyToConversation1 = function(conversationId, senderId, senderType, body, sentAt, callback) {  
    //find conversation
    var conversationFromOpenToOngoing = false;
    var conversationId;
    Conversation.findOne({_id: conversationId}).exec()
    .then(function(conversation){
        console.log(conversation);
        if(conversation && senderType=='User' && conversation.status === 'open'){
            conversation.status = 'ongoing';
            conversation.participant = senderId;
            conversationFromOpenToOngoing = true;
            return conversation.save();
        }else{
            conversationFromOpenToOngoing = false;
            return conversation;
        }
    })
    .then(function(savedConversation){
        console.log(savedConversation);
        conversationId = savedConversation._id;
        const reply = new Message({
            conversation: savedConversation._id,
            body: body,
            author: {kind: senderType?senderType:'User', item: senderId},
            sentAt: sentAt
        });
        return reply.save();
    })
    .then(function(savedMessage){
        callback(true, conversationFromOpenToOngoing, conversationId, { message: 'Reply successfully sent!', reply: savedMessage._id});
    })
    .catch(function(err){
        console.log('error');
        callback(false, false, null, {error1: err});
    });
};

exports.getMessagesForConversation = function(conversationId, callback){
    Message.find({conversation: conversationId})
        .select('createdAt body author conversation sentAt isSystemGenerated')
        .sort('createdAt')
        .populate('author.item', 'profile email')
        .populate({
            path: 'conversation',
            select: '_id'
        })
        .exec(function(err, messages){
            if(err){
                callback(false, {error: err});
            }
            else{
                callback(true, {conversation: messages});
            }
        });
};

exports.getConversationsHistory = function(operatorId, callback){
    Conversation.find({$and:[{participant: operatorId},{status:'ended'}]})
    .select('_id')
    .sort('-createdAt')
    .then(function(conversations){
        //if no conversations found
        if(conversations.length === 0){
            return Promise.all([]);
        }

        let fullConversationRes = [];
        conversations.forEach(function(conversation){
            fullConversationRes.push(
                Message.findOne({'conversation': conversation._id})
                .select('_id createdAt body author conversation isSystemGenerated')
                .sort('-createdAt')
                .populate('author.item', 'profile email')
                .populate({
                    path: 'conversation',
                    select: 'customer _id status',
                    populate: {path: 'customer', select:'profile'}
                })
            );
        });

        return Promise.all(fullConversationRes);
    }).then(function(listOfConversations) {
        callback(true, {conversations:listOfConversations.filter(function(x){return x !== null})});
    }, function(err) {
        callback(false, {error: err});
    });
};

exports.endConversation = function(conversationId, customerEndedConv, callback){
    Conversation.findOne({_id: conversationId})
    .exec()
    .then(function(conversation){
        if(!conversation){
            callback(false, {error: 'Conversation with the id does not exist.'});
            return;
        }else if(conversation.status == 'ended'){
            callback(false, {error: 'Conversation already ended.'});
            return;
        }else{
            conversation.status = 'ended';
            conversation.customerEnded = customerEndedConv;
            return conversation.save();
        }
    }).then(function(savedConversation){
        if(savedConversation){
            callback(true, {message: 'Conversation Ended'})
        }
    }).catch(function(err){
        console.log('error');
        callback(false, {error: err});
    });
};

exports.emailConversation = function(conversationId, callback){
    var body1 = '', customerEmail;
    Message.find({conversation: conversationId})
        .select('createdAt body author conversation sentAt isSystemGenerated')
        .sort('createdAt')
        .populate('author.item', 'profile email')
        .populate({
            path: 'conversation',
            select: '_id'
        })
        .exec()
        .then(function(messages){
            if(!messages || messages.length == 0){
                callback(false, {message: 'No messages found.'})
            }else{
                messages.forEach(function(message){
                    if(!customerEmail && message.author.kind == 'Customer'){
                        customerEmail = message.author.item.email;
                    }
                    if(!message.isSystemGenerated)
                        body1 += message.author.item.profile.firstName + ' ' + message.author.item.profile.lastName + ' (' + (message.author.kind == 'Customer'?'You':'Operator') + '):\n' + message.body + '\n\n';
                });
                if(customerEmail){
                    var mailOptions = {
                        to: customerEmail,
                        from: 'niraj.kumar@psquickit.com',
                        subject: 'Your chat history with Operator.',
                        text: 'You are receiving this because you (or someone else) has requested for an archive of the messages of your recent conversation with our support operator.\n\n' +
                        'Following was your conversation:\n\n' + body1 + '\n\n' +
                        'If you did not request this, please ignore this email.\n'
                    };

                    emailController.sendEmail(mailOptions, function(err, info) {
                        if(err){
                            callback(false, {messageBody: 'Error when sending email. Please check logs'});
                        }else{
                            callback(true, {messageBody: 'Email sent to : ' + customerEmail});
                        }
                    });
                }else{
                    callback(false, {messageBody: 'Could not find customer email.'});
                }
            }
        }).catch(function(err){
            console.log('error');
            callback(false, {error: err});
        });
};