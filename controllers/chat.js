const Conversation = require('../models/conversation'),
    Message = require('../models/message'),
    User = require('../models/user'),
    Customer = require('../models/customer');

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
                .select('_id createdAt body author conversation')
                .sort('-createdAt')
                .populate('author.item', 'profile email')
                .populate({
                    path: 'conversation',
                    select: 'customer _id',
                    populate: {path: 'customer', select:'profile'}
                })
            );
        });

        return Promise.all(fullConversationRes);
    }).then(function(listOfConversations) {
        callback(true, {conversations:listOfConversations});
    }, function(err) {
        callback(false, {error: err});
    });
};

exports.sendReplyToConversation1 = function(conversationId, senderId, senderType, body, sentAt, callback) {  
    //find conversation
    Conversation.findOne({_id: conversationId}).exec()
    .then(function(conversation){
        console.log(conversation);
        if(conversation && senderType=='User' && conversation.status === 'open'){
            conversation.status = 'ongoing';
            conversation.participant = senderId;
            return conversation.save();
        }else{
            return conversation;
        }
    })
    .then(function(savedConversation){
        console.log(savedConversation);
        const reply = new Message({
            conversation: savedConversation._id,
            body: body,
            author: {kind: senderType?senderType:'User', item: senderId},
            sentAt: sentAt
        });
        return reply.save();
    })
    .then(function(savedMessage){
        callback(true, { message: 'Reply successfully sent!', reply: savedMessage._id});
    })
    .catch(function(err){
        console.log('error');
        callback(false, {error1: err});
    });
};

exports.getMessagesForConversation = function(conversationId, callback){
    Message.find({conversation: conversationId})
        .select('createdAt body author conversation sentAt')
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